import { MongoDatabase } from './mongo-database'
import { MongoEntityConverter } from './mongo-entity-converter'
import { Collection } from 'mongodb'

export abstract class BaseMongoRepository {
	protected mongoDatabase: MongoDatabase
	protected mongoEntityConverter: MongoEntityConverter

	protected constructor(mongoConnection: MongoDatabase, mongoEntityConverter: MongoEntityConverter) {
		this.mongoDatabase = mongoConnection
		this.mongoEntityConverter = mongoEntityConverter
	}

	abstract getCollectionName(): string

	protected getCollection(): Collection {
		return this.mongoDatabase.getCollection(this.getCollectionName())
	}

	protected assertDatabaseConnection(queryName: string): void {
		if (!this.getCollection()) {
			throw new Error(`Unable to perform query: ${queryName} - not connected to collection: ${this.getCollectionName()}`)
		}
	}
}
