import { RundownPlaylistId, StudioId } from '@sofie-automation/corelib/dist/dataModel/Ids'
import { DBRundown, Rundown } from '@sofie-automation/corelib/dist/dataModel/Rundown'
import { DBRundownPlaylist } from '@sofie-automation/corelib/dist/dataModel/RundownPlaylist'
import {
	clone,
	getHash,
	getRandomString,
	normalizeArrayToMap,
	stringifyError,
} from '@sofie-automation/corelib/dist/lib'
import { protectString, unprotectString } from '@sofie-automation/corelib/dist/protectedString'
import { IngestJobs } from '@sofie-automation/corelib/dist/worker/ingest'
import {
	OrderMoveRundownToPlaylistProps,
	OrderRestoreToDefaultProps,
	RegeneratePlaylistProps,
	RemovePlaylistProps,
} from '@sofie-automation/corelib/dist/worker/studio'
import { ReadonlyDeep } from 'type-fest'
import { BlueprintResultRundownPlaylist, IBlueprintRundown } from '@sofie-automation/blueprints-integration'
import { JobContext } from './jobs'
import { logger } from './logging'
import { resetRundownPlaylist } from './playout/lib'
import { runJobWithPlaylistLock, runWithPlaylistCache } from './playout/lock'
import { updateTimeline } from './playout/timeline/generate'
import { DBStudio } from '@sofie-automation/corelib/dist/dataModel/Studio'
import { WrappedStudioBlueprint } from './blueprints/cache'
import { StudioUserContext } from './blueprints/context'
import { getCurrentTime } from './lib'
import { regeneratePlaylistAndRundownOrder, updatePlayoutAfterChangingRundownInPlaylist } from './ingest/commit'
import { allowedToMoveRundownOutOfPlaylist } from './rundown'
import { PlaylistTiming } from '@sofie-automation/corelib/dist/playout/rundownTiming'
import { UserError, UserErrorMessage } from '@sofie-automation/corelib/dist/error'
import { RundownLock } from './jobs/lock'
import { runWithRundownLock } from './ingest/lock'
import { convertRundownToBlueprints } from './blueprints/context/lib'
import { sortRundownIDsInPlaylist } from '@sofie-automation/corelib/dist/playout/playlist'

export async function handleRemoveRundownPlaylist(context: JobContext, data: RemovePlaylistProps): Promise<void> {
	const removed = await runJobWithPlaylistLock(context, data, async (playlist) => {
		if (playlist) {
			await context.directCollections.RundownPlaylists.remove(playlist._id)
			return true
		} else {
			return false
		}
	})

	if (removed) {
		// Playlist was removed, cleanup contents
		await cleanupRundownsForRemovedPlaylist(context, data.playlistId)
	}
}

/**
 * Run the cached data through blueprints in order to re-generate the Rundown
 */
export async function handleRegenerateRundownPlaylist(
	context: JobContext,
	data: RegeneratePlaylistProps
): Promise<void> {
	const ingestData = await runJobWithPlaylistLock(context, data, async (playlist, playlistLock) => {
		if (!playlist) throw new Error(`Rundown Playlist "${data.playlistId}" not found`)

		if (playlist.activationId) {
			throw UserError.create(UserErrorMessage.RundownRegenerateWhileActive)
		}

		logger.info(`Regenerating rundown playlist ${playlist.name} (${playlist._id})`)

		const rundowns: Array<Pick<DBRundown, '_id' | 'externalId'>> =
			await context.directCollections.Rundowns.findFetch(
				{ playlistId: playlist._id },
				{ projection: { _id: 1, externalId: 1 } }
			)
		if (rundowns.length === 0) return []

		await runWithPlaylistCache(context, playlist, playlistLock, null, async (cache) => {
			await resetRundownPlaylist(context, cache)

			if (cache.Playlist.doc.activationId) {
				await updateTimeline(context, cache)
			}
		})

		// exit the sync function, so the cache is written back
		return rundowns.map((rundown) => ({
			rundownExternalId: rundown.externalId,
		}))
	})

	// Fire off all the updates in parallel, in their own low-priority tasks
	await Promise.all(
		ingestData.map(async ({ rundownExternalId }) => {
			await context.queueIngestJob(IngestJobs.RegenerateRundown, {
				rundownExternalId: rundownExternalId,
				peripheralDeviceId: null,
			})
		})
	)
}

