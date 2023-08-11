import { instance, mock, when } from 'ts-mockito'
import { Rundown, RundownInterface } from '../../../model/entities/rundown'
import { MongoEntityConverter } from '../mongo/mongo-entity-converter'
import { MongoRundownPlaylistRepository } from '../mongo/mongo-rundown-playlist-repository'
import { RundownRepository } from '../interfaces/rundown-repository'
import { MongoDatabase } from '../mongo/mongo-database'
// eslint-disable-next-line node/no-unpublished-import
import { MongoMemoryServer } from 'mongodb-memory-server'
import { MongoClient, Db } from 'mongodb'
import { BasicRundown } from '../../../model/entities/basic-rundown'

describe('MongoRundownPlaylistRepository', () => {
	// Set a timeout beyound the default of 5 Seconds to ensure CI tests don't exceed the limit on GitHub
	jest.setTimeout(15000)
	let mongoServer: MongoMemoryServer
	let client: MongoClient

	beforeAll(async () => {
		mongoServer = await MongoMemoryServer.create()
		client = await MongoClient.connect(mongoServer.getUri())
	})

	afterAll(async () => {
		if (client) {
			await client.close()
		}
		if (mongoServer) {
			await mongoServer.stop()
		}
	})

	describe('getRundown', () => {
		it('has an activationId, return an active rundown', async () => {
			const activatedRundown: Rundown = createActiveRundown()

			const db: Db = await populateDatabase([activatedRundown])
			const testee: RundownRepository = await createTestee(db, [activatedRundown])
			const result: Rundown = await testee.getRundown(activatedRundown.id)

			expect(result.isActive()).toBe(true)
		})
		it('does not have an activationId, return inactive rundown', async () => {
			const inactiveRundown: Rundown = createInactiveRundown()
			const db: Db = await populateDatabase([inactiveRundown])
			const testee: RundownRepository = await createTestee(db, [inactiveRundown])
			const result: Rundown = await testee.getRundown(inactiveRundown.id)

			expect(result.isActive()).toBe(false)
		})
	})
	describe('getBasicRundowns', () => {
		it('returns two rundowns, only one is active', async () => {
			const activatedRundown: Rundown = createActiveRundown()
			const inactiveRundown: Rundown = createInactiveRundown()
			const db: Db = await populateDatabase([activatedRundown, inactiveRundown])
			const testee: RundownRepository = await createTestee(db, [activatedRundown, inactiveRundown])
			const result: BasicRundown[] = await testee.getBasicRundowns()

			expect(result[0].isActive()).toBe(true)
			expect(result[1].isActive()).toBe(false)
		})
		it('returns two rundowns, none are active', async () => {
			const inactiveRundown: Rundown = createInactiveRundown()
			const secondInactiveRundown: Rundown = createInactiveRundown()
			const db: Db = await populateDatabase([inactiveRundown, secondInactiveRundown])
			const testee: RundownRepository = await createTestee(db, [inactiveRundown, secondInactiveRundown])
			const result: BasicRundown[] = await testee.getBasicRundowns()

			expect(result[0].isActive()).toBe(false)
			expect(result[1].isActive()).toBe(false)
		})
	})

	function createActiveRundown(): Rundown {
		return new Rundown({
			id: 'id' + Math.random(),
			name: 'name' + Math.random(),
			isRundownActive: true,
		} as RundownInterface)
	}

	function createInactiveRundown(): Rundown {
		return new Rundown({
			id: 'id' + Math.random(),
			name: 'name' + Math.random(),
			isRundownActive: false,
		} as RundownInterface)
	}

	async function populateDatabase(rundowns: Rundown[]): Promise<Db> {
		const db: Db = client.db(mongoServer.instanceInfo!.dbName)

		for (const rundown of rundowns) {
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
		return db
	}

	async function createTestee(db: Db, rundowns: Rundown[]): Promise<RundownRepository> {
		const rundownRepository: RundownRepository = mock<RundownRepository>()
		const mongoDb: MongoDatabase = mock(MongoDatabase)
		const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)

		rundowns.forEach((rundown) => {
			when(rundownRepository.getRundown(rundown.id)).thenReturn(Promise.resolve(rundown))
		})
		when(rundownRepository.getBasicRundowns()).thenReturn(Promise.resolve(rundowns))
		when(mongoDb.getCollection('rundownPlaylists')).thenReturn(db.collection('rundownPlaylists'))

		return new MongoRundownPlaylistRepository(instance(mongoDb), mongoConverter, instance(rundownRepository))
	}
})
