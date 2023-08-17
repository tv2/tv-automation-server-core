// eslint-disable-next-line node/no-unpublished-import
import { MongoMemoryServer } from 'mongodb-memory-server'
import { Db, MongoClient } from 'mongodb'
import { Rundown } from '../../../model/entities/rundown'
import { MongoEntityConverter } from '../mongo/mongo-entity-converter'
import { Segment } from '../../../model/entities/segment'
import { Part } from '../../../model/entities/part'

export class MongoTestDatabase {
	private mongoServer: MongoMemoryServer
	private client: MongoClient

	constructor() {
		// Set a timeout beyond the default of 5 Seconds to ensure CI tests don't exceed the limit on GitHub
		jest.setTimeout(15000)
	}

	public async beforeAll(override?: () => Promise<void>) {
		if (override) {
			return override()
		}
		this.mongoServer = await MongoMemoryServer.create()
		this.client = await MongoClient.connect(this.mongoServer.getUri())
	}

	public async afterAll(override?: () => Promise<void>) {
		if (override) {
			return override()
		}
		if (this.client) {
			await this.client.close()
		}
		if (this.mongoServer) {
			await this.mongoServer.stop()
		}
	}

	public getDatabase(dbName: string): Db {
		return this.client.db(dbName)
	}

	public getNewDatabaseName(): string {
		return 'db' + Math.round(Math.random() * 1000)
	}

	public async populateDatabaseWithRundowns(rundowns: Rundown[], databaseName: string): Promise<void> {
		const db: Db = this.getDatabase(databaseName)
		const entityConverter = new MongoEntityConverter()
		for (const rundown of rundowns) {
			const convertedRundown = entityConverter.convertToMongoRundown(rundown)
			await db.collection('rundowns').insertOne(convertedRundown)
			if (rundown.isActive()) {
				await db.collection('rundownPlaylists').insertOne({
					externalId: rundown.name,
					activationId: 'activated',
				})
			} else {
				await db.collection('rundownPlaylists').insertOne({
					externalId: rundown.name,
				})
			}
		}
	}

	public async populateDatabaseWithSegments(segments: Segment[], databaseName: string): Promise<void> {
		const db: Db = this.getDatabase(databaseName)
		const entityConverter = new MongoEntityConverter()
		for (const segment of entityConverter.convertToMongoSegments(segments)) {
			await db.collection('segments').insertOne(segment)
		}
	}

	public async populateDatabaseWithParts(parts: Part[], databaseName: string): Promise<Db> {
		const db: Db = this.getDatabase(databaseName)
		const entityConverter = new MongoEntityConverter()
		for (const part of entityConverter.convertToMongoParts(parts)) {
			await db.collection('parts').insertOne(part)
		}

		return db
	}
}
