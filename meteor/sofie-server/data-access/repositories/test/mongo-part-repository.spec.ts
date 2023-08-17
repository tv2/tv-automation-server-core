import { MongoPartRepository } from '../mongo/mongo-part-repository'
import { Part, PartInterface } from '../../../model/entities/part'
import { Db } from 'mongodb'
import { MongoEntityConverter } from '../mongo/mongo-entity-converter'
import { PartRepository } from '../interfaces/part-repository'
import { MongoDatabase } from '../mongo/mongo-database'
import { anything, instance, mock, when } from 'ts-mockito'
import { MongoTestDatabase } from './mongo-test-database'
import { PieceRepository } from '../interfaces/piece-repository'

const COLLECTION_NAME = 'parts'

describe(`${MongoPartRepository.name}`, () => {
	const testDatabase: MongoTestDatabase = new MongoTestDatabase()
	beforeAll(async () => await testDatabase.beforeAll())
	afterAll(async () => testDatabase.afterAll())

	describe(`${MongoPartRepository.prototype.deleteParts.name}`, () => {
		it('deletes one part successfully', async () => {
			const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)
			const segmentId: string = 'someSegmentId'
			const part: Part = createPart({ segmentId: segmentId })
			const db: Db = await populateDatabase([part])

			when(mongoConverter.convertParts(anything())).thenReturn([part])
			const testee: PartRepository = await createTestee(db, {
				mongoConverter: mongoConverter,
			})

			await testee.deleteParts(segmentId)

			expect(await db.collection(COLLECTION_NAME).countDocuments()).toBe(0)
		})

		it('deletes multiple parts successfully', async () => {
			const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)
			const segmentId: string = 'someSegmentId'
			const parts: Part[] = [createPart({ segmentId: segmentId }), createPart({ segmentId: segmentId })]
			const db: Db = await populateDatabase(parts)

			when(mongoConverter.convertParts(anything())).thenReturn(parts)
			const testee: PartRepository = await createTestee(db, {
				mongoConverter: mongoConverter,
			})

			await testee.deleteParts(segmentId)

			expect(await db.collection(COLLECTION_NAME).countDocuments()).toBe(0)
		})

		it('calls deletion of pieces, matching amount of parts', async () => {})

		it('throws exception, when nonexistent segmentId is given', async () => {})

		it('does not deletes any pieces, when nonexistent segmentId is given', async () => {})
	})

	interface PartBuilderParams {
		id?: string
		name?: string
		rank?: number
		segmentId?: string
	}

	function createPart(params: PartBuilderParams): Part {
		return new Part({
			id: params.id ?? 'id' + Math.random(),
			name: params.name ?? 'name' + Math.random(),
			rank: params.rank ?? Math.random(),
			segmentId: params.segmentId ?? 'segmentId' + Math.random(),
		} as PartInterface)
	}

	async function populateDatabase(parts: Part[]): Promise<Db> {
		const db: Db = testDatabase.getDatabase(testDatabase.getCurrentDatabaseName())
		const entityConverter = new MongoEntityConverter()
		for (const part of entityConverter.convertToMongoParts(parts)) {
			await db.collection(COLLECTION_NAME).insertOne(part)
		}

		return db
	}

	interface TesteeBuilderParams {
		pieceRepository?: PieceRepository
		mongoDb?: MongoDatabase
		mongoConverter?: MongoEntityConverter
	}

	async function createTestee(db: Db, params: TesteeBuilderParams): Promise<PartRepository> {
		const pieceRepository: PieceRepository = params.pieceRepository ?? mock<PieceRepository>()
		const mongoDb: MongoDatabase = params.mongoDb ?? mock(MongoDatabase)
		const mongoConverter: MongoEntityConverter = params.mongoConverter ?? mock(MongoEntityConverter)

		when(mongoDb.getCollection(COLLECTION_NAME)).thenReturn(db.collection(COLLECTION_NAME))

		return new MongoPartRepository(instance(mongoDb), instance(mongoConverter), instance(pieceRepository))
	}
})
