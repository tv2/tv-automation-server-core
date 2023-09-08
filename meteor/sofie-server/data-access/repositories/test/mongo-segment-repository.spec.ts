import { MongoSegmentRepository } from '../mongo/mongo-segment-repository'
import { MongoDatabase } from '../mongo/mongo-database'
import { MongoEntityConverter, MongoSegment } from '../mongo/mongo-entity-converter'
import { Db } from 'mongodb'
import { anyString, anything, instance, mock, spy, verify, when } from 'ts-mockito'
import { PartRepository } from '../interfaces/part-repository'
import { SegmentRepository } from '../interfaces/segment-repository'
import { Segment } from '../../../model/entities/segment'
import { MongoTestDatabase } from './mongo-test-database'
import { DeletionFailedException } from '../../../model/exceptions/deletion-failed-exception'
import { EntityMockFactory } from '../../../model/entities/test/entity-mock-factory'

const COLLECTION_NAME = 'segments'

describe(`${MongoSegmentRepository.name}`, () => {
	const testDatabase: MongoTestDatabase = new MongoTestDatabase()
	beforeEach(async () => testDatabase.setupDatabase())
	afterEach(async () => testDatabase.teardownDatabase())

	describe(`${MongoSegmentRepository.prototype.deleteSegmentsForRundown.name}`, () => {
		it('deletes one segment successfully', async () => {
			const db: Db = testDatabase.getDatabase()
			const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)
			const partRepository: PartRepository = mock<PartRepository>()
			const rundownId: string = 'someRundownId'
			const mongoSegment: MongoSegment = createMongoSegment({ rundownId: rundownId })
			const segment: Segment = EntityMockFactory.createSegment({ rundownId: rundownId })
			await testDatabase.populateDatabaseWithSegments([mongoSegment])

			when(mongoConverter.convertSegments(anything())).thenReturn([segment])
			when(partRepository.getParts(anything())).thenResolve([])
			const testee: SegmentRepository = createTestee({
				mongoConverter: mongoConverter,
				partRepository: partRepository,
			})

			await testee.deleteSegmentsForRundown(rundownId)

			await expect(db.collection(COLLECTION_NAME).countDocuments()).resolves.toBe(0)
		})

		it('deletes multiple segments successfully', async () => {
			const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)
			const partRepository: PartRepository = mock<PartRepository>()
			const rundownId: string = 'someRundownId'
			const mongoSegments: MongoSegment[] = [
				createMongoSegment({ rundownId: rundownId }),
				createMongoSegment({ rundownId: rundownId }),
				createMongoSegment({ rundownId: rundownId }),
			]
			const segments: Segment[] = [
				EntityMockFactory.createSegment({ rundownId: rundownId }),
				EntityMockFactory.createSegment({ rundownId: rundownId }),
				EntityMockFactory.createSegment({ rundownId: rundownId }),
			]
			await testDatabase.populateDatabaseWithSegments(mongoSegments)
			const db: Db = testDatabase.getDatabase()

			when(mongoConverter.convertSegments(anything())).thenReturn(segments)
			when(partRepository.getParts(anything())).thenResolve([])
			const testee: SegmentRepository = createTestee({
				mongoConverter: mongoConverter,
				partRepository: partRepository,
			})

			await testee.deleteSegmentsForRundown(rundownId)

			await expect(db.collection(COLLECTION_NAME).countDocuments()).resolves.toBe(0)
		})

		// eslint-disable-next-line jest/expect-expect
		it('calls deletion of parts, matching amount of segments', async () => {
			const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)
			const partRepository: PartRepository = mock<PartRepository>()
			const rundownId: string = 'someRundownId'
			const mongoSegments: MongoSegment[] = [
				createMongoSegment({ rundownId: rundownId }),
				createMongoSegment({ rundownId: rundownId }),
			]
			const segments: Segment[] = [
				EntityMockFactory.createSegment({ rundownId: rundownId }),
				EntityMockFactory.createSegment({ rundownId: rundownId }),
			]
			await testDatabase.populateDatabaseWithSegments(mongoSegments)

			when(mongoConverter.convertSegments(anything())).thenReturn(segments)
			when(partRepository.getParts(anything())).thenResolve([])
			const testee: SegmentRepository = createTestee({
				mongoConverter: mongoConverter,
				partRepository: partRepository,
			})

			await testee.deleteSegmentsForRundown(rundownId)

			verify(partRepository.deletePartsForSegment(anyString())).times(mongoSegments.length)
		})

		it('does not deletes any segments, when nonexistent rundownId is given', async () => {
			const db: Db = testDatabase.getDatabase()
			const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)
			const nonExistingId: string = 'nonExistingId'
			const mongoSegment: MongoSegment = createMongoSegment({})
			await testDatabase.populateDatabaseWithSegments([mongoSegment])

			when(mongoConverter.convertSegments(anything())).thenReturn([])
			const testee: SegmentRepository = createTestee({
				mongoConverter: mongoConverter,
			})
			const action = async () => testee.deleteSegmentsForRundown(nonExistingId)

			await expect(action).rejects.toThrow(DeletionFailedException)
			await expect(db.collection(COLLECTION_NAME).countDocuments()).resolves.toBe(1)
		})

		it('throws exception, when nonexistent rundownId is given', async () => {
			const expectedErrorMessageFragment: string = 'Expected to delete one or more segments'
			const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)
			const nonExistingId: string = 'nonExistingId'
			const mongoSegment: MongoSegment = createMongoSegment({})
			await testDatabase.populateDatabaseWithSegments([mongoSegment])

			when(mongoConverter.convertSegments(anything())).thenReturn([])
			const testee: SegmentRepository = createTestee({
				mongoConverter: mongoConverter,
			})
			const action = async () => testee.deleteSegmentsForRundown(nonExistingId)

			await expect(action).rejects.toThrow(DeletionFailedException)
			await expect(action).rejects.toThrow(expectedErrorMessageFragment)
		})

		// eslint-disable-next-line jest/expect-expect
		it('deletes parts before segments', async () => {
			const db: Db = testDatabase.getDatabase()
			const mongoDb: MongoDatabase = mock(MongoDatabase)
			const partRepository: PartRepository = mock<PartRepository>()
			const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)
			const rundownId: string = 'someRundownId'
			const mongoSegment: MongoSegment = createMongoSegment({ rundownId: rundownId })
			const segment: Segment = EntityMockFactory.createSegment({ rundownId: rundownId })
			await testDatabase.populateDatabaseWithSegments([mongoSegment])
			const collection = db.collection(COLLECTION_NAME)
			const spiedCollection = spy(collection)

			when(mongoConverter.convertSegments(anything())).thenReturn([segment])
			when(partRepository.getParts(anything())).thenResolve([])
			when(mongoDb.getCollection(anything())).thenReturn(collection)
			const testee: SegmentRepository = createTestee({
				mongoConverter: mongoConverter,
				mongoDb: mongoDb,
				partRepository: partRepository,
			})

			await testee.deleteSegmentsForRundown(rundownId)

			verify(partRepository.deletePartsForSegment(anything())).calledBefore(
				spiedCollection.deleteMany(anything())
			)
		})
	})

	describe(`${MongoSegmentRepository.prototype.saveSegment.name}`, () => {
		it('has segment as not on air and saves the segment as on air', async () => {
			const inactiveMongoSegment: MongoSegment = createMongoSegment({ _id: 'randomId', isOnAir: false })
			const onAirSegment: Segment = EntityMockFactory.createSegment({
				id: inactiveMongoSegment._id,
				isOnAir: true,
			})

			await testDatabase.populateDatabaseWithSegments([inactiveMongoSegment])
			const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)
			const mongoDb: MongoDatabase = mock(MongoDatabase)
			const db: Db = testDatabase.getDatabase()
			const collection = db.collection(COLLECTION_NAME)

			when(mongoDb.getCollection(anything())).thenReturn(collection)
			when(mongoConverter.convertToMongoSegment(anything())).thenReturn({
				_id: onAirSegment.id,
				isOnAir: onAirSegment.isOnAir(),
			} as MongoSegment)

			const testee: SegmentRepository = createTestee({
				mongoDb: mongoDb,
				mongoConverter: mongoConverter,
			})
			await testee.saveSegment(onAirSegment)

			const result: MongoSegment = (await db
				.collection(COLLECTION_NAME)
				.findOne({ _id: onAirSegment.id })) as unknown as MongoSegment

			expect(result.isOnAir).toBeTruthy()
		})

		it('has segment as on air and saves the segment as not on air', async () => {
			const onAirMongoSegment: MongoSegment = createMongoSegment({ _id: 'randomId', isOnAir: true })
			const inactiveSegment: Segment = EntityMockFactory.createSegment({
				id: onAirMongoSegment._id,
				isOnAir: false,
			})

			await testDatabase.populateDatabaseWithSegments([onAirMongoSegment])
			const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)
			const mongoDb: MongoDatabase = mock(MongoDatabase)
			const db: Db = testDatabase.getDatabase()
			const collection = db.collection(COLLECTION_NAME)

			when(mongoDb.getCollection(anything())).thenReturn(collection)
			when(mongoConverter.convertToMongoSegment(anything())).thenReturn({
				_id: inactiveSegment.id,
				isOnAir: inactiveSegment.isOnAir(),
			} as MongoSegment)

			const testee: SegmentRepository = createTestee({
				mongoDb: mongoDb,
				mongoConverter: mongoConverter,
			})
			await testee.saveSegment(inactiveSegment)

			const result: MongoSegment = (await db
				.collection(COLLECTION_NAME)
				.findOne({ _id: inactiveSegment.id })) as unknown as MongoSegment

			expect(result.isOnAir).toBeFalsy()
		})

		it('does not have segment as next but saves the segment as next', async () => {
			const nonQueuedMongoSegment: MongoSegment = createMongoSegment({ _id: 'randomId', isNext: false })
			const nextSegment: Segment = EntityMockFactory.createSegment({
				id: nonQueuedMongoSegment._id,
				isNext: true,
			})

			await testDatabase.populateDatabaseWithSegments([nonQueuedMongoSegment])
			const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)
			const mongoDb: MongoDatabase = mock(MongoDatabase)
			const db: Db = testDatabase.getDatabase()
			const collection = db.collection(COLLECTION_NAME)

			when(mongoDb.getCollection(anything())).thenReturn(collection)
			when(mongoConverter.convertToMongoSegment(anything())).thenReturn({
				_id: nextSegment.id,
				isNext: nextSegment.isNext(),
			} as MongoSegment)

			const testee: SegmentRepository = createTestee({
				mongoDb: mongoDb,
				mongoConverter: mongoConverter,
			})
			await testee.saveSegment(nextSegment)

			const result: MongoSegment = (await db
				.collection(COLLECTION_NAME)
				.findOne({ _id: nextSegment.id })) as unknown as MongoSegment

			expect(result.isNext).toBeTruthy()
		})

		it('has segment as next and saves the segment as no longer next', async () => {
			const nextMongoSegment: MongoSegment = createMongoSegment({ _id: 'randomId', isNext: true })
			const nonQueuedSegment: Segment = EntityMockFactory.createSegment({
				id: nextMongoSegment._id,
				isNext: false,
			})

			await testDatabase.populateDatabaseWithSegments([nextMongoSegment])
			const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)
			const mongoDb: MongoDatabase = mock(MongoDatabase)
			const db: Db = testDatabase.getDatabase()
			const collection = db.collection(COLLECTION_NAME)

			when(mongoDb.getCollection(anything())).thenReturn(collection)
			when(mongoConverter.convertToMongoSegment(anything())).thenReturn({
				_id: nonQueuedSegment.id,
				isNext: nonQueuedSegment.isNext(),
			} as MongoSegment)

			const testee: SegmentRepository = createTestee({
				mongoDb: mongoDb,
				mongoConverter: mongoConverter,
			})
			await testee.saveSegment(nonQueuedSegment)

			const result: MongoSegment = (await db
				.collection(COLLECTION_NAME)
				.findOne({ _id: nonQueuedSegment.id })) as unknown as MongoSegment

			expect(result.isNext).toBeFalsy()
		})
	})

	function createMongoSegment(mongoSegmentInterface?: Partial<MongoSegment>): MongoSegment {
		return {
			_id: mongoSegmentInterface?._id ?? 'id' + Math.random(),
			name: mongoSegmentInterface?.name ?? 'segmentName',
			rundownId: mongoSegmentInterface?.rundownId ?? 'rundownId' + Math.random() * 10,
		} as MongoSegment
	}

	function createTestee(params: {
		partRepository?: PartRepository
		mongoDb?: MongoDatabase
		mongoConverter?: MongoEntityConverter
	}): MongoSegmentRepository {
		const partRepository: PartRepository = params.partRepository ?? mock<PartRepository>()
		const mongoConverter: MongoEntityConverter = params.mongoConverter ?? mock(MongoEntityConverter)

		if (!params.mongoDb) {
			params.mongoDb = mock(MongoDatabase)
			when(params.mongoDb.getCollection(COLLECTION_NAME)).thenReturn(
				testDatabase.getDatabase().collection(COLLECTION_NAME)
			)
		}

		return new MongoSegmentRepository(instance(params.mongoDb), instance(mongoConverter), instance(partRepository))
	}
})
