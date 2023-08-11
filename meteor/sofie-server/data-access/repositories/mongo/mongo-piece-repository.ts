import { BaseMongoRepository } from './base-mongo-repository'
import { PieceRepository } from '../interfaces/piece-repository'
import { Piece } from '../../../model/entities/piece'
import { MongoEntityConverter, MongoPiece } from './mongo-entity-converter'
import { MongoDatabase } from './mongo-database'

const PIECE_COLLECTION_NAME: string = 'pieces'

export class MongoPieceRepository extends BaseMongoRepository implements PieceRepository {
	constructor(mongoDatabase: MongoDatabase, mongoEntityConverter: MongoEntityConverter) {
		super(mongoDatabase, mongoEntityConverter)
	}

	protected getCollectionName(): string {
		return PIECE_COLLECTION_NAME
	}

	public async getPieces(partId: string): Promise<Piece[]> {
		this.assertDatabaseConnection('getPieces')
		const mongoPieces: MongoPiece[] = (await this.getCollection()
			.find({ startPartId: partId })
			.toArray()) as unknown as MongoPiece[]
		return this.mongoEntityConverter.convertPieces(mongoPieces)
	}

	public async deletePieces(partId: string): Promise<boolean> {
		const piecesDeletionResult = await this.getCollection().deleteMany({startPartId: partId})
		return piecesDeletionResult.acknowledged
	}
}
