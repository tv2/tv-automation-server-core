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
	beforeEach(async () => await testDatabase.setupDatabase())
	afterEach(async () => await testDatabase.teardownDatabase())

	describe(`${MongoPartRepository.prototype.deleteSegmentParts.name}`, () => {
		it('deletes one part successfully', async () => {
			const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)
			const segmentId: string = 'someSegmentId'
			const part: Part = createPart({ segmentId: segmentId })
			await testDatabase.populateDatabaseWithParts([part])
			const db: Db = testDatabase.getDatabase()

			when(mongoConverter.convertParts(anything())).thenReturn([part])
			const testee: PartRepository = await createCommonTestee({
				mongoConverter: mongoConverter,
			})

			await testee.deleteSegmentParts(segmentId)

			await expect(db.collection(COLLECTION_NAME).countDocuments()).resolves.toBe(0)
		})

		it('deletes multiple parts successfully', async () => {
			const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)
			const segmentId: string = 'someSegmentId'
			const parts: Part[] = [createPart({ segmentId: segmentId }), createPart({ segmentId: segmentId })]
			await testDatabase.populateDatabaseWithParts(parts)
			const db: Db = testDatabase.getDatabase()

			when(mongoConverter.convertParts(anything())).thenReturn(parts)
			const testee: PartRepository = await createCommonTestee({
				mongoConverter: mongoConverter,
			})

			await testee.deleteSegmentParts(segmentId)

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
			const testee: PartRepository = await createCommonTestee({
				mongoConverter: mongoConverter,
				pieceRepository: pieceRepository,
			})

			await testee.deleteSegmentParts(segmentId)

			verify(pieceRepository.deletePartPieces(anyString())).times(parts.length)
		})

		it('throws exception, when nonexistent segmentId is given', async () => {
			const expectedErrorMessageFragment: string = 'Expected to delete one or more parts'
			const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)
			const nonExistingId: string = 'nonExistingId'
			const part: Part = createPart({})
			await testDatabase.populateDatabaseWithParts([part])

			when(mongoConverter.convertParts(anything())).thenReturn([])
			const testee: PartRepository = await createCommonTestee({
				mongoConverter: mongoConverter,
			})

			const action = async () => testee.deleteSegmentParts(nonExistingId)

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
			const testee = await createCommonTestee({
				mongoConverter: mongoConverter,
			})
			const action = async () => testee.deleteSegmentParts(nonExistingId)

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
			const testee: PartRepository = await createTestee({
				mongoConverter: mongoConverter,
				mongoDb: mongoDb,
				pieceRepository: pieceRepository,
			})

			await testee.deleteSegmentParts(segmentId)

			verify(pieceRepository.deletePartPieces(anything())).calledBefore(spied.deleteMany(anything()))
		})
	})

	// TODO: Extract to Helper Class in Model layer
	function createPiece(params: { id?: string; name?: string; partId?: string }): Piece {
		return new Piece({
			id: params.id ?? 'id' + Math.random(),
			name: params.name ?? 'name' + Math.random(),
			partId: params.partId ?? 'segmentId' + Math.random(),
		} as PieceInterface)
	}

	// TODO: Extract to Helper Class in Model layer
	function createPart(params: { id?: string; name?: string; rank?: number; segmentId?: string }): Part {
		return new Part({
			id: params.id ?? 'id' + Math.random(),
			name: params.name ?? 'name' + Math.random(),
			rank: params.rank ?? Math.random(),
			segmentId: params.segmentId ?? 'segmentId' + Math.random(),
		} as PartInterface)
	}

	interface TesteeBuilderParams {
		pieceRepository?: PieceRepository
		mongoDb?: MongoDatabase
		mongoConverter?: MongoEntityConverter
	}

	async function createCommonTestee(params: TesteeBuilderParams): Promise<PartRepository> {
		const mongoDb: MongoDatabase = params.mongoDb ?? mock(MongoDatabase)

		testDatabase.applyCommonMocking(testDatabase.getDatabase(), mongoDb, COLLECTION_NAME)

		return createTestee({
			pieceRepository: params.pieceRepository,
			mongoConverter: params.mongoConverter,
			mongoDb: mongoDb,
		})
	}

	async function createTestee(params: TesteeBuilderParams): Promise<PartRepository> {
		const pieceRepository: PieceRepository = params.pieceRepository ?? mock<PieceRepository>()
		const mongoDb: MongoDatabase = params.mongoDb ?? mock(MongoDatabase)
		const mongoConverter: MongoEntityConverter = params.mongoConverter ?? mock(MongoEntityConverter)

		return new MongoPartRepository(instance(mongoDb), instance(mongoConverter), instance(pieceRepository))
	}
})
