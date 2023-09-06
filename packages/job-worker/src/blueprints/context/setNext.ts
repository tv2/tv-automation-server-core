import { DBPartInstance } from '@sofie-automation/corelib/dist/dataModel/PartInstance'
import { PieceInstance } from '@sofie-automation/corelib/dist/dataModel/PieceInstance'
import { ShowStyleCompound } from '@sofie-automation/corelib/dist/dataModel/ShowStyleCompound'
import { protectString } from '@sofie-automation/corelib/dist/protectedString'
import { DbCacheWriteCollection } from '../../cache/CacheCollection'
import { CacheForPlayout } from '../../playout/cache'
import { ReadonlyDeep } from 'type-fest'
import { ContextInfo, RundownUserContext } from './context'
import { ISetNextContext, IBlueprintResolvedPieceInstance } from '@sofie-automation/blueprints-integration'
import { convertResolvedPieceInstanceToBlueprints } from './lib'
import { DBRundown } from '@sofie-automation/corelib/dist/dataModel/Rundown'
import { DBStudio } from '@sofie-automation/corelib/dist/dataModel/Studio'
import { JobContext } from '../../jobs'
import { logChanges } from '../../cache/lib'
import { ProcessedShowStyleConfig } from '../config'
import { getResolvedPieces } from '../../playout/pieces'

export class SetNextContext extends RundownUserContext implements ISetNextContext {
	private readonly _pieceInstanceCache: DbCacheWriteCollection<PieceInstance>
	private readonly _cache: CacheForPlayout

	private partInstance: DBPartInstance

	constructor(
		private readonly _context: JobContext,
		cache: CacheForPlayout,
		contextInfo: ContextInfo,
		studio: ReadonlyDeep<DBStudio>,
		showStyleCompound: ReadonlyDeep<ShowStyleCompound>,
		rundown: ReadonlyDeep<DBRundown>,
		config: ProcessedShowStyleConfig,
		partInstance: DBPartInstance,
		pieceInstances: PieceInstance[]
	) {
		super(contextInfo, studio, _context.getStudioBlueprintConfig(), showStyleCompound, config, rundown)

		this.partInstance = partInstance

		this._pieceInstanceCache = DbCacheWriteCollection.createFromArray(
			this._context,
			this._context.directCollections.PieceInstances,
			pieceInstances
		)

		this._cache = cache
	}

	applyChangesToCache(cache: CacheForPlayout): void {
		if (this._pieceInstanceCache.isModified()) {
			this.logInfo(`OnSetNext changes to apply to PieceInstances`)
		} else {
			this.logInfo(`No OnSetNext changes to apply to PieceInstances`)
		}

		const pieceChanges = this._pieceInstanceCache.updateOtherCacheWithData(cache.PieceInstances)

		logChanges('PieceInstances', pieceChanges)
	}

	disablePieceInstance(pieceInstanceId: string): void {
		const pieceInstance = this._pieceInstanceCache.findOne(protectString(pieceInstanceId))
		if (!pieceInstance) {
			throw new Error(`PieceInstance "${pieceInstanceId}" could not be found`)
		}
		this._cache.PieceInstances.update(pieceInstance._id, {
			$set: {
				disabled: true,
			},
		})
	}

	enablePieceInstance(pieceInstanceId: string): void {
		const pieceInstance = this._pieceInstanceCache.findOne(protectString(pieceInstanceId))
		if (!pieceInstance) {
			throw new Error(`PieceInstance "${pieceInstanceId}" could not be found`)
		}
		this._cache.PieceInstances.update(pieceInstance._id, {
			$unset: {
				disabled: 1,
			},
		})
	}

	getResolvedPieceInstances(): IBlueprintResolvedPieceInstance[] {
		const resolvedInstances = getResolvedPieces(
			this._context,
			this._cache,
			this.showStyleCompound,
			this.partInstance
		)
		return resolvedInstances.map(convertResolvedPieceInstanceToBlueprints)
	}
}
