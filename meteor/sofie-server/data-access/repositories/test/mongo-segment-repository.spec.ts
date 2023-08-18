import { MongoSegmentRepository } from '../mongo/mongo-segment-repository'
import { MongoDatabase } from '../mongo/mongo-database'
import { MongoEntityConverter } from '../mongo/mongo-entity-converter'
import { Db } from 'mongodb'
import { anyString, anything, instance, mock, verify, when } from 'ts-mockito'
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

	describe(`${MongoSegmentRepository.prototype.deleteSegments.name}`, () => {
		it('deletes one segment successfully', async () => {
			const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)
			const partRepository: PartRepository = mock<PartRepository>()
			const rundownId: string = 'someRundownId'
			const segment: Segment = createSegment({ rundownId: rundownId })
			await testDatabase.populateDatabaseWithSegments([segment])
			const db: Db = testDatabase.getDatabase()

			when(mongoConverter.convertSegments(anything())).thenReturn([segment])
			when(partRepository.getParts(anything())).thenResolve([])
			const testee: SegmentRepository = await createTestee(db, {
				mongoConverter: mongoConverter,
				partRepository: partRepository,
			})

			await testee.deleteSegments(rundownId)

			expect(await db.collection(COLLECTION_NAME).countDocuments()).toBe(0)
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
			const testee: SegmentRepository = await createTestee(db, {
				mongoConverter: mongoConverter,
				partRepository: partRepository,
			})

			await testee.deleteSegments(rundownId)

			expect(await db.collection(COLLECTION_NAME).countDocuments()).toBe(0)
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
			const db: Db = testDatabase.getDatabase()

			when(mongoConverter.convertSegments(anything())).thenReturn(segments)
			when(partRepository.getParts(anything())).thenResolve(parts)
			const testee: SegmentRepository = await createTestee(db, {
				mongoConverter: mongoConverter,
				partRepository: partRepository,
			})

			await testee.deleteSegments(rundownId)

			verify(partRepository.deleteParts(anyString())).times(segments.length)
		})

		it('does not deletes any segments, when nonexistent rundownId is given', async () => {
			const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)
			const nonExistingId: string = 'nonExistingId'
			const segment: Segment = createSegment({})
			await testDatabase.populateDatabaseWithSegments([segment])
			const db: Db = testDatabase.getDatabase()

			when(mongoConverter.convertSegments(anything())).thenReturn([])
			const testee: SegmentRepository = await createTestee(db, {
				mongoConverter: mongoConverter,
			})

			expect.assertions(2)
			try {
				await testee.deleteSegments(nonExistingId)
			} catch (error) {
				// It isn't conditional, as the test will fail, if not hit, due to the 'expect.assertions(2)'
				// eslint-disable-next-line jest/no-conditional-expect
				expect(error).toBeInstanceOf(DeletionFailedException)
				// eslint-disable-next-line jest/no-conditional-expect
				expect(await db.collection(COLLECTION_NAME).countDocuments()).toBe(1)
			}
		})

		it('throws exception, when nonexistent rundownId is given', async () => {
			const expectedErrorMessageFragment: string = 'Expected to delete one or more segments'
			const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)
			const nonExistingId: string = 'nonExistingId'
			const segment: Segment = createSegment({})
			await testDatabase.populateDatabaseWithSegments([segment])
			const db: Db = testDatabase.getDatabase()

			when(mongoConverter.convertSegments(anything())).thenReturn([])
			const testee: SegmentRepository = await createTestee(db, {
				mongoConverter: mongoConverter,
			})

			expect.assertions(2)
			try {
				await testee.deleteSegments(nonExistingId)
			} catch (error) {
				// It isn't conditional, as the test will fail, if not hit, due to the 'expect.assertions(2)'
				// eslint-disable-next-line jest/no-conditional-expect
				expect(error).toBeInstanceOf(DeletionFailedException)
				// eslint-disable-next-line jest/no-conditional-expect
				expect((error as DeletionFailedException).message).toContain(expectedErrorMessageFragment)
			}
		})
	})

	interface PartBuilderParams {
		id?: string
		name?: string
		rank?: number
		segmentId?: string
	}

	// TODO: Extract to Helper Class in Model layer
	function createPart(params: PartBuilderParams): Part {
		return new Part({
			id: params.id ?? 'id' + Math.random(),
			name: params.name ?? 'name' + Math.random(),
			rank: params.rank ?? Math.random(),
			segmentId: params.segmentId ?? 'segmentId' + Math.random(),
		} as PartInterface)
	}

	interface SegmentBuilderParams {
		id?: string
		name?: string
		rundownId?: string
	}

	// TODO: Extract to Helper Class in Model layer
	function createSegment(params: SegmentBuilderParams): Segment {
		return new Segment({
			id: params.id ?? 'id' + Math.random(),
			name: params.name ?? 'name' + Math.random(),
			rundownId: params.rundownId ?? 'rundownId' + Math.random(),
		} as SegmentInterface)
	}

	interface TesteeBuilderParams {
		partRepository?: PartRepository
		mongoDb?: MongoDatabase
		mongoConverter?: MongoEntityConverter
	}

	async function createTestee(db: Db, params: TesteeBuilderParams): Promise<SegmentRepository> {
		const partRepository: PartRepository = params.partRepository ?? mock<PartRepository>()
		const mongoDb: MongoDatabase = params.mongoDb ?? mock(MongoDatabase)
		const mongoConverter: MongoEntityConverter = params.mongoConverter ?? mock(MongoEntityConverter)

		when(mongoDb.getCollection(COLLECTION_NAME)).thenReturn(db.collection(COLLECTION_NAME))

		return new MongoSegmentRepository(instance(mongoDb), instance(mongoConverter), instance(partRepository))
	}
})
