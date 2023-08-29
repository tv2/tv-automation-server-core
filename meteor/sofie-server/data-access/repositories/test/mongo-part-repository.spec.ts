import { MongoPartRepository } from '../mongo/mongo-part-repository'
import { Part, PartInterface } from '../../../model/entities/part'
import { Db } from 'mongodb'
import { MongoEntityConverter } from '../mongo/mongo-entity-converter'
import { PartRepository } from '../interfaces/part-repository'
import { MongoDatabase } from '../mongo/mongo-database'
import { anyString, anything, instance, mock, spy, verify, when } from 'ts-mockito'
import { MongoTestDatabase } from './mongo-test-database'
import { PieceRepository } from '../interfaces/piece-repository'
import { Piece, PieceInterface } from '../../../model/entities/piece'
import { DeletionFailedException } from '../../../model/exceptions/deletion-failed-exception'

const COLLECTION_NAME = 'parts'

describe(`${MongoPartRepository.name}`, () => {
	const testDatabase: MongoTestDatabase = new MongoTestDatabase()
	beforeEach(async () => testDatabase.setupDatabase())
	afterEach(async () => testDatabase.teardownDatabase())

	describe(`${MongoPartRepository.prototype.deletePartsForSegment.name}`, () => {
		it('deletes one part successfully', async () => {
			const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)
			const segmentId: string = 'someSegmentId'
			const part: Part = createPart({ segmentId: segmentId })
			await testDatabase.populateDatabaseWithParts([part])
			const db: Db = testDatabase.getDatabase()

			when(mongoConverter.convertParts(anything())).thenReturn([part])
			const testee: PartRepository = createTestee({
				mongoConverter: mongoConverter,
			})

			await testee.deletePartsForSegment(segmentId)

			await expect(db.collection(COLLECTION_NAME).countDocuments()).resolves.toBe(0)
		})

		it('deletes multiple parts successfully', async () => {
			const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)
			const segmentId: string = 'someSegmentId'
			const parts: Part[] = [createPart({ segmentId: segmentId }), createPart({ segmentId: segmentId })]
			await testDatabase.populateDatabaseWithParts(parts)
			const db: Db = testDatabase.getDatabase()

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
			const parts: Part[] = [createPart({ segmentId: segmentId }), createPart({ segmentId: segmentId })]
			const pieces: Piece[] = [createPiece({}), createPiece({}), createPiece({})]
			await testDatabase.populateDatabaseWithParts(parts)

			when(mongoConverter.convertParts(anything())).thenReturn(parts)
			when(pieceRepository.getPieces(anything())).thenResolve(pieces)
			const testee: PartRepository = createTestee({
				mongoConverter: mongoConverter,
				pieceRepository: pieceRepository,
			})

			await testee.deletePartsForSegment(segmentId)

			verify(pieceRepository.deletePiecesForPart(anyString())).times(parts.length)
		})

		it('throws exception, when nonexistent segmentId is given', async () => {
			const expectedErrorMessageFragment: string = 'Expected to delete one or more parts'
			const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)
			const nonExistingId: string = 'nonExistingId'
			const part: Part = createPart({})
			await testDatabase.populateDatabaseWithParts([part])

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
			const part = createPart({})
			await testDatabase.populateDatabaseWithParts([part])
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
			const mongoConverter = mock(MongoEntityConverter)
			const segmentId: string = 'someSegmentId'
			const part: Part = createPart({ segmentId: segmentId })
			await testDatabase.populateDatabaseWithParts([part])
			const db: Db = testDatabase.getDatabase()
			const collection = db.collection(COLLECTION_NAME)
			const spied = spy(collection)

			when(mongoConverter.convertParts(anything())).thenReturn([part])
			when(pieceRepository.getPieces(anything())).thenResolve([])
			when(mongoDb.getCollection(anything())).thenReturn(collection)
			const testee: PartRepository = createTestee({
				mongoConverter: mongoConverter,
				mongoDb: mongoDb,
				pieceRepository: pieceRepository,
			})

			await testee.deletePartsForSegment(segmentId)

			verify(pieceRepository.deletePiecesForPart(anything())).calledBefore(spied.deleteMany(anything()))
		})
	})

	// TODO: Extract to Helper Class in Model layer
	function createPiece(params: { id?: string; name?: string; partId?: string }): Piece {
		return new Piece({
			id: params.id ?? testDatabase.getValidObjectIdString('id'),
			name: params.name ?? 'name' + Math.random(),
			partId: params.partId ?? 'segmentId' + Math.random(),
		} as PieceInterface)
	}

	// TODO: Extract to Helper Class in Model layer
	function createPart(params: { id?: string; name?: string; rank?: number; segmentId?: string }): Part {
		return new Part({
			id: params.id ?? testDatabase.getValidObjectIdString('id'),
			name: params.name ?? 'name' + Math.random(),
			rank: params.rank ?? Math.random(),
			segmentId: params.segmentId ?? 'segmentId' + Math.random(),
		} as PartInterface)
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
