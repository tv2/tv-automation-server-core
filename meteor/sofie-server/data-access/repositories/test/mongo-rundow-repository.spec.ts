import { MongoRundownRepository } from '../mongo/mongo-rundown-repository'
import { MongoTestDatabase } from './mongo-test-database'
import { Rundown, RundownInterface } from '../../../model/entities/rundown'
import { Db } from 'mongodb'
import { RundownRepository } from '../interfaces/rundown-repository'
import { SegmentRepository } from '../interfaces/segment-repository'
import { MongoDatabase } from '../mongo/mongo-database'
import { anyString, instance, mock, verify, when } from 'ts-mockito'
import { MongoEntityConverter } from '../mongo/mongo-entity-converter'
import { DeletionFailedException } from '../../../model/exceptions/deletion-failed-exception'

describe(`${MongoRundownRepository.name}`, () => {
	const testDatabase: MongoTestDatabase = new MongoTestDatabase()
	beforeAll(async () => await testDatabase.beforeAll())
	afterAll(async () => testDatabase.afterAll())

	describe(`${MongoRundownRepository.prototype.deleteRundown.name}`, () => {
		it('deletes active rundown successfully', async () => {
			const randomRundownId: string = 'randomRundownId'
			const randomRundown: Rundown = createActiveRundown(randomRundownId)
			const db: Db = await populateDatabase([randomRundown])

			const testee = await createTestee(db, {})
			await testee.deleteRundown(randomRundownId)

			expect(await db.collection('rundowns').countDocuments()).toBe(0)
		})

		it('deletes inactive rundown successfully', async () => {
			const randomRundownId: string = 'randomRundownId'
			const randomRundown: Rundown = createInactiveRundown(randomRundownId)
			const db: Db = await populateDatabase([randomRundown])

			const testee = await createTestee(db, {})
			await testee.deleteRundown(randomRundownId)

			expect(await db.collection('rundowns').countDocuments()).toBe(0)
		})

		// eslint-disable-next-line jest/expect-expect
		it('calls deletion of segments', async () => {
			const segmentRepository: SegmentRepository = mock<SegmentRepository>()
			const randomRundownId: string = 'randomRundownId'
			const randomRundown: Rundown = createInactiveRundown(randomRundownId)
			const db: Db = await populateDatabase([randomRundown])

			const testee = await createTestee(db, { segmentRepository: segmentRepository })
			await testee.deleteRundown(randomRundownId)

			verify(segmentRepository.deleteSegments(anyString())).once()
		})

		it('does not delete, and throws exception, when nonexistent rundownId is given', async () => {
			const expectedErrorMessage: string = 'Expected to delete one rundown'
			const nonExistingId: string = 'nonExistingId'
			const rundown: Rundown = createInactiveRundown()
			const db: Db = await populateDatabase([rundown])

			const testee = await createTestee(db, {})

			expect.assertions(2)
			try {
				await testee.deleteRundown(nonExistingId)
			} catch (error) {
				// It isn't conditional, as the test will fail, if not hit, due to the 'expect.assertions(2)'
				// eslint-disable-next-line jest/no-conditional-expect
				expect(error).toBeInstanceOf(DeletionFailedException)
				// eslint-disable-next-line jest/no-conditional-expect
				expect((error as DeletionFailedException).message).toContain(expectedErrorMessage)
			}
		})
	})

	// TODO: Extract to Helper Class in Model layer
	function createActiveRundown(rundownId?: string): Rundown {
		return new Rundown({
			id: rundownId ?? 'id' + Math.random(),
			name: 'name' + Math.random(),
			isRundownActive: true,
		} as RundownInterface)
	}

	// TODO: Extract to Helper Class in Model layer
	function createInactiveRundown(rundownId?: string): Rundown {
		return new Rundown({
			id: rundownId ?? 'id' + Math.random(),
			name: 'name' + Math.random(),
			isRundownActive: false,
		} as RundownInterface)
	}

	async function populateDatabase(rundowns: Rundown[]): Promise<Db> {
		const db: Db = testDatabase.getDatabase(testDatabase.getCurrentDatabaseName())
		const entityConverter = new MongoEntityConverter()
		for (const rundown of entityConverter.convertToMongoRundowns(rundowns)) {
			await db.collection('rundowns').insertOne(rundown)
		}

		return db
	}

	interface TesteeBuilderParams {
		segmentRepository?: SegmentRepository
		mongoDb?: MongoDatabase
		mongoConverter?: MongoEntityConverter
	}

	async function createTestee(db: Db, params: TesteeBuilderParams): Promise<RundownRepository> {
		const segmentRepository: SegmentRepository = params.segmentRepository ?? mock<SegmentRepository>()
		const mongoDb: MongoDatabase = params.mongoDb ?? mock(MongoDatabase)
		const mongoConverter: MongoEntityConverter = params.mongoConverter ?? mock(MongoEntityConverter)

		when(mongoDb.getCollection('rundowns')).thenReturn(db.collection('rundowns'))

		return new MongoRundownRepository(instance(mongoDb), instance(mongoConverter), instance(segmentRepository))
	}
})
