/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
	PeripheralDeviceCategory,
	PeripheralDeviceType,
	PERIPHERAL_SUBTYPE_PROCESS,
} from '@sofie-automation/corelib/dist/dataModel/PeripheralDevice'
import {
	setupDefaultRundownPlaylist,
	setupMockPeripheralDevice,
	setupMockShowStyleCompound,
} from '../../__mocks__/presetCollections'
import { MockJobContext, setupDefaultJobEnvironment } from '../../__mocks__/context'
import { DBRundown, Rundown } from '@sofie-automation/corelib/dist/dataModel/Rundown'
import { DBRundownPlaylist } from '@sofie-automation/corelib/dist/dataModel/RundownPlaylist'
import {
	activateHold,
	activateRundownPlaylist,
	deactivateRundownPlaylist,
	handleTimelineTriggerTime,
	takeNextPart,
} from '../playout'
import { fixSnapshot } from '../../__mocks__/helpers/snapshot'
import { runJobWithPlayoutCache } from '../lock'
import { updateTimeline } from '../timeline/generate'
import { getSelectedPartInstances, getSortedPartsForRundown } from './lib'
import { PieceLifespan, IBlueprintPieceType } from '@sofie-automation/blueprints-integration'
import { AdLibPiece } from '@sofie-automation/corelib/dist/dataModel/AdLibPiece'
import { RundownPlaylistId, RundownId, PartId, PartInstanceId } from '@sofie-automation/corelib/dist/dataModel/Ids'
import {
	TimelineEnableExt,
	TimelineComplete,
	deserializeTimelineBlob,
} from '@sofie-automation/corelib/dist/dataModel/Timeline'
import { normalizeArrayToMap, literal, getRandomId } from '@sofie-automation/corelib/dist/lib'
import { getPartGroupId, getPieceControlObjectId, getPieceGroupId } from '@sofie-automation/corelib/dist/playout/ids'
import { unprotectString, protectString } from '@sofie-automation/corelib/dist/protectedString'
import { Time } from 'superfly-timeline'
import { DBPartInstance } from '@sofie-automation/corelib/dist/dataModel/PartInstance'
import { DBPart } from '@sofie-automation/corelib/dist/dataModel/Part'
import {
	setupRundownWithInTransitionExistingInfinite,
	setupRundownWithInTransition,
	setupRundownWithInTransitionContentDelay,
	setupRundownWithInTransitionContentDelayAndPreroll,
	setupRundownWithPreroll,
	setupRundownWithInTransitionNewInfinite,
	setupRundownWithInTransitionPlannedPiece,
	setupRundownWithInTransitionEnableHold,
	setupRundownWithInTransitionDisabled,
	setupRundownWithOutTransition,
	setupRundownWithOutTransitionAndPreroll,
	setupRundownWithOutTransitionAndPreroll2,
	setupRundownWithOutTransitionAndInTransition,
	setupRundownWithOutTransitionEnableHold,
	setupRundownBase,
} from './helpers/rundowns'
import { defaultRundownPlaylist } from '../../__mocks__/defaultCollectionObjects'
import { ShowStyleCompound } from '@sofie-automation/corelib/dist/dataModel/ShowStyleCompound'
import { ReadonlyDeep } from 'type-fest'
import { innerStartAdLibPiece, innerStartOrQueueAdLibPiece } from '../adlib'
import { EmptyPieceTimelineObjectsBlob, Piece, PieceStatusCode } from '@sofie-automation/corelib/dist/dataModel/Piece'
import { adjustFakeTime, useFakeCurrentTime, useRealCurrentTime } from '../../__mocks__/time'
import { restartRandomId } from '../../__mocks__/nanoid'
import { wrapPieceToInstance } from '@sofie-automation/corelib/dist/dataModel/PieceInstance'

interface PartTimelineTimings {
	previousPart: TimelineEnableExt | null
	currentPieces: {
		[id: string]: {
			childGroup: PreAndPostRoll | PreAndPostRoll[]
			controlObj: TimelineEnableExt | TimelineEnableExt[]
		} | null
	}
	currentInfinitePieces: {
		[id: string]: {
			partGroup: TimelineEnableExt | TimelineEnableExt[]
			pieceGroup: {
				childGroup: PreAndPostRoll | PreAndPostRoll[]
				controlObj: TimelineEnableExt | TimelineEnableExt[]
			}
		} | null
	}
	previousOutTransition:
		| {
				childGroup: PreAndPostRoll | PreAndPostRoll[]
				controlObj: TimelineEnableExt | TimelineEnableExt[]
		  }
		| null
		| undefined
}

