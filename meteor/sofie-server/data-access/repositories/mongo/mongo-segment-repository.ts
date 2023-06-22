import { SegmentRepository } from '../segment-repository'
import { Segment } from '../../../model/segment'
import { MongoDatabase } from './mongo-database'
import { MongoEntityConverter, MongoSegment } from './mongo-entity-converter'
import { BaseMongoRepository } from './base-mongo-repository'

const SEGMENT_COLLECTION_NAME: string = 'segments'

export class MongoSegmentRepository extends BaseMongoRepository implements SegmentRepository {

	constructor(mongoDatabase: MongoDatabase, mongoEntityConverter: MongoEntityConverter) {
		super(mongoDatabase, mongoEntityConverter)
	}

	getCollectionName(): string {
		return SEGMENT_COLLECTION_NAME
	}

	async getSegments(rundownId: string): Promise<Segment[]> {
		this.assertDatabaseConnection('getSegments')
		const mongoSegments: MongoSegment[] = await this.getCollection().find({ 'rundownId': rundownId }).toArray() as unknown as MongoSegment[]
		return this.mongoEntityConverter.convertSegments(mongoSegments)
	}

}
