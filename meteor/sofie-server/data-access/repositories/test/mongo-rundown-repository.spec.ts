import { MongoRundownRepository } from '../mongo/mongo-rundown-repository'
import { MongoTestDatabase } from './mongo-test-database'
import { Rundown, RundownInterface } from '../../../model/entities/rundown'
import { SegmentRepository } from '../interfaces/segment-repository'
import { MongoDatabase } from '../mongo/mongo-database'
import { anyString, anything, instance, mock, spy, verify, when } from 'ts-mockito'
import { MongoEntityConverter, MongoRundown } from '../mongo/mongo-entity-converter'
import { NotFoundException } from '../../../model/exceptions/not-found-exception'
import { Db, ObjectId } from 'mongodb'
import { RundownRepository } from '../interfaces/rundown-repository'

const COLLECTION_NAME = 'rundowns'
describe(`${MongoRundownRepository.name}`, () => {
	const testDatabase: MongoTestDatabase = new MongoTestDatabase()
	beforeEach(async () => testDatabase.setupDatabase())
	afterEach(async () => testDatabase.teardownDatabase())

	describe(`${MongoRundownRepository.prototype.deleteRundown.name}`, () => {
		it('deletes active rundown successfully', async () => {
			const mongoConverter = mock(MongoEntityConverter)
			const segmentRepository: SegmentRepository = mock<SegmentRepository>()
			const rundownId: string = testDatabase.getValidObjectIdString('someRundownId')
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
			const rundownId: string = testDatabase.getValidObjectIdString('someRundownId')
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
			const rundownId: string = testDatabase.getValidObjectIdString('someRundownId')
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
			const nonExistingId: string = testDatabase.getValidObjectIdString('nonExistingId')
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
			const nonExistingId: string = testDatabase.getValidObjectIdString('nonExistingId')
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
			const rundownId: string = testDatabase.getValidObjectIdString('someRundownId')
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

	describe(`${MongoRundownRepository.prototype.saveRundown.name}`, () => {
		it('has rundown as not on air and saves the rundown as on air', async () => {
			const id: string = testDatabase.getValidObjectIdString('rundownId')
			const inactiveRundown: Rundown = createRundown({ rundownId: id, isRundownActive: false })
			const activeRundown: Rundown = createRundown({ rundownId: id, isRundownActive: true })

			await testDatabase.populateDatabaseWithRundowns([inactiveRundown])
			const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)
			const mongoDb: MongoDatabase = mock(MongoDatabase)
			const db: Db = testDatabase.getDatabase()
			const collection = db.collection(COLLECTION_NAME)

			when(mongoDb.getCollection(anything())).thenReturn(collection)
			when(mongoConverter.convertToMongoRundown(anything())).thenReturn({
				_id: new ObjectId(activeRundown.id),
				name: activeRundown.name,
				isActive: activeRundown.isActive(),
			} as MongoRundown)

			const testee: RundownRepository = createTestee({
				mongoDb: mongoDb,
				mongoConverter: mongoConverter,
			})
			await testee.saveRundown(activeRundown)

			const result: MongoRundown = (await db
				.collection(COLLECTION_NAME)
				.findOne({ _id: id })) as unknown as MongoRundown

			expect(result.isActive).toBeTruthy()
		})

		it('has rundown as on air and saves the rundown as not on air', async () => {
			const id: string = testDatabase.getValidObjectIdString('rundownId')
			const activeRundown: Rundown = createRundown({ rundownId: id, isRundownActive: true })
			const inactiveRundown: Rundown = createRundown({ rundownId: id, isRundownActive: false })

			await testDatabase.populateDatabaseWithRundowns([activeRundown])
			const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)
			const mongoDb: MongoDatabase = mock(MongoDatabase)
			const db: Db = testDatabase.getDatabase()
			const collection = db.collection(COLLECTION_NAME)

			when(mongoDb.getCollection(anything())).thenReturn(collection)
			when(mongoConverter.convertToMongoRundown(anything())).thenReturn({
				_id: new ObjectId(inactiveRundown.id),
				name: inactiveRundown.name,
				isActive: inactiveRundown.isActive(),
			} as MongoRundown)

			const testee: RundownRepository = createTestee({
				mongoDb: mongoDb,
				mongoConverter: mongoConverter,
			})
			await testee.saveRundown(inactiveRundown)

			const result: MongoRundown = (await db
				.collection(COLLECTION_NAME)
				.findOne({ _id: id })) as unknown as MongoRundown

			expect(result.isActive).toBeFalsy()
		})
	})

	// TODO: Extract to Helper Class in Model layer
	function createRundown(params: { rundownId?: string; name?: string; isRundownActive?: boolean }): Rundown {
		return new Rundown({
			id: params.rundownId ?? testDatabase.getValidObjectIdString('id'),
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
