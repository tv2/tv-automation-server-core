import { MongoRundownRepository } from '../mongo/mongo-rundown-repository'
import { MongoTestDatabase } from './mongo-test-database'
import { Rundown, RundownInterface } from '../../../model/entities/rundown'
import { SegmentRepository } from '../interfaces/segment-repository'
import { MongoDatabase } from '../mongo/mongo-database'
import { anyString, anything, instance, mock, spy, verify, when } from 'ts-mockito'
import { MongoEntityConverter } from '../mongo/mongo-entity-converter'
import { NotFoundException } from '../../../model/exceptions/not-found-exception'
import { Db } from 'mongodb'

const COLLECTION_NAME = 'rundowns'
describe(`${MongoRundownRepository.name}`, () => {
	const testDatabase: MongoTestDatabase = new MongoTestDatabase()
	beforeEach(async () => testDatabase.setupDatabase())
	afterEach(async () => testDatabase.teardownDatabase())

	describe(`${MongoRundownRepository.prototype.deleteRundown.name}`, () => {
		it('deletes active rundown successfully', async () => {
			const mongoConverter = mock(MongoEntityConverter)
			const segmentRepository: SegmentRepository = mock<SegmentRepository>()
			const rundownId: string = 'someRundownId'
			const activeRundown: Rundown = createRundown({ rundownId: rundownId, isRundownActive: true })
			await testDatabase.populateDatabaseWithRundowns([activeRundown])
			const db: Db = testDatabase.getDatabase()

			when(mongoConverter.convertRundown(anything())).thenReturn(activeRundown)
			when(segmentRepository.getSegments(anything())).thenResolve([])
			const testee = createTestee({
				segmentRepository: segmentRepository,
				mongoConverter: mongoConverter,
			})
			await testee.deleteRundown(rundownId)

			await expect(db.collection(COLLECTION_NAME).countDocuments()).resolves.toBe(0)
		})

		it('deletes inactive rundown successfully', async () => {
			const mongoConverter = mock(MongoEntityConverter)
			const segmentRepository: SegmentRepository = mock<SegmentRepository>()
			const rundownId: string = 'someRundownId'
			const inactiveRundown: Rundown = createRundown({ rundownId: rundownId, isRundownActive: false })
			await testDatabase.populateDatabaseWithRundowns([inactiveRundown])
			const db: Db = testDatabase.getDatabase()

			when(mongoConverter.convertRundown(anything())).thenReturn(inactiveRundown)
			when(segmentRepository.getSegments(anything())).thenResolve([])
			const testee = createTestee({
				segmentRepository: segmentRepository,
				mongoConverter: mongoConverter,
			})
			await testee.deleteRundown(rundownId)

			await expect(db.collection(COLLECTION_NAME).countDocuments()).resolves.toBe(0)
		})

		// eslint-disable-next-line jest/expect-expect
		it('calls deletion of segments', async () => {
			const mongoConverter = mock(MongoEntityConverter)
			const segmentRepository: SegmentRepository = mock<SegmentRepository>()
			const rundownId: string = 'someRundownId'
			const rundown: Rundown = createRundown({ rundownId: rundownId })
			await testDatabase.populateDatabaseWithRundowns([rundown])

			when(mongoConverter.convertRundown(anything())).thenReturn(rundown)
			when(segmentRepository.getSegments(anything())).thenResolve([])
			const testee = createTestee({
				segmentRepository: segmentRepository,
				mongoConverter: mongoConverter,
			})
			await testee.deleteRundown(rundownId)

			verify(segmentRepository.deleteSegmentsForRundown(anyString())).once()
		})

		it('does not delete, when nonexistent rundownId is given', async () => {
			const nonExistingId: string = 'nonExistingId'
			const rundown: Rundown = createRundown({})
			await testDatabase.populateDatabaseWithRundowns([rundown])
			const db: Db = testDatabase.getDatabase()

			const testee = createTestee({})
			const action = async () => testee.deleteRundown(nonExistingId)

			await expect(action).rejects.toThrow(NotFoundException)
			await expect(db.collection(COLLECTION_NAME).countDocuments()).resolves.toBe(1)
		})

		it('throws exception, when nonexistent rundownId is given', async () => {
			const expectedErrorMessageFragment: string = 'Failed to find a rundown with id'
			const nonExistingId: string = 'nonExistingId'
			const rundown: Rundown = createRundown({})
			await testDatabase.populateDatabaseWithRundowns([rundown])

			const testee = createTestee({})
			const action = async () => testee.deleteRundown(nonExistingId)

			await expect(action).rejects.toThrow(NotFoundException)
			await expect(action).rejects.toThrow(expectedErrorMessageFragment)
		})

		// eslint-disable-next-line jest/expect-expect
		it('deletes segments before rundown', async () => {
			const mongoDb: MongoDatabase = mock(MongoDatabase)
			const mongoConverter = mock(MongoEntityConverter)
			const segmentRepository: SegmentRepository = mock<SegmentRepository>()
			const rundownId: string = 'someRundownId'
			const rundown: Rundown = createRundown({ rundownId: rundownId })
			await testDatabase.populateDatabaseWithRundowns([rundown])
			const db: Db = testDatabase.getDatabase()
			const collection = db.collection(COLLECTION_NAME)
			const spied = spy(collection)

			when(mongoConverter.convertRundown(anything())).thenReturn(rundown)
			when(segmentRepository.getSegments(anything())).thenResolve([])
			when(mongoDb.getCollection(anything())).thenReturn(collection)
			const testee = createTestee({
				segmentRepository: segmentRepository,
				mongoConverter: mongoConverter,
				mongoDb: mongoDb,
			})

			await testee.deleteRundown(rundownId)

			verify(segmentRepository.deleteSegmentsForRundown(anything())).calledBefore(spied.deleteOne(anything()))
		})
	})

	// TODO: Extract to Helper Class in Model layer
	function createRundown(params: { rundownId?: string; name?: string; isRundownActive?: boolean }): Rundown {
		return new Rundown({
			id: params.rundownId ?? 'id' + Math.random(),
			name: params.name ?? 'name' + Math.random(),
			isRundownActive: params.isRundownActive ?? false,
		} as RundownInterface)
	}

	function createTestee(params: {
		segmentRepository?: SegmentRepository
		mongoDb?: MongoDatabase
		mongoConverter?: MongoEntityConverter
	}): MongoRundownRepository {
		const segmentRepository: SegmentRepository = params.segmentRepository ?? mock<SegmentRepository>()
		const mongoConverter: MongoEntityConverter = params.mongoConverter ?? mock(MongoEntityConverter)

		if (!params.mongoDb) {
			params.mongoDb = mock(MongoDatabase)
			when(params.mongoDb.getCollection(COLLECTION_NAME)).thenReturn(
				testDatabase.getDatabase().collection(COLLECTION_NAME)
			)
		}

		return new MongoRundownRepository(
			instance(params.mongoDb),
			instance(mongoConverter),
			instance(segmentRepository)
		)
	}
})
