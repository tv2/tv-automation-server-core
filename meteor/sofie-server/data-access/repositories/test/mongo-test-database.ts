import {MongoMemoryServer} from "mongodb-memory-server";
import {Db, MongoClient} from "mongodb";

export class MongoTestDatabase {
	private mongoServer: MongoMemoryServer
	private client: MongoClient

	constructor() {
		// Set a timeout beyond the default of 5 Seconds to ensure CI tests don't exceed the limit on GitHub
		jest.setTimeout(15000)
	}

	public async beforeAll(override? : () => Promise<void>) {
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

	public getCurrentDatabaseName(): string {
		return this.mongoServer.instanceInfo!.dbName
	}
}