/**
 * Convert the playlistExternalId into a playlistId.
 * When we've received an externalId for a playlist, that can directly be used to reference a playlistId
 */
export function getPlaylistIdFromExternalId(studioId: StudioId, playlistExternalId: string): RundownPlaylistId {
	return protectString(getHash(`${studioId}_${playlistExternalId}`))
}

/**
 * Warning: this must not be executed inside a PlaylistLock, otherwise we risk getting into a deadlock
 */
export async function cleanupRundownsForRemovedPlaylist(
	context: JobContext,
	playlistId: RundownPlaylistId
): Promise<void> {
	const rundowns = (await context.directCollections.Rundowns.findFetch(
		{ playlistId: playlistId },
		{ projection: { _id: 1 } }
	)) as Array<Pick<Rundown, '_id'>>

	await Promise.all(
		rundowns.map(async (rd) => {
			//
			return runWithRundownLock(context, rd._id, async (rundown, lock) => {
				// Make sure rundown exists, and still belongs to the playlist
				if (rundown && rundown.playlistId === playlistId) {
					await removeRundownFromDb(context, lock)
				}
			})
		})
	)
}

export async function removeRundownFromDb(context: JobContext, lock: RundownLock): Promise<void> {
	if (!lock.isLocked) throw new Error(`Can't delete Rundown without lock: ${lock.toString()}`)

	const rundownId = lock.rundownId
	// Note: playlists are not removed by this, one could be left behind empty
	await Promise.allSettled([
		context.directCollections.Rundowns.remove({ _id: rundownId }),
		context.directCollections.AdLibActions.remove({ rundownId: rundownId }),
		context.directCollections.AdLibPieces.remove({ rundownId: rundownId }),
		context.directCollections.ExpectedMediaItems.remove({ rundownId: rundownId }),
		context.directCollections.ExpectedPlayoutItems.remove({ rundownId: rundownId }),
		context.directCollections.ExpectedPackages.remove({ rundownId: rundownId }),
		context.directCollections.IngestDataCache.remove({ rundownId: rundownId }),
		context.directCollections.RundownBaselineAdLibPieces.remove({ rundownId: rundownId }),
		context.directCollections.Segments.remove({ rundownId: rundownId }),
		context.directCollections.Parts.remove({ rundownId: rundownId }),
		context.directCollections.PartInstances.remove({ rundownId: rundownId }),
		context.directCollections.Pieces.remove({ startRundownId: rundownId }),
		context.directCollections.PieceInstances.remove({ rundownId: rundownId }),
		context.directCollections.RundownBaselineAdLibActions.remove({ rundownId: rundownId }),
		context.directCollections.RundownBaselineObjects.remove({ rundownId: rundownId }),
	])
}

