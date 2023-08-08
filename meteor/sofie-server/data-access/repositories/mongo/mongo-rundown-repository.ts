import { Rundown } from '../../../model/entities/rundown'
import { RundownRepository } from '../interfaces/rundown-repository'
import { MongoEntityConverter, MongoRundown } from './mongo-entity-converter'
import { MongoDatabase } from './mongo-database'
import { SegmentRepository } from '../interfaces/segment-repository'
import { BaseMongoRepository } from './base-mongo-repository'

const RUNDOWN_COLLECTION_NAME: string = 'rundowns'

export class MongoRundownRepository extends BaseMongoRepository implements RundownRepository {
	constructor(
		mongoDatabase: MongoDatabase,
		mongoEntityConverter: MongoEntityConverter,
		private segmentRepository: SegmentRepository
	) {
		super(mongoDatabase, mongoEntityConverter)
	}

	protected getCollectionName(): string {
		return RUNDOWN_COLLECTION_NAME
	}

	public async getBasicRundowns(): Promise<Rundown[]> {
		this.assertDatabaseConnection('getRundowns')
		const rundowns: MongoRundown[] = (await this.getCollection()
			.find({})
			.project({ _id: 1, name: 1, modified: 1 })
			.toArray()) as unknown as MongoRundown[]
		return this.mongoEntityConverter.convertRundowns(rundowns)
	}

	public async getRundown(rundownId: string): Promise<Rundown> {
		this.assertDatabaseConnection('getRundown')
		const mongoRundown: MongoRundown = (await this.getCollection().findOne({
			_id: rundownId,
		})) as unknown as MongoRundown
		const rundown = this.mongoEntityConverter.convertRundown(mongoRundown)
		rundown.setSegments(await this.segmentRepository.getSegments(rundown.id))
		return rundown
	}

	public saveRundown(_rundown: Rundown): void {
		throw new Error('Not implemented')
	}
}
