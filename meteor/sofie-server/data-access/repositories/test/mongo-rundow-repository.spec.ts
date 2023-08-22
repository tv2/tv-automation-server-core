import { MongoRundownRepository } from '../mongo/mongo-rundown-repository'
import { MongoTestDatabase } from './mongo-test-database'
import { Rundown, RundownInterface } from '../../../model/entities/rundown'
import { RundownRepository } from '../interfaces/rundown-repository'
import { SegmentRepository } from '../interfaces/segment-repository'
import { MongoDatabase } from '../mongo/mongo-database'
import { anyString, anything, instance, mock, spy, verify, when } from 'ts-mockito'
import { MongoEntityConverter } from '../mongo/mongo-entity-converter'
import { NotFoundException } from '../../../model/exceptions/not-found-exception'
import { Db } from 'mongodb'

const COLLECTION_NAME = 'rundowns'
describe(`${MongoRundownRepository.name}`, () => {
	const testDatabase: MongoTestDatabase = new MongoTestDatabase()
	beforeEach(async () => await testDatabase.setupDatabase())
	afterEach(async () => await testDatabase.teardownDatabase())

	describe(`${MongoRundownRepository.prototype.deleteRundown.name}`, () => {
		it('deletes active rundown successfully', async () => {
			const mongoDb: MongoDatabase = mock(MongoDatabase)
			const mongoConverter = mock(MongoEntityConverter)
			const segmentRepository: SegmentRepository = mock<SegmentRepository>()
			const rundownId: string = 'someRundownId'
			const activeRundown: Rundown = createActiveRundown(rundownId)
			await testDatabase.populateDatabaseWithRundowns([activeRundown])
			const db: Db = testDatabase.getDatabase()

			when(mongoConverter.convertRundown(anything())).thenReturn(activeRundown)
			when(segmentRepository.getSegments(anything())).thenResolve([])
			testDatabase.applyCommonMockingActions(db, mongoDb, COLLECTION_NAME)
			const testee = await createTestee({
				segmentRepository: segmentRepository,
				mongoConverter: mongoConverter,
				mongoDb: mongoDb,
			})
			await testee.deleteRundown(rundownId)

			expect(await db.collection(COLLECTION_NAME).countDocuments()).toBe(0)
		})

		it('deletes inactive rundown successfully', async () => {
			const mongoDb: MongoDatabase = mock(MongoDatabase)
			const mongoConverter = mock(MongoEntityConverter)
			const segmentRepository: SegmentRepository = mock<SegmentRepository>()
			const rundownId: string = 'someRundownId'
			const inactiveRundown: Rundown = createInactiveRundown(rundownId)
			await testDatabase.populateDatabaseWithRundowns([inactiveRundown])
			const db: Db = testDatabase.getDatabase()

			when(mongoConverter.convertRundown(anything())).thenReturn(inactiveRundown)
			when(segmentRepository.getSegments(anything())).thenResolve([])
			testDatabase.applyCommonMockingActions(db, mongoDb, COLLECTION_NAME)
			const testee = await createTestee({
				segmentRepository: segmentRepository,
				mongoConverter: mongoConverter,
				mongoDb: mongoDb,
			})
			await testee.deleteRundown(rundownId)

			expect(await db.collection(COLLECTION_NAME).countDocuments()).toBe(0)
		})

		// eslint-disable-next-line jest/expect-expect
		it('calls deletion of segments', async () => {
			const mongoDb: MongoDatabase = mock(MongoDatabase)
			const mongoConverter = mock(MongoEntityConverter)
			const segmentRepository: SegmentRepository = mock<SegmentRepository>()
			const rundownId: string = 'someRundownId'
			const rundown: Rundown = createInactiveRundown(rundownId)
			await testDatabase.populateDatabaseWithRundowns([rundown])
			const db: Db = testDatabase.getDatabase()

			when(mongoConverter.convertRundown(anything())).thenReturn(rundown)
			when(segmentRepository.getSegments(anything())).thenResolve([])
			testDatabase.applyCommonMockingActions(db, mongoDb, COLLECTION_NAME)
			const testee = await createTestee({
				segmentRepository: segmentRepository,
				mongoConverter: mongoConverter,
				mongoDb: mongoDb,
			})
			await testee.deleteRundown(rundownId)

			verify(segmentRepository.deleteSegments(anyString())).once()
		})

		it('does not delete, when nonexistent rundownId is given', async () => {
			const mongoDb: MongoDatabase = mock(MongoDatabase)
			const nonExistingId: string = 'nonExistingId'
			const rundown: Rundown = createInactiveRundown()
			await testDatabase.populateDatabaseWithRundowns([rundown])
			const db: Db = testDatabase.getDatabase()

			testDatabase.applyCommonMockingActions(db, mongoDb, COLLECTION_NAME)
			const testee = await createTestee({ mongoDb: mongoDb })

			expect.assertions(2)
			try {
				await testee.deleteRundown(nonExistingId)
			} catch (error) {
				// eslint-disable-next-line jest/no-conditional-expect
				expect(error).toBeInstanceOf(NotFoundException)
				// eslint-disable-next-line jest/no-conditional-expect
				expect(await db.collection(COLLECTION_NAME).countDocuments()).toBe(1)
			}
		})

		it('throws exception, when nonexistent rundownId is given', async () => {
			const mongoDb: MongoDatabase = mock(MongoDatabase)
			const expectedErrorMessageFragment: string = 'Failed to find a rundown with id'
			const nonExistingId: string = 'nonExistingId'
			const rundown: Rundown = createInactiveRundown()
			await testDatabase.populateDatabaseWithRundowns([rundown])
			const db: Db = testDatabase.getDatabase()

			testDatabase.applyCommonMockingActions(db, mongoDb, COLLECTION_NAME)
			const testee = await createTestee({ mongoDb: mongoDb })

			expect.assertions(2)
			try {
				await testee.deleteRundown(nonExistingId)
			} catch (error) {
				// It isn't conditional, as the test will fail, if not hit, due to the 'expect.assertions(2)'
				// eslint-disable-next-line jest/no-conditional-expect
				expect(error).toBeInstanceOf(NotFoundException)
				// eslint-disable-next-line jest/no-conditional-expect
				expect((error as NotFoundException).message).toContain(expectedErrorMessageFragment)
			}
		})

		// eslint-disable-next-line jest/expect-expect
		it('deletes segments before rundown', async () => {
			const mongoDb: MongoDatabase = mock(MongoDatabase)
			const mongoConverter = mock(MongoEntityConverter)
			const segmentRepository: SegmentRepository = mock<SegmentRepository>()
			const rundownId: string = 'someRundownId'
			const rundown: Rundown = createActiveRundown(rundownId)
			await testDatabase.populateDatabaseWithRundowns([rundown])
			const db: Db = testDatabase.getDatabase()
			const collection = db.collection(COLLECTION_NAME)
			const spied = spy(collection)

			when(mongoConverter.convertRundown(anything())).thenReturn(rundown)
			when(segmentRepository.getSegments(anything())).thenResolve([])
			when(mongoDb.getCollection(anything())).thenReturn(collection)
			const testee = await createTestee({
				segmentRepository: segmentRepository,
				mongoConverter: mongoConverter,
				mongoDb: mongoDb,
			})

			await testee.deleteRundown(rundownId)

			verify(segmentRepository.deleteSegments(anything())).calledBefore(spied.deleteOne(anything()))
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

	async function createTestee(params: {
		segmentRepository?: SegmentRepository
		mongoDb?: MongoDatabase
		mongoConverter?: MongoEntityConverter
	}): Promise<RundownRepository> {
		const segmentRepository: SegmentRepository = params.segmentRepository ?? mock<SegmentRepository>()
		const mongoDb: MongoDatabase = params.mongoDb ?? mock(MongoDatabase)
		const mongoConverter: MongoEntityConverter = params.mongoConverter ?? mock(MongoEntityConverter)

		return new MongoRundownRepository(instance(mongoDb), instance(mongoConverter), instance(segmentRepository))
	}
})
