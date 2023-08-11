import { PeripheralDeviceType } from '@sofie-automation/corelib/dist/dataModel/PeripheralDevice'
import { DBRundown } from '@sofie-automation/corelib/dist/dataModel/Rundown'
import { RundownHoldState } from '@sofie-automation/corelib/dist/dataModel/RundownPlaylist'
import { UserError, UserErrorMessage } from '@sofie-automation/corelib/dist/error'
import { logger } from '../logging'
import { JobContext } from '../jobs'
import { CacheForPlayout, getOrderedSegmentsAndPartsFromPlayoutCache, getSelectedPartInstancesFromCache } from './cache'
import { isTooCloseToAutonext, selectNextPart, setNextPart } from './lib'
import { getCurrentTime } from '../lib'
import { DBShowStyleBase } from '@sofie-automation/corelib/dist/dataModel/ShowStyleBase'
import { ShowStyleCompound } from '@sofie-automation/corelib/dist/dataModel/ShowStyleCompound'
import { PartEndState, VTContent } from '@sofie-automation/blueprints-integration'
import { DBPartInstance } from '@sofie-automation/corelib/dist/dataModel/PartInstance'
import { ReadonlyDeep } from 'type-fest'
import { getResolvedPieces } from './pieces'
import { clone, getRandomId, literal, stringifyError } from '@sofie-automation/corelib/dist/lib'
import { protectString } from '@sofie-automation/corelib/dist/protectedString'
import { updateTimeline } from './timeline/generate'
import {
	PieceInstanceId,
	PieceInstanceInfiniteId,
	RundownPlaylistActivationId,
} from '@sofie-automation/corelib/dist/dataModel/Ids'
import { PieceInstance } from '@sofie-automation/corelib/dist/dataModel/PieceInstance'
import { PartEventContext, RundownContext } from '../blueprints/context'
import { WrappedShowStyleBlueprint } from '../blueprints/cache'
import { innerStopPieces } from './adlib'
import { reportPartInstanceHasStarted, reportPartInstanceHasStopped } from '../blueprints/events'
import { EventsJobs } from '@sofie-automation/corelib/dist/worker/events'
import { calculatePartTimings } from '@sofie-automation/corelib/dist/playout/timings'
import { convertPartInstanceToBlueprints, convertResolvedPieceInstanceToBlueprints } from '../blueprints/context/lib'
import { processAndPrunePieceInstanceTimings } from '@sofie-automation/corelib/dist/playout/infinites'

