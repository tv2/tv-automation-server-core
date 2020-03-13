import { Meteor } from 'meteor/meteor'
import { check } from 'meteor/check'
import * as _ from 'underscore'
import { PeripheralDevice } from '../../../lib/collections/PeripheralDevices'
import {
	Rundown,
	Rundowns,
	DBRundown
} from '../../../lib/collections/Rundowns'
import {
	Part,
	Parts,
	DBPart
} from '../../../lib/collections/Parts'
import {
	Piece,
	Pieces
} from '../../../lib/collections/Pieces'
import {
	saveIntoDb,
	getCurrentTime,
	literal,
	sumChanges,
	anythingChanged,
	ReturnType,
	asyncCollectionUpsert,
	asyncCollectionUpdate,
	waitForPromise,
	PreparedChanges,
	prepareSaveIntoDb,
	savePreparedChanges,
	Optional,
	PreparedChangesChangesDoc,
	omit
} from '../../../lib/lib'
import { PeripheralDeviceSecurity } from '../../security/peripheralDevices'
import { IngestRundown, IngestSegment, IngestPart, BlueprintResultSegment } from 'tv-automation-sofie-blueprints-integration'
import { logger } from '../../../lib/logging'
import { Studio } from '../../../lib/collections/Studios'
import { selectShowStyleVariant, afterRemoveSegments, afterRemoveParts, ServerRundownAPI, removeSegments, updatePartRanks } from '../rundown'
import { loadShowStyleBlueprints, getBlueprintOfRundown } from '../blueprints/cache'
import { ShowStyleContext, RundownContext, SegmentContext } from '../blueprints/context'
import { Blueprints, Blueprint } from '../../../lib/collections/Blueprints'
import { RundownBaselineObj, RundownBaselineObjs } from '../../../lib/collections/RundownBaselineObjs'
import { Random } from 'meteor/random'
import { postProcessRundownBaselineItems, postProcessAdLibPieces, postProcessPieces } from '../blueprints/postProcess'
import { RundownBaselineAdLibItem, RundownBaselineAdLibPieces } from '../../../lib/collections/RundownBaselineAdLibPieces'
import { DBSegment, Segments, Segment } from '../../../lib/collections/Segments'
import { AdLibPiece, AdLibPieces } from '../../../lib/collections/AdLibPieces'
import { saveRundownCache, saveSegmentCache, loadCachedIngestSegment, loadCachedRundownData } from './ingestCache'
import { getRundownId, getSegmentId, getPartId, getStudioFromDevice, getRundown, canBeUpdated } from './lib'
import { PackageInfo } from '../../coreSystem'
import { updateExpectedMediaItemsOnRundown } from '../expectedMediaItems'
import { triggerUpdateTimelineAfterIngestData } from '../playout/playout'
import { PartNote, NoteType } from '../../../lib/api/notes'
import { syncFunction } from '../../codeControl'
import { updateSourceLayerInfinitesAfterPart } from '../playout/infinites'
import { UpdateNext } from './updateNext'
import { extractExpectedPlayoutItems, updateExpectedPlayoutItemsOnRundown } from './expectedPlayoutItems'
import { ExpectedPlayoutItem, ExpectedPlayoutItems } from '../../../lib/collections/ExpectedPlayoutItems'
import { Settings } from '../../../lib/Settings'
import { isArray } from 'util'

export enum RundownSyncFunctionPriority {
	Ingest = 0,
	Playout = 10,
}
export function rundownSyncFunction<T extends Function> (rundownId: string, priority: RundownSyncFunctionPriority, fcn: T): ReturnType<T> {
	return syncFunction(fcn, `ingest_rundown_${rundownId}`, undefined, priority)()
}

interface SegmentChanges {
	segmentId: string,
	segment: PreparedChanges<DBSegment>
	parts: PreparedChanges<DBPart>
	pieces: PreparedChanges<Piece>
	adlibPieces: PreparedChanges<AdLibPiece>
}

