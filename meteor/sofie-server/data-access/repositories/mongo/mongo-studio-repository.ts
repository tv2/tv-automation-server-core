import { BaseMongoRepository } from './base-mongo-repository'
import { StudioRepository } from '../interfaces/studio-repository'
import { Studio } from '../../../model/entities/studio'
import { MongoDatabase } from './mongo-database'
import { MongoEntityConverter, MongoStudio } from './mongo-entity-converter'

const COLLECTION_NAME: string = 'studios'

export class MongoStudioRepository extends BaseMongoRepository implements StudioRepository {
	constructor(mongoDatabase: MongoDatabase, mongoEntityConverter: MongoEntityConverter) {
		super(mongoDatabase, mongoEntityConverter)
	}

	protected getCollectionName(): string {
		return COLLECTION_NAME
	}

	async getStudio(studioId: string): Promise<Studio> {
		this.assertDatabaseConnection(this.getStudio.name)
		const mongoStudio: MongoStudio = (await this.getCollection().findOne({
			_id: studioId,
		})) as unknown as MongoStudio
		return this.mongoEntityConverter.convertStudio(mongoStudio)
	}
}
