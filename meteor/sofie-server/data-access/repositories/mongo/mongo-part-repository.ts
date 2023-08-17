import { BaseMongoRepository } from './base-mongo-repository'
import { PartRepository } from '../interfaces/part-repository'
import { Part } from '../../../model/entities/part'
import { MongoDatabase } from './mongo-database'
import { MongoEntityConverter, MongoPart } from './mongo-entity-converter'
import { PieceRepository } from '../interfaces/piece-repository'
import { DeletionFailedException } from '../../../model/exceptions/deletion-failed-exception'

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

	public async deleteParts(segmentId: string): Promise<void> {
		this.assertDatabaseConnection(this.deleteParts.name)
		const parts = await this.getParts(segmentId)

		parts.map((part) => part.id).forEach(async (id) => await this.pieceRepository.deletePieces(id))
		const partsDeletedResult = await this.getCollection().deleteMany({ segmentId: segmentId })

		// TODO: Figure out how to archive a 'false' acknowledgment, and add test case using that knowledge
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
