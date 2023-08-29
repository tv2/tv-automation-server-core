import { MongoRundownRepository } from '../mongo/mongo-rundown-repository'
import { MongoTestDatabase } from './mongo-test-database'
import { Rundown, RundownInterface } from '../../../model/entities/rundown'
import { RundownRepository } from '../interfaces/rundown-repository'
import { SegmentRepository } from '../interfaces/segment-repository'
import { MongoDatabase } from '../mongo/mongo-database'
import { anyString, anything, instance, mock, spy, verify, when } from 'ts-mockito'
import { MongoEntityConverter, MongoRundown } from '../mongo/mongo-entity-converter'
import { NotFoundException } from '../../../model/exceptions/not-found-exception'
import { Db } from 'mongodb'

const COLLECTION_NAME = 'rundowns'
describe(`${MongoRundownRepository.name}`, () => {
	const testDatabase: MongoTestDatabase = new MongoTestDatabase()
	beforeEach(async () => await testDatabase.setupDatabase())
	afterEach(async () => await testDatabase.teardownDatabase())

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
			const testee = await createCommonTestee({
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
			const testee = await createCommonTestee({
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
			const testee = await createCommonTestee({
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

			const testee = await createCommonTestee({})
			const action = async () => testee.deleteRundown(nonExistingId)

			await expect(action).rejects.toThrow(NotFoundException)
			await expect(db.collection(COLLECTION_NAME).countDocuments()).resolves.toBe(1)
		})

		it('throws exception, when nonexistent rundownId is given', async () => {
			const expectedErrorMessageFragment: string = 'Failed to find a rundown with id'
			const nonExistingId: string = 'nonExistingId'
			const rundown: Rundown = createRundown({})
			await testDatabase.populateDatabaseWithRundowns([rundown])

			const testee = await createCommonTestee({})
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
			const testee = await createTestee({
				segmentRepository: segmentRepository,
				mongoConverter: mongoConverter,
				mongoDb: mongoDb,
			})

			await testee.deleteRundown(rundownId)

			verify(segmentRepository.deleteSegmentsForRundown(anything())).calledBefore(spied.deleteOne(anything()))
		})
	})

	describe(`${MongoRundownRepository.prototype.saveRundown.name}`, () => {
		it('keeps properties intact on save', async () => {
			const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)
			const localMongoConverter: MongoEntityConverter = new MongoEntityConverter()
			const mongoDb: MongoDatabase = mock(MongoDatabase)
			const rundownBeforeSave: Rundown = createRundown({})
			const db: Db = testDatabase.getDatabase()
			const collection = db.collection(COLLECTION_NAME)

			when(mongoDb.getCollection(anything())).thenReturn(collection)
			when(mongoConverter.convertToMongoRundown(anything())).thenReturn({
				_id: rundownBeforeSave.id,
				name: rundownBeforeSave.name,
				isActive: rundownBeforeSave.isActive(),
			} as MongoRundown)

			const testee: RundownRepository = await createTestee({ mongoDb: mongoDb, mongoConverter: mongoConverter })
			await testee.saveRundown(rundownBeforeSave)

			const mongoRundown: MongoRundown = (await db
				.collection(COLLECTION_NAME)
				.findOne({ _id: rundownBeforeSave.id })) as unknown as MongoRundown
			const rundownAfterSave: Rundown = localMongoConverter.convertRundown(mongoRundown)

			expect(rundownBeforeSave).toEqual(rundownAfterSave)
		})
		it('has rundown as not on air and saves the rundown as on air', async () => {
			const id: string = 'randomId'
			const inactiveRundown: Rundown = createRundown({ rundownId: id, isRundownActive: false })
			const activeRundown: Rundown = createRundown({ rundownId: id, isRundownActive: true })

			await testDatabase.populateDatabaseWithRundowns([inactiveRundown])
			const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)
			const mongoDb: MongoDatabase = mock(MongoDatabase)
			const db: Db = testDatabase.getDatabase()
			const collection = db.collection(COLLECTION_NAME)

			when(mongoDb.getCollection(anything())).thenReturn(collection)
			when(mongoConverter.convertToMongoRundown(anything())).thenReturn({
				_id: activeRundown.id,
				name: activeRundown.name,
				isActive: activeRundown.isActive(),
			} as MongoRundown)

			const testee: RundownRepository = await createTestee({
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
			const id: string = 'randomId'
			const activeRundown: Rundown = createRundown({ rundownId: id, isRundownActive: true })
			const inactiveRundown: Rundown = createRundown({ rundownId: id, isRundownActive: false })

			await testDatabase.populateDatabaseWithRundowns([activeRundown])
			const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)
			const mongoDb: MongoDatabase = mock(MongoDatabase)
			const db: Db = testDatabase.getDatabase()
			const collection = db.collection(COLLECTION_NAME)

			when(mongoDb.getCollection(anything())).thenReturn(collection)
			when(mongoConverter.convertToMongoRundown(anything())).thenReturn({
				_id: inactiveRundown.id,
				name: inactiveRundown.name,
				isActive: inactiveRundown.isActive(),
			} as MongoRundown)

			const testee: RundownRepository = await createTestee({
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
			id: params.rundownId ?? 'id' + Math.random(),
			name: params.name ?? 'name' + Math.random(),
			isRundownActive: params.isRundownActive ?? false,
		} as RundownInterface)
	}

	interface TesteeBuilderParams {
		segmentRepository?: SegmentRepository
		mongoDb?: MongoDatabase
		mongoConverter?: MongoEntityConverter
	}

	async function createCommonTestee(params: TesteeBuilderParams): Promise<RundownRepository> {
		const mongoDb: MongoDatabase = params.mongoDb ?? mock(MongoDatabase)

		testDatabase.applyCommonMocking(testDatabase.getDatabase(), mongoDb, COLLECTION_NAME)

		// Todo: figure out the syntax for unpacking the existing and only changing one. I know Anders knows it.
		return createTestee({
			segmentRepository: params.segmentRepository,
			mongoConverter: params.mongoConverter,
			mongoDb: mongoDb,
		})
	}

	async function createTestee(params: TesteeBuilderParams): Promise<RundownRepository> {
		const segmentRepository: SegmentRepository = params.segmentRepository ?? mock<SegmentRepository>()
		const mongoDb: MongoDatabase = params.mongoDb ?? mock(MongoDatabase)
		const mongoConverter: MongoEntityConverter = params.mongoConverter ?? mock(MongoEntityConverter)

		return new MongoRundownRepository(instance(mongoDb), instance(mongoConverter), instance(segmentRepository))
	}
})