export namespace RundownInput {
	// Get info on the current rundowns from this device:
	export function dataRundownList (self: any, deviceId: string, deviceToken: string) {
		const peripheralDevice = PeripheralDeviceSecurity.getPeripheralDevice(deviceId, deviceToken, self)
		logger.info('dataRundownList')
		return listIngestRundowns(peripheralDevice)
	}
	export function dataRundownGet (self: any, deviceId: string, deviceToken: string, rundownExternalId: string) {
		const peripheralDevice = PeripheralDeviceSecurity.getPeripheralDevice(deviceId, deviceToken, self)
		logger.info('dataRundownGet', rundownExternalId)
		check(rundownExternalId, String)
		return getIngestRundown(peripheralDevice, rundownExternalId)
	}
	// Delete, Create & Update Rundown (and it's contents):
	export function dataRundownDelete (self: any, deviceId: string, deviceToken: string, rundownExternalId: string) {
		const peripheralDevice = PeripheralDeviceSecurity.getPeripheralDevice(deviceId, deviceToken, self)
		logger.info('dataRundownDelete', rundownExternalId)
		check(rundownExternalId, String)
		handleRemovedRundown(peripheralDevice, rundownExternalId)
	}
	export function dataRundownCreate (self: any, deviceId: string, deviceToken: string, ingestRundown: IngestRundown) {
		const peripheralDevice = PeripheralDeviceSecurity.getPeripheralDevice(deviceId, deviceToken, self)
		logger.info('dataRundownCreate', ingestRundown)
		check(ingestRundown, Object)
		handleUpdatedRundown(peripheralDevice, ingestRundown, 'dataRundownCreate')
	}
	export function dataRundownUpdate (self: any, deviceId: string, deviceToken: string, ingestRundown: IngestRundown) {
		const peripheralDevice = PeripheralDeviceSecurity.getPeripheralDevice(deviceId, deviceToken, self)
		logger.info('dataRundownUpdate', ingestRundown)
		check(ingestRundown, Object)
		handleUpdatedRundown(peripheralDevice, ingestRundown, 'dataRundownUpdate')
	}
	// Delete, Create & Update Segment (and it's contents):
	export function dataSegmentDelete (self: any, deviceId: string, deviceToken: string, rundownExternalId: string, segmentExternalId: string) {
		const peripheralDevice = PeripheralDeviceSecurity.getPeripheralDevice(deviceId, deviceToken, self)
		logger.info('dataSegmentDelete', rundownExternalId, segmentExternalId)
		check(rundownExternalId, String)
		check(segmentExternalId, String)
		handleRemovedSegment(peripheralDevice, rundownExternalId, segmentExternalId)
	}
	export function dataSegmentCreate (self: any, deviceId: string, deviceToken: string, rundownExternalId: string, ingestSegment: IngestSegment) {
		let peripheralDevice = PeripheralDeviceSecurity.getPeripheralDevice(deviceId, deviceToken, self)
		logger.info('dataSegmentCreate', rundownExternalId, ingestSegment)
		check(rundownExternalId, String)
		check(ingestSegment, Object)
		handleUpdatedSegment(peripheralDevice, rundownExternalId, ingestSegment)
	}
	export function dataSegmentUpdate (self: any, deviceId: string, deviceToken: string, rundownExternalId: string, ingestSegment: IngestSegment) {
		const peripheralDevice = PeripheralDeviceSecurity.getPeripheralDevice(deviceId, deviceToken, self)
		logger.info('dataSegmentUpdate', rundownExternalId, ingestSegment)
		check(rundownExternalId, String)
		check(ingestSegment, Object)
		handleUpdatedSegment(peripheralDevice, rundownExternalId, ingestSegment)
	}
	// Delete, Create & Update Part:
	export function dataPartDelete (self: any, deviceId: string, deviceToken: string, rundownExternalId: string, segmentExternalId: string, partExternalId: string) {
		const peripheralDevice = PeripheralDeviceSecurity.getPeripheralDevice(deviceId, deviceToken, self)
		logger.info('dataPartDelete', rundownExternalId, segmentExternalId, partExternalId)
		check(rundownExternalId, String)
		check(segmentExternalId, String)
		check(partExternalId, String)
		handleRemovedPart(peripheralDevice, rundownExternalId, segmentExternalId, partExternalId)
	}
	export function dataPartCreate (self: any, deviceId: string, deviceToken: string, rundownExternalId: string, segmentExternalId: string, ingestPart: IngestPart) {
		const peripheralDevice = PeripheralDeviceSecurity.getPeripheralDevice(deviceId, deviceToken, self)
		logger.info('dataPartCreate', rundownExternalId, segmentExternalId, ingestPart)
		check(rundownExternalId, String)
		check(segmentExternalId, String)
		check(ingestPart, Object)
		handleUpdatedPart(peripheralDevice, rundownExternalId, segmentExternalId, ingestPart)
	}
	export function dataPartUpdate (self: any, deviceId: string, deviceToken: string, rundownExternalId: string, segmentExternalId: string, ingestPart: IngestPart) {
		const peripheralDevice = PeripheralDeviceSecurity.getPeripheralDevice(deviceId, deviceToken, self)
		logger.info('dataPartUpdate', rundownExternalId, segmentExternalId, ingestPart)
		check(rundownExternalId, String)
		check(segmentExternalId, String)
		check(ingestPart, Object)
		handleUpdatedPart(peripheralDevice, rundownExternalId, segmentExternalId, ingestPart)
	}
}

function getIngestRundown (peripheralDevice: PeripheralDevice, rundownExternalId: string): IngestRundown {
	const rundown = Rundowns.findOne({
		peripheralDeviceId: peripheralDevice._id,
		externalId: rundownExternalId
	})
	if (!rundown) {
		throw new Meteor.Error(404, `Rundown ${rundownExternalId} does not exist`)
	}

	return loadCachedRundownData(rundown._id, rundown.externalId)
}
function listIngestRundowns (peripheralDevice: PeripheralDevice): string[] {
	const rundowns = Rundowns.find({
		peripheralDeviceId: peripheralDevice._id
	}).fetch()

	return rundowns.map(r => r.externalId)
}

