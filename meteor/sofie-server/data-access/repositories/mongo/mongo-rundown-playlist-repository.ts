import { RundownRepository } from '../interfaces/rundown-repository'
import { BaseMongoRepository } from './base-mongo-repository'
import { Rundown } from '../../../model/entities/rundown'
import { MongoDatabase } from './mongo-database'
import { MongoEntityConverter, MongoRundownPlaylist } from './mongo-entity-converter'

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

	async getBasicRundowns(): Promise<Rundown[]> {
		this.assertDatabaseConnection('getRundownPlaylists')
		const rundowns: Rundown[] = await this.rundownRepository.getBasicRundowns()

		const playlists: MongoRundownPlaylist[] = (await this.getCollection()
			.find()
			.project({})
			.toArray()) as unknown as MongoRundownPlaylist[]

		rundowns.forEach((rundown) => {
			playlists.forEach((playlist) => {
				if (playlist.externalId !== rundown.name) {
					return
				}
				if (typeof playlist.activationId !== 'undefined') {
					rundown.setActiveStatus(true)
				} else {
					rundown.setActiveStatus(false)
				}
			})
		})

		return rundowns
	}

	async getRundown(rundownId: string): Promise<Rundown> {
		this.assertDatabaseConnection('getRundownPlaylist')
		const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
		const cursor = this.getCollection().find({ externalId: rundown.name }).project({ _id: 0, activationId: 1 })

		const activationStatus = (await cursor.toArray())[0]

		if (Object.entries(activationStatus).length > 0) {
			rundown.setActiveStatus(true)
		} else {
			rundown.setActiveStatus(false)
		}
		return rundown
	}

	saveRundown(_rundown: Rundown): void {
		throw new Error('Not implemented')
	}
}
