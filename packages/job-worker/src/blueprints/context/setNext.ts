import { RundownPlaylistActivationId } from '@sofie-automation/corelib/dist/dataModel/Ids'
import { DBPartInstance } from '@sofie-automation/corelib/dist/dataModel/PartInstance'
import { PieceInstance, wrapPieceToInstance } from '@sofie-automation/corelib/dist/dataModel/PieceInstance'
import { ShowStyleCompound } from '@sofie-automation/corelib/dist/dataModel/ShowStyleCompound'
import { omit } from '@sofie-automation/corelib/dist/lib'
import { protectString, protectStringArray, unprotectStringArray } from '@sofie-automation/corelib/dist/protectedString'
import { DbCacheWriteCollection } from '../../cache/CacheCollection'
import { CacheForPlayout } from '../../playout/cache'
import { setupPieceInstanceInfiniteProperties } from '../../playout/pieces'
import { ReadonlyDeep } from 'type-fest'
import _ = require('underscore')
import { ContextInfo, RundownUserContext } from './context'
import {
	IBlueprintPiece,
	IBlueprintPieceInstance,
	OmitId,
	IBlueprintMutatablePart,
	IBlueprintPartInstance,
	SomeContent,
	WithTimeline,
	ISetNextContext,
} from '@sofie-automation/blueprints-integration'
import { postProcessPieces, postProcessTimelineObjects } from '../postProcess'
import {
	IBlueprintPieceObjectsSampleKeys,
	IBlueprintMutatablePartSampleKeys,
	convertPieceInstanceToBlueprints,
	convertPartInstanceToBlueprints,
} from './lib'
import { DBRundown } from '@sofie-automation/corelib/dist/dataModel/Rundown'
import { DBStudio } from '@sofie-automation/corelib/dist/dataModel/Studio'
import { JobContext } from '../../jobs'
import { logChanges } from '../../cache/lib'
import { EditableMongoModifier } from '../../db'
import { serializePieceTimelineObjectsBlob } from '@sofie-automation/corelib/dist/dataModel/Piece'
import { ProcessedShowStyleConfig } from '../config'

export class SetNextContext extends RundownUserContext implements ISetNextContext {
	private readonly _partInstanceCache: DbCacheWriteCollection<DBPartInstance>
	private readonly _pieceInstanceCache: DbCacheWriteCollection<PieceInstance>

	private partInstance: DBPartInstance | undefined

	constructor(
		private readonly _context: JobContext,
		contextInfo: ContextInfo,
		private readonly playlistActivationId: RundownPlaylistActivationId,
		studio: ReadonlyDeep<DBStudio>,
		showStyleCompound: ReadonlyDeep<ShowStyleCompound>,
		rundown: ReadonlyDeep<DBRundown>,
		config: ProcessedShowStyleConfig,
		partInstance: DBPartInstance,
		pieceInstances: PieceInstance[]
	) {
		super(contextInfo, studio, _context.getStudioBlueprintConfig(), showStyleCompound, config, rundown)

		this.partInstance = partInstance

		// Create temporary cache databases
		this._pieceInstanceCache = DbCacheWriteCollection.createFromArray(
			this._context,
			this._context.directCollections.PieceInstances,
			pieceInstances
		)
		this._partInstanceCache = DbCacheWriteCollection.createFromArray(
			this._context,
			this._context.directCollections.PartInstances,
			[partInstance]
		)
	}

	applyChangesToCache(cache: CacheForPlayout): void {
		if (this._partInstanceCache.isModified() || this._pieceInstanceCache.isModified()) {
			this.logInfo(`Found ingest changes to apply to PartInstance`)
		} else {
			this.logInfo(`No ingest changes to apply to PartInstance`)
		}

		const pieceChanges = this._pieceInstanceCache.updateOtherCacheWithData(cache.PieceInstances)
		const partChanges = this._partInstanceCache.updateOtherCacheWithData(cache.PartInstances)

		logChanges('PartInstances', partChanges)
		logChanges('PieceInstances', pieceChanges)
	}