export function handleRemovedRundown (peripheralDevice: PeripheralDevice, rundownExternalId: string) {
	const studio = getStudioFromDevice(peripheralDevice)
	const rundownId = getRundownId(studio, rundownExternalId)

	rundownSyncFunction(rundownId, RundownSyncFunctionPriority.Ingest, () => {
		const rundown = getRundown(rundownId, rundownExternalId)
		if (rundown) {

			if (canBeUpdated(rundown)) {
				if (!isUpdateAllowed(rundown, { removed: [rundown] }, {}, {})) {
					ServerRundownAPI.unsync(rundown._id)
				} else {
					logger.info(`Removing rundown "${rundown._id}"`)
					rundown.remove()
				}
			} else {
				logger.info(`Rundown "${rundown._id}" cannot be updated`)
				if (!rundown.unsynced) {
					ServerRundownAPI.unsync(rundown._id)
				}
			}
		}
	})
}
export function handleUpdatedRundown (peripheralDevice: PeripheralDevice, ingestRundown: IngestRundown, dataSource: string) {
	const studio = getStudioFromDevice(peripheralDevice)
	handleUpdatedRundownForStudio(studio, peripheralDevice, ingestRundown, dataSource)
}
export function handleUpdatedRundownForStudio (studio: Studio, peripheralDevice: PeripheralDevice | undefined, ingestRundown: IngestRundown, dataSource: string) {
	const rundownId = getRundownId(studio, ingestRundown.externalId)
	if (peripheralDevice && peripheralDevice.studioId !== studio._id) {
		throw new Meteor.Error(500, `PeripheralDevice "${peripheralDevice._id}" does not belong to studio "${studio._id}"`)
	}

	return rundownSyncFunction(rundownId, RundownSyncFunctionPriority.Ingest, () => handleUpdatedRundownInner(studio, rundownId, ingestRundown, dataSource, peripheralDevice))
}
export function handleUpdatedRundownInner (studio: Studio, rundownId: string, ingestRundown: IngestRundown, dataSource?: string, peripheralDevice?: PeripheralDevice) {
	const existingDbRundown = Rundowns.findOne(rundownId)
	if (!canBeUpdated(existingDbRundown)) return

	updateRundownAndSaveCache(studio, rundownId, existingDbRundown, ingestRundown, dataSource, peripheralDevice)
}
export function updateRundownAndSaveCache (
	studio: Studio,
	rundownId: string,
	existingDbRundown: Rundown | undefined,
	ingestRundown: IngestRundown,
	dataSource?: string,
	peripheralDevice?: PeripheralDevice) {
	logger.info((existingDbRundown ? 'Updating' : 'Adding') + ' rundown ' + rundownId)

	saveRundownCache(rundownId, ingestRundown)

	updateRundownFromIngestData(studio, existingDbRundown, ingestRundown, dataSource, peripheralDevice)
}
function updateRundownFromIngestData (
	studio: Studio,
	existingDbRundown: Rundown | undefined,
	ingestRundown: IngestRundown,
	dataSource?: string,
	peripheralDevice?: PeripheralDevice
): boolean {
	const rundownId = getRundownId(studio, ingestRundown.externalId)

	const showStyle = selectShowStyleVariant(studio, ingestRundown)
	if (!showStyle) {
		logger.debug('Blueprint rejected the rundown')
		throw new Meteor.Error(501, 'Blueprint rejected the rundown')
	}

	const showStyleBlueprint = loadShowStyleBlueprints(showStyle.base).blueprint
	const blueprintContext = new ShowStyleContext(studio, showStyle.base._id, showStyle.variant._id)
	const rundownRes = showStyleBlueprint.getRundown(blueprintContext, ingestRundown)

	// Ensure the ids in the notes are clean
	const rundownNotes = _.map(blueprintContext.getNotes(), note => literal<PartNote>({
		...note,
		origin: {
			name: note.origin.name,
			rundownId: rundownId,
		}
	}))

	const showStyleBlueprintDb = Blueprints.findOne(showStyle.base.blueprintId) as Blueprint || {}

	const dbRundownData: DBRundown = _.extend(existingDbRundown || {},
		_.omit(literal<DBRundown>({
			...rundownRes.rundown,
			notes: rundownNotes,
			_id: rundownId,
			externalId: ingestRundown.externalId,
			studioId: studio._id,
			showStyleVariantId: showStyle.variant._id,
			showStyleBaseId: showStyle.base._id,
			unsynced: false,

			importVersions: {
				studio: studio._rundownVersionHash,
				showStyleBase: showStyle.base._rundownVersionHash,
				showStyleVariant: showStyle.variant._rundownVersionHash,
				blueprint: showStyleBlueprintDb.blueprintVersion,
				core: PackageInfo.version,
			},

			// omit the below fields
			previousPartId: null,
			currentPartId: null,
			nextPartId: null,
			created: 0,
			modified: 0,

			peripheralDeviceId: '', // added later
			dataSource: '' // added later
		}), ['previousPartId', 'currentPartId', 'nextPartId', 'created', 'modified', 'peripheralDeviceId', 'dataSource'])
	)
	if (peripheralDevice) {
		dbRundownData.peripheralDeviceId = peripheralDevice._id
	} else {
		// TODO - this needs to set something..
	}
	if (dataSource) {
		dbRundownData.dataSource = dataSource
	}

	// Save rundown into database:
	let changes = saveIntoDb(Rundowns, {
		_id: dbRundownData._id
	}, [dbRundownData], {
		beforeInsert: (o) => {
			o.modified = getCurrentTime()
			o.created = getCurrentTime()
			o.previousPartId = null
			o.currentPartId = null
			o.nextPartId = null
			return o
		},
		beforeUpdate: (o) => {
			o.modified = getCurrentTime()
			return o
		}
	})

	const dbRundown = Rundowns.findOne(dbRundownData._id)
	if (!dbRundown) throw new Meteor.Error(500, 'Rundown not found (it should have been)')

	// Save the baseline
	const blueprintRundownContext = new RundownContext(dbRundown, studio)
	logger.info(`Building baseline objects for ${dbRundown._id}...`)
	logger.info(`... got ${rundownRes.baseline.length} objects from baseline.`)

	const baselineObj: RundownBaselineObj = {
		_id: Random.id(7),
		rundownId: dbRundown._id,
		objects: postProcessRundownBaselineItems(blueprintRundownContext, rundownRes.baseline)
	}
	// Save the global adlibs
	logger.info(`... got ${rundownRes.globalAdLibPieces.length} adLib objects from baseline.`)
	const adlibItems = postProcessAdLibPieces(blueprintRundownContext, rundownRes.globalAdLibPieces, 'baseline')

	const existingRundownParts = Parts.find({
		rundownId: dbRundown._id,
		dynamicallyInserted: { $ne: true }
	}).fetch()

	const existingSegments = Segments.find({ rundownId: dbRundown._id }).fetch()
	const segments: DBSegment[] = []
	const parts: DBPart[] = []
	const segmentPieces: Piece[] = []
	const adlibPieces: AdLibPiece[] = []

	const { blueprint, blueprintId } = getBlueprintOfRundown(dbRundown)

	_.each(ingestRundown.segments, (ingestSegment: IngestSegment) => {
		const segmentId = getSegmentId(rundownId, ingestSegment.externalId)
		const existingSegment = _.find(existingSegments, s => s._id === segmentId)
		const existingParts = existingRundownParts.filter(p => p.segmentId === segmentId)

		ingestSegment.parts = _.sortBy(ingestSegment.parts, part => part.rank)

		const context = new SegmentContext(dbRundown, studio, existingParts)
		context.handleNotesExternally = true
		const res = blueprint.getSegment(context, ingestSegment)

		const segmentContents = generateSegmentContents(context, blueprintId, ingestSegment, existingSegment, existingParts, res)
		segments.push(segmentContents.newSegment)
		parts.push(...segmentContents.parts)
		segmentPieces.push(...segmentContents.segmentPieces)
		adlibPieces.push(...segmentContents.adlibPieces)
	})


	// Prepare updates:
	let prepareSaveSegments = prepareSaveIntoDb(Segments, {
		rundownId: rundownId
	}, segments)
	let prepareSaveParts = prepareSaveIntoDb<Part, DBPart>(Parts, {
		rundownId: rundownId,
	}, parts)
	let prepareSavePieces = prepareSaveIntoDb<Piece, Piece>(Pieces, {
		rundownId: rundownId,
		dynamicallyInserted: { $ne: true } // do not affect dynamically inserted pieces (such as adLib pieces)
	}, segmentPieces)
	let prepareSaveAdLibPieces = prepareSaveIntoDb<AdLibPiece, AdLibPiece>(AdLibPieces, {
		rundownId: rundownId,
	}, adlibPieces)

	if (Settings.allowUnsyncedSegments) {

		if (!isUpdateAllowed(dbRundown, { changed: [{ doc: dbRundown, oldId: dbRundown._id }] })) {
			ServerRundownAPI.unsync(dbRundown._id)
			return false
		} else {
			const segmentChanges: SegmentChanges[] = splitIntoSegments(
				prepareSaveSegments,
				prepareSaveParts,
				prepareSavePieces,
				prepareSaveAdLibPieces
			)
			console.log(`SEGMENT CHANGES: ${segmentChanges.length}`)
			const approvedSegmentChanges: SegmentChanges[] = []
			_.each(segmentChanges, segmentChange => {
				if (isUpdateAllowed(dbRundown, { changed: [{ doc: dbRundown, oldId: dbRundown._id }] }, segmentChange.segment, segmentChange.parts)) {
					logger.info(`Approving change`)
					approvedSegmentChanges.push(segmentChange)
				} else {
					logger.info(`Rejecting change`)
					ServerRundownAPI.unsync(dbRundown._id, segmentChange.segmentId)
				}
			})
			prepareSaveSegments = {
				inserted: [],
				changed: [],
				removed: [],
				unchanged: []
			}
			prepareSaveParts = {
				inserted: [],
				changed: [],
				removed: [],
				unchanged: []
			}
			prepareSavePieces = {
				inserted: [],
				changed: [],
				removed: [],
				unchanged: []
			}
			prepareSaveAdLibPieces = {
				inserted: [],
				changed: [],
				removed: [],
				unchanged: []
			}
			approvedSegmentChanges.forEach((segmentChange) => {
				for (const key in prepareSaveSegments) {
					prepareSaveSegments[key].push(...segmentChange.segment[key])
					prepareSaveParts[key].push(...segmentChange.parts[key])
					prepareSavePieces[key].push(...segmentChange.pieces[key])
					prepareSaveAdLibPieces[key].push(...segmentChange.adlibPieces[key])
				}
			})
		}
	} else {
		if (!isUpdateAllowed(dbRundown, { changed: [{ doc: dbRundown, oldId: dbRundown._id }] }, prepareSaveSegments, prepareSaveParts)) {
			ServerRundownAPI.unsync(dbRundown._id)
			return false
		}
	}

	changes = sumChanges(
		changes,
		// Save the baseline
		saveIntoDb<RundownBaselineObj, RundownBaselineObj>(RundownBaselineObjs, {
			rundownId: dbRundown._id,
		}, [baselineObj]),
		// Save the global adlibs
		saveIntoDb<RundownBaselineAdLibItem, RundownBaselineAdLibItem>(RundownBaselineAdLibPieces, {
			rundownId: dbRundown._id
		}, adlibItems),

		// Update Segments:
		savePreparedChanges(prepareSaveSegments, Segments, {
			afterInsert (segment) {
				logger.info('inserted segment ' + segment._id)
			},
			afterUpdate (segment) {
				logger.info('updated segment ' + segment._id)
			},
			afterRemove (segment) {
				logger.info('removed segment ' + segment._id)
			},
			afterRemoveAll (segments) {
				afterRemoveSegments(dbRundown, _.map(segments, s => s._id))
			}
		}),

		savePreparedChanges<Part, DBPart>(prepareSaveParts, Parts, {
			afterInsert (part) {
				logger.debug('inserted part ' + part._id)
			},
			afterUpdate (part) {
				logger.debug('updated part ' + part._id)
			},
			afterRemove (part) {
				logger.debug('deleted part ' + part._id)
			},
			afterRemoveAll (parts) {
				afterRemoveParts(dbRundown, parts)
			}
		}),

		savePreparedChanges<Piece, Piece>(prepareSavePieces, Pieces, {
			afterInsert (piece) {
				logger.debug('inserted piece ' + piece._id)
				logger.debug(piece)
			},
			afterUpdate (piece) {
				logger.debug('updated piece ' + piece._id)
			},
			afterRemove (piece) {
				logger.debug('deleted piece ' + piece._id)
			}
		}),

		savePreparedChanges<AdLibPiece, AdLibPiece>(prepareSaveAdLibPieces, AdLibPieces, {
			afterInsert (adLibPiece) {
				logger.debug('inserted adLibPiece ' + adLibPiece._id)
				logger.debug(adLibPiece)
			},
			afterUpdate (adLibPiece) {
				logger.debug('updated piece ' + adLibPiece._id)
			},
			afterRemove (adLibPiece) {
				logger.debug('deleted piece ' + adLibPiece._id)
			}
		})
	)

	const didChange = anythingChanged(changes)
	if (didChange) {
		afterIngestChangedData(dbRundown, _.map(segments, s => s._id))
	}

	logger.info(`Rundown ${dbRundown._id} update complete`)
	return didChange
}

