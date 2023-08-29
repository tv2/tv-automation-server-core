import { MongoPieceRepository } from '../mongo/mongo-piece-repository'
import { MongoTestDatabase } from './mongo-test-database'
import { Piece, PieceInterface } from '../../../model/entities/piece'
import { MongoEntityConverter } from '../mongo/mongo-entity-converter'
import { anything, instance, mock, when } from 'ts-mockito'
import { Db } from 'mongodb'
import { PieceRepository } from '../interfaces/piece-repository'
import { MongoDatabase } from '../mongo/mongo-database'
import { DeletionFailedException } from '../../../model/exceptions/deletion-failed-exception'

const COLLECTION_NAME = 'pieces'

describe(`${MongoPieceRepository.name}`, () => {
	const testDatabase: MongoTestDatabase = new MongoTestDatabase()
	beforeEach(async () => testDatabase.setupDatabase())
	afterEach(async () => testDatabase.teardownDatabase())

	describe(`${MongoPieceRepository.prototype.deletePiecesForPart.name}`, () => {
		it('deletes one pieces successfully', async () => {
			const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)
			const partId: string = 'somePartId'
			const piece: Piece = createPiece({ partId: partId })
			await testDatabase.populateDatabaseWithPieces([piece])
			const db: Db = testDatabase.getDatabase()

			when(mongoConverter.convertPieces(anything())).thenReturn([piece])
			const testee: PieceRepository = createTestee({
				mongoConverter: mongoConverter,
			})

			await testee.deletePiecesForPart(partId)

			await expect(db.collection(COLLECTION_NAME).countDocuments()).resolves.toBe(0)
		})

		it('deletes multiple pieces successfully', async () => {
			const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)
			const partId: string = 'somePartId'
			const pieces: Piece[] = [createPiece({ partId: partId }), createPiece({ partId: partId })]
			await testDatabase.populateDatabaseWithPieces(pieces)
			const db: Db = testDatabase.getDatabase()

			when(mongoConverter.convertPieces(anything())).thenReturn(pieces)
			const testee: PieceRepository = createTestee({
				mongoConverter: mongoConverter,
			})

			await testee.deletePiecesForPart(partId)

			await expect(db.collection(COLLECTION_NAME).countDocuments()).resolves.toBe(0)
		})

		it('throws exception, when nonexistent partId is given', async () => {
			const expectedErrorMessageFragment: string = 'Expected to delete one or more pieces'
			const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)
			const nonExistingId: string = 'nonExistingId'
			const partId: string = 'somePartId'
			const piece: Piece = createPiece({ partId: partId })
			await testDatabase.populateDatabaseWithPieces([piece])

			when(mongoConverter.convertPieces(anything())).thenReturn([])
			const testee: PieceRepository = createTestee({
				mongoConverter: mongoConverter,
			})
			const action = async () => testee.deletePiecesForPart(nonExistingId)

			await expect(action).rejects.toThrow(DeletionFailedException)
			await expect(action).rejects.toThrow(expectedErrorMessageFragment)
		})

		it('does not deletes any pieces, when nonexistent partId is given', async () => {
			const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)
			const nonExistingId: string = 'nonExistingId'
			const partId: string = 'somePartId'
			const piece: Piece = createPiece({ partId: partId })
			await testDatabase.populateDatabaseWithPieces([piece])
			const db: Db = testDatabase.getDatabase()

			when(mongoConverter.convertPieces(anything())).thenReturn([])
			const testee: PieceRepository = createTestee({
				mongoConverter: mongoConverter,
			})
			const action = async () => testee.deletePiecesForPart(nonExistingId)

			await expect(action).rejects.toThrow(DeletionFailedException)
			await expect(db.collection(COLLECTION_NAME).countDocuments()).resolves.toBe(1)
		})
	})

	// TODO: Extract to Helper Class in Model layer
	function createPiece(params: { id?: string; name?: string; rank?: number; partId?: string }): Piece {
		return new Piece({
			id: params.id ?? 'id' + Math.random(),
			name: params.name ?? 'name' + Math.random(),
			partId: params.partId ?? 'partId' + Math.random(),
		} as PieceInterface)
	}

	function createTestee(params: {
		mongoDb?: MongoDatabase
		mongoConverter?: MongoEntityConverter
	}): MongoPieceRepository {
		const mongoDb: MongoDatabase = params.mongoDb ?? mock(MongoDatabase)
		const mongoConverter: MongoEntityConverter = params.mongoConverter ?? mock(MongoEntityConverter)

		when(mongoDb.getCollection(COLLECTION_NAME)).thenReturn(testDatabase.getDatabase().collection(COLLECTION_NAME))

		return new MongoPieceRepository(instance(mongoDb), instance(mongoConverter))
	}
})