interface PreAndPostRoll {
	preroll: number
	postroll: number
	invalid?: string
}
function getPrerollAndPostroll(enable: TimelineEnableExt | TimelineEnableExt[]): PreAndPostRoll | PreAndPostRoll[] {
	const doIt = (enable: TimelineEnableExt): PreAndPostRoll => {
		const res: PreAndPostRoll = {
			preroll: 0,
			postroll: 0,
		}

		if (typeof enable.start === 'string') {
			const start = enable.start

			const match = start.match(/^#piece_group_control_(.*)\.start - (\d+)$/)
			if (match) {
				res.preroll = Number(match[2])
			} else {
				res.invalid = 'Failed to parse start'
			}
		} else {
			res.invalid = 'Failed to parse start'
		}
		if (typeof enable.end === 'string') {
			const end = enable.end

			const match = end.match(/^#piece_group_control_(.*)\.end \+ (\d+)$/)
			if (match) {
				res.postroll = Number(match[2])
			} else {
				res.invalid = 'Failed to parse end'
			}
		} else {
			res.invalid = 'Failed to parse end'
		}

		if (Object.keys(enable).length !== 2) {
			res.invalid = 'Extra keys!'
		}

		return res
	}

	if (Array.isArray(enable)) {
		return enable.map(doIt)
	} else {
		return doIt(enable)
	}
}

/**
 * Check the timings of objects in the timeline to an expected result
 * Note: this ensures that every piece for the currentPartInstance is accounted for in the expected result
 */
async function checkTimingsRaw(
	context: MockJobContext,
	rundownId: RundownId,
	timeline: TimelineComplete | undefined,
	currentPartInstance: DBPartInstance,
	previousPartInstance: DBPartInstance | undefined,
	expectedTimings: PartTimelineTimings
) {
	const timelineObjs = timeline ? deserializeTimelineBlob(timeline?.timelineBlob) : []
	const objs = normalizeArrayToMap(timelineObjs, 'id')

	// previous part group
	const prevPartTlObj = previousPartInstance ? objs.get(getPartGroupId(previousPartInstance)) : undefined
	if (expectedTimings.previousPart) {
		expect(prevPartTlObj).toBeTruthy()
		expect(prevPartTlObj?.enable).toMatchObject(expectedTimings.previousPart)
	} else {
		expect(prevPartTlObj).toBeFalsy()
	}

	// current part group is assumed to start at now

	// Current pieces
	const currentPieces = await context.directCollections.PieceInstances.findFetch({
		partInstanceId: currentPartInstance._id,
	})
	const targetCurrentPieces: PartTimelineTimings['currentPieces'] = {}
	const targetCurrentInfinitePieces: PartTimelineTimings['currentInfinitePieces'] = {}
	for (const piece of currentPieces) {
		let entryId = unprotectString(piece.piece._id)
		if (entryId.startsWith(unprotectString(rundownId)))
			entryId = entryId.substring(unprotectString(rundownId).length + 1)

		if (piece.piece.lifespan === PieceLifespan.WithinPart) {
			const pieceObj = objs.get(getPieceGroupId(piece))
			const controlObj = objs.get(getPieceControlObjectId(piece))

			targetCurrentPieces[entryId] = controlObj
				? {
						childGroup: getPrerollAndPostroll(pieceObj?.enable ?? []),
						controlObj: controlObj.enable,
				  }
				: null
		} else {
			const partGroupId = getPartGroupId(protectString<PartInstanceId>(unprotectString(piece._id))) + '_infinite'
			const partObj = objs.get(partGroupId)
			if (!partObj) {
				targetCurrentInfinitePieces[entryId] = null
			} else {
				const pieceObj = objs.get(getPieceGroupId(piece))
				const controlObj = objs.get(getPieceControlObjectId(piece))

				targetCurrentInfinitePieces[entryId] = {
					partGroup: partObj.enable,
					pieceGroup: {
						childGroup: getPrerollAndPostroll(pieceObj?.enable ?? []),
						controlObj: controlObj?.enable ?? [],
					},
				}
			}
		}
	}
	expect(targetCurrentPieces).toEqual(expectedTimings.currentPieces)
	expect(targetCurrentInfinitePieces).toEqual(expectedTimings.currentInfinitePieces)

	if (previousPartInstance) {
		// Previous pieces
		const previousPieces = await context.directCollections.PieceInstances.findFetch({
			partInstanceId: previousPartInstance._id,
		})
		let previousOutTransition: PartTimelineTimings['previousOutTransition']
		for (const piece of previousPieces) {
			if (piece.piece.pieceType === IBlueprintPieceType.OutTransition) {
				if (previousOutTransition !== undefined) throw new Error('Too many out transition pieces were found')

				const pieceObj = objs.get(getPieceGroupId(piece))
				const controlObj = objs.get(getPieceControlObjectId(piece))
				previousOutTransition = controlObj
					? {
							childGroup: getPrerollAndPostroll(pieceObj?.enable ?? []),
							controlObj: controlObj.enable,
					  }
					: null
			}
		}
		expect(previousOutTransition).toEqual(expectedTimings.previousOutTransition)
	} else {
		expect(expectedTimings.previousOutTransition).toBeFalsy()
	}
}

/** Perform a take and check the the selected part ids are as expected */
async function doTakePart(
	context: MockJobContext,
	playlistId: RundownPlaylistId,
	expectedPreviousPartId: PartId | null,
	expectedCurrentPartId: PartId | null,
	expectedNextPartId: PartId | null
) {
	adjustFakeTime(1500)

	{
		const playlist = (await context.directCollections.RundownPlaylists.findOne(playlistId)) as DBRundownPlaylist
		expect(playlist).toBeTruthy()

		await takeNextPart(context, {
			playlistId: playlistId,
			fromPartInstanceId: playlist.currentPartInstanceId,
		})
	}

	const playlist = (await context.directCollections.RundownPlaylists.findOne(playlistId)) as DBRundownPlaylist
	expect(playlist).toBeTruthy()

	const { currentPartInstance, nextPartInstance, previousPartInstance } = await getSelectedPartInstances(
		context,
		playlist
	)

	if (expectedCurrentPartId) {
		expect(currentPartInstance).toBeTruthy()
		expect(currentPartInstance!.part._id).toEqual(expectedCurrentPartId)
	} else {
		expect(currentPartInstance).toBeFalsy()
	}

	if (expectedPreviousPartId) {
		expect(previousPartInstance).toBeTruthy()
		expect(previousPartInstance!.part._id).toEqual(expectedPreviousPartId)
	} else {
		expect(previousPartInstance).toBeFalsy()
	}

	if (expectedNextPartId) {
		expect(nextPartInstance).toBeTruthy()
		expect(nextPartInstance!.part._id).toEqual(expectedNextPartId)
	} else {
		expect(nextPartInstance).toBeFalsy()
	}

	return { currentPartInstance, nextPartInstance, previousPartInstance }
}

/** Perform an activate and check the next part id is as expected */
async function doActivatePlaylist(context: MockJobContext, playlistId: RundownPlaylistId, nextPartId: PartId) {
	adjustFakeTime(1000)

	await activateRundownPlaylist(context, {
		playlistId: playlistId,
		rehearsal: false,
	})

	const playlist = (await context.directCollections.RundownPlaylists.findOne(playlistId)) as DBRundownPlaylist
	expect(playlist).toBeTruthy()

	const { currentPartInstance, nextPartInstance } = await getSelectedPartInstances(context, playlist)
	expect(currentPartInstance).toBeFalsy()
	expect(nextPartInstance).toBeTruthy()
	expect(nextPartInstance!.part._id).toEqual(nextPartId)
	expect(playlist).toMatchObject({
		activationId: expect.stringMatching(/^randomId/),
		rehearsal: false,
		currentPartInstanceId: null,
		// nextPartInstanceId: parts[0]._id,
	})
}

/** Perform an activate and check the selected part ids are cleared */
async function doDeactivatePlaylist(context: MockJobContext, playlistId: RundownPlaylistId) {
	adjustFakeTime(1000)

	await deactivateRundownPlaylist(context, {
		playlistId: playlistId,
	})

	const playlist = (await context.directCollections.RundownPlaylists.findOne(playlistId)) as DBRundownPlaylist
	expect(playlist).toBeTruthy()

	// Ensure this is defined to something, for the jest matcher
	playlist.activationId = playlist.activationId ?? undefined

	expect(playlist).toMatchObject({
		activationId: undefined,
		currentPartInstanceId: null,
		nextPartInstanceId: null,
	})
}

/** perform an update of the timeline */
async function doUpdateTimeline(context: MockJobContext, playlistId: RundownPlaylistId, forceNowToTime?: Time) {
	await runJobWithPlayoutCache(
		context,
		{
			playlistId: playlistId,
		},
		null,
		async (cache) => {
			await updateTimeline(context, cache, forceNowToTime)
		}
	)
}

interface SelectedPartInstances {
	currentPartInstance: DBPartInstance | undefined
	nextPartInstance: DBPartInstance | undefined
	previousPartInstance: DBPartInstance | undefined
}

describe('Timeline', () => {
	let context: MockJobContext
	let showStyle: ReadonlyDeep<ShowStyleCompound>
	beforeEach(async () => {
		restartRandomId()

		context = setupDefaultJobEnvironment()

		useFakeCurrentTime()

		showStyle = await setupMockShowStyleCompound(context)

		// Ignore calls to queueEventJob, they are expected
		context.queueEventJob = async () => Promise.resolve()
	})
	afterEach(() => {
		useRealCurrentTime()
	})
	test('Basic rundown', async () => {
		await setupMockPeripheralDevice(
			context,
			PeripheralDeviceCategory.PLAYOUT,
			PeripheralDeviceType.PLAYOUT,
			PERIPHERAL_SUBTYPE_PROCESS
		)

		const { rundownId: rundownId0, playlistId: playlistId0 } = await setupDefaultRundownPlaylist(context)
		expect(rundownId0).toBeTruthy()
		expect(playlistId0).toBeTruthy()

		const getRundown0 = async () => {
			return (await context.directCollections.Rundowns.findOne(rundownId0)) as DBRundown
		}
		const getPlaylist0 = async () => {
			const playlist = (await context.directCollections.RundownPlaylists.findOne(
				playlistId0
			)) as DBRundownPlaylist
			playlist.activationId = playlist.activationId ?? undefined
			return playlist
		}

		await expect(getRundown0()).resolves.toBeTruthy()
		await expect(getPlaylist0()).resolves.toBeTruthy()

		const parts = await context.directCollections.Parts.findFetch({ rundownId: rundownId0 })

		await expect(getPlaylist0()).resolves.toMatchObject({
			activationId: undefined,
			rehearsal: false,
		})

		{
			// Prepare and activate in rehersal:
			await activateRundownPlaylist(context, { playlistId: playlistId0, rehearsal: false })
			const { currentPartInstance, nextPartInstance } = await getSelectedPartInstances(
				context,
				await getPlaylist0()
			)
			expect(currentPartInstance).toBeFalsy()
			expect(nextPartInstance).toBeTruthy()
			expect(nextPartInstance!.part._id).toEqual(parts[0]._id)
			await expect(getPlaylist0()).resolves.toMatchObject({
				activationId: expect.stringMatching(/^randomId/),
				rehearsal: false,
				currentPartInstanceId: null,
				// nextPartInstanceId: parts[0]._id,
			})
		}

		{
			// Take the first Part:
			await takeNextPart(context, { playlistId: playlistId0, fromPartInstanceId: null })
			const { currentPartInstance, nextPartInstance } = await getSelectedPartInstances(
				context,
				await getPlaylist0()
			)
			expect(currentPartInstance).toBeTruthy()
			expect(nextPartInstance).toBeTruthy()
			expect(currentPartInstance!.part._id).toEqual(parts[0]._id)
			expect(nextPartInstance!.part._id).toEqual(parts[1]._id)
			// expect(getPlaylist0()).toMatchObject({
			// 	currentPartInstanceId: parts[0]._id,
			// 	nextPartInstanceId: parts[1]._id,
			// })
		}

		await runJobWithPlayoutCache(context, { playlistId: playlistId0 }, null, async (cache) => {
			await updateTimeline(context, cache)
		})

		expect(fixSnapshot(await context.directCollections.Timelines.findFetch())).toMatchSnapshot()

		await runJobWithPlayoutCache(context, { playlistId: playlistId0 }, null, async (cache) => {
			const currentTime = 100 * 1000
			await updateTimeline(context, cache, currentTime)
		})

		expect(fixSnapshot(await context.directCollections.Timelines.findFetch())).toMatchSnapshot()

		{
			// Deactivate rundown:
			await deactivateRundownPlaylist(context, { playlistId: playlistId0 })
			await expect(getPlaylist0()).resolves.toMatchObject({
				activationId: undefined,
				currentPartInstanceId: null,
				nextPartInstanceId: null,
			})
		}

		expect(fixSnapshot(await context.directCollections.Timelines.findFetch())).toMatchSnapshot()
	})

	function testTransitionTimings(
		name: string,
		customRundownFactory: (
			context: MockJobContext,
			playlistId: RundownPlaylistId,
			rundownId: RundownId,
			showStyle: ReadonlyDeep<ShowStyleCompound>
		) => Promise<RundownId>,
		checkFcn: (
			rundownId: RundownId,
			timeline: null,
			currentPartInstance: DBPartInstance,
			previousPartInstance: DBPartInstance,
			checkTimings: (timings: PartTimelineTimings) => Promise<void>
		) => Promise<void>,
		timeout?: number
	) {
		// eslint-disable-next-line jest/expect-expect
		test(
			// eslint-disable-next-line jest/valid-title
			name,
			async () =>
				runTimelineTimings(
					customRundownFactory,
					async (playlistId, rundownId, parts, _getPartInstances, checkTimings) => {
						// Take the first Part:
						await doTakePart(context, playlistId, null, parts[0]._id, parts[1]._id)

						// Take the second Part:
						const { currentPartInstance, previousPartInstance } = await doTakePart(
							context,
							playlistId,
							parts[0]._id,
							parts[1]._id,
							null
						)

						// Run the result check
						await checkFcn(rundownId, null, currentPartInstance!, previousPartInstance!, checkTimings)
					}
				),
			timeout
		)
	}

	async function runTimelineTimings(
		customRundownFactory: (
			context: MockJobContext,
			playlistId: RundownPlaylistId,
			rundownId: RundownId,
			showStyle: ReadonlyDeep<ShowStyleCompound>
		) => Promise<RundownId>,
		fcn: (
			playlistId: RundownPlaylistId,
			rundownId: RundownId,
			parts: DBPart[],
			getPartInstances: () => Promise<SelectedPartInstances>,
			checkTimings: (timings: PartTimelineTimings) => Promise<void>
		) => Promise<void>
	) {
		const rundownId0: RundownId = getRandomId()
		const playlistId0 = await context.directCollections.RundownPlaylists.insertOne(
			defaultRundownPlaylist(protectString('playlist_' + rundownId0), context.studioId)
		)

		const rundownId = await customRundownFactory(context, playlistId0, rundownId0, showStyle)
		expect(rundownId0).toBe(rundownId)

		const rundown = (await context.directCollections.Rundowns.findOne(rundownId0)) as Rundown
		expect(rundown).toBeTruthy()

		{
			const playlist = (await context.directCollections.RundownPlaylists.findOne(
				playlistId0
			)) as DBRundownPlaylist
			expect(playlist).toBeTruthy()

			// Ensure this is defined to something, for the jest matcher
			playlist.activationId = playlist.activationId ?? undefined

			expect(playlist).toMatchObject({
				activationId: undefined,
				rehearsal: false,
			})
		}

		const parts = await getSortedPartsForRundown(context, rundown._id)

		// Prepare and activate in rehersal:
		await doActivatePlaylist(context, playlistId0, parts[0]._id)

		const getPartInstances = async (): Promise<SelectedPartInstances> => {
			const playlist = (await context.directCollections.RundownPlaylists.findOne(
				playlistId0
			)) as DBRundownPlaylist
			expect(playlist).toBeTruthy()
			const res = await getSelectedPartInstances(context, playlist)
			return {
				currentPartInstance: res.currentPartInstance ?? undefined,
				nextPartInstance: res.nextPartInstance ?? undefined,
				previousPartInstance: res.previousPartInstance ?? undefined,
			}
		}

		const checkTimings = async (timings: PartTimelineTimings) => {
			// Check the calculated timings
			const timeline = await context.directCollections.Timelines.findOne(context.studio._id)
			expect(timeline).toBeTruthy()

			// console.log('objs', JSON.stringify(timeline?.timeline?.map((o) => o.id) || [], undefined, 4))

			await doUpdateTimeline(context, playlistId0)

			const { currentPartInstance, previousPartInstance } = await getPartInstances()
			return checkTimingsRaw(context, rundownId0, timeline, currentPartInstance!, previousPartInstance, timings)
		}

		// Run the required steps
		await fcn(playlistId0, rundownId0, parts, getPartInstances, checkTimings)

		// Deactivate rundown:
		await doDeactivatePlaylist(context, playlistId0)

		const timelinesEnd = await context.directCollections.Timelines.findFetch()
		expect(fixSnapshot(timelinesEnd)).toMatchSnapshot()
	}

	describe('In transitions', () => {
		testTransitionTimings(
			'Basic inTransition',
			setupRundownWithInTransition,
			async (_rundownId0, _timeline, currentPartInstance, _previousPartInstance, checkTimings) => {
				await checkTimings({
					// old part is extended by 1000ms due to transition keepalive
					previousPart: { end: `#${getPartGroupId(currentPartInstance)}.start + 1000` },
					currentPieces: {
						// pieces are delayed by the content delay
						piece010: {
							controlObj: { start: 0 },
							childGroup: { preroll: 0, postroll: 0 },
						},
					},
					currentInfinitePieces: {},
					previousOutTransition: undefined,
				})
			}
		)

		testTransitionTimings(
			'Basic inTransition with planned pieces',
			setupRundownWithInTransitionPlannedPiece,
			async (_rundownId0, _timeline, currentPartInstance, _previousPartInstance, checkTimings) => {
				await checkTimings({
					// old part is extended by 1000ms due to transition keepalive
					previousPart: { end: `#${getPartGroupId(currentPartInstance)}.start + 1000` },
					currentPieces: {
						// pieces are delayed by the content delay
						piece010: {
							controlObj: { start: 500 },
							childGroup: { preroll: 0, postroll: 0 },
						},
						// transition piece
						piece011: {
							controlObj: { start: 0 },
							childGroup: { preroll: 0, postroll: 0 },
						},
						// pieces are delayed by the content delay
						piece012: {
							controlObj: { start: 1500, duration: 1000 },
							childGroup: { preroll: 0, postroll: 0 },
						},
					},
					currentInfinitePieces: {},
					previousOutTransition: undefined,
				})
			}
		)

		testTransitionTimings(
			'Preroll',
			setupRundownWithPreroll,
			async (_rundownId0, _timeline, currentPartInstance, _previousPartInstance, checkTimings) => {
				await checkTimings({
					// old part is extended due to preroll
					previousPart: { end: `#${getPartGroupId(currentPartInstance)}.start + 500` },
					currentPieces: {
						// main piece
						piece010: {
							controlObj: { start: 500 },
							childGroup: { preroll: 500, postroll: 0 },
						},
					},
					currentInfinitePieces: {},
					previousOutTransition: undefined,
				})
			}
		)

		testTransitionTimings(
			'Basic inTransition with contentDelay',
			setupRundownWithInTransitionContentDelay,
			async (_rundownId0, _timeline, currentPartInstance, _previousPartInstance, checkTimings) => {
				await checkTimings({
					// old part is extended due to preroll and transition keepalive
					previousPart: { end: `#${getPartGroupId(currentPartInstance)}.start + 1000` },
					currentPieces: {
						// pieces are delayed by the content delay
						piece010: {
							controlObj: { start: 500 },
							childGroup: { preroll: 0, postroll: 0 },
						},
						// transition piece
						piece011: {
							controlObj: { start: 0 },
							childGroup: { preroll: 0, postroll: 0 },
						},
					},
					currentInfinitePieces: {},
					previousOutTransition: undefined,
				})
			}
		)

		testTransitionTimings(
			'Basic inTransition with contentDelay + preroll',
			setupRundownWithInTransitionContentDelayAndPreroll,
			async (_rundownId0, _timeline, currentPartInstance, _previousPartInstance, checkTimings) => {
				await checkTimings({
					// old part is extended due to preroll and transition keepalive
					previousPart: { end: `#${getPartGroupId(currentPartInstance)}.start + 1000` },
					currentPieces: {
						// pieces are delayed by the content delay
						piece010: {
							controlObj: { start: 500 },
							childGroup: { preroll: 250, postroll: 0 },
						},
						// transition piece
						piece011: {
							controlObj: { start: 0 },
							childGroup: { preroll: 0, postroll: 0 },
						},
					},
					currentInfinitePieces: {},
					previousOutTransition: undefined,
				})
			}
		)

		testTransitionTimings(
			'inTransition with existing infinites',
			setupRundownWithInTransitionExistingInfinite,
			async (_rundownId0, _timeline, currentPartInstance, _previousPartInstance, checkTimings) => {
				await checkTimings({
					// old part is extended due to transition keepalive
					previousPart: { end: `#${getPartGroupId(currentPartInstance)}.start + 1000` },
					currentPieces: {
						// pieces are delayed by the content delay
						piece010: {
							controlObj: { start: 500 },
							childGroup: { preroll: 0, postroll: 0 },
						},
						// transition piece
						piece011: {
							controlObj: { start: 0 },
							childGroup: { preroll: 0, postroll: 0 },
						},
					},
					currentInfinitePieces: {
						piece002: {
							// No delay applied as it started before this part, so should be left untouched
							partGroup: { start: `#part_group_${currentPartInstance?._id}.start` },
							pieceGroup: {
								controlObj: { start: 500 },
								childGroup: { preroll: 0, postroll: 0 },
							},
						},
					},
					previousOutTransition: undefined,
				})
			}
		)

		testTransitionTimings(
			'inTransition with new infinite',
			setupRundownWithInTransitionNewInfinite,
			async (_rundownId0, _timeline, currentPartInstance, _previousPartInstance, checkTimings) => {
				await checkTimings({
					// old part is extended due to transition keepalive
					previousPart: { end: `#${getPartGroupId(currentPartInstance)}.start + 1000` },
					currentPieces: {
						// pieces are delayed by the content delay
						piece010: {
							controlObj: { start: 500 },
							childGroup: { preroll: 0, postroll: 0 },
						},
						// transition piece
						piece011: {
							controlObj: { start: 0 },
							childGroup: { preroll: 0, postroll: 0 },
						},
					},
					currentInfinitePieces: {
						piece012: {
							// Delay get applied to the pieceGroup inside the partGroup
							partGroup: { start: `#${getPartGroupId(currentPartInstance)}.start` },
							pieceGroup: {
								controlObj: { start: 500 },
								childGroup: { preroll: 0, postroll: 0 },
							},
						},
					},
					previousOutTransition: undefined,
				})
			}
		)

		// eslint-disable-next-line jest/expect-expect
		test('inTransition is disabled during hold', async () =>
			runTimelineTimings(
				setupRundownWithInTransitionEnableHold,
				async (playlistId, _rundownId, parts, getPartInstances, checkTimings) => {
					// Take the first Part:
					await doTakePart(context, playlistId, null, parts[0]._id, parts[1]._id)

					// activate hold mode
					await activateHold(context, { playlistId: playlistId })

					await doTakePart(context, playlistId, parts[0]._id, parts[1]._id, null)

					const { currentPartInstance } = await getPartInstances()
					await checkTimings({
						// old part ends immediately
						previousPart: { end: `#${getPartGroupId(currentPartInstance!)}.start + 0` },
						currentPieces: {
							// pieces are not delayed
							piece010: {
								controlObj: { start: 0 },
								childGroup: { preroll: 0, postroll: 0 },
							},
							// no in transition
							piece011: null,
						},
						currentInfinitePieces: {},
						previousOutTransition: undefined,
					})
				}
			))

		testTransitionTimings(
			'inTransition disabled',
			setupRundownWithInTransitionDisabled,
			async (_rundownId0, _timeline, currentPartInstance, _previousPartInstance, checkTimings) => {
				await checkTimings({
					// old part is not extended
					previousPart: { end: `#${getPartGroupId(currentPartInstance)}.start + 0` },
					currentPieces: {
						// pieces are not delayed
						piece010: {
							controlObj: { start: 0 },
							childGroup: { preroll: 0, postroll: 0 },
						},
						// no transition piece
						piece011: null,
					},
					currentInfinitePieces: {},
					previousOutTransition: undefined,
				})
			}
		)
	})

	describe('Out transitions', () => {
		testTransitionTimings(
			'Basic outTransition',
			setupRundownWithOutTransition,
			async (_rundownId0, _timeline, currentPartInstance, previousPartInstance, checkTimings) => {
				await checkTimings({
					// old part is extended by 1000ms due to transition keepalive
					previousPart: { end: `#${getPartGroupId(currentPartInstance)}.start + 1000` },
					currentPieces: {
						// pieces are delayed by outTransition time
						piece010: {
							controlObj: { start: 1000 },
							childGroup: { preroll: 0, postroll: 0 },
						},
					},
					currentInfinitePieces: {},
					// outTransitionPiece is inserted
					previousOutTransition: {
						controlObj: { start: `#${getPartGroupId(previousPartInstance)}.end - 1000` },
						childGroup: { preroll: 0, postroll: 0 },
					},
				})
			}
		)

		testTransitionTimings(
			'outTransition + preroll',
			setupRundownWithOutTransitionAndPreroll,
			async (_rundownId0, _timeline, currentPartInstance, previousPartInstance, checkTimings) => {
				await checkTimings({
					// old part is extended by 1000ms due to transition keepalive
					previousPart: { end: `#${getPartGroupId(currentPartInstance)}.start + 1000` },
					currentPieces: {
						// pieces are delayed by outTransition time
						piece010: {
							// 1000ms out transition, 250ms preroll
							controlObj: { start: 1000 },
							childGroup: { preroll: 250, postroll: 0 },
						},
					},
					currentInfinitePieces: {},
					// outTransitionPiece is inserted
					previousOutTransition: {
						controlObj: { start: `#${getPartGroupId(previousPartInstance)}.end - 1000` },
						childGroup: { preroll: 0, postroll: 0 },
					},
				})
			}
		)

		testTransitionTimings(
			'outTransition + preroll (2)',
			setupRundownWithOutTransitionAndPreroll2,
			async (_rundownId0, _timeline, currentPartInstance, previousPartInstance, checkTimings) => {
				await checkTimings({
					// old part is extended by 1000ms due to transition keepalive
					previousPart: { end: `#${getPartGroupId(currentPartInstance)}.start + 1000` },
					currentPieces: {
						// pieces are delayed by outTransition time
						piece010: {
							// 250ms out transition, 1000ms preroll. preroll takes precedence
							controlObj: { start: 1000 },
							childGroup: { preroll: 1000, postroll: 0 },
						},
					},
					currentInfinitePieces: {},
					// outTransitionPiece is inserted
					previousOutTransition: {
						controlObj: { start: `#${getPartGroupId(previousPartInstance)}.end - 250` },
						childGroup: { preroll: 0, postroll: 0 },
					},
				})
			}
		)

		testTransitionTimings(
			'outTransition + inTransition',
			setupRundownWithOutTransitionAndInTransition,
			async (_rundownId0, _timeline, currentPartInstance, previousPartInstance, checkTimings) => {
				await checkTimings({
					// old part is extended by 1000ms due to transition keepalive
					previousPart: { end: `#${getPartGroupId(currentPartInstance)}.start + 600` }, // 600ms outtransiton & 250ms transition keepalive
					currentPieces: {
						// pieces are delayed by in transition preroll time
						piece010: {
							// inTransPieceTlObj + 300 contentDelay
							controlObj: { start: 650 },
							childGroup: { preroll: 0, postroll: 0 },
						},
						// in transition is delayed by outTransition time
						piece011: {
							// 600 - 250 = 350
							controlObj: { start: 350, duration: 500 },
							childGroup: { preroll: 0, postroll: 0 },
						},
					},
					currentInfinitePieces: {},
					// outTransitionPiece is inserted
					previousOutTransition: {
						controlObj: { start: `#${getPartGroupId(previousPartInstance)}.end - 600` },
						childGroup: { preroll: 0, postroll: 0 },
					},
				})
			}
		)

		// eslint-disable-next-line jest/expect-expect
		test('outTransition is disabled during hold', async () =>
			runTimelineTimings(
				setupRundownWithOutTransitionEnableHold,
				async (playlistId, _rundownId, parts, getPartInstances, checkTimings) => {
					// Take the first Part:
					await doTakePart(context, playlistId, null, parts[0]._id, parts[1]._id)

					// activate hold mode
					await activateHold(context, { playlistId: playlistId })

					await doTakePart(context, playlistId, parts[0]._id, parts[1]._id, null)

					const { currentPartInstance } = await getPartInstances()
					await checkTimings({
						previousPart: { end: `#${getPartGroupId(currentPartInstance!)}.start + 500` }, // note: this seems odd, but the pieces are delayed to compensate
						currentPieces: {
							piece010: {
								controlObj: { start: 500 }, // note: Offset matches extension of previous partGroup
								childGroup: { preroll: 0, postroll: 0 },
							},
						},
						currentInfinitePieces: {},
						previousOutTransition: undefined,
					})
				}
			))
	})

	describe('Adlib pieces', () => {
		async function doStartAdlibPiece(
			playlistId: RundownPlaylistId,
			currentPartInstance: DBPartInstance,
			adlibSource: AdLibPiece
		) {
			await runJobWithPlayoutCache(context, { playlistId }, null, async (cache) => {
				const rundown = cache.Rundowns.findOne(currentPartInstance.rundownId) as Rundown
				expect(rundown).toBeTruthy()

				return innerStartOrQueueAdLibPiece(context, cache, rundown, false, currentPartInstance, adlibSource)
			})
		}

		async function doWrapAndStartAdlibPiece(
			playlistId: RundownPlaylistId,
			partInstance: DBPartInstance,
			piece: Piece
		) {
			await runJobWithPlayoutCache(context, { playlistId }, null, async (cache) => {
				const rundown = cache.Rundowns.findOne(partInstance.rundownId) as Rundown
				expect(rundown).toBeTruthy()
				const newPieceInstance = wrapPieceToInstance(piece, partInstance.playlistActivationId, partInstance._id)

				return innerStartAdLibPiece(context, cache, rundown, partInstance, newPieceInstance)
			})
		}

		async function doSimulatePiecePlaybackTimings(playlistId: RundownPlaylistId, time: Time, objectCount: number) {
			const timelineComplete = (await context.directCollections.Timelines.findOne(
				context.studioId
			)) as TimelineComplete
			expect(timelineComplete).toBeTruthy()

			const rawTimelineObjs = deserializeTimelineBlob(timelineComplete.timelineBlob)
			const nowObjs = rawTimelineObjs.filter((obj) => !Array.isArray(obj.enable) && obj.enable.start === 'now')
			expect(nowObjs).toHaveLength(objectCount)

			// All should be inside a PartGroup
			expect(
				nowObjs.find((obj) => !obj.inGroup || !obj.inGroup.startsWith(getPartGroupId(protectString(''))))
			).toBeFalsy()

			const results = nowObjs.map((obj) => ({
				id: obj.id,
				time: time,
			}))
			// console.log('Sending trigger for:', results)

			await handleTimelineTriggerTime(context, { results })

			await doUpdateTimeline(context, playlistId)
		}

		test('Current part with preroll', async () =>
			runTimelineTimings(
				async (
					context: MockJobContext,
					playlistId: RundownPlaylistId,
					rundownId: RundownId,
					showStyle: ReadonlyDeep<ShowStyleCompound>
				): Promise<RundownId> => {
					await setupRundownBase(
						context,
						playlistId,
						rundownId,
						showStyle,
						{},
						{
							piece0: { prerollDuration: 500 },
							piece1: { prerollDuration: 50, sourceLayerId: showStyle.sourceLayers[3]._id },
						}
					)

					return rundownId
				},
				async (playlistId, _rundownId, parts, getPartInstances, checkTimings) => {
					// Take the only Part:
					await doTakePart(context, playlistId, null, parts[0]._id, null)

					// Should look normal for now
					await checkTimings({
						previousPart: null,
						currentPieces: {
							piece000: {
								controlObj: { start: 500 }, // This one gave the preroll
								childGroup: { preroll: 500, postroll: 0 },
							},
							piece001: {
								controlObj: { start: 500 },
								childGroup: { preroll: 50, postroll: 0 },
							},
						},
						currentInfinitePieces: {},
						previousOutTransition: undefined,
					})

					const { currentPartInstance } = await getPartInstances()
					expect(currentPartInstance).toBeTruthy()

					// Insert an adlib piece
					await doStartAdlibPiece(
						playlistId,
						currentPartInstance!,
						literal<AdLibPiece>({
							_id: protectString('adlib1'),
							rundownId: currentPartInstance!.rundownId,
							status: PieceStatusCode.OK,
							externalId: 'fake',
							name: 'Adlibbed piece',
							lifespan: PieceLifespan.WithinPart,
							sourceLayerId: showStyle.sourceLayers[0]._id,
							outputLayerId: showStyle.outputLayers[0]._id,
							content: {},
							timelineObjectsString: EmptyPieceTimelineObjectsBlob,
							_rank: 0,
						})
					)

					const adlibbedPieceId = 'randomId9007'

					// The adlib should be starting at 'now'
					await checkTimings({
						previousPart: null,
						currentPieces: {
							piece000: {
								controlObj: {
									start: 500, // This one gave the preroll
									end: `#piece_group_control_${currentPartInstance!._id}_${adlibbedPieceId}.start`,
								},
								childGroup: {
									preroll: 500,
									postroll: 0,
								},
							},
							piece001: {
								controlObj: {
									start: 500,
								},
								childGroup: {
									preroll: 50,
									postroll: 0,
								},
							},
							[adlibbedPieceId]: {
								// Our adlibbed piece
								controlObj: {
									start: 'now',
								},
								childGroup: {
									preroll: 0,
									postroll: 0,
								},
							},
						},
						currentInfinitePieces: {},
						previousOutTransition: undefined,
					})

					const pieceOffset = 12560
					// Simulate the piece timing confirmation from playout-gateway
					await doSimulatePiecePlaybackTimings(playlistId, pieceOffset, 1)

					// Now we have a concrete time
					await checkTimings({
						previousPart: null,
						currentPieces: {
							piece000: {
								controlObj: {
									start: 500, // This one gave the preroll
									end: `#${getPartGroupId(currentPartInstance!)}.start + ${pieceOffset}`, // This is expected to match the start of the adlib
								},
								childGroup: {
									preroll: 500,
									postroll: 0,
								},
							},
							piece001: {
								controlObj: {
									start: 500,
								},
								childGroup: {
									preroll: 50,
									postroll: 0,
								},
							},
							[adlibbedPieceId]: {
								// Our adlibbed piece
								controlObj: {
									start: pieceOffset,
								},
								childGroup: {
									preroll: 0,
									postroll: 0,
								},
							},
						},
						currentInfinitePieces: {},
						previousOutTransition: undefined,
					})
				}
			))

		test('Current part with preroll and adlib preroll', async () =>
			runTimelineTimings(
				async (
					context: MockJobContext,
					playlistId: RundownPlaylistId,
					rundownId: RundownId,
					showStyle: ReadonlyDeep<ShowStyleCompound>
				): Promise<RundownId> => {
					await setupRundownBase(
						context,
						playlistId,
						rundownId,
						showStyle,
						{},
						{
							piece0: { prerollDuration: 500 },
							piece1: { prerollDuration: 50, sourceLayerId: showStyle.sourceLayers[3]._id },
						}
					)

					return rundownId
				},
				async (playlistId, _rundownId, parts, getPartInstances, checkTimings) => {
					// Take the only Part:
					await doTakePart(context, playlistId, null, parts[0]._id, null)

					// Should look normal for now
					await checkTimings({
						previousPart: null,
						currentPieces: {
							piece000: {
								// This one gave the preroll
								controlObj: {
									start: 500,
								},
								childGroup: {
									preroll: 500,
									postroll: 0,
								},
							},
							piece001: {
								controlObj: {
									start: 500,
								},
								childGroup: {
									preroll: 50,
									postroll: 0,
								},
							},
						},
						currentInfinitePieces: {},
						previousOutTransition: undefined,
					})

					const { currentPartInstance } = await getPartInstances()
					expect(currentPartInstance).toBeTruthy()

					// Insert an adlib piece
					await doStartAdlibPiece(
						playlistId,
						currentPartInstance!,
						literal<AdLibPiece>({
							_id: protectString('adlib1'),
							rundownId: currentPartInstance!.rundownId,
							status: PieceStatusCode.OK,
							externalId: 'fake',
							name: 'Adlibbed piece',
							lifespan: PieceLifespan.WithinPart,
							sourceLayerId: showStyle.sourceLayers[0]._id,
							outputLayerId: showStyle.outputLayers[0]._id,
							content: {},
							timelineObjectsString: EmptyPieceTimelineObjectsBlob,
							_rank: 0,
							prerollDuration: 340,
						})
					)

					const adlibbedPieceId = 'randomId9007'

					// The adlib should be starting at 'now'
					await checkTimings({
						previousPart: null,
						currentPieces: {
							piece000: {
								controlObj: {
									start: 500, // This one gave the preroll
									end: `#piece_group_control_${currentPartInstance!._id}_${adlibbedPieceId}.start`,
								},
								childGroup: {
									preroll: 500,
									postroll: 0,
								},
							},
							piece001: {
								controlObj: {
									start: 500,
								},
								childGroup: {
									preroll: 50,
									postroll: 0,
								},
							},
							[adlibbedPieceId]: {
								// Our adlibbed piece
								controlObj: {
									start: `#piece_group_control_${
										currentPartInstance!._id
									}_${adlibbedPieceId}_start_now + 340`,
								},
								childGroup: {
									preroll: 340,
									postroll: 0,
								},
							},
						},
						currentInfinitePieces: {},
						previousOutTransition: undefined,
					})

					const pieceOffset = 12560
					// Simulate the piece timing confirmation from playout-gateway
					await doSimulatePiecePlaybackTimings(playlistId, pieceOffset, 1)

					// Now we have a concrete time
					await checkTimings({
						previousPart: null,
						currentPieces: {
							piece000: {
								controlObj: {
									start: 500, // This one gave the preroll
									end: `#${getPartGroupId(currentPartInstance!)}.start + ${pieceOffset}`,
								},
								childGroup: {
									preroll: 500,
									postroll: 0,
								},
							},
							piece001: {
								controlObj: {
									start: 500,
								},
								childGroup: {
									preroll: 50,
									postroll: 0,
								},
							},
							[adlibbedPieceId]: {
								// Our adlibbed piece
								controlObj: {
									start: pieceOffset,
								},
								childGroup: {
									preroll: 340,
									postroll: 0,
								},
							},
						},
						currentInfinitePieces: {},
						previousOutTransition: undefined,
					})
				}
			))

		// eslint-disable-next-line jest/expect-expect
		test('Next part with inTransition + dynamicallyInserted adlib piece', async () =>
			runTimelineTimings(
				setupRundownWithInTransitionPlannedPiece,
				async (playlistId, _rundownId, parts, getPartInstances, checkTimings) => {
					// Take the first Part:
					await doTakePart(context, playlistId, null, parts[0]._id, parts[1]._id)

					const { nextPartInstance } = await getPartInstances()
					// Insert an adlib piece
					await doWrapAndStartAdlibPiece(
						playlistId,
						nextPartInstance!,
						literal<Piece>({
							_id: protectString('adlib1'),
							startRundownId: nextPartInstance!.rundownId,
							startSegmentId: nextPartInstance!.segmentId,
							startPartId: parts[1]._id,
							status: PieceStatusCode.OK,
							externalId: 'fake',
							name: 'Adlibbed piece',
							lifespan: PieceLifespan.WithinPart,
							sourceLayerId: showStyle.sourceLayers[1]._id,
							outputLayerId: showStyle.outputLayers[0]._id,
							content: {},
							timelineObjectsString: EmptyPieceTimelineObjectsBlob,
							enable: { start: 0 },
							invalid: false,
							pieceType: IBlueprintPieceType.Normal,
						})
					)

					await doTakePart(context, playlistId, parts[0]._id, parts[1]._id, null)

					await checkTimings({
						// old part is extended by 1000ms due to transition keepalive
						previousPart: { end: `#${getPartGroupId(nextPartInstance!)}.start + 1000` },
						currentPieces: {
							// exclusive group between layers 0 and 1
							piece010: null,
							// transition piece
							piece011: {
								controlObj: { start: 0 },
								childGroup: { preroll: 0, postroll: 0 },
							},
							// pieces are delayed by the content delay
							piece012: {
								controlObj: { start: 1500, duration: 1000 },
								childGroup: { preroll: 0, postroll: 0 },
							},
							adlib1: {
								controlObj: { start: 500 },
								childGroup: { preroll: 0, postroll: 0 },
							},
						},
						currentInfinitePieces: {},
						previousOutTransition: undefined,
					})
				}
			))

		// eslint-disable-next-line jest/expect-expect
		test('Current part with inTransition + dynamicallyInserted adlib piece', async () =>
			runTimelineTimings(
				setupRundownWithInTransitionPlannedPiece,
				async (playlistId, _rundownId, parts, getPartInstances, checkTimings) => {
					// Take the first Part:
					await doTakePart(context, playlistId, null, parts[0]._id, parts[1]._id)
					// Take the second part
					await doTakePart(context, playlistId, parts[0]._id, parts[1]._id, null)

					const { currentPartInstance } = await getPartInstances()
					// Insert an adlib piece
					await doStartAdlibPiece(
						playlistId,
						currentPartInstance!,
						literal<AdLibPiece>({
							_id: protectString('adlib1'),
							rundownId: currentPartInstance!.rundownId,
							status: PieceStatusCode.OK,
							externalId: 'fake',
							name: 'Adlibbed piece',
							lifespan: PieceLifespan.WithinPart,
							sourceLayerId: showStyle.sourceLayers[1]._id,
							outputLayerId: showStyle.outputLayers[0]._id,
							content: {},
							timelineObjectsString: EmptyPieceTimelineObjectsBlob,
							invalid: false,
							_rank: 0,
						})
					)

					const adlibbedPieceId = 'randomId9008'

					const pieceOffset = 12560
					// Simulate the piece timing confirmation from playout-gateway
					await doSimulatePiecePlaybackTimings(playlistId, pieceOffset, 1)

					await checkTimings({
						// old part is extended by 1000ms due to transition keepalive
						previousPart: { end: `#${getPartGroupId(currentPartInstance!)}.start + 1000` },
						currentPieces: {
							piece010: {
								controlObj: {
									start: 500,
									end: `#${getPartGroupId(currentPartInstance!)}.start + ${pieceOffset}`,
								},
								childGroup: { preroll: 0, postroll: 0 },
							},
							// transition piece
							piece011: {
								controlObj: { start: 0 },
								childGroup: { preroll: 0, postroll: 0 },
							},
							piece012: {
								controlObj: { start: 1500, duration: 1000 },
								childGroup: { preroll: 0, postroll: 0 },
							},
							[adlibbedPieceId]: {
								controlObj: { start: 12560 },
								childGroup: { preroll: 0, postroll: 0 },
							},
						},
						currentInfinitePieces: {},
						previousOutTransition: undefined,
					})
				}
			))
	})
})