function handleRemovedSegment (peripheralDevice: PeripheralDevice, rundownExternalId: string, segmentExternalId: string) {
	const studio = getStudioFromDevice(peripheralDevice)
	const rundownId = getRundownId(studio, rundownExternalId)

	return rundownSyncFunction(rundownId, RundownSyncFunctionPriority.Ingest, () => {
		const rundown = getRundown(rundownId, rundownExternalId)
		const segmentId = getSegmentId(rundown._id, segmentExternalId)

		const segment = Segments.findOne(segmentId)
		if (!segment) throw new Meteor.Error(404, `handleRemovedSegment: Segment "${segmentId}" not found`)

		if (canBeUpdated(rundown, segment)) {
			if (!isUpdateAllowed(rundown, {}, { removed: [segment] }, {})) {
				ServerRundownAPI.unsync(rundown._id, segment._id)
			} else {
				if (removeSegments(rundown, [segmentId]) === 0) {
					throw new Meteor.Error(404, `handleRemovedSegment: removeSegments: Segment ${segmentExternalId} not found`)
				}
			}
		}
	})
}
export function handleUpdatedSegment (peripheralDevice: PeripheralDevice, rundownExternalId: string, ingestSegment: IngestSegment) {
	const studio = getStudioFromDevice(peripheralDevice)
	const rundownId = getRundownId(studio, rundownExternalId)

	return rundownSyncFunction(rundownId, RundownSyncFunctionPriority.Ingest, () => {
		const rundown = getRundown(rundownId, rundownExternalId)
		const segmentId = getSegmentId(rundown._id, ingestSegment.externalId)
		const segment = Segments.findOne(segmentId)

		if (!canBeUpdated(rundown, segment)) return

		saveSegmentCache(rundown._id, segmentId, ingestSegment)
		const updatedSegmentId = updateSegmentFromIngestData(studio, rundown, ingestSegment)
		if (updatedSegmentId) {
			afterIngestChangedData(rundown, [updatedSegmentId])
		}
	})
}
export function updateSegmentsFromIngestData (
	studio: Studio,
	rundown: Rundown,
	ingestSegments: IngestSegment[]
) {
	const changedSegmentIds: string[] = []
	for (let ingestSegment of ingestSegments) {
		const segmentId = updateSegmentFromIngestData(studio, rundown, ingestSegment)
		if (segmentId !== null) {
			changedSegmentIds.push(segmentId)
		}
	}
	if (changedSegmentIds.length > 0) {
		afterIngestChangedData(rundown, changedSegmentIds)
	}
}
/**
 * Run ingestData through blueprints and update the Segment
 * @param studio
 * @param rundown
 * @param ingestSegment
 * @returns a segmentId if data has changed, null otherwise
 */
