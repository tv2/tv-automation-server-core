import { instance, mock, when } from 'ts-mockito'
import { Rundown, RundownInterface } from '../../../model/entities/rundown'
import { MongoEntityConverter } from '../mongo/mongo-entity-converter'
import { MongoRundownPlaylistRepository } from '../mongo/mongo-rundown-playlist-repository'
import { RundownRepository } from '../interfaces/rundown-repository'
import { MongoDatabase } from '../mongo/mongo-database'

import { Db } from 'mongodb'
import { BasicRundown } from '../../../model/entities/basic-rundown'
import { MongoTestDatabase } from './mongo-test-database'

describe('MongoRundownPlaylistRepository', () => {
	const testDatabase: MongoTestDatabase = new MongoTestDatabase()
	beforeAll(async () => await testDatabase.beforeAll())
	afterAll(async () => testDatabase.afterAll())

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

	// TODO: Extract to Helper Class in Model layer
	function createActiveRundown(rundownId?: string): Rundown {
		return new Rundown({
			id: rundownId ?? 'id' + Math.random(),
			name: 'name' + Math.random(),
			isRundownActive: true,
		} as RundownInterface)
	}

	// TODO: Extract to Helper Class in Model layer
	function createInactiveRundown(rundownId?: string): Rundown {
		return new Rundown({
			id: rundownId ?? 'id' + Math.random(),
			name: 'name' + Math.random(),
			isRundownActive: false,
		} as RundownInterface)
	}

	async function populateDatabase(rundowns: Rundown[]): Promise<Db> {
		const db: Db = testDatabase.getDatabase(testDatabase.getCurrentDatabaseName())

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

		return new MongoRundownPlaylistRepository(
			instance(mongoDb),
			instance(mongoConverter),
			instance(rundownRepository)
		)
	}
})