export async function takeNextPartInnerSync(context: JobContext, cache: CacheForPlayout, now: number): Promise<void> {
	const span = context.startSpan('takeNextPartInner')

	if (!cache.Playlist.doc.activationId) throw new Error(`Rundown Playlist "${cache.Playlist.doc._id}" is not active!`)
	const playlistActivationId = cache.Playlist.doc.activationId

	const timeOffset: number | null = cache.Playlist.doc.nextTimeOffset || null

	const { currentPartInstance, nextPartInstance, previousPartInstance } = getSelectedPartInstancesFromCache(cache)

	const currentOrNextPartInstance = nextPartInstance || currentPartInstance
	if (!currentOrNextPartInstance) throw new Error(`No partInstance could be found!`)
	const currentRundown = currentOrNextPartInstance
		? cache.Rundowns.findOne(currentOrNextPartInstance.rundownId)
		: undefined
	if (!currentRundown)
		throw new Error(
			`Rundown "${(currentOrNextPartInstance && currentOrNextPartInstance.rundownId) || ''}" could not be found!`
		)

	const pShowStyle = context.getShowStyleCompound(currentRundown.showStyleVariantId, currentRundown.showStyleBaseId)

	if (currentPartInstance) {
		const allowTransition = previousPartInstance && !previousPartInstance.part.disableNextInTransition
		const start = currentPartInstance.timings?.startedPlayback

		const now = getCurrentTime()
		if (currentPartInstance.blockTakeUntil && currentPartInstance.blockTakeUntil > now) {
			const remainingTime = currentPartInstance.blockTakeUntil - now
			// Adlib-actions can arbitrarily block takes from being done
			logger.debug(`Take is blocked until ${currentPartInstance.blockTakeUntil}. Which is in: ${remainingTime}`)
			throw UserError.create(UserErrorMessage.TakeBlockedDuration, { duration: remainingTime })
		}

		// If there was a transition from the previous Part, then ensure that has finished before another take is permitted
		if (
			allowTransition &&
			currentPartInstance.part.inTransition &&
			start &&
			now < start + currentPartInstance.part.inTransition.blockTakeDuration
		) {
			throw UserError.create(UserErrorMessage.TakeDuringTransition)
		}

		if (isTooCloseToAutonext(currentPartInstance, true)) {
			throw UserError.create(UserErrorMessage.TakeCloseToAutonext)
		}
	}

	if (cache.Playlist.doc.holdState === RundownHoldState.COMPLETE) {
		cache.Playlist.update({
			$set: {
				holdState: RundownHoldState.NONE,
			},
		})
		// If hold is active, then this take is to clear it
	} else if (cache.Playlist.doc.holdState === RundownHoldState.ACTIVE) {
		await completeHold(context, cache, await pShowStyle, currentPartInstance)

		if (span) span.end()

		return
	}

	const takePartInstance = nextPartInstance
	if (!takePartInstance) throw new Error('takePart not found!')
	const takeRundown: DBRundown | undefined = cache.Rundowns.findOne(takePartInstance.rundownId)
	if (!takeRundown) throw new Error(`takeRundown: takeRundown not found! ("${takePartInstance.rundownId}")`)

	// it is only a first take if the Playlist has no startedPlayback and the taken PartInstance is not untimed
	const isFirstTake = !cache.Playlist.doc.startedPlayback && !takePartInstance.part.untimed

	clearNextSegmentId(cache, takePartInstance)

	const nextPart = selectNextPart(
		context,
		cache.Playlist.doc,
		takePartInstance,
		null,
		getOrderedSegmentsAndPartsFromPlayoutCache(cache)
	)

	const showStyle = await pShowStyle
	const blueprint = await context.getShowStyleBlueprint(showStyle._id)
	if (blueprint.blueprint.onPreTake) {
		const span = context.startSpan('blueprint.onPreTake')
		try {
			await blueprint.blueprint.onPreTake(
				new PartEventContext(
					'onPreTake',
					context.studio,
					context.getStudioBlueprintConfig(),
					showStyle,
					await context.getShowStyleBlueprintConfig(showStyle),
					takeRundown,
					takePartInstance
				)
			)
		} catch (err) {
			logger.error(`Error in showStyleBlueprint.onPreTake: ${stringifyError(err)}`)
		}
		if (span) span.end()
	}

	await updatePartInstanceOnTake(
		context,
		cache,
		showStyle,
		blueprint,
		takeRundown,
		takePartInstance,
		currentPartInstance
	)

	cache.Playlist.update({
		$set: {
			previousPartInstanceId: cache.Playlist.doc.currentPartInstanceId,
			currentPartInstanceId: takePartInstance._id,
			holdState:
				!cache.Playlist.doc.holdState || cache.Playlist.doc.holdState === RundownHoldState.COMPLETE
					? RundownHoldState.NONE
					: cache.Playlist.doc.holdState + 1,
		},
	})

	cache.PartInstances.update(takePartInstance._id, {
		$set: {
			isTaken: true,
			'timings.take': now,
			'timings.playOffset': timeOffset || 0,
		},
	})

	if (cache.Playlist.doc.previousPartInstanceId) {
		cache.PartInstances.update(cache.Playlist.doc.previousPartInstanceId, {
			$set: {
				'timings.takeOut': now,
			},
		})
	}

	resetPreviousSegment(cache)

	// Once everything is synced, we can choose the next part
	await setNextPart(context, cache, nextPart)

	// Setup the parts for the HOLD we are starting
	if (
		cache.Playlist.doc.previousPartInstanceId &&
		(cache.Playlist.doc.holdState as RundownHoldState) === RundownHoldState.ACTIVE
	) {
		startHold(context, cache, playlistActivationId, currentPartInstance, nextPartInstance)
	}
	await afterTake(context, cache, takePartInstance, timeOffset)

	// Last:
	const takeDoneTime = getCurrentTime()
	cache.defer(async (cache2) => {
		await afterTakeUpdateTimingsAndEvents(context, cache2, showStyle, blueprint, isFirstTake, takeDoneTime)
	})

	if (span) span.end()
}

