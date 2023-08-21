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
	beforeEach(async () => await testDatabase.setupDatabase())
	afterEach(async () => testDatabase.teardownDatabase())

	describe(`${MongoPieceRepository.prototype.deletePieces.name}`, () => {
		it('deletes one pieces successfully', async () => {
			const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)
			const partId: string = 'somePartId'
			const piece: Piece = createPiece({ partId: partId })
			await testDatabase.populateDatabaseWithPieces([piece])
			const db: Db = testDatabase.getDatabase()

			when(mongoConverter.convertPieces(anything())).thenReturn([piece])
			const testee: PieceRepository = await createTestee(db, {
				mongoConverter: mongoConverter,
			})

			await testee.deletePieces(partId)

			expect(await db.collection(COLLECTION_NAME).countDocuments()).toBe(0)
		})

		it('deletes multiple pieces successfully', async () => {
			const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)
			const partId: string = 'somePartId'
			const pieces: Piece[] = [createPiece({ partId: partId }), createPiece({ partId: partId })]
			await testDatabase.populateDatabaseWithPieces(pieces)
			const db: Db = testDatabase.getDatabase()

			when(mongoConverter.convertPieces(anything())).thenReturn(pieces)
			const testee: PieceRepository = await createTestee(db, {
				mongoConverter: mongoConverter,
			})

			await testee.deletePieces(partId)

			expect(await db.collection(COLLECTION_NAME).countDocuments()).toBe(0)
		})

		it('throws exception, when nonexistent partId is given', async () => {
			const expectedErrorMessageFragment: string = 'Expected to delete one or more pieces'
			const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)
			const nonExistingId: string = 'nonExistingId'
			const partId: string = 'somePartId'
			const piece: Piece = createPiece({ partId: partId })
			await testDatabase.populateDatabaseWithPieces([piece])
			const db: Db = testDatabase.getDatabase()

			when(mongoConverter.convertPieces(anything())).thenReturn([])
			const testee: PieceRepository = await createTestee(db, {
				mongoConverter: mongoConverter,
			})

			expect.assertions(2)
			try {
				await testee.deletePieces(nonExistingId)
			} catch (error) {
				// eslint-disable-next-line jest/no-conditional-expect
				expect(error).toBeInstanceOf(DeletionFailedException)
				// eslint-disable-next-line jest/no-conditional-expect
				expect((error as DeletionFailedException).message).toContain(expectedErrorMessageFragment)
			}
		})

		it('does not deletes any pieces, when nonexistent partId is given', async () => {
			const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)
			const nonExistingId: string = 'nonExistingId'
			const partId: string = 'somePartId'
			const piece: Piece = createPiece({ partId: partId })
			await testDatabase.populateDatabaseWithPieces([piece])
			const db: Db = testDatabase.getDatabase()

			when(mongoConverter.convertPieces(anything())).thenReturn([])
			const testee: PieceRepository = await createTestee(db, {
				mongoConverter: mongoConverter,
			})

			expect.assertions(2)
			try {
				await testee.deletePieces(nonExistingId)
			} catch (error) {
				// eslint-disable-next-line jest/no-conditional-expect
				expect(error).toBeInstanceOf(DeletionFailedException)
				// eslint-disable-next-line jest/no-conditional-expect
				expect(await db.collection(COLLECTION_NAME).countDocuments()).toBe(1)
			}
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

	async function createTestee(
		db: Db,
		params: {
			mongoDb?: MongoDatabase
			mongoConverter?: MongoEntityConverter
		}
	): Promise<PieceRepository> {
		const mongoDb: MongoDatabase = params.mongoDb ?? mock(MongoDatabase)
		const mongoConverter: MongoEntityConverter = params.mongoConverter ?? mock(MongoEntityConverter)

		when(mongoDb.getCollection(COLLECTION_NAME)).thenReturn(db.collection(COLLECTION_NAME))

		return new MongoPieceRepository(instance(mongoDb), instance(mongoConverter))
	}
})
