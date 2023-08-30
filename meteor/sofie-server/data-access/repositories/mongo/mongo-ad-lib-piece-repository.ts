import { BaseMongoRepository } from './base-mongo-repository'
import { AdLibPieceRepository } from '../interfaces/ad-lib-piece-repository'
import { Identifier } from '../../../model/value-objects/identifier'
import { MongoAdLibPiece, MongoEntityConverter } from './mongo-entity-converter'
import { MongoDatabase } from './mongo-database'
import { AdLibPiece } from '../../../model/entities/ad-lib-piece'
import { NotFoundException } from '../../../model/exceptions/not-found-exception'

const AD_LIB_COLLECTION_NAME: string = 'adLibPieces'

export class MongoAdLibPieceRepository extends BaseMongoRepository implements AdLibPieceRepository {
	constructor(mongoDatabase: MongoDatabase, mongoEntityConverter: MongoEntityConverter) {
		super(mongoDatabase, mongoEntityConverter)
	}

	protected getCollectionName(): string {
		return AD_LIB_COLLECTION_NAME
	}

	public async getAdLibPieceIdentifiers(rundownId: string): Promise<Identifier[]> {
		this.assertDatabaseConnection(this.getAdLibPieceIdentifiers.name)
		const mongoAdLibPieces: MongoAdLibPiece[] = (await this.getCollection()
			.find({ rundownId: rundownId })
			.toArray()) as unknown as MongoAdLibPiece[]
		return this.mongoEntityConverter.convertMongoAdLibPiecesToIdentifiers(mongoAdLibPieces)
	}

	public async getAdLibPiece(adLibPieceId: string): Promise<AdLibPiece> {
		this.assertDatabaseConnection(this.getAdLibPiece.name)
		const mongoAdLibPiece: MongoAdLibPiece = (await this.getCollection().findOne({
			_id: adLibPieceId,
		})) as unknown as MongoAdLibPiece
		if (!mongoAdLibPiece) {
			throw new NotFoundException(`Could not find an AdLibPiece for "${adLibPieceId}"`)
		}
		return this.mongoEntityConverter.convertAdLib(mongoAdLibPiece)
	}
}
