import { RundownRepository } from '../interfaces/rundown-repository'
import { BaseMongoRepository } from './base-mongo-repository'
import { Rundown } from '../../../model/entities/rundown'
import { MongoDatabase } from './mongo-database'
import { MongoEntityConverter, MongoRundownPlaylist } from './mongo-entity-converter'
import { BasicRundown } from '../../../model/entities/basic-rundown'

const RUNDOWN_PLAYLIST_COLLECTION_NAME: string = 'rundownPlaylists'

export class MongoRundownPlaylistRepository extends BaseMongoRepository implements RundownRepository {
	constructor(
		mongoDatabase: MongoDatabase,
		mongoEntityConverter: MongoEntityConverter,
		private rundownRepository: RundownRepository
	) {
		super(mongoDatabase, mongoEntityConverter)
	}

	protected getCollectionName(): string {
		return RUNDOWN_PLAYLIST_COLLECTION_NAME
	}

	async getBasicRundowns(): Promise<BasicRundown[]> {
		this.assertDatabaseConnection('getRundownPlaylists')
		const rundowns: BasicRundown[] = await this.rundownRepository.getBasicRundowns()

		const playlists: MongoRundownPlaylist[] = (await this.getCollection()
			.find()
			.project({})
			.toArray()) as unknown as MongoRundownPlaylist[]

		const activePlaylist: MongoRundownPlaylist | undefined = playlists.find((playlist) => playlist.activationId)
		if (!activePlaylist) {
			return rundowns
		}

		const activeRundown: BasicRundown | undefined = rundowns.find(
			(rundown) => rundown.name === activePlaylist.externalId
		)
		if (!activeRundown) {
			return rundowns
		}

		Object.assign(
			activeRundown,
			new BasicRundown(activeRundown.id, activeRundown.name, true, activeRundown.getLastTimeModified())
		)

		return rundowns
	}

	async getRundown(rundownId: string): Promise<Rundown> {
		this.assertDatabaseConnection('getRundownPlaylist')
		const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
		const cursor = this.getCollection().find({ externalId: rundown.name }).project({ _id: 0, activationId: 1 })
		const activationStatus = (await cursor.toArray())[0]
		const isRundownActive: boolean = Object.entries(activationStatus).length > 0

		const activatedRundown: BasicRundown = new BasicRundown(
			rundown.id,
			rundown.name,
			isRundownActive,
			rundown.getLastTimeModified()
		)
		Object.assign(rundown, activatedRundown)
		return rundown
	}

	saveRundown(_rundown: Rundown): void {
		throw new Error('Not implemented')
	}
}
