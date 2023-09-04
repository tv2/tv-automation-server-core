import { BaseMongoRepository } from './base-mongo-repository'
import { PieceRepository } from '../interfaces/piece-repository'
import { Piece } from '../../../model/entities/piece'
import { MongoEntityConverter, MongoPiece } from './mongo-entity-converter'
import { MongoDatabase } from './mongo-database'
import { DeletionFailedException } from '../../../model/exceptions/deletion-failed-exception'
import { DeleteResult } from 'mongodb'

const PIECE_COLLECTION_NAME: string = 'pieces'

export class MongoPieceRepository extends BaseMongoRepository implements PieceRepository {
	constructor(mongoDatabase: MongoDatabase, mongoEntityConverter: MongoEntityConverter) {
		super(mongoDatabase, mongoEntityConverter)
	}

	protected getCollectionName(): string {
		return PIECE_COLLECTION_NAME
	}

	public async getPieces(partId: string): Promise<Piece[]> {
		this.assertDatabaseConnection(this.getPieces.name)
		const mongoPieces: MongoPiece[] = (await this.getCollection()
			.find({ startPartId: partId })
			.toArray()) as unknown as MongoPiece[]
		return this.mongoEntityConverter.convertPieces(mongoPieces)
	}

	public async deletePiecesForPart(partId: string): Promise<void> {
		this.assertDatabaseConnection(this.deletePiecesForPart.name)
		const piecesDeletionResult: DeleteResult = await this.getCollection().deleteMany({ startPartId: partId })

		if (!piecesDeletionResult.acknowledged) {
			throw new DeletionFailedException(`Deletion of pieces was not acknowledged, for partId: ${partId}`)
		}
		if (piecesDeletionResult.deletedCount === 0) {
			throw new DeletionFailedException(
				`Expected to delete one or more pieces, but none was deleted, for partId: ${partId}`
			)
		}
	}
}
