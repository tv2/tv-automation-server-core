import { SegmentRepository } from '../interfaces/segment-repository'
import { Segment } from '../../../model/entities/segment'
import { MongoDatabase } from './mongo-database'
import { MongoEntityConverter, MongoSegment } from './mongo-entity-converter'
import { BaseMongoRepository } from './base-mongo-repository'
import { PartRepository } from '../interfaces/part-repository'

const SEGMENT_COLLECTION_NAME: string = 'segments'

export class MongoSegmentRepository extends BaseMongoRepository implements SegmentRepository {
	private partRepository: PartRepository

	constructor(
		mongoDatabase: MongoDatabase,
		mongoEntityConverter: MongoEntityConverter,
		partRepository: PartRepository
	) {
		super(mongoDatabase, mongoEntityConverter)
		this.partRepository = partRepository
	}

	protected getCollectionName(): string {
		return SEGMENT_COLLECTION_NAME
	}

	public async getSegments(rundownId: string): Promise<Segment[]> {
		this.assertDatabaseConnection('getSegments')
		const mongoSegments: MongoSegment[] = (await this.getCollection()
			.find({ rundownId: rundownId })
			.toArray()) as unknown as MongoSegment[]
		const segments: Segment[] = this.mongoEntityConverter.convertSegments(mongoSegments)
		return Promise.all(
			segments.map(async (segment) => {
				segment.setParts(await this.partRepository.getParts(segment.id))
				return segment
			})
		)
	}
}