function updateSegmentFromIngestData (
	studio: Studio,
	rundown: Rundown,
	ingestSegment: IngestSegment
): string | null {
	const segmentId = getSegmentId(rundown._id, ingestSegment.externalId)
	const { blueprint, blueprintId } = getBlueprintOfRundown(rundown)

	const existingSegment = Segments.findOne({
		_id: segmentId,
		rundownId: rundown._id,
	})
	const existingParts = Parts.find({
		rundownId: rundown._id,
		segmentId: segmentId,
		dynamicallyInserted: { $ne: true }
	}).fetch()

	ingestSegment.parts = _.sortBy(ingestSegment.parts, s => s.rank)

	const context = new SegmentContext(rundown, studio, existingParts)
	context.handleNotesExternally = true
	const res = blueprint.getSegment(context, ingestSegment)

	const { parts, segmentPieces, adlibPieces, newSegment } = generateSegmentContents(context, blueprintId, ingestSegment, existingSegment, existingParts, res)

	// Move part over from other segments:
	// This is done so that metadata and play-status is retained when a part is moved between segments.
	const partsToMoveFromOtherSegments = Parts.find({
		rundownId: rundown._id,
		segmentId: { $ne: segmentId },
		dynamicallyInserted: { $ne: true },
		_id: { $in: _.pluck(parts, '_id') }
	}).fetch()
	Parts.update({
		_id: { $in: _.pluck(partsToMoveFromOtherSegments, '_id')}
	}, { $set: {
		segmentId: segmentId
	}}, {
		multi: true
	})

	const prepareSaveParts = prepareSaveIntoDb<Part, DBPart>(Parts, {
		rundownId: rundown._id,
		segmentId: segmentId,
		dynamicallyInserted: { $ne: true } // do not affect dynamically inserted parts (such as adLib parts)
	}, parts)
	const prepareSavePieces = prepareSaveIntoDb<Piece, Piece>(Pieces, {
		rundownId: rundown._id,
		partId: { $in: parts.map(p => p._id) },
		dynamicallyInserted: { $ne: true } // do not affect dynamically inserted pieces (such as adLib pieces)
	}, segmentPieces)
	const prepareSaveAdLibPieces = prepareSaveIntoDb<AdLibPiece, AdLibPiece>(AdLibPieces, {
		rundownId: rundown._id,
		partId: { $in: parts.map(p => p._id) },
	}, adlibPieces)

	// Determine if update is allowed here
	if (!isUpdateAllowed(rundown, {}, { changed: [{ doc: newSegment, oldId: newSegment._id }] }, prepareSaveParts)) {
		ServerRundownAPI.unsync(rundown._id, segmentId)

		// Roll back changes to moved parts:
		_.each(partsToMoveFromOtherSegments, part => {
			logger.info(`Roll back changed segmentId for Part "${part._id}" to "${part.segmentId}"`)
			Parts.update(part._id, {$set: {
				segmentId: part.segmentId
			}})
		})
		return null
	}

	// Update segment info:
	const p = asyncCollectionUpsert(Segments, {
		_id: segmentId,
		rundownId: rundown._id
	}, newSegment)

	const changes = sumChanges(
		savePreparedChanges<Part, DBPart>(prepareSaveParts, Parts, {
			afterInsert (part) {
				logger.debug('inserted part ' + part._id)
			},
			afterUpdate (part) {
				logger.debug('updated part ' + part._id)
			},
			afterRemove (part) {
				logger.debug('deleted part ' + part._id)
			},
			afterRemoveAll (parts) {
				afterRemoveParts(rundown, parts)
			}
		}),
		savePreparedChanges<Piece, Piece>(prepareSavePieces, Pieces, {
			afterInsert (piece) {
				logger.debug('inserted piece ' + piece._id)
				logger.debug(piece)
			},
			afterUpdate (piece) {
				logger.debug('updated piece ' + piece._id)
			},
			afterRemove (piece) {
				logger.debug('deleted piece ' + piece._id)
			}
		}),
		savePreparedChanges<AdLibPiece, AdLibPiece>(prepareSaveAdLibPieces, AdLibPieces, {
			afterInsert (adLibPiece) {
				logger.debug('inserted adLibPiece ' + adLibPiece._id)
				logger.debug(adLibPiece)
			},
			afterUpdate (adLibPiece) {
				logger.debug('updated adLibPiece ' + adLibPiece._id)
			},
			afterRemove (adLibPiece) {
				logger.debug('deleted adLibPiece ' + adLibPiece._id)
			}
		})
	)
	waitForPromise(p)
	return anythingChanged(changes) ? segmentId : null
}
export function afterIngestChangedData (rundown: Rundown, segmentIds: string[]) {
	// To be called after rundown has been changed
	updateExpectedMediaItemsOnRundown(rundown._id)
	updateExpectedPlayoutItemsOnRundown(rundown._id)
	updatePartRanks(rundown._id)
	updateSourceLayerInfinitesAfterPart(rundown)
	UpdateNext.ensureNextPartIsValid(rundown)
	triggerUpdateTimelineAfterIngestData(rundown._id, segmentIds)
}