	insertPieceInstance(piece0: IBlueprintPiece): IBlueprintPieceInstance {
		const trimmedPiece: IBlueprintPiece = _.pick(piece0, IBlueprintPieceObjectsSampleKeys)

		if (!this.partInstance) throw new Error(`PartInstance has been removed`)

		const piece = postProcessPieces(
			this._context,
			[trimmedPiece],
			this.showStyleCompound.blueprintId,
			this.partInstance.rundownId,
			this.partInstance.segmentId,
			this.partInstance.part._id,
			false
		)[0]
		const newPieceInstance = wrapPieceToInstance(piece, this.playlistActivationId, this.partInstance._id)

		// Ensure the infinite-ness is setup correctly. We assume any piece inserted starts in the current part
		setupPieceInstanceInfiniteProperties(newPieceInstance)

		this._pieceInstanceCache.insert(newPieceInstance)

		return convertPieceInstanceToBlueprints(newPieceInstance)
	}

	updatePieceInstance(pieceInstanceId: string, updatedPiece: Partial<IBlueprintPiece>): IBlueprintPieceInstance {
		// filter the submission to the allowed ones
		const trimmedPiece: Partial<OmitId<IBlueprintPiece>> = _.pick(updatedPiece, IBlueprintPieceObjectsSampleKeys)
		if (Object.keys(trimmedPiece).length === 0) {
			throw new Error(`Cannot update PieceInstance "${pieceInstanceId}". Some valid properties must be defined`)
		}

		if (!this.partInstance) throw new Error(`PartInstance has been removed`)

		const pieceInstance = this._pieceInstanceCache.findOne(protectString(pieceInstanceId))
		if (!pieceInstance) {
			throw new Error(`PieceInstance "${pieceInstanceId}" could not be found`)
		}
		if (pieceInstance.partInstanceId !== this.partInstance._id) {
			throw new Error(`PieceInstance "${pieceInstanceId}" does not belong to the current PartInstance`)
		}

		const update: EditableMongoModifier<PieceInstance> = {
			$set: {},
			$unset: {},
		}

		if (updatedPiece.content?.timelineObjects) {
			update.$set['piece.timelineObjectsString'] = serializePieceTimelineObjectsBlob(
				postProcessTimelineObjects(
					pieceInstance.piece._id,
					this.showStyleCompound.blueprintId,
					updatedPiece.content.timelineObjects
				)
			)
			// This has been processed
			updatedPiece.content = omit(updatedPiece.content, 'timelineObjects') as WithTimeline<SomeContent>
		}

		for (const [k, val] of Object.entries(trimmedPiece)) {
			if (val === undefined) {
				update.$unset[`piece.${k}`] = 1
			} else {
				// @ts-expect-error This can't key correctly because of the loosely typed `k`
				update.$set[`piece.${k}`] = val
			}
		}

		this._pieceInstanceCache.update(pieceInstance._id, update)

		const updatedPieceInstance = this._pieceInstanceCache.findOne(pieceInstance._id)
		if (!updatedPieceInstance) {
			throw new Error(`PieceInstance "${pieceInstanceId}" could not be found, after applying changes`)
		}

		return convertPieceInstanceToBlueprints(updatedPieceInstance)
	}

	updatePartInstance(updatePart: Partial<IBlueprintMutatablePart>): IBlueprintPartInstance {
		// filter the submission to the allowed ones
		const trimmedProps: Partial<IBlueprintMutatablePart> = _.pick(updatePart, [
			...IBlueprintMutatablePartSampleKeys,
		])
		if (Object.keys(trimmedProps).length === 0) {
			throw new Error(`Cannot update PartInstance. Some valid properties must be defined`)
		}

		if (!this.partInstance) throw new Error(`PartInstance has been removed`)

		const update: any = {
			$set: {},
			$unset: {},
		}

		for (const [k, val] of Object.entries(trimmedProps)) {
			if (val === undefined) {
				update.$unset[`part.${k}`] = val
			} else {
				update.$set[`part.${k}`] = val
			}
		}

		this._partInstanceCache.update(this.partInstance._id, update)

		const updatedPartInstance = this._partInstanceCache.findOne(this.partInstance._id)
		if (!updatedPartInstance) {
			throw new Error(`PartInstance could not be found, after applying changes`)
		}

		return convertPartInstanceToBlueprints(updatedPartInstance)
	}

	removePieceInstances(...pieceInstanceIds: string[]): string[] {
		if (!this.partInstance) throw new Error(`PartInstance has been removed`)

		const pieceInstances = this._pieceInstanceCache.findFetch({
			partInstanceId: this.partInstance._id,
			_id: { $in: protectStringArray(pieceInstanceIds) },
		})

		this._pieceInstanceCache.remove({
			_id: { $in: pieceInstances.map((p) => p._id) },
		})

		return unprotectStringArray(pieceInstances.map((p) => p._id))
	}
}
