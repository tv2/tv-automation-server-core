import { instance, mock, when } from 'ts-mockito'
import { Rundown } from '../../../model/entities/rundown'
import { MongoEntityConverter, MongoRundown } from '../mongo/mongo-entity-converter'
import { MongoRundownPlaylistRepository } from '../mongo/mongo-rundown-playlist-repository'
import { RundownRepository } from '../interfaces/rundown-repository'
import { MongoDatabase } from '../mongo/mongo-database'
import { BasicRundown } from '../../../model/entities/basic-rundown'
import { MongoTestDatabase } from './mongo-test-database'
import { ObjectId } from 'mongodb'
import { EntityMockFactory } from '../../../model/entities/test/entity-mock-factory'

const COLLECTION_NAME = 'rundownPlaylists'

describe('MongoRundownPlaylistRepository', () => {
	const testDatabase: MongoTestDatabase = new MongoTestDatabase()
	beforeEach(async () => testDatabase.setupDatabase())
	afterEach(async () => testDatabase.teardownDatabase())

	describe('getRundown', () => {
		it('has an activationId, return an active rundown', async () => {
			const activatedRundown: MongoRundown = createMongoRundown()
			await testDatabase.populateDatabaseWithActiveRundowns([activatedRundown])

			const testee: RundownRepository = createTestee([activatedRundown])
			const result: Rundown = await testee.getRundown(activatedRundown._id.toString())

			expect(result.isActive()).toBe(true)
		})
		it('does not have an activationId, return inactive rundown', async () => {
			const inactiveRundown: MongoRundown = createMongoRundown()
			await testDatabase.populateDatabaseWithInactiveRundowns([inactiveRundown])

			const testee: RundownRepository = createTestee([inactiveRundown])
			const result: Rundown = await testee.getRundown(inactiveRundown._id.toString())

			expect(result.isActive()).toBe(false)
		})
	})
	describe('getBasicRundowns', () => {
		it('returns two rundowns, only one is active', async () => {
			const activatedRundown: MongoRundown = createMongoRundown()
			const inactiveRundown: MongoRundown = createMongoRundown()
			await testDatabase.populateDatabaseWithActiveRundowns([activatedRundown])
			await testDatabase.populateDatabaseWithInactiveRundowns([inactiveRundown])

			const testee: RundownRepository = createTestee([activatedRundown, inactiveRundown])
			const result: BasicRundown[] = await testee.getBasicRundowns()

			expect(result[0].isActive()).toBe(true)
			expect(result[1].isActive()).toBe(false)
		})
		it('returns two rundowns, none are active', async () => {
			const inactiveRundown: MongoRundown = createMongoRundown()
			const secondInactiveRundown: MongoRundown = createMongoRundown()
			await testDatabase.populateDatabaseWithInactiveRundowns([inactiveRundown, secondInactiveRundown])

			const testee: RundownRepository = createTestee([inactiveRundown, secondInactiveRundown])
			const result: BasicRundown[] = await testee.getBasicRundowns()

			expect(result[0].isActive()).toBe(false)
			expect(result[1].isActive()).toBe(false)
		})
	})

	function createMongoRundown(mongoRundownInterface?: Partial<MongoRundown>): MongoRundown {
		return {
			_id: mongoRundownInterface?._id ?? new ObjectId(),
			name: mongoRundownInterface?.name ?? 'rundownName',
		} as MongoRundown
	}

	function createTestee(rundowns: MongoRundown[]): MongoRundownPlaylistRepository {
		const rundownRepository: RundownRepository = mock<RundownRepository>()
		const mongoDb: MongoDatabase = mock(MongoDatabase)
		const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)

		const entityRundowns = rundowns.map((rundown) =>
			EntityMockFactory.createRundown({ id: rundown._id.toString() })
		)
		entityRundowns.forEach((rundown) => {
			when(rundownRepository.getRundown(rundown.id)).thenResolve(rundown)
		})
		when(rundownRepository.getBasicRundowns()).thenResolve(entityRundowns)
		when(mongoDb.getCollection(COLLECTION_NAME)).thenReturn(testDatabase.getDatabase().collection(COLLECTION_NAME))

		return new MongoRundownPlaylistRepository(
			instance(mongoDb),
			instance(mongoConverter),
			instance(rundownRepository)
		)
	}
})
