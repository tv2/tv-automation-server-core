import { TimelineRepository } from '../interfaces/timeline-repository'
import { BaseMongoRepository } from './base-mongo-repository'
import { Timeline } from '../../../model/entities/timeline'
import { MongoDatabase } from './mongo-database'
import { MongoEntityConverter, MongoTimeline } from './mongo-entity-converter'

const TIMELINE_COLLECTION_NAME: string = 'timeline'

export class MongoTimelineRepository extends BaseMongoRepository implements TimelineRepository {
	constructor(mongoDatabase: MongoDatabase, mongoEntityConverter: MongoEntityConverter) {
		super(mongoDatabase, mongoEntityConverter)
	}

	protected getCollectionName(): string {
		return TIMELINE_COLLECTION_NAME
	}

	public async saveTimeline(timeline: Timeline): Promise<void> {
		this.assertDatabaseConnection(this.saveTimeline.name)
		const mongoTimeline: MongoTimeline = this.mongoEntityConverter.convertToMongoTimeline(timeline)
		await this.getCollection().replaceOne({ _id: mongoTimeline._id }, mongoTimeline)
	}
}