export function produceRundownPlaylistInfoFromRundown(
	context: JobContext,
	studioBlueprint: ReadonlyDeep<WrappedStudioBlueprint> | undefined,
	existingPlaylist: ReadonlyDeep<DBRundownPlaylist> | undefined,
	playlistId: RundownPlaylistId,
	playlistExternalId: string,
	rundowns: ReadonlyDeep<Array<DBRundown>>
): DBRundownPlaylist {
	let playlistInfo: BlueprintResultRundownPlaylist | null = null
	try {
		if (studioBlueprint?.blueprint?.getRundownPlaylistInfo) {
			playlistInfo = studioBlueprint.blueprint.getRundownPlaylistInfo(
				new StudioUserContext(
					{
						name: 'produceRundownPlaylistInfoFromRundown',
						identifier: `studioId=${context.studioId},playlistId=${playlistId},rundownIds=${rundowns
							.map((r) => r._id)
							.join(',')}`,
						tempSendUserNotesIntoBlackHole: true,
					},
					context.studio,
					context.getStudioBlueprintConfig()
				),
				rundowns.map(convertRundownToBlueprints),
				playlistExternalId
			)
		}
	} catch (err) {
		logger.error(`Error in studioBlueprint.getRundownPlaylistInfo: ${stringifyError(err)}`)
		playlistInfo = null
	}

	const rundownsInDefaultOrder = sortDefaultRundownInPlaylistOrder(rundowns)

	let newPlaylist: DBRundownPlaylist
	if (playlistInfo) {
		newPlaylist = {
			created: getCurrentTime(),
			currentPartInstanceId: null,
			nextPartInstanceId: null,
			previousPartInstanceId: null,
			rundownIdsInOrder: [],

			...clone<DBRundownPlaylist | undefined>(existingPlaylist),

			_id: playlistId,
			externalId: playlistExternalId,
			organizationId: context.studio.organizationId,
			studioId: context.studioId,
			name: playlistInfo.playlist.name,
			timing: playlistInfo.playlist.timing,

			loop: playlistInfo.playlist.loop,

			outOfOrderTiming: playlistInfo.playlist.outOfOrderTiming,
			timeOfDayCountdowns: playlistInfo.playlist.timeOfDayCountdowns,
			metaData: playlistInfo.playlist.metaData,

			modified: getCurrentTime(),
		}
	} else {
		newPlaylist = {
			...defaultPlaylistForRundown(rundownsInDefaultOrder[0], context.studio, existingPlaylist),
			_id: playlistId,
			externalId: playlistExternalId,
		}
	}

	if (!newPlaylist.rundownRanksAreSetInSofie) {
		if (playlistInfo?.order) {
			// The blueprints gave us an order

			newPlaylist.rundownIdsInOrder = []

			const blueprintOrder = Object.entries(playlistInfo.order)
				.filter((e) => typeof e[1] === 'number')
				.sort((a, b) => {
					if (a[1] !== b[1]) {
						return a[1] - b[1]
					} else {
						return a[0].localeCompare(b[0])
					}
				})

			const rundownExternalIdMap = normalizeArrayToMap(rundownsInDefaultOrder, 'externalId')
			for (const item of blueprintOrder) {
				const rundown = rundownExternalIdMap.get(item[0])
				if (rundown) {
					newPlaylist.rundownIdsInOrder.push(rundown._id)
				}
			}
		} else {
			newPlaylist.rundownIdsInOrder = rundownsInDefaultOrder.map((rd) => rd._id)
		}
	}

	// Make sure that every rundown was included in the sorting
	for (const rundown of rundownsInDefaultOrder) {
		if (!newPlaylist.rundownIdsInOrder.includes(rundown._id)) {
			newPlaylist.rundownIdsInOrder.push(rundown._id)
		}
	}

	// Ensure there aren't unused RundownIds
	const expectedRundownIds = new Set(rundowns.map((rd) => rd._id))
	newPlaylist.rundownIdsInOrder = newPlaylist.rundownIdsInOrder.filter((id) => expectedRundownIds.has(id))

	return newPlaylist
}

function defaultPlaylistForRundown(
	rundown: ReadonlyDeep<IBlueprintRundown>,
	studio: ReadonlyDeep<DBStudio>,
	existingPlaylist?: ReadonlyDeep<DBRundownPlaylist>
): Omit<DBRundownPlaylist, '_id' | 'externalId'> {
	return {
		created: getCurrentTime(),
		currentPartInstanceId: null,
		nextPartInstanceId: null,
		previousPartInstanceId: null,
		rundownIdsInOrder: [],

		...clone<DBRundownPlaylist | undefined>(existingPlaylist),

		organizationId: studio.organizationId,
		studioId: studio._id,
		name: rundown.name,
		timing: rundown.timing,

		modified: getCurrentTime(),
	}
}