export function clearNextSegmentId(cache: CacheForPlayout, takeOrCurrentPartInstance?: DBPartInstance): void {
	if (
		takeOrCurrentPartInstance?.consumesNextSegmentId &&
		cache.Playlist.doc.nextSegmentId === takeOrCurrentPartInstance.segmentId
	) {
		// clear the nextSegmentId if the newly taken partInstance says it was selected because of it
		cache.Playlist.update({
			$unset: {
				nextSegmentId: 1,
			},
		})
	}
}

export function resetPreviousSegment(cache: CacheForPlayout): void {
	const { previousPartInstance, currentPartInstance } = getSelectedPartInstancesFromCache(cache)

	// If the playlist is looping and
	// If the previous and current part are not in the same segment, then we have just left a segment
	if (
		cache.Playlist.doc.loop &&
		previousPartInstance &&
		previousPartInstance.segmentId !== currentPartInstance?.segmentId
	) {
		// Reset the old segment
		const segmentId = previousPartInstance.segmentId
		const resetIds = new Set(
			cache.PartInstances.update((p) => !p.reset && p.segmentId === segmentId, {
				$set: {
					reset: true,
				},
			})
		)
		cache.PieceInstances.update((p) => resetIds.has(p.partInstanceId), {
			$set: {
				reset: true,
			},
		})
	}
}

async function afterTakeUpdateTimingsAndEvents(
	context: JobContext,
	cache: CacheForPlayout,
	showStyle: ReadonlyDeep<ShowStyleCompound>,
	blueprint: ReadonlyDeep<WrappedShowStyleBlueprint>,
	isFirstTake: boolean,
	takeDoneTime: number
): Promise<void> {
	const { currentPartInstance: takePartInstance, previousPartInstance } = getSelectedPartInstancesFromCache(cache)
	const takeRundown = takePartInstance ? cache.Rundowns.findOne(takePartInstance.rundownId) : undefined

	// todo: should this be changed back to Meteor.defer, at least for the blueprint stuff?
	if (takePartInstance) {
		cache.PartInstances.update(takePartInstance._id, {
			$set: {
				'timings.takeDone': takeDoneTime,
			},
		})

		// Simulate playout, if no gateway
		const playoutDevices = cache.PeripheralDevices.findFetch((d) => d.type === PeripheralDeviceType.PLAYOUT)
		if (playoutDevices.length === 0) {
			logger.info(
				`No Playout gateway attached to studio, reporting PartInstance "${
					takePartInstance._id
				}" to have started playback on timestamp ${new Date(takeDoneTime).toISOString()}`
			)
			reportPartInstanceHasStarted(context, cache, takePartInstance, takeDoneTime)

			if (previousPartInstance) {
				logger.info(
					`Also reporting PartInstance "${
						previousPartInstance._id
					}" to have stopped playback on timestamp ${new Date(takeDoneTime).toISOString()}`
				)
				reportPartInstanceHasStopped(context, cache, previousPartInstance, takeDoneTime)
			}
		}

		// let bp = getBlueprintOfRundown(rundown)
		if (isFirstTake && takeRundown) {
			if (blueprint.blueprint.onRundownFirstTake) {
				const span = context.startSpan('blueprint.onRundownFirstTake')
				try {
					await blueprint.blueprint.onRundownFirstTake(
						new PartEventContext(
							'onRundownFirstTake',
							context.studio,
							context.getStudioBlueprintConfig(),
							showStyle,
							await context.getShowStyleBlueprintConfig(showStyle),
							takeRundown,
							takePartInstance
						)
					)
				} catch (err) {
					logger.error(`Error in showStyleBlueprint.onRundownFirstTake: ${stringifyError(err)}`)
				}
				if (span) span.end()
			}
		}

		if (blueprint.blueprint.onPostTake && takeRundown) {
			const span = context.startSpan('blueprint.onPostTake')
			try {
				await blueprint.blueprint.onPostTake(
					new PartEventContext(
						'onPostTake',
						context.studio,
						context.getStudioBlueprintConfig(),
						showStyle,
						await context.getShowStyleBlueprintConfig(showStyle),
						takeRundown,
						takePartInstance
					)
				)
			} catch (err) {
				logger.error(`Error in showStyleBlueprint.onPostTake: ${stringifyError(err)}`)
			}
			if (span) span.end()
		}
	}
}

