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
	let mongoServer: MongoMemoryServer
	let client: MongoClient
	const activatedRundown: Rundown = new Rundown({
		id: 'activatedRundownId',
		name: 'INEWS_QUEUE_PATH_ONE',
		isRundownActive: true,
	} as RundownInterface)
	const inactiveRundown: Rundown = new Rundown({
		id: 'deactivatedRundownId',
		name: 'INEWS_QUEUE_PATH_TWO',
		isRundownActive: false,
	} as RundownInterface)
	const anotherInactiveRundown: Rundown = new Rundown({
		id: 'anotherDeactivatedRundownId',
		name: 'INEWS_QUEUE_PATH_THREE',
		isRundownActive: false,
	} as RundownInterface)

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
			const db: Db = await populateDatabase([activatedRundown])
			const testee: RundownRepository = await createTestee(db, [activatedRundown])
			const result: Rundown = await testee.getRundown(activatedRundown.id)

			expect(result.isActive()).toBe(true)
		})
		it('does not have an activationId, return inactive rundown', async () => {
			const db: Db = await populateDatabase([inactiveRundown])
			const testee: RundownRepository = await createTestee(db, [inactiveRundown])
			const result: Rundown = await testee.getRundown(inactiveRundown.id)

			expect(result.isActive()).toBe(false)
		})
	})
	describe('getBasicRundowns', () => {
		it('returns two rundowns, one is active', async () => {
			const rundowns: Rundown[] = [activatedRundown, inactiveRundown]
			const db: Db = await populateDatabase(rundowns)
			const testee: RundownRepository = await createTestee(db, rundowns)
			const result: BasicRundown[] = await testee.getBasicRundowns()

			expect(result[0].isActive()).toBe(true)
		})
		it('returns two rundowns, none are active', async () => {
			const rundowns: Rundown[] = [inactiveRundown, anotherInactiveRundown]
			const db: Db = await populateDatabase(rundowns)
			const testee: RundownRepository = await createTestee(db, rundowns)
			const result: BasicRundown[] = await testee.getBasicRundowns()

			expect(result[0].isActive()).toBe(false)
		})
	})

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
