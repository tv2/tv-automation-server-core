import { MongoSegmentRepository } from '../mongo/mongo-segment-repository'
import { MongoDatabase } from '../mongo/mongo-database'
import { MongoEntityConverter, MongoSegment } from '../mongo/mongo-entity-converter'
import { Db } from 'mongodb'
import { anyString, anything, instance, mock, spy, verify, when } from 'ts-mockito'
import { PartRepository } from '../interfaces/part-repository'
import { SegmentRepository } from '../interfaces/segment-repository'
import { Segment, SegmentInterface } from '../../../model/entities/segment'
import { MongoTestDatabase } from './mongo-test-database'
import { DeletionFailedException } from '../../../model/exceptions/deletion-failed-exception'
import { Part, PartInterface } from '../../../model/entities/part'

const COLLECTION_NAME = 'segments'

describe(`${MongoSegmentRepository.name}`, () => {
	const testDatabase: MongoTestDatabase = new MongoTestDatabase()
	beforeEach(async () => await testDatabase.setupDatabase())
	afterEach(async () => await testDatabase.teardownDatabase())

	describe(`${MongoSegmentRepository.prototype.deleteSegmentsForRundown.name}`, () => {
		it('deletes one segment successfully', async () => {
			const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)
			const partRepository: PartRepository = mock<PartRepository>()
			const rundownId: string = 'someRundownId'
			const segment: Segment = createSegment({ rundownId: rundownId })
			await testDatabase.populateDatabaseWithSegments([segment])
			const db: Db = testDatabase.getDatabase()

			when(mongoConverter.convertSegments(anything())).thenReturn([segment])
			when(partRepository.getParts(anything())).thenResolve([])
			const testee: SegmentRepository = await createCommonTestee({
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
			const segments = [
				createSegment({ rundownId: rundownId }),
				createSegment({ rundownId: rundownId }),
				createSegment({ rundownId: rundownId }),
			]
			await testDatabase.populateDatabaseWithSegments(segments)
			const db: Db = testDatabase.getDatabase()

			when(mongoConverter.convertSegments(anything())).thenReturn(segments)
			when(partRepository.getParts(anything())).thenResolve([])
			const testee: SegmentRepository = await createCommonTestee({
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
			const segments: Segment[] = [
				createSegment({ rundownId: rundownId }),
				createSegment({ rundownId: rundownId }),
			]
			const parts = [createPart({}), createPart({}), createPart({})]
			await testDatabase.populateDatabaseWithSegments(segments)

			when(mongoConverter.convertSegments(anything())).thenReturn(segments)
			when(partRepository.getParts(anything())).thenResolve(parts)
			const testee: SegmentRepository = await createCommonTestee({
				mongoConverter: mongoConverter,
				partRepository: partRepository,
			})

			await testee.deleteSegmentsForRundown(rundownId)

			verify(partRepository.deletePartsForSegment(anyString())).times(segments.length)
		})

		it('does not deletes any segments, when nonexistent rundownId is given', async () => {
			const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)
			const nonExistingId: string = 'nonExistingId'
			const segment: Segment = createSegment({})
			await testDatabase.populateDatabaseWithSegments([segment])
			const db: Db = testDatabase.getDatabase()

			when(mongoConverter.convertSegments(anything())).thenReturn([])
			const testee: SegmentRepository = await createCommonTestee({
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
			const segment: Segment = createSegment({})
			await testDatabase.populateDatabaseWithSegments([segment])

			when(mongoConverter.convertSegments(anything())).thenReturn([])
			const testee: SegmentRepository = await createCommonTestee({
				mongoConverter: mongoConverter,
			})
			const action = async () => testee.deleteSegmentsForRundown(nonExistingId)

			await expect(action).rejects.toThrow(DeletionFailedException)
			await expect(action).rejects.toThrow(expectedErrorMessageFragment)
		})

		// eslint-disable-next-line jest/expect-expect
		it('deletes parts before segments', async () => {
			const mongoDb: MongoDatabase = mock(MongoDatabase)
			const partRepository: PartRepository = mock<PartRepository>()
			const mongoConverter = mock(MongoEntityConverter)
			const rundownId: string = 'someRundownId'
			const segment: Segment = createSegment({ rundownId: rundownId })
			await testDatabase.populateDatabaseWithSegments([segment])
			const db: Db = testDatabase.getDatabase()
			const collection = db.collection(COLLECTION_NAME)
			const spied = spy(collection)

			when(mongoConverter.convertSegments(anything())).thenReturn([segment])
			when(partRepository.getParts(anything())).thenResolve([])
			when(mongoDb.getCollection(anything())).thenReturn(collection)
			const testee: SegmentRepository = await createTestee({
				mongoConverter: mongoConverter,
				mongoDb: mongoDb,
				partRepository: partRepository,
			})

			await testee.deleteSegmentsForRundown(rundownId)

			verify(partRepository.deletePartsForSegment(anything())).calledBefore(spied.deleteMany(anything()))
		})
	})

	describe(`${MongoSegmentRepository.prototype.save.name}`, () => {
		it('keeps properties intact on save', async () => {
			const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)
			const localMongoConverter: MongoEntityConverter = new MongoEntityConverter()
			const mongoDb: MongoDatabase = mock(MongoDatabase)
			const segmentBeforeSave: Segment = createSegment({})
			const db: Db = testDatabase.getDatabase()
			const collection = db.collection(COLLECTION_NAME)

			when(mongoDb.getCollection(anything())).thenReturn(collection)
			when(mongoConverter.convertToMongoSegment(anything())).thenReturn({
				_id: segmentBeforeSave.id,
				_rank: segmentBeforeSave.rank,
				externalId: '',
				isHidden: false,
				isNext: segmentBeforeSave.isNext(),
				isOnAir: segmentBeforeSave.isOnAir(),
				name: segmentBeforeSave.name,
				rundownId: segmentBeforeSave.rundownId,
			})

			const testee: SegmentRepository = await createTestee({ mongoDb: mongoDb, mongoConverter: mongoConverter })
			await testee.save(segmentBeforeSave)

			const mongoSegment: MongoSegment = (await db
				.collection(COLLECTION_NAME)
				.findOne({ _id: segmentBeforeSave.id })) as unknown as MongoSegment
			const segmentAfterSave: Segment = localMongoConverter.convertSegment(mongoSegment)

			expect(segmentBeforeSave).toEqual(segmentAfterSave)
		})
		it('has segment as not on air and saves the segment as on air', async () => {
			const id: string = 'randomId'
			const inactiveSegment: Segment = createSegment({ id: id, isOnAir: false })
			const onAirSegment: Segment = createSegment({ id: id, isOnAir: true })

			await testDatabase.populateDatabaseWithSegments([inactiveSegment])
			const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)
			const mongoDb: MongoDatabase = mock(MongoDatabase)
			const db: Db = testDatabase.getDatabase()
			const collection = db.collection(COLLECTION_NAME)

			when(mongoDb.getCollection(anything())).thenReturn(collection)
			when(mongoConverter.convertToMongoSegment(anything())).thenReturn({
				_id: onAirSegment.id,
				_rank: onAirSegment.rank,
				externalId: '',
				isHidden: false,
				isNext: onAirSegment.isNext(),
				isOnAir: onAirSegment.isOnAir(),
				name: onAirSegment.name,
				rundownId: onAirSegment.rundownId,
			})

			const testee: SegmentRepository = await createTestee({
				mongoDb: mongoDb,
				mongoConverter: mongoConverter,
			})
			await testee.save(onAirSegment)

			const result: MongoSegment = (await db
				.collection(COLLECTION_NAME)
				.findOne({ _id: id })) as unknown as MongoSegment

			expect(result.isOnAir).toBeTruthy()
		})
		it('has segment as on air and saves the segment as not on air', async () => {
			const id: string = 'randomId'
			const onAirSegment: Segment = createSegment({ id: id, isOnAir: true })
			const inactiveSegment: Segment = createSegment({ id: id, isOnAir: false })

			await testDatabase.populateDatabaseWithSegments([onAirSegment])
			const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)
			const mongoDb: MongoDatabase = mock(MongoDatabase)
			const db: Db = testDatabase.getDatabase()
			const collection = db.collection(COLLECTION_NAME)

			when(mongoDb.getCollection(anything())).thenReturn(collection)
			when(mongoConverter.convertToMongoSegment(anything())).thenReturn({
				_id: inactiveSegment.id,
				_rank: inactiveSegment.rank,
				externalId: '',
				isHidden: false,
				isNext: inactiveSegment.isNext(),
				isOnAir: inactiveSegment.isOnAir(),
				name: inactiveSegment.name,
				rundownId: inactiveSegment.rundownId,
			})

			const testee: SegmentRepository = await createTestee({
				mongoDb: mongoDb,
				mongoConverter: mongoConverter,
			})
			await testee.save(inactiveSegment)

			const result: MongoSegment = (await db
				.collection(COLLECTION_NAME)
				.findOne({ _id: id })) as unknown as MongoSegment

			expect(result.isOnAir).toBeFalsy()
		})
		it('does not have segment as next but saves the segment as next', async () => {
			const id: string = 'randomId'
			const nonQueuedSegment: Segment = createSegment({ id: id, isNext: false })
			const nextSegment: Segment = createSegment({ id: id, isNext: true })

			await testDatabase.populateDatabaseWithSegments([nonQueuedSegment])
			const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)
			const mongoDb: MongoDatabase = mock(MongoDatabase)
			const db: Db = testDatabase.getDatabase()
			const collection = db.collection(COLLECTION_NAME)

			when(mongoDb.getCollection(anything())).thenReturn(collection)
			when(mongoConverter.convertToMongoSegment(anything())).thenReturn({
				_id: nextSegment.id,
				_rank: nextSegment.rank,
				externalId: '',
				isHidden: false,
				isNext: nextSegment.isNext(),
				isOnAir: nextSegment.isOnAir(),
				name: nextSegment.name,
				rundownId: nextSegment.rundownId,
			})

			const testee: SegmentRepository = await createTestee({
				mongoDb: mongoDb,
				mongoConverter: mongoConverter,
			})
			await testee.save(nextSegment)

			const result: MongoSegment = (await db
				.collection(COLLECTION_NAME)
				.findOne({ _id: id })) as unknown as MongoSegment

			expect(result.isNext).toBeTruthy()
		})
		it('has segment as next and saves the segment as not next', async () => {
			const id: string = 'randomId'
			const nextSegment: Segment = createSegment({ id: id, isNext: true })
			const nonQueuedSegment: Segment = createSegment({ id: id, isNext: false })

			await testDatabase.populateDatabaseWithSegments([nextSegment])
			const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)
			const mongoDb: MongoDatabase = mock(MongoDatabase)
			const db: Db = testDatabase.getDatabase()
			const collection = db.collection(COLLECTION_NAME)

			when(mongoDb.getCollection(anything())).thenReturn(collection)
			when(mongoConverter.convertToMongoSegment(anything())).thenReturn({
				_id: nonQueuedSegment.id,
				_rank: nonQueuedSegment.rank,
				externalId: '',
				isHidden: false,
				isNext: nonQueuedSegment.isNext(),
				isOnAir: nonQueuedSegment.isOnAir(),
				name: nonQueuedSegment.name,
				rundownId: nonQueuedSegment.rundownId,
			})

			const testee: SegmentRepository = await createTestee({
				mongoDb: mongoDb,
				mongoConverter: mongoConverter,
			})
			await testee.save(nonQueuedSegment)

			const result: MongoSegment = (await db
				.collection(COLLECTION_NAME)
				.findOne({ _id: id })) as unknown as MongoSegment

			expect(result.isNext).toBeFalsy()
		})
	})

	// TODO: Extract to Helper Class in Model layer
	function createPart(params: { id?: string; name?: string; rank?: number; segmentId?: string }): Part {
		return new Part({
			id: params.id ?? 'id' + Math.random(),
			name: params.name ?? 'name' + Math.random(),
			rank: params.rank ?? Math.random(),
			segmentId: params.segmentId ?? 'segmentId' + Math.random(),
		} as PartInterface)
	}

	// TODO: Extract to Helper Class in Model layer
	function createSegment(params: {
		id?: string
		name?: string
		rundownId?: string
		rank?: number
		isNext?: boolean
		isOnAir?: boolean
		parts?: Part[]
	}): Segment {
		return new Segment({
			id: params.id ?? 'id' + Math.random(),
			name: params.name ?? 'name' + Math.random(),
			rundownId: params.rundownId ?? 'rundownId' + Math.random(),
			rank: params.rank ?? Math.random(),
			isNext: params.isNext ?? false,
			isOnAir: params.isOnAir ?? false,
			parts: params.parts ?? [],
		} as SegmentInterface)
	}

	interface TesteeBuilderParams {
		partRepository?: PartRepository
		mongoDb?: MongoDatabase
		mongoConverter?: MongoEntityConverter
	}

	async function createCommonTestee(params: TesteeBuilderParams): Promise<SegmentRepository> {
		const mongoDb: MongoDatabase = params.mongoDb ?? mock(MongoDatabase)

		testDatabase.applyCommonMocking(testDatabase.getDatabase(), mongoDb, COLLECTION_NAME)

		return createTestee({
			partRepository: params.partRepository,
			mongoConverter: params.mongoConverter,
			mongoDb: mongoDb,
		})
	}

	async function createTestee(params: TesteeBuilderParams): Promise<SegmentRepository> {
		const partRepository: PartRepository = params.partRepository ?? mock<PartRepository>()
		const mongoDb: MongoDatabase = params.mongoDb ?? mock(MongoDatabase)
		const mongoConverter: MongoEntityConverter = params.mongoConverter ?? mock(MongoEntityConverter)

		return new MongoSegmentRepository(instance(mongoDb), instance(mongoConverter), instance(partRepository))
	}
})