export async function updatePartInstanceOnTake(
	context: JobContext,
	cache: CacheForPlayout,
	showStyle: ReadonlyDeep<ShowStyleCompound>,
	blueprint: ReadonlyDeep<WrappedShowStyleBlueprint>,
	takeRundown: DBRundown,
	takePartInstance: DBPartInstance,
	currentPartInstance: DBPartInstance | undefined
): Promise<void> {
	const playlist = cache.Playlist.doc

	// TODO - the state could change after this sampling point. This should be handled properly
	let previousPartEndState: PartEndState | undefined = undefined
	if (blueprint.blueprint.getEndStateForPart && currentPartInstance) {
		try {
			const time = getCurrentTime()
			const resolvedPieces = getResolvedPieces(context, cache, showStyle, currentPartInstance)

			const span = context.startSpan('blueprint.getEndStateForPart')
			const context2 = new RundownContext(
				{
					name: `${playlist.name}`,
					identifier: `playlist=${playlist._id},currentPartInstance=${
						currentPartInstance._id
					},execution=${getRandomId()}`,
				},
				context.studio,
				context.getStudioBlueprintConfig(),
				showStyle,
				await context.getShowStyleBlueprintConfig(showStyle),
				takeRundown
			)
			previousPartEndState = blueprint.blueprint.getEndStateForPart(
				context2,
				playlist.previousPersistentState,
				convertPartInstanceToBlueprints(currentPartInstance),
				resolvedPieces.map(convertResolvedPieceInstanceToBlueprints),
				time
			)
			if (span) span.end()
			logger.info(`Calculated end state in ${getCurrentTime() - time}ms`)
		} catch (err) {
			logger.error(`Error in showStyleBlueprint.getEndStateForPart: ${stringifyError(err)}`)
			previousPartEndState = undefined
		}
	}

	// calculate and cache playout timing properties, so that we don't depend on the previousPartInstance:
	const tmpTakePieces = processAndPrunePieceInstanceTimings(
		showStyle,
		cache.PieceInstances.findFetch((p) => p.partInstanceId === takePartInstance._id),
		0
	)
	const partPlayoutTimings = calculatePartTimings(
		cache.Playlist.doc.holdState,
		currentPartInstance?.part,
		cache.PieceInstances.findFetch((p) => p.partInstanceId === currentPartInstance?._id).map((p) => p.piece),
		takePartInstance.part,
		tmpTakePieces.filter((p) => !p.infinite || p.infinite.infiniteInstanceIndex === 0).map((p) => p.piece)
	)

	const partInstanceM: any = {
		$set: literal<Partial<DBPartInstance>>({
			isTaken: true,
			partPlayoutTimings: partPlayoutTimings,
		}),
	}
	if (previousPartEndState) {
		partInstanceM.$set.previousPartEndState = previousPartEndState
	}

	cache.PartInstances.update(takePartInstance._id, partInstanceM)
}