export function handleRemovedPart (peripheralDevice: PeripheralDevice, rundownExternalId: string, segmentExternalId: string, partExternalId: string) {
	const studio = getStudioFromDevice(peripheralDevice)
	const rundownId = getRundownId(studio, rundownExternalId)

	return rundownSyncFunction(rundownId, RundownSyncFunctionPriority.Ingest, () => {
		const rundown = getRundown(rundownId, rundownExternalId)
		const segmentId = getSegmentId(rundown._id, segmentExternalId)
		const partId = getPartId(rundown._id, partExternalId)

		const segment = Segments.findOne(segmentId)

		if (canBeUpdated(rundown, segment)) {
			const part = Parts.findOne({
				_id: partId,
				segmentId: segmentId,
				rundownId: rundown._id
			})
			if (!part) throw new Meteor.Error(404, 'Part not found')


			if (!isUpdateAllowed(rundown, {}, {}, { removed: [part] })) {
				ServerRundownAPI.unsync(rundown._id, segmentId)
			} else {

				// Blueprints will handle the deletion of the Part
				const ingestSegment = loadCachedIngestSegment(rundown._id, rundownExternalId, segmentId, segmentExternalId)
				ingestSegment.parts = ingestSegment.parts.filter(p => p.externalId !== partExternalId)

				saveSegmentCache(rundown._id, segmentId, ingestSegment)

				const updatedSegmentId = updateSegmentFromIngestData(studio, rundown, ingestSegment)
				if (updatedSegmentId) {
					afterIngestChangedData(rundown, [updatedSegmentId])
				}
			}
		}


	})
}
export function handleUpdatedPart (peripheralDevice: PeripheralDevice, rundownExternalId: string, segmentExternalId: string, ingestPart: IngestPart) {
	const studio = getStudioFromDevice(peripheralDevice)
	const rundownId = getRundownId(studio, rundownExternalId)

	return rundownSyncFunction(rundownId, RundownSyncFunctionPriority.Ingest, () => {
		const rundown = getRundown(rundownId, rundownExternalId)

		handleUpdatedPartInner(studio, rundown, segmentExternalId, ingestPart)
	})
}
export function handleUpdatedPartInner (studio: Studio, rundown: Rundown, segmentExternalId: string, ingestPart: IngestPart) {
	// Updated OR created part
	const segmentId = getSegmentId(rundown._id, segmentExternalId)
	const partId = getPartId(rundown._id, ingestPart.externalId)

	const segment = Segments.findOne(segmentId)
	if (!segment) throw new Meteor.Error(500, `Segment "${segmentId}" not found`)

	if (!canBeUpdated(rundown, segment)) return

	const part = Parts.findOne({
		_id: partId,
		segmentId: segmentId,
		rundownId: rundown._id
	})

	if (
		part && !isUpdateAllowed(rundown, {}, {}, { changed: [{ doc: part, oldId: part._id }] })
	) {
		ServerRundownAPI.unsync(rundown._id, segmentId)
	} else {

		if (!isUpdateAllowed(rundown, {}, { changed: [{ doc: segment, oldId: segment._id }] }, { })) {
			ServerRundownAPI.unsync(rundown._id, segmentId)
		} else {
			// Blueprints will handle the creation of the Part
			const ingestSegment: IngestSegment = loadCachedIngestSegment(rundown._id, rundown.externalId, segmentId, segmentExternalId)
			ingestSegment.parts = ingestSegment.parts.filter(p => p.externalId !== ingestPart.externalId)
			ingestSegment.parts.push(ingestPart)

			saveSegmentCache(rundown._id, segmentId, ingestSegment)
			const updatedSegmentId = updateSegmentFromIngestData(studio, rundown, ingestSegment)
			if (updatedSegmentId) {
				afterIngestChangedData(rundown, [updatedSegmentId])
			}
		}

	}
}

