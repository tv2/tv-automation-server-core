import { BaseMongoRepository } from './base-mongo-repository'
import { RundownBaselineRepository } from '../interfaces/rundown-baseline-repository'
import { TimelineObject } from '../../../model/entities/timeline-object'
import { MongoDatabase } from './mongo-database'
import { MongoEntityConverter } from './mongo-entity-converter'

const COLLECTION_NAME: string = 'rundownBaselineObjs'

export class MongoRundownBaselineRepository extends BaseMongoRepository implements RundownBaselineRepository {
	constructor(mongoDatabase: MongoDatabase, mongoEntityConverter: MongoEntityConverter) {
		super(mongoDatabase, mongoEntityConverter)
	}

	protected getCollectionName(): string {
		return COLLECTION_NAME
	}

	// TODO: Test this when receiving the setup for in-memory-mongo-database for test
	async getRundownBaseline(rundownId: string): Promise<TimelineObject[]> {
		this.assertDatabaseConnection(this.getRundownBaseline.name)
		const rundownBaseline: { timelineObjectsString: string } = (await this.getCollection().findOne({
			rundownId,
		})) as unknown as { timelineObjectsString: string }
		const timelineObjects: TimelineObject[] = JSON.parse(rundownBaseline.timelineObjectsString)
		return timelineObjects ?? []
	}
}