/** Move a rundown manually (by a user in Sofie)  */
export async function moveRundownIntoPlaylist(
	context: JobContext,
	data: OrderMoveRundownToPlaylistProps
): Promise<void> {
	const studio = context.studio

	if (data.intoPlaylistId) {
		const tmpIntoPlaylist: Pick<DBRundownPlaylist, '_id' | 'studioId'> | undefined =
			await context.directCollections.RundownPlaylists.findOne(data.intoPlaylistId, {
				projection: { studioId: 1 },
			})
		if (!tmpIntoPlaylist || tmpIntoPlaylist.studioId !== context.studioId)
			throw new Error(`RundownPlaylist "${data.intoPlaylistId}" not found`)
	}

	// Lock the rundown, to make sure that an ingest operation doesnt overwrite our playlistId changes
	// Future: This lock is held for way longer than it needs to, but this is the safest to avoid a race condition
	await runWithRundownLock(context, data.rundownId, async (rundown) => {
		if (!rundown) throw new Error(`Rundown "${data.rundownId}" not found`)

		if (data.intoPlaylistId === null || rundown.playlistId !== data.intoPlaylistId) {
			// Do a check if we're allowed to move out of currently playing playlist:
			await runJobWithPlaylistLock(
				context,
				{ playlistId: rundown.playlistId },
				async (oldPlaylist, oldPlaylistLock) => {
					if (!oldPlaylist)
						throw new Error(
							`RundownPlaylists "${rundown.playlistId}" for rundown "${rundown._id}" not found!`
						)

					if (!(await allowedToMoveRundownOutOfPlaylist(context, oldPlaylist, rundown))) {
						throw new Error(`Not allowed to move currently playing rundown!`)
					}

					// Quickly Remove it from the old playlist so that we can free the playlist lock
					await context.directCollections.Rundowns.update(rundown._id, {
						$set: { playlistId: protectString('__TMP__'), playlistIdIsSetInSofie: true },
					})

					// Regenerate the playlist
					const newPlaylist = await regeneratePlaylistAndRundownOrder(context, oldPlaylistLock, oldPlaylist)
					if (newPlaylist) {
						// ensure the 'old' playout is updated to remove any references to the rundown
						await updatePlayoutAfterChangingRundownInPlaylist(context, newPlaylist, oldPlaylistLock, null)
					}
				}
			)
		}

		if (data.intoPlaylistId) {
			// Move into an existing playlist:
			await runJobWithPlaylistLock(
				context,
				{ playlistId: data.intoPlaylistId },
				async (intoPlaylist, intoPlaylistLock) => {
					if (!intoPlaylist)
						throw new Error(
							`RundownPlaylists "${data.intoPlaylistId}" for rundown "${rundown._id}" not found!`
						)

					const allRundowns = await context.directCollections.Rundowns.findFetch({
						playlistId: intoPlaylist._id,
					})

					// Make sure the playlist is set to manual ordering
					if (!intoPlaylist.rundownRanksAreSetInSofie) {
						intoPlaylist.rundownRanksAreSetInSofie = true
						// intoPlaylist.rundownRanks = TODO?
						await context.directCollections.RundownPlaylists.update(intoPlaylist._id, {
							$set: {
								rundownRanksAreSetInSofie: true,
							},
						})
					}

					if (intoPlaylist._id === rundown.playlistId) {
						// Move the rundown within the playlist
						const i = data.rundownsIdsInPlaylistInOrder.indexOf(data.rundownId)
						if (i === -1)
							throw new Error(`RundownId "${data.rundownId}" not found in rundownsIdsInPlaylistInOrder`)

						// Determine the new order of the rundowns
						let newRundownIdOrder = intoPlaylist.rundownIdsInOrder.filter((id) => id !== data.rundownId) // shallow clone. remove self from current position
						if (data.rundownsIdsInPlaylistInOrder.length === 1) {
							// Push to the end. No order was specified
							newRundownIdOrder.push(data.rundownId)
						} else if (data.rundownsIdsInPlaylistInOrder.length === 2) {
							// It looks like we were sent a fragment, rather than a complete order
							if (i === 0) {
								const otherId = data.rundownsIdsInPlaylistInOrder[1]
								const otherIndex = newRundownIdOrder.indexOf(otherId)

								// Push rundown before otherId (or the start)
								if (otherIndex === -1) {
									newRundownIdOrder.unshift(data.rundownId)
								} else {
									newRundownIdOrder.splice(otherIndex, 0, data.rundownId)
								}
							} else {
								const otherId = data.rundownsIdsInPlaylistInOrder[0]
								const otherIndex = newRundownIdOrder.indexOf(otherId)

								// Push rundown after otherId (or the end)
								if (otherIndex === -1) {
									newRundownIdOrder.push(data.rundownId)
								} else {
									newRundownIdOrder.splice(otherIndex + 1, 0, data.rundownId)
								}
							}
						} else {
							// Replace the complete order
							newRundownIdOrder = data.rundownsIdsInPlaylistInOrder
						}

						// Ensure that all the rundowns are present
						newRundownIdOrder = sortRundownIDsInPlaylist(
							newRundownIdOrder,
							allRundowns.map((r) => r._id)
						)

						// Set on the playlist, the `regeneratePlaylistAndRundownOrder` call will persist it
						intoPlaylist.rundownIdsInOrder = newRundownIdOrder
					} else {
						// Moving from another playlist
						allRundowns.push(rundown)

						// Put the rundown into the playlist (it will appear at the end until we save the order)
						await context.directCollections.Rundowns.update(rundown._id, {
							$set: {
								playlistId: intoPlaylist._id,
								playlistIdIsSetInSofie: true,
							},
						})
						rundown.playlistId = intoPlaylist._id
						rundown.playlistIdIsSetInSofie = true
					}

					// Update the playlist and the order of the contents
					const newPlaylist = await regeneratePlaylistAndRundownOrder(
						context,
						intoPlaylistLock,
						intoPlaylist,
						allRundowns
					)
					if (!newPlaylist) {
						throw new Error(`RundownPlaylist must still be valid as it has some Rundowns`)
					}

					// If the playlist is active this could have changed lookahead
					await updatePlayoutAfterChangingRundownInPlaylist(context, newPlaylist, intoPlaylistLock, rundown)
				}
			)
		} else {
			// Move into a new playlist:

			// No point locking the playlist, as we are creating something fresh and unique here

			const externalId = getRandomString()
			const playlist: DBRundownPlaylist = {
				...defaultPlaylistForRundown(rundown, studio),
				externalId: externalId,
				_id: getPlaylistIdFromExternalId(studio._id, externalId),
				rundownIdsInOrder: [rundown._id],
			}
			await context.directCollections.RundownPlaylists.insertOne(playlist)

			await context.directCollections.Rundowns.update(rundown._id, {
				$set: {
					playlistId: playlist._id,
					playlistIdIsSetInSofie: true,
				},
			})
		}
	})
}

