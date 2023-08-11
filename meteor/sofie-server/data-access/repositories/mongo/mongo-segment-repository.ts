import { SegmentRepository } from '../interfaces/segment-repository'
import { Segment } from '../../../model/entities/segment'
import { MongoDatabase } from './mongo-database'
import { MongoEntityConverter, MongoSegment } from './mongo-entity-converter'
import { BaseMongoRepository } from './base-mongo-repository'
import { PartRepository } from '../interfaces/part-repository'

const SEGMENT_COLLECTION_NAME: string = 'segments'

export class MongoSegmentRepository extends BaseMongoRepository implements SegmentRepository {
	constructor(
		mongoDatabase: MongoDatabase,
		mongoEntityConverter: MongoEntityConverter,
		private partRepository: PartRepository
	) {
		super(mongoDatabase, mongoEntityConverter)
	}

	protected getCollectionName(): string {
		return SEGMENT_COLLECTION_NAME
	}

	public async getSegments(rundownId: string): Promise<Segment[]> {
		this.assertDatabaseConnection(this.getSegments.name)
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

	public async deleteSegments(rundownId: string): Promise<boolean> {
		this.assertDatabaseConnection(this.deleteSegments.name)
		const segments = await this.getSegments(rundownId)

		const ongoingDeletions = segments.map(async (segment: Segment) => this.partRepository.deleteParts(segment.id))
		const partsDeleteResult = await Promise.all(ongoingDeletions).then((results: boolean[]) => results.every((partResult: boolean) => partResult))
		const segmentDeleteResult = await this.getCollection().deleteMany({rundownId: rundownId})

		return segmentDeleteResult.acknowledged && partsDeleteResult
	}
}
