import { Rundown } from '../../../model/entities/rundown'
import { RundownRepository } from '../interfaces/rundown-repository'
import { MongoEntityConverter, MongoRundown } from './mongo-entity-converter'
import { MongoDatabase } from './mongo-database'
import { SegmentRepository } from '../interfaces/segment-repository'
import { BaseMongoRepository } from './base-mongo-repository'

const RUNDOWN_COLLECTION_NAME: string = 'rundowns'

export class MongoRundownRepository extends BaseMongoRepository implements RundownRepository {

	private segmentRepository: SegmentRepository

	constructor(mongoDatabase: MongoDatabase, mongoEntityConverter: MongoEntityConverter, segmentRepository: SegmentRepository) {
		super(mongoDatabase, mongoEntityConverter)
		this.segmentRepository = segmentRepository
	}

	getCollectionName(): string {
		return RUNDOWN_COLLECTION_NAME
	}

	async getRundowns(): Promise<Rundown[]> {
		this.assertDatabaseConnection('getRundowns')
		const mongoRundowns: MongoRundown[] =  await this.getCollection().find({}).toArray() as unknown as MongoRundown[]
		const rundowns: Rundown[] = this.mongoEntityConverter.convertRundowns(mongoRundowns)
		return Promise.all(rundowns.map(async rundown => {
			rundown.setSegments(await this.segmentRepository.getSegments(rundown.id))
			return rundown
		}))
	}

	async getRundown(rundownId: string): Promise<Rundown> {
		this.assertDatabaseConnection('getRundown')
		const mongoRundown: MongoRundown = await this.getCollection().findOne({ '_id': rundownId }) as unknown as MongoRundown
		const rundown = this.mongoEntityConverter.convertRundown(mongoRundown)
		rundown.setSegments(await this.segmentRepository.getSegments(rundown.id))
		return rundown
	}

	saveRundown(_rundown: Rundown): void {
		throw new Error('Not implemented')
	}
}