function generateSegmentContents (
	context: RundownContext,
	blueprintId: string,
	ingestSegment: IngestSegment,
	existingSegment: DBSegment | undefined,
	existingParts: DBPart[],
	blueprintRes: BlueprintResultSegment
) {
	const rundownId = context.rundownId
	const segmentId = getSegmentId(rundownId, ingestSegment.externalId)

	const allNotes = _.map(context.getNotes(), note => literal<PartNote>({
		...note,
		origin: {
			name: note.origin.name,
			rundownId: rundownId,
			segmentId: segmentId,
			partId: note.origin.partId,
			pieceId: note.origin.pieceId,
		}
	}))

	// Ensure all parts have a valid externalId set on them
	const knownPartIds = blueprintRes.parts.map(p => p.part.externalId)

	const segmentNotes = _.filter(allNotes, note => !note.origin.partId || knownPartIds.indexOf(note.origin.partId) === -1)

	const newSegment = literal<DBSegment>({
		...(existingSegment || {}),
		...blueprintRes.segment,
		_id: segmentId,
		rundownId: rundownId,
		externalId: ingestSegment.externalId,
		_rank: ingestSegment.rank,
		notes: segmentNotes,
	})

	const parts: DBPart[] = []
	const segmentPieces: Piece[] = []
	const adlibPieces: AdLibPiece[] = []

	// Parts
	blueprintRes.parts.forEach((blueprintPart, i) => {
		const partId = getPartId(rundownId, blueprintPart.part.externalId)

		const notes = _.filter(allNotes, note => note.origin.partId === blueprintPart.part.externalId)
		_.each(notes, note => note.origin.partId = partId)

		const existingPart = _.find(existingParts, p => p._id === partId)
		const part = literal<DBPart>({
			..._.omit(existingPart || {}, 'invalid'),
			...blueprintPart.part,
			_id: partId,
			rundownId: rundownId,
			segmentId: newSegment._id,
			_rank: i, // This gets updated to a rundown unique rank as a later step
			notes: notes,
		})
		parts.push(part)

		// Do checks of Part:
		if (newSegment.isHidden && !part.invalid) {
			logger.warn(`Warning: Segment "${newSegment._id}" is hidden, but Part "${part._id}" is not invalid!`)
		}

		// Update pieces
		const pieces = postProcessPieces(context, blueprintPart.pieces, blueprintId, part._id)
		segmentPieces.push(...pieces)

		const adlibs = postProcessAdLibPieces(context, blueprintPart.adLibPieces, blueprintId, part._id)
		adlibPieces.push(...adlibs)
	})

	return {
		newSegment,
		parts,
		segmentPieces,
		adlibPieces
	}
}

export function isUpdateAllowed (
	rundown: Rundown,
	rundownChanges?: Optional<PreparedChanges<DBRundown>>,
	segmentChanges?: Optional<PreparedChanges<DBSegment>>,
	partChanges?: Optional<PreparedChanges<DBPart>>
): boolean {
	let allowed: boolean = true

	if (!rundown) return false
	if (rundown.unsynced) {
		logger.info(`Rundown "${rundown._id}" has been unsynced and needs to be synced before it can be updated.`)
		return false
	}

	if (rundown.active) {

		if (allowed && rundownChanges && rundownChanges.removed && rundownChanges.removed.length) {
			_.each(rundownChanges.removed, rd => {
				if (rundown._id === rd._id) {
					// Don't allow removing an active rundown
					logger.warn(`Not allowing removal of current active rundown "${rd._id}"`)
					allowed = false
				}
			})
		}
		if (rundown.currentPartId) {
			if (allowed && partChanges && partChanges.removed && partChanges.removed.length) {
				_.each(partChanges.removed, part => {
					if (rundown.currentPartId === part._id) {
						// Don't allow removing currently playing part
						logger.warn(`Not allowing removal of currently playing part "${part._id}"`)
						allowed = false
					}
				})
			}
			if (allowed) {
				const currentPart = rundown.getParts({ _id: rundown.currentPartId })[0]
				if (segmentChanges && segmentChanges.removed && segmentChanges.removed.length) {
					_.each(segmentChanges.removed, segment => {
						if (currentPart.segmentId === segment._id) {
							// Don't allow removing segment with currently playing part
							logger.warn(`Not allowing removal of segment "${segment._id}", containing currently playing part "${currentPart._id}"`)
							allowed = false
						}
					})
				}
				if (allowed && partChanges && partChanges.removed && partChanges.removed.length && currentPart && currentPart.afterPart) {
					// If the currently playing part is a queued part and depending on any of the parts that are to be removed:
					const removedPartIds = partChanges.removed.map(part => part._id)
					if (removedPartIds.includes(currentPart.afterPart)) {
						// Don't allow removal of a part that has a currently playing queued Part
						logger.warn(`Not allowing removal of part "${currentPart.afterPart}", because currently playing (queued) part "${currentPart._id}" is after it`)
						allowed = false
					}
				}
			}
		}
	}
	if (!allowed) {
		if (rundownChanges) logger.debug(`rundownChanges: ${printChanges(rundownChanges)}`)
		if (segmentChanges) logger.debug(`segmentChanges: ${printChanges(segmentChanges)}`)
		if (partChanges) logger.debug(`partChanges: ${printChanges(partChanges)}`)
	}
	return allowed
}
function printChanges (changes: Optional<PreparedChanges<{_id: string}>>): string {
	let str = ''

	if (changes.changed)	str += _.map(changes.changed,	doc => 'change:' + doc.doc._id).join(',')
	if (changes.inserted)	str += _.map(changes.inserted,	doc => 'insert:' + doc._id).join(',')
	if (changes.removed)	str += _.map(changes.removed,	doc => 'remove:' + doc._id).join(',')

	return str
}

type partIdToSegmentId = Map<string, string>

function splitIntoSegments (
	prepareSaveSegments: PreparedChanges<DBSegment>,
	prepareSaveParts: PreparedChanges<DBPart>,
	prepareSavePieces: PreparedChanges<Piece>,
	prepareSaveAdLibPieces: PreparedChanges<AdLibPiece>
): SegmentChanges[] {
	let changes: SegmentChanges[] = []

	groupSegmentChanges(changes, prepareSaveSegments, 'changed')
	groupSegmentChanges(changes, prepareSaveSegments, 'inserted')
	groupSegmentChanges(changes, prepareSaveSegments, 'removed')
	groupSegmentChanges(changes, prepareSaveSegments, 'unchanged')

	let partsToSegments: partIdToSegmentId = new Map()

	partsToSegments = groupPartChanges(prepareSaveParts, partsToSegments, changes)

	console.log(JSON.stringify(partsToSegments))

	groupPieceChanges(prepareSavePieces, partsToSegments, changes)

	groupAdlibChanges(prepareSaveAdLibPieces, partsToSegments, changes)

	return changes
}

function groupSegmentChanges <
	ChangeType extends keyof PreparedChanges<DBSegment>,
	ChangedObj extends DBSegment | DBPart | Piece | AdLibPiece
