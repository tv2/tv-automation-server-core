import { BaseMongoRepository } from './base-mongo-repository'
import { PartRepository } from '../interfaces/part-repository'
import { Part } from '../../../model/entities/part'
import { MongoDatabase } from './mongo-database'
import { MongoEntityConverter, MongoPart } from './mongo-entity-converter'
import { PieceRepository } from '../interfaces/piece-repository'
import { DeletionFailedException } from '../../../model/exceptions/deletion-failed-exception'
import { DeleteResult } from 'mongodb'

const PART_COLLECTION_NAME: string = 'parts'

export class MongoPartRepository extends BaseMongoRepository implements PartRepository {
	constructor(
		mongoDatabase: MongoDatabase,
		mongoEntityConverter: MongoEntityConverter,
		private pieceRepository: PieceRepository
	) {
		super(mongoDatabase, mongoEntityConverter)
	}

	protected getCollectionName(): string {
		return PART_COLLECTION_NAME
	}

	public async getParts(segmentId: string): Promise<Part[]> {
		this.assertDatabaseConnection(this.getParts.name)
		const mongoParts: MongoPart[] = (await this.getCollection()
			.find({ segmentId: segmentId })
			.toArray()) as unknown as MongoPart[]
		const parts: Part[] = this.mongoEntityConverter.convertParts(mongoParts)
		return Promise.all(
			parts.map(async (part) => {
				part.pieces = await this.pieceRepository.getPieces(part.id)
				return part
			})
		)
	}

	public async save(part: Part): Promise<void> {
		const mongoPart: MongoPart = this.mongoEntityConverter.convertToMongoPart(part)
		await this.getCollection().replaceOne(
			{ _id: part.id },
			{
				segmentId: mongoPart.segmentId,
				title: mongoPart.title,
				expectedDuration: mongoPart.expectedDuration,
				isOnAir: mongoPart.isOnAir,
				isNext: mongoPart.isNext,
			},
			{ upsert: true }
		)
	}

	public async deletePartsForSegment(segmentId: string): Promise<void> {
		this.assertDatabaseConnection(this.deletePartsForSegment.name)
		const parts: Part[] = await this.getParts(segmentId)

		for (const part of parts) {
			await this.pieceRepository.deletePiecesForPart(part.id)
		}
		const partsDeletedResult: DeleteResult = await this.getCollection().deleteMany({ segmentId: segmentId })

		if (!partsDeletedResult.acknowledged) {
			throw new DeletionFailedException(`Deletion of parts was not acknowledged, for segmentId: ${segmentId}`)
		}
		if (partsDeletedResult.deletedCount === 0) {
			throw new DeletionFailedException(
				`Expected to delete one or more parts, but none was deleted, for segmentId: ${segmentId}`
			)
		}
	}
}