export async function afterTake(
	context: JobContext,
	cache: CacheForPlayout,
	takePartInstance: DBPartInstance,
	timeOffset: number | null = null
): Promise<void> {
	const span = context.startSpan('afterTake')
	// This function should be called at the end of a "take" event (when the Parts have been updated)

	let forceNowTime: number | undefined = undefined
	if (timeOffset) {
		forceNowTime = getCurrentTime() - timeOffset
	}
	// or after a new part has started playing
	await updateTimeline(context, cache, forceNowTime)

	cache.deferAfterSave(async () => {
		// This is low-prio, defer so that it's executed well after publications has been updated,
		// so that the playout gateway has haf the chance to learn about the timeline changes
		if (takePartInstance.part.shouldNotifyCurrentPlayingPart) {
			context
				.queueEventJob(EventsJobs.NotifyCurrentlyPlayingPart, {
					rundownId: takePartInstance.rundownId,
					isRehearsal: !!cache.Playlist.doc.rehearsal,
					partExternalId: takePartInstance.part.externalId,
				})
				.catch((e) => {
					logger.warn(`Failed to queue NotifyCurrentlyPlayingPart job: ${e}`)
				})
		}
	})

	if (span) span.end()
}

/**
 * A Hold starts by extending the "extendOnHold"-able pieces in the previous Part.
 */
function startHold(
	context: JobContext,
	cache: CacheForPlayout,
	activationId: RundownPlaylistActivationId,
	holdFromPartInstance: DBPartInstance | undefined,
	holdToPartInstance: DBPartInstance | undefined
) {
	if (!holdFromPartInstance) throw new Error('previousPart not found!')
	if (!holdToPartInstance) throw new Error('currentPart not found!')
	const span = context.startSpan('startHold')

	// Make a copy of any item which is flagged as an 'infinite' extension
	const itemsToCopy = cache.PieceInstances.findFetch(
		(p) => p.partInstanceId === holdFromPartInstance._id && !!p.piece.extendOnHold
	)
	itemsToCopy.forEach((instance) => {
		if (!instance.infinite) {
			const infiniteInstanceId: PieceInstanceInfiniteId = getRandomId()
			// mark current one as infinite
			cache.PieceInstances.update(instance._id, {
				$set: {
					infinite: {
						infiniteInstanceId: infiniteInstanceId,
						infiniteInstanceIndex: 0,
						infinitePieceId: instance.piece._id,
						fromPreviousPart: false,
					},
				},
			})

			// make the extension
			const newInstance = literal<PieceInstance>({
				_id: protectString<PieceInstanceId>(instance._id + '_hold'),
				playlistActivationId: activationId,
				rundownId: instance.rundownId,
				partInstanceId: holdToPartInstance._id,
				dynamicallyInserted: {
					time: getCurrentTime(),
				},
				piece: {
					...clone(instance.piece),
					enable: { start: 0 },
					extendOnHold: false,
				},
				infinite: {
					infiniteInstanceId: infiniteInstanceId,
					infiniteInstanceIndex: 1,
					infinitePieceId: instance.piece._id,
					fromPreviousPart: true,
					fromHold: true,
				},
				// Preserve the timings from the playing instance
				startedPlayback: instance.startedPlayback,
				stoppedPlayback: instance.stoppedPlayback,
			})
			const content = newInstance.piece.content as VTContent | undefined
			if (content && content.fileName && content.sourceDuration && instance.startedPlayback) {
				content.seek = Math.min(content.sourceDuration, getCurrentTime() - instance.startedPlayback)
			}

			// This gets deleted once the nextpart is activated, so it doesnt linger for long
			cache.PieceInstances.replace(newInstance)
		}
	})
	if (span) span.end()
}

async function completeHold(
	context: JobContext,
	cache: CacheForPlayout,
	showStyleBase: ReadonlyDeep<DBShowStyleBase>,
	currentPartInstance: DBPartInstance | undefined
): Promise<void> {
	cache.Playlist.update({
		$set: {
			holdState: RundownHoldState.COMPLETE,
		},
	})

	if (cache.Playlist.doc.currentPartInstanceId) {
		if (!currentPartInstance) throw new Error('currentPart not found!')

		// Clear the current extension line
		innerStopPieces(context, cache, showStyleBase, currentPartInstance, (p) => !!p.infinite?.fromHold, undefined)
	}

	await updateTimeline(context, cache)
}
