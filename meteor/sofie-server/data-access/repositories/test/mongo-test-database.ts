// eslint-disable-next-line node/no-unpublished-import
import { MongoMemoryServer } from 'mongodb-memory-server'
import { Db, MongoClient } from 'mongodb'
import { Rundown } from '../../../model/entities/rundown'
import { MongoEntityConverter } from '../mongo/mongo-entity-converter'
import { Segment } from '../../../model/entities/segment'
import { Part } from '../../../model/entities/part'
import { Piece } from '../../../model/entities/piece'
import { MongoDatabase } from '../mongo/mongo-database'
import { when } from 'ts-mockito'

export class MongoTestDatabase {
	private mongoServer: MongoMemoryServer
	private client: MongoClient

	constructor() {
		// Set a timeout beyond the default of 5 Seconds to ensure CI tests don't exceed the limit on GitHub
		jest.setTimeout(15000)
	}

	public async setupDatabase(override?: () => Promise<void>) {
		if (override) {
			return override()
		}
		this.mongoServer = await MongoMemoryServer.create()
		this.client = await MongoClient.connect(this.mongoServer.getUri())
	}

	public async teardownDatabase(override?: () => Promise<void>) {
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

	public getDatabase(): Db {
		return this.client.db(this.mongoServer.instanceInfo!.dbName)
	}

	public applyCommonMocking(db: Db, mongoDb: MongoDatabase, collectionName: string) {
		when(mongoDb.getCollection(collectionName)).thenReturn(db.collection(collectionName))
	}

	public async populateDatabaseWithRundowns(rundowns: Rundown[]): Promise<void> {
		const db: Db = this.getDatabase()
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

	public async populateDatabaseWithSegments(segments: Segment[]): Promise<void> {
		const db: Db = this.getDatabase()
		const entityConverter = new MongoEntityConverter()
		for (const segment of entityConverter.convertToMongoSegments(segments)) {
			await db.collection('segments').insertOne(segment)
		}
	}

	public async populateDatabaseWithParts(parts: Part[]): Promise<void> {
		const db: Db = this.getDatabase()
		const entityConverter = new MongoEntityConverter()
		for (const part of entityConverter.convertToMongoParts(parts)) {
			await db.collection('parts').insertOne(part)
		}
	}

	public async populateDatabaseWithPieces(pieces: Piece[]) {
		const db: Db = this.getDatabase()
		const entityConverter = new MongoEntityConverter()
		for (const piece of entityConverter.convertToMongoPieces(pieces)) {
			await db.collection('pieces').insertOne(piece)
		}
	}
}
