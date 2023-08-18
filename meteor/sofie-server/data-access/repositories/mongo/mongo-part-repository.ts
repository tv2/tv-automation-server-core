import { BaseMongoRepository } from './base-mongo-repository'
import { PartRepository } from '../interfaces/part-repository'
import { Part } from '../../../model/entities/part'
import { MongoDatabase } from './mongo-database'
import { MongoEntityConverter, MongoPart } from './mongo-entity-converter'
import { PieceRepository } from '../interfaces/piece-repository'

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
		this.assertDatabaseConnection('getParts')
		const mongoParts: MongoPart[] = (await this.getCollection()
			.find({ segmentId: segmentId })
			.toArray()) as unknown as MongoPart[]
		const parts: Part[] = this.mongoEntityConverter.convertParts(mongoParts)
		return Promise.all(
			parts.map(async (part) => {
				part.setPieces(await this.pieceRepository.getPieces(part.id))
				return part
			})
		)
	}
}
