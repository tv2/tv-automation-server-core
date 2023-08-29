import { instance, mock, when } from 'ts-mockito'
import { Rundown, RundownInterface } from '../../../model/entities/rundown'
import { MongoEntityConverter } from '../mongo/mongo-entity-converter'
import { MongoRundownPlaylistRepository } from '../mongo/mongo-rundown-playlist-repository'
import { RundownRepository } from '../interfaces/rundown-repository'
import { MongoDatabase } from '../mongo/mongo-database'
import { BasicRundown } from '../../../model/entities/basic-rundown'
import { MongoTestDatabase } from './mongo-test-database'

const COLLECTION_NAME = 'rundownPlaylists'

describe('MongoRundownPlaylistRepository', () => {
	const testDatabase: MongoTestDatabase = new MongoTestDatabase()
	beforeEach(async () => testDatabase.setupDatabase())
	afterEach(async () => testDatabase.teardownDatabase())

	describe('getRundown', () => {
		it('has an activationId, return an active rundown', async () => {
			const activatedRundown: Rundown = createActiveRundown()
			await testDatabase.populateDatabaseWithRundowns([activatedRundown])

			const testee: RundownRepository = createTestee([activatedRundown])
			const result: Rundown = await testee.getRundown(activatedRundown.id)

			expect(result.isActive()).toBe(true)
		})
		it('does not have an activationId, return inactive rundown', async () => {
			const inactiveRundown: Rundown = createInactiveRundown()
			await testDatabase.populateDatabaseWithRundowns([inactiveRundown])

			const testee: RundownRepository = createTestee([inactiveRundown])
			const result: Rundown = await testee.getRundown(inactiveRundown.id)

			expect(result.isActive()).toBe(false)
		})
	})
	describe('getBasicRundowns', () => {
		it('returns two rundowns, only one is active', async () => {
			const activatedRundown: Rundown = createActiveRundown()
			const inactiveRundown: Rundown = createInactiveRundown()
			await testDatabase.populateDatabaseWithRundowns([activatedRundown, inactiveRundown])

			const testee: RundownRepository = createTestee([activatedRundown, inactiveRundown])
			const result: BasicRundown[] = await testee.getBasicRundowns()

			expect(result[0].isActive()).toBe(true)
			expect(result[1].isActive()).toBe(false)
		})
		it('returns two rundowns, none are active', async () => {
			const inactiveRundown: Rundown = createInactiveRundown()
			const secondInactiveRundown: Rundown = createInactiveRundown()
			await testDatabase.populateDatabaseWithRundowns([inactiveRundown, secondInactiveRundown])

			const testee: RundownRepository = createTestee([inactiveRundown, secondInactiveRundown])
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

	function createTestee(rundowns: Rundown[]): MongoRundownPlaylistRepository {
		const rundownRepository: RundownRepository = mock<RundownRepository>()
		const mongoDb: MongoDatabase = mock(MongoDatabase)
		const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)

		rundowns.forEach((rundown) => {
			when(rundownRepository.getRundown(rundown.id)).thenResolve(rundown)
		})
		when(rundownRepository.getBasicRundowns()).thenResolve(rundowns)
		when(mongoDb.getCollection(COLLECTION_NAME)).thenReturn(testDatabase.getDatabase().collection(COLLECTION_NAME))

		return new MongoRundownPlaylistRepository(
			instance(mongoDb),
			instance(mongoConverter),
			instance(rundownRepository)
		)
	}
})