/** Restore the order of rundowns in a playlist, giving control over the ordering back to the NRCS */
export async function restoreRundownsInPlaylistToDefaultOrder(
	context: JobContext,
	data: OrderRestoreToDefaultProps
): Promise<void> {
	await runJobWithPlaylistLock(context, data, async (playlist, playlistLock) => {
		if (playlist) {
			// Update the playlist
			await context.directCollections.RundownPlaylists.update(playlist._id, {
				$set: {
					rundownRanksAreSetInSofie: false,
				},
			})
			const newPlaylist = clone<DBRundownPlaylist>(playlist)
			newPlaylist.rundownRanksAreSetInSofie = false

			// Update the _rank of the rundowns
			const updatedPlaylist = await regeneratePlaylistAndRundownOrder(context, playlistLock, newPlaylist)

			if (updatedPlaylist) {
				// If the playlist is active this could have changed lookahead
				await updatePlayoutAfterChangingRundownInPlaylist(context, updatedPlaylist, playlistLock, null)
			}
		}
	})
}

function sortDefaultRundownInPlaylistOrder(rundowns0: ReadonlyDeep<Array<DBRundown>>): ReadonlyDeep<Array<DBRundown>> {
	const rundowns = [...rundowns0] // shallow clone array
	return rundowns.sort((a, b) => {
		const timingSorting = PlaylistTiming.sortTiminings(a, b)
		if (timingSorting !== 0) return timingSorting

		const nameSorting = a.name.localeCompare(b.name)
		if (nameSorting !== 0) return nameSorting

		const externalIdSorting = a.externalId.localeCompare(b.externalId)
		if (externalIdSorting !== 0) return externalIdSorting

		const idSorting = unprotectString(a._id).localeCompare(unprotectString(b._id))
		return idSorting
	})
}
