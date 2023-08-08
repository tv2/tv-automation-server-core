import { instance, mock, when } from 'ts-mockito'
import { Rundown, RundownInterface } from '../../../model/entities/rundown'
import { MongoEntityConverter } from '../mongo/mongo-entity-converter'
import { MongoRundownPlaylistRepository } from '../mongo/mongo-rundown-playlist-repository'
import { RundownRepository } from '../interfaces/rundown-repository'
import { MongoDatabase } from '../mongo/mongo-database'
// eslint-disable-next-line node/no-unpublished-import
import { MongoMemoryServer } from 'mongodb-memory-server'
import { MongoClient } from 'mongodb'

describe('mongo-rundown-playlist-repository.spec.ts', () => {
	let mongoServer: MongoMemoryServer
	let client: MongoClient

	beforeEach(async () => {
		mongoServer = await MongoMemoryServer.create()
		client = await MongoClient.connect(mongoServer.getUri())
	})

	afterEach(async () => {
		if (client) {
			await client.close()
		}
		if (mongoServer) {
			await mongoServer.stop()
		}
	})

	describe('getRundown', () => {
		it('has an activationId, return an active rundown', async () => {
			const rundownId: string = 'activatedRundownId'
			const testee: MongoRundownPlaylistRepository = await createTesteeForRundown(true, rundownId)
			const result: Rundown = await testee.getRundown(rundownId)

			expect(result.getActiveStatus()).toBe(true)
		})
		it('does not have an activationId, return deactivated rundown', async () => {
			const rundownId: string = 'deactivatedRundownId'
			const testee: MongoRundownPlaylistRepository = await createTesteeForRundown(false, rundownId)
			const result: Rundown = await testee.getRundown(rundownId)

			expect(result.getActiveStatus()).toBe(false)
		})
	})
	describe('getBasicRundowns', () => {
		it('returns two rundowns, one is active', async () => {
			const firstRundownId: string = 'firstActivatedRundownId'
			const secondRundownId: string = 'secondActivatedRundownId'
			const testee: MongoRundownPlaylistRepository = await createTesteeForTwoRundowns(
				true,
				firstRundownId,
				secondRundownId
			)
			const result: Rundown[] = await testee.getBasicRundowns()

			expect(result[0].getActiveStatus()).toBe(true)
		})
		it('returns two rundowns, none are active', async () => {
			const firstRundownId: string = 'firstDeactivatedRundownId'
			const secondRundownId: string = 'secondDeactivatedRundownId'
			const testee: MongoRundownPlaylistRepository = await createTesteeForTwoRundowns(
				false,
				firstRundownId,
				secondRundownId
			)
			const result: Rundown[] = await testee.getBasicRundowns()

			expect(result[0].getActiveStatus()).toBe(false)
		})
	})

	async function createTesteeForRundown(
		includeActiveRundown: boolean,
		rundownId: string
	): Promise<MongoRundownPlaylistRepository> {
		const db = client.db(mongoServer.instanceInfo!.dbName)

		const rundownName: string = 'INEWS_QUEUE_PATH'
		const playlistExternalId: string = 'INEWS_QUEUE_PATH'

		const rundown: Rundown = new Rundown({ id: rundownId, name: rundownName } as RundownInterface)

		if (includeActiveRundown) {
			await db.collection('rundownPlaylists').insertOne({
				externalId: playlistExternalId,
				activationId: 'activated',
			})
		} else {
			await db.collection('rundownPlaylists').insertOne({
				externalId: playlistExternalId,
			})
		}

		const rundownRepository: RundownRepository = mock<RundownRepository>()
		const mongoDb: MongoDatabase = mock(MongoDatabase)
		const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)

		when(rundownRepository.getRundown(rundown.id)).thenReturn(Promise.resolve(rundown))
		when(mongoDb.getCollection('rundownPlaylists')).thenReturn(db.collection('rundownPlaylists'))

		return new MongoRundownPlaylistRepository(instance(mongoDb), mongoConverter, instance(rundownRepository))
	}

	async function createTesteeForTwoRundowns(
		includeActivateRundown: boolean,
		firstRundownId: string,
		secondRundownId: string
	): Promise<MongoRundownPlaylistRepository> {
		const db = client.db(mongoServer.instanceInfo!.dbName)

		const firstRundownName: string = 'INEWS_QUEUE_PATH_ONE'
		const secondRundownName: string = 'INEWS_QUEUE_PATH_TWO'
		const firstPlaylistExternalId: string = 'INEWS_QUEUE_PATH_ONE'
		const secondPlaylistExternalId: string = 'INEWS_QUEUE_PATH_TWO'

		const firstRundown: Rundown = new Rundown({ id: firstRundownId, name: firstRundownName } as RundownInterface)
		const secondRundown: Rundown = new Rundown({ id: secondRundownId, name: secondRundownName } as RundownInterface)

		const rundowns: Rundown[] = [firstRundown, secondRundown]

		if (includeActivateRundown) {
			await db.collection('rundownPlaylists').insertOne({
				externalId: firstPlaylistExternalId,
				activationId: 'activated',
			})
		} else {
			await db.collection('rundownPlaylists').insertOne({
				externalId: firstPlaylistExternalId,
			})
		}
		await db.collection('rundownPlaylists').insertOne({
			externalId: secondPlaylistExternalId,
		})

		const rundownRepository: RundownRepository = mock<RundownRepository>()
		const mongoDb: MongoDatabase = mock(MongoDatabase)
		const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)

		when(rundownRepository.getBasicRundowns()).thenReturn(Promise.resolve(rundowns))
		when(mongoDb.getCollection('rundownPlaylists')).thenReturn(db.collection('rundownPlaylists'))

		return new MongoRundownPlaylistRepository(instance(mongoDb), mongoConverter, instance(rundownRepository))
	}
})
