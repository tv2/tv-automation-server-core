import { MongoRundownRepository } from '../mongo/mongo-rundown-repository'
import { MongoTestDatabase } from './mongo-test-database'
import { SegmentRepository } from '../interfaces/segment-repository'
import { MongoDatabase } from '../mongo/mongo-database'
import { anyString, anything, instance, mock, spy, verify, when } from 'ts-mockito'
import { MongoEntityConverter, MongoRundown } from '../mongo/mongo-entity-converter'
import { NotFoundException } from '../../../model/exceptions/not-found-exception'
import { Db } from 'mongodb'
import { RundownBaselineRepository } from '../interfaces/rundown-baseline-repository'
import { RundownRepository } from '../interfaces/rundown-repository'
import { Rundown } from '../../../model/entities/rundown'
import { EntityMockFactory } from '../../../model/entities/test/entity-mock-factory'

const COLLECTION_NAME = 'rundowns'
describe(`${MongoRundownRepository.name}`, () => {
	const testDatabase: MongoTestDatabase = new MongoTestDatabase()
	beforeEach(async () => testDatabase.setupDatabase())
	afterEach(async () => testDatabase.teardownDatabase())

	describe(`${MongoRundownRepository.prototype.deleteRundown.name}`, () => {
		it('deletes active rundown successfully', async () => {
			const db: Db = testDatabase.getDatabase()
			const rundownId: string = 'someRundownId'
			const mongoRundown: MongoRundown = createMongoRundown({
				_id: rundownId,
			})
			await testDatabase.populateDatabaseWithActiveRundowns([mongoRundown])
			const testee: RundownRepository = createTestee({})

			await expect(db.collection(COLLECTION_NAME).findOne({ _id: rundownId })).resolves.not.toBeNull()
			await testee.deleteRundown(rundownId)
			await expect(db.collection(COLLECTION_NAME).findOne({ _id: rundownId })).resolves.toBeNull()
		})

		it('deletes inactive rundown successfully', async () => {
			const db: Db = testDatabase.getDatabase()
			const rundownId: string = 'someRundownId'
			const mongoRundown: MongoRundown = createMongoRundown({
				_id: rundownId,
			})
			await testDatabase.populateDatabaseWithInactiveRundowns([mongoRundown])
			const testee: MongoRundownRepository = createTestee({})

			await expect(db.collection(COLLECTION_NAME).findOne({ _id: rundownId })).resolves.not.toBeNull()
			await testee.deleteRundown(rundownId)
			await expect(db.collection(COLLECTION_NAME).findOne({ _id: rundownId })).resolves.toBeNull()
		})

		// eslint-disable-next-line jest/expect-expect
		it('calls deletion of segments', async () => {
			const segmentRepository: SegmentRepository = mock<SegmentRepository>()
			const rundownId: string = 'someRundownId'
			const mongoRundown: MongoRundown = createMongoRundown({
				_id: rundownId,
			})
			await testDatabase.populateDatabaseWithInactiveRundowns([mongoRundown])
			const testee: MongoRundownRepository = createTestee({
				segmentRepository: segmentRepository,
			})

			await testee.deleteRundown(rundownId)

			verify(segmentRepository.deleteSegmentsForRundown(anyString())).once()
		})

		it('does not delete, when nonexistent rundownId is given', async () => {
			const nonExistingId: string = 'nonExistingId'
			const rundownName: string = 'someName'
			const mongoRundown: MongoRundown = createMongoRundown({ name: rundownName })
			await testDatabase.populateDatabaseWithInactiveRundowns([mongoRundown])
			const db: Db = testDatabase.getDatabase()

			const testee: MongoRundownRepository = createTestee({})
			const action = async () => testee.deleteRundown(nonExistingId)

			await expect(action).rejects.toThrow(NotFoundException)
			await expect(db.collection(COLLECTION_NAME).countDocuments()).resolves.toBe(1)
			await expect(db.collection(COLLECTION_NAME).findOne({ name: rundownName })).resolves.not.toBeNull()
		})

		it('throws exception, when nonexistent rundownId is given', async () => {
			const nonExistingId: string = 'nonExistingId'
			const rundownName: string = 'someName'
			const mongoRundown: MongoRundown = createMongoRundown({ name: rundownName })
			await testDatabase.populateDatabaseWithInactiveRundowns([mongoRundown])
			const db: Db = testDatabase.getDatabase()

			const testee: MongoRundownRepository = createTestee({})
			const action = async () => testee.deleteRundown(nonExistingId)

			await expect(action).rejects.toThrow(NotFoundException)
			await expect(db.collection(COLLECTION_NAME).findOne({ name: rundownName })).resolves.not.toBeNull()
		})

		// eslint-disable-next-line jest/expect-expect
		it('deletes segments before rundown', async () => {
			const segmentRepository: SegmentRepository = mock<SegmentRepository>()
			const mongoDb: MongoDatabase = mock(MongoDatabase)
			const rundownId: string = 'someRundownId'
			const mongoRundown: MongoRundown = createMongoRundown({
				_id: rundownId,
			})
			await testDatabase.populateDatabaseWithInactiveRundowns([mongoRundown])
			const db: Db = testDatabase.getDatabase()
			const collection = db.collection(COLLECTION_NAME)
			const spiedCollection = spy(collection)

			when(mongoDb.getCollection(anything())).thenReturn(collection)
			const testee: MongoRundownRepository = createTestee({
				mongoDb: mongoDb,
				segmentRepository: segmentRepository,
			})

			await testee.deleteRundown(rundownId)

			verify(segmentRepository.deleteSegmentsForRundown(anything())).calledBefore(
				spiedCollection.deleteOne(anything())
			)
		})
	})

	describe(`${MongoRundownRepository.prototype.saveRundown.name}`, () => {
		it('has rundown as not on air and saves the rundown as on air', async () => {
			const inactiveMongoRundown: MongoRundown = createMongoRundown({
				_id: 'rundownId',
			})
			const activeRundown: Rundown = EntityMockFactory.createRundown({
				id: inactiveMongoRundown._id,
				isRundownActive: true,
			})
			await testDatabase.populateDatabaseWithInactiveRundowns([inactiveMongoRundown])

			const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)
			const mongoDb: MongoDatabase = mock(MongoDatabase)
			const db: Db = testDatabase.getDatabase()
			const collection = db.collection(COLLECTION_NAME)

			when(mongoDb.getCollection(anything())).thenReturn(collection)
			when(mongoConverter.convertToMongoRundown(anything())).thenReturn({
				_id: activeRundown.id,
				isActive: activeRundown.isActive(),
			} as unknown as MongoRundown)

			const testee: RundownRepository = createTestee({
				mongoDb: mongoDb,
				mongoConverter: mongoConverter,
			})
			await testee.saveRundown(activeRundown)

			const result: MongoRundown = (await db
				.collection(COLLECTION_NAME)
				.findOne({ _id: activeRundown.id })) as unknown as MongoRundown
			expect(result.isActive).toBeTruthy()
		})

		it('has rundown as on air and saves the rundown as not on air', async () => {
			const activeMongoRundown: MongoRundown = createMongoRundown({ _id: 'rundownId' })
			const inactiveRundown: Rundown = EntityMockFactory.createRundown({
				id: activeMongoRundown._id,
				isRundownActive: false,
			})
			await testDatabase.populateDatabaseWithActiveRundowns([activeMongoRundown])

			const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)
			const mongoDb: MongoDatabase = mock(MongoDatabase)
			const db: Db = testDatabase.getDatabase()
			const collection = db.collection(COLLECTION_NAME)

			when(mongoDb.getCollection(anything())).thenReturn(collection)
			when(mongoConverter.convertToMongoRundown(anything())).thenReturn({
				_id: inactiveRundown.id,
				isActive: inactiveRundown.isActive(),
			} as unknown as MongoRundown)

			const testee: RundownRepository = createTestee({
				mongoDb: mongoDb,
				mongoConverter: mongoConverter,
			})
			await testee.saveRundown(inactiveRundown)

			const result: MongoRundown = (await db
				.collection(COLLECTION_NAME)
				.findOne({ _id: inactiveRundown.id })) as unknown as MongoRundown
			expect(result.isActive).toBeFalsy()
		})
	})

	function createMongoRundown(mongoRundownInterface?: Partial<MongoRundown>): MongoRundown {
		return {
			_id: mongoRundownInterface?._id ?? 'id' + Math.random(),
			name: mongoRundownInterface?.name ?? 'rundownName',
		} as MongoRundown
	}

	function createTestee(params: {
		segmentRepository?: SegmentRepository
		mongoDb?: MongoDatabase
		mongoConverter?: MongoEntityConverter
		baselineRepository?: RundownBaselineRepository
	}): MongoRundownRepository {
		const segmentRepository: SegmentRepository = params.segmentRepository ?? mock<SegmentRepository>()
		const mongoConverter: MongoEntityConverter = params.mongoConverter ?? mock(MongoEntityConverter)
		const baselineRepository: RundownBaselineRepository =
			params.baselineRepository ?? mock<RundownBaselineRepository>()

		if (!params.mongoDb) {
			params.mongoDb = mock(MongoDatabase)
			when(params.mongoDb.getCollection(COLLECTION_NAME)).thenReturn(
				testDatabase.getDatabase().collection(COLLECTION_NAME)
			)
		}

		return new MongoRundownRepository(
			instance(params.mongoDb),
			instance(mongoConverter),
			instance(baselineRepository),
			instance(segmentRepository)
		)
	}
})
