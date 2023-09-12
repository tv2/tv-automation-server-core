import { BaseMongoRepository } from './base-mongo-repository'
import { ShowStyleRepository } from '../interfaces/show-style-repository'
import { ShowStyle } from '../../../model/entities/show-style'
import { MongoDatabase } from './mongo-database'
import { MongoEntityConverter, MongoShowStyle } from './mongo-entity-converter'

const COLLECTION_NAME: string = 'showStyleBases'

export class MongoShowStyleRepository extends BaseMongoRepository implements ShowStyleRepository {
	constructor(mongoDatabase: MongoDatabase, mongoEntityConverter: MongoEntityConverter) {
		super(mongoDatabase, mongoEntityConverter)
	}

	protected getCollectionName(): string {
		return COLLECTION_NAME
	}

	async getShowStyle(showStyleId: string): Promise<ShowStyle> {
		this.assertDatabaseConnection(this.getShowStyle.name)
		const mongoShowStyle: MongoShowStyle = (await this.getCollection().findOne({
			_id: showStyleId,
		})) as unknown as MongoShowStyle
		return this.mongoEntityConverter.convertShowStyle(mongoShowStyle)
	}
}