> (
	changes: SegmentChanges[],
	preparedChanges: PreparedChanges<ChangedObj>,
	changeField: ChangeType
) {
	const subset = preparedChanges[changeField]
	subset.forEach((ch) => {
		if (changeField === 'changed') {
			const existing = changes.findIndex((c) => (ch as PreparedChangesChangesDoc<ChangedObj>).doc._id === c.segmentId)
			processSegmentChangeGroupInner(existing, changes, changeField, ch, (ch as PreparedChangesChangesDoc<ChangedObj>).doc._id)
		} else {
			const existing = changes.findIndex((c) => (ch as ChangedObj)._id === c.segmentId)
			processSegmentChangeGroupInner(existing, changes, changeField, ch, (ch as ChangedObj)._id)
		}
	})
}

function groupPartChanges (
	prepareSaveParts: PreparedChanges<DBPart>,
	partsToSegments: Map<string, string>,
	changes: SegmentChanges[]
): Map<string, string> {
	return groupAdlibsPiecesPartsInner(prepareSaveParts, partsToSegments, changes, 'parts')
}

function groupPieceChanges (
	prepareSavePieces: PreparedChanges<Piece>,
	partsToSegments: Map<string, string>,
	changes: SegmentChanges[]
): Map<string, string> {
	return groupAdlibsPiecesPartsInner(prepareSavePieces, partsToSegments, changes, 'pieces')
}

function groupAdlibChanges (
	prepareSaveAdLibPieces: PreparedChanges<AdLibPiece>,
	partsToSegments: Map<string, string>,
	changes: SegmentChanges[]
): Map<string, string> {
	return groupAdlibsPiecesPartsInner(prepareSaveAdLibPieces, partsToSegments, changes, 'adlibPieces')
}

type FieldType<S> = S extends PreparedChanges<AdLibPiece> ? 'adlibPieces' : S extends PreparedChanges<Piece> ? 'pieces' : 'parts'

function groupAdlibsPiecesPartsInner <
	S extends PreparedChanges<AdLibPiece | Piece | DBPart>
> (
	prepareSaveChanges: S,
	partsToSegments: Map<string, string>,
	changes: SegmentChanges[],
	field: FieldType<S>
): Map<string, string> {
	for (const changedObj of prepareSaveChanges.changed) {
		const segmentId = field === 'parts' ? 
			(changedObj.doc as DBPart).segmentId :
			partsToSegments.get((changedObj.doc as AdLibPiece | Piece).partId || '')
		if (!segmentId) {
			logger.warning(`SegmentId could not be found when trying to modify ${field} ${changedObj.doc._id}`)
			continue  // In theory this shouldn't happen, but reject 'orphaned' changes
		}
		if (field === 'parts') {
			partsToSegments.set((changedObj.doc as DBPart)._id, segmentId)
		}
		const index = changes.findIndex((c) => c.segmentId === segmentId)
		addChange(index, segmentId, changedObj, field, changes, 'changed')
	}

	['removed', 'inserted', 'unchanged'].forEach((changeType: keyof Omit<PreparedChanges<S>, 'changed'>) => {
		for (const changedObj of prepareSaveChanges[changeType]) {
			const segmentId = field === 'parts' ? 
				(changedObj as DBPart).segmentId :
				partsToSegments.get((changedObj as AdLibPiece | Piece).partId || '')
			if (!segmentId) {
				logger.warning(`SegmentId could not be found when trying to modify ${field} ${changedObj._id}`)
				continue  // In theory this shouldn't happen, but reject 'orphaned' changes
			}
			if (field === 'parts') {
				partsToSegments.set((changedObj as DBPart)._id, segmentId)
			}
			const index = changes.findIndex((c) => c.segmentId === segmentId)
			addChange(index, segmentId, changedObj, field, changes, changeType)
		}
	})

	return partsToSegments
}

function addChange <
	T extends AdLibPiece | Piece | DBPart,
	ChangedObjType extends T | PreparedChangesChangesDoc<T>
> (
	index: number,
	segmentId: string,
	changedObj: ChangedObjType,
	field: FieldType<T>,
	changes:  SegmentChanges[],
	changeType: keyof SegmentChanges['segment']
) {
	if (index === -1) {
		const newChange = makeChangeObj(segmentId)
		changes.push(newChange)
		index = changes.length - 1
	}

	if (field === 'adlibPieces') {
		if (changeType === 'changed') {
			changes[index].adlibPieces.changed.push(changedObj as unknown as PreparedChangesChangesDoc<AdLibPiece>)
		} else {
			changes[index].adlibPieces[changeType].push(changedObj as unknown as AdLibPiece)
		}
	} if (field === 'pieces') {
		if (changeType === 'changed') {
			changes[index].pieces.changed.push(changedObj as unknown as PreparedChangesChangesDoc<Piece>)
		} else {
			changes[index].pieces[changeType].push(changedObj as unknown as Piece)
		}
	} else {
		if (changeType === 'changed') {
			changes[index].parts.changed.push(changedObj as unknown as PreparedChangesChangesDoc<DBPart>)
		} else {
			changes[index].parts[changeType].push(changedObj as unknown as DBPart)

		}
	}
}

function processSegmentChangeGroupInner (
	index: number,
	changes: SegmentChanges[],
	changeType: keyof SegmentChanges['segment'],
	changedObject: PreparedChangesChangesDoc<DBSegment> | DBSegment,
	segmentId: string
) {
	if (index === -1) {
		const newChange = makeChangeObj(segmentId)
		changes.push(newChange)
		index = changes.length - 1
	}
	
	if (!changes[index].segment) {
		changes[index].segment = {
			inserted: [],
			changed: [],
			removed: [],
			unchanged: []
		}
	}

	if (changeType === 'changed') {
		changes[index].segment.changed.push(changedObject as unknown as PreparedChangesChangesDoc<DBSegment>)
	} else {
		changes[index].segment[changeType].push(changedObject as unknown as DBSegment)
	}
}

function makeChangeObj (segmentId: string): SegmentChanges {
	return {
		segmentId,
		segment: {
			inserted: [],
			changed: [],
			removed: [],
			unchanged: []
		},
		parts: {
			inserted: [],
			changed: [],
			removed: [],
			unchanged: []
		},
		pieces: {
			inserted: [],
			changed: [],
			removed: [],
			unchanged: []
		},
		adlibPieces: {
			inserted: [],
			changed: [],
			removed: [],
			unchanged: []
		}
	}
}
