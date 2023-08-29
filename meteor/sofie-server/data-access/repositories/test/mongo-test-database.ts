// eslint-disable-next-line node/no-unpublished-import
import { MongoMemoryServer } from 'mongodb-memory-server'
import { Db, MongoClient } from 'mongodb'
import { Rundown } from '../../../model/entities/rundown'
import { MongoEntityConverter, MongoRundown } from '../mongo/mongo-entity-converter'
import { Segment } from '../../../model/entities/segment'
import { Part } from '../../../model/entities/part'
import { Piece } from '../../../model/entities/piece'

export class MongoTestDatabase {
	private mongoServer: MongoMemoryServer
	private client: MongoClient

	constructor() {
		// Set a timeout beyond the default of 5 Seconds to ensure CI tests don't exceed the limit on GitHub
		jest.setTimeout(15000)
	}

	public async setupDatabase(): Promise<void> {
		this.mongoServer = await MongoMemoryServer.create()
		this.client = await MongoClient.connect(this.mongoServer.getUri())
	}

	public async teardownDatabase(): Promise<void> {
		if (this.client) {
			await this.client.close()
		}
		if (this.mongoServer) {
			await this.mongoServer.stop()
		}
	}

	public getValidObjectIdString(base: string): string {
		const twelveChar = base.length >= 12 ? base.substring(0, 12) : this.fillTo12Chars(base).substring(0, 12)
		return this.convertToHex(twelveChar)
	}

	private fillTo12Chars(base: string): string {
		const missingLength = 12 - base.length + 2
		const multiplier = this.replaceAll('1' + Array<number>(missingLength).fill(0).join(), ',')
		return base + Math.floor(Math.random() * +multiplier)
	}

	// Can and should be replaced with 'string.replaceAll(...)', when the project is updated to target Es2021.
	private replaceAll(target: string, searchFor: string, replaceWith: string = ''): string {
		while (target.includes(searchFor)) {
			target = target.replace(searchFor, replaceWith)
		}
		return target
	}

	private convertToHex(base: string): string {
		let hex = ''
		for (let i = 0; i < base.length; i++) {
			const charCode = base.charCodeAt(i)
			const hexValue = charCode.toString(16)
			hex += hexValue.padStart(2, '0')
		}
		return hex
	}

	public getDatabase(): Db {
		return this.client.db(this.mongoServer.instanceInfo!.dbName)
	}

	public async populateDatabaseWithRundowns(rundowns: Rundown[]): Promise<void> {
		const db: Db = this.getDatabase()
		const entityConverter: MongoEntityConverter = new MongoEntityConverter()
		const rundownsCollection = db.collection('rundowns')
		for (const rundown of rundowns) {
			const convertedRundown: MongoRundown = entityConverter.convertToMongoRundown(rundown)
			await rundownsCollection.insertOne(convertedRundown)
		}
	}

	public async populateDatabaseWithSegments(segments: Segment[]): Promise<void> {
		const db: Db = this.getDatabase()
		const entityConverter: MongoEntityConverter = new MongoEntityConverter()
		const segmentsCollection = db.collection('segments')
		await Promise.all(
			entityConverter
				.convertToMongoSegments(segments)
				.map(async (segment) => segmentsCollection.insertOne(segment))
		)
	}

	public async populateDatabaseWithParts(parts: Part[]): Promise<void> {
		const db: Db = this.getDatabase()
		const entityConverter: MongoEntityConverter = new MongoEntityConverter()
		const partsCollection = db.collection('parts')
		await Promise.all(
			entityConverter.convertToMongoParts(parts).map(async (part) => partsCollection.insertOne(part))
		)
	}

	public async populateDatabaseWithPieces(pieces: Piece[]): Promise<void> {
		const db: Db = this.getDatabase()
		const entityConverter: MongoEntityConverter = new MongoEntityConverter()
		const piecesCollection = db.collection('pieces')
		await Promise.all(
			entityConverter.convertToMongoPieces(pieces).map(async (piece) => piecesCollection.insertOne(piece))
		)
	}
}
