import { MongoRundownRepository } from '../mongo/mongo-rundown-repository'
import { MongoTestDatabase } from './mongo-test-database'
import { Rundown, RundownInterface } from '../../../model/entities/rundown'
import { Db } from 'mongodb'
import { RundownRepository } from '../interfaces/rundown-repository'
import { SegmentRepository } from '../interfaces/segment-repository'
import { MongoDatabase } from '../mongo/mongo-database'
import { anyString, instance, mock, verify, when } from 'ts-mockito'
import { MongoEntityConverter } from '../mongo/mongo-entity-converter'
import { DeletionFailedException } from '../../../model/exceptions/deletion-failed-exception'

const COLLECTION_NAME = 'rundowns'
describe(`${MongoRundownRepository.name}`, () => {
	const testDatabase: MongoTestDatabase = new MongoTestDatabase()
	beforeAll(async () => await testDatabase.beforeAll())
	afterAll(async () => await testDatabase.afterAll())

	describe(`${MongoRundownRepository.prototype.deleteRundown.name}`, () => {
		it('deletes active rundown successfully', async () => {
			const dbName: string = testDatabase.getNewDatabaseName()
			const rundownId: string = 'someRundownId'
			const activeRundown: Rundown = createActiveRundown(rundownId)
			await testDatabase.populateDatabaseWithRundowns([activeRundown], dbName)
			const db: Db = testDatabase.getDatabase(dbName)

			const testee = await createTestee(db, {})
			await testee.deleteRundown(rundownId)

			expect(await db.collection(COLLECTION_NAME).countDocuments()).toBe(0)
		})

		it('deletes inactive rundown successfully', async () => {
			const dbName: string = testDatabase.getNewDatabaseName()
			const rundownId: string = 'someRundownId'
			const inactiveRundown: Rundown = createInactiveRundown(rundownId)
			await testDatabase.populateDatabaseWithRundowns([inactiveRundown], dbName)

			const db: Db = testDatabase.getDatabase(dbName)

			const testee = await createTestee(db, {})
			await testee.deleteRundown(rundownId)

			expect(await db.collection(COLLECTION_NAME).countDocuments()).toBe(0)
		})

		// eslint-disable-next-line jest/expect-expect
		it('calls deletion of segments', async () => {
			const dbName: string = testDatabase.getNewDatabaseName()
			const segmentRepository: SegmentRepository = mock<SegmentRepository>()
			const rundownId: string = 'someRundownId'
			const rundown: Rundown = createInactiveRundown(rundownId)
			await testDatabase.populateDatabaseWithRundowns([rundown], dbName)
			const db: Db = testDatabase.getDatabase(dbName)

			const testee = await createTestee(db, { segmentRepository: segmentRepository })
			await testee.deleteRundown(rundownId)

			verify(segmentRepository.deleteSegments(anyString())).once()
		})

		it('does not delete, and throws exception, when nonexistent rundownId is given', async () => {
			const dbName: string = testDatabase.getNewDatabaseName()
			const expectedErrorMessageFragment: string = 'Expected to delete one rundown'
			const nonExistingId: string = 'nonExistingId'
			const rundown: Rundown = createInactiveRundown()
			await testDatabase.populateDatabaseWithRundowns([rundown], dbName)
			const db: Db = testDatabase.getDatabase(dbName)

			const testee = await createTestee(db, {})

			expect.assertions(2)
			try {
				await testee.deleteRundown(nonExistingId)
			} catch (error) {
				// It isn't conditional, as the test will fail, if not hit, due to the 'expect.assertions(2)'
				// eslint-disable-next-line jest/no-conditional-expect
				expect(error).toBeInstanceOf(DeletionFailedException)
				// eslint-disable-next-line jest/no-conditional-expect
				expect((error as DeletionFailedException).message).toContain(expectedErrorMessageFragment)
			}
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

	interface TesteeBuilderParams {
		segmentRepository?: SegmentRepository
		mongoDb?: MongoDatabase
		mongoConverter?: MongoEntityConverter
	}

	async function createTestee(db: Db, params: TesteeBuilderParams): Promise<RundownRepository> {
		const segmentRepository: SegmentRepository = params.segmentRepository ?? mock<SegmentRepository>()
		const mongoDb: MongoDatabase = params.mongoDb ?? mock(MongoDatabase)
		const mongoConverter: MongoEntityConverter = params.mongoConverter ?? mock(MongoEntityConverter)

		when(mongoDb.getCollection(COLLECTION_NAME)).thenReturn(db.collection(COLLECTION_NAME))

		return new MongoRundownRepository(instance(mongoDb), instance(mongoConverter), instance(segmentRepository))
	}
})
