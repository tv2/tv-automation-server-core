import { MongoPartRepository } from '../mongo/mongo-part-repository'
import { Db, ObjectId } from 'mongodb'
import { MongoEntityConverter, MongoPart } from '../mongo/mongo-entity-converter'
import { PartRepository } from '../interfaces/part-repository'
import { MongoDatabase } from '../mongo/mongo-database'
import { anyString, anything, instance, mock, spy, verify, when } from 'ts-mockito'
import { MongoTestDatabase } from './mongo-test-database'
import { PieceRepository } from '../interfaces/piece-repository'
import { DeletionFailedException } from '../../../model/exceptions/deletion-failed-exception'
import { EntityMockFactory } from '../../../model/entities/test/entity-mock-factory'
import { Part } from '../../../model/entities/part'

const COLLECTION_NAME = 'parts'

describe(`${MongoPartRepository.name}`, () => {
	const testDatabase: MongoTestDatabase = new MongoTestDatabase()
	beforeEach(async () => testDatabase.setupDatabase())
	afterEach(async () => testDatabase.teardownDatabase())

	describe(`${MongoPartRepository.prototype.deletePartsForSegment.name}`, () => {
		it('deletes one part successfully', async () => {
			const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)
			const segmentId: string = 'someSegmentId'
			const part: MongoPart = createMongoPart({ segmentId: segmentId })
			const entityPart: Part = EntityMockFactory.createPart({ segmentId: segmentId })
			await testDatabase.populateDatabaseWithParts([part])
			const db: Db = testDatabase.getDatabase()

			when(mongoConverter.convertParts(anything())).thenReturn([entityPart])
			const testee: PartRepository = createTestee({
				mongoConverter: mongoConverter,
			})

			await testee.deletePartsForSegment(segmentId)

			await expect(db.collection(COLLECTION_NAME).countDocuments()).resolves.toBe(0)
		})

		it('deletes multiple parts successfully', async () => {
			const db: Db = testDatabase.getDatabase()
			const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)
			const segmentId: string = 'someSegmentId'
			const mongoParts: MongoPart[] = [
				createMongoPart({ segmentId: segmentId }),
				createMongoPart({ segmentId: segmentId }),
			]
			const parts: Part[] = [
				EntityMockFactory.createPart({ segmentId: segmentId }),
				EntityMockFactory.createPart({ segmentId: segmentId }),
			]
			await testDatabase.populateDatabaseWithParts(mongoParts)

			when(mongoConverter.convertParts(anything())).thenReturn(parts)
			const testee: PartRepository = createTestee({
				mongoConverter: mongoConverter,
			})

			await testee.deletePartsForSegment(segmentId)

			await expect(db.collection(COLLECTION_NAME).countDocuments()).resolves.toBe(0)
		})

		// eslint-disable-next-line jest/expect-expect
		it('calls deletion of pieces, matching amount of parts', async () => {
			const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)
			const pieceRepository: PieceRepository = mock<PieceRepository>()
			const segmentId: string = 'someSegmentId'
			const mongoParts: MongoPart[] = [
				createMongoPart({ segmentId: segmentId }),
				createMongoPart({ segmentId: segmentId }),
			]
			const parts: Part[] = [
				EntityMockFactory.createPart({ segmentId: segmentId }),
				EntityMockFactory.createPart({ segmentId: segmentId }),
			]
			await testDatabase.populateDatabaseWithParts(mongoParts)

			when(mongoConverter.convertParts(anything())).thenReturn(parts)
			when(pieceRepository.getPieces(anything())).thenResolve([])
			const testee: PartRepository = createTestee({
				mongoConverter: mongoConverter,
				pieceRepository: pieceRepository,
			})

			await testee.deletePartsForSegment(segmentId)

			verify(pieceRepository.deletePiecesForPart(anyString())).times(mongoParts.length)
		})

		it('throws exception, when nonexistent segmentId is given', async () => {
			const expectedErrorMessageFragment: string = 'Expected to delete one or more parts'
			const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)
			const nonExistingId: string = 'nonExistingId'
			const mongoPart: MongoPart = createMongoPart({})
			await testDatabase.populateDatabaseWithParts([mongoPart])

			when(mongoConverter.convertParts(anything())).thenReturn([])
			const testee: PartRepository = createTestee({
				mongoConverter: mongoConverter,
			})

			const action = async () => testee.deletePartsForSegment(nonExistingId)

			await expect(action).rejects.toThrow(DeletionFailedException)
			await expect(action).rejects.toThrow(expectedErrorMessageFragment)
		})

		it('does not deletes any pieces, when nonexistent segmentId is given', async () => {
			const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)
			const nonExistingId: string = 'nonExistingId'
			const mongoPart: MongoPart = createMongoPart({})
			await testDatabase.populateDatabaseWithParts([mongoPart])
			const db = testDatabase.getDatabase()

			when(mongoConverter.convertParts(anything())).thenReturn([])
			const testee = createTestee({
				mongoConverter: mongoConverter,
			})
			const action = async () => testee.deletePartsForSegment(nonExistingId)

			await expect(action).rejects.toThrow(DeletionFailedException)
			await expect(db.collection(COLLECTION_NAME).countDocuments()).resolves.toBe(1)
		})

		// eslint-disable-next-line jest/expect-expect
		it('deletes pieces before parts', async () => {
			const mongoDb: MongoDatabase = mock(MongoDatabase)
			const pieceRepository: PieceRepository = mock<PieceRepository>()
			const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)
			const segmentId: string = 'someSegmentId'
			const mongoPart: MongoPart = createMongoPart({ segmentId: segmentId })
			const part: Part = EntityMockFactory.createPart({ segmentId: segmentId })
			await testDatabase.populateDatabaseWithParts([mongoPart])
			const db: Db = testDatabase.getDatabase()
			const collection = db.collection(COLLECTION_NAME)
			const spiedCollection = spy(collection)

			when(mongoConverter.convertParts(anything())).thenReturn([part])
			when(pieceRepository.getPieces(anything())).thenResolve([])
			when(mongoDb.getCollection(anything())).thenReturn(collection)
			const testee: PartRepository = createTestee({
				mongoConverter: mongoConverter,
				mongoDb: mongoDb,
				pieceRepository: pieceRepository,
			})

			await testee.deletePartsForSegment(segmentId)

			verify(pieceRepository.deletePiecesForPart(anything())).calledBefore(spiedCollection.deleteMany(anything()))
		})
	})

	function createMongoPart(mongoPartInterface?: Partial<MongoPart>): MongoPart {
		return {
			_id: mongoPartInterface?._id ?? new ObjectId(),
			title: mongoPartInterface?.title ?? 'partTitle',
			_rank: mongoPartInterface?._rank ?? Math.random() * 100,
			segmentId: mongoPartInterface?.segmentId ?? 'segmentId' + Math.random() * 10,
		} as MongoPart
	}

	function createTestee(params: {
		pieceRepository?: PieceRepository
		mongoDb?: MongoDatabase
		mongoConverter?: MongoEntityConverter
	}): MongoPartRepository {
		const pieceRepository: PieceRepository = params.pieceRepository ?? mock<PieceRepository>()
		const mongoConverter: MongoEntityConverter = params.mongoConverter ?? mock(MongoEntityConverter)

		if (!params.mongoDb) {
			params.mongoDb = mock(MongoDatabase)
			when(params.mongoDb.getCollection(COLLECTION_NAME)).thenReturn(
				testDatabase.getDatabase().collection(COLLECTION_NAME)
			)
		}

		return new MongoPartRepository(instance(params.mongoDb), instance(mongoConverter), instance(pieceRepository))
	}
})
