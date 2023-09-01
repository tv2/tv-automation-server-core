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

	public async deleteRundown(rundownId: string): Promise<void> {
		return this.rundownRepository.deleteRundown(rundownId)
	}

	protected getCollectionName(): string {
		return RUNDOWN_PLAYLIST_COLLECTION_NAME
	}

	async getBasicRundowns(): Promise<BasicRundown[]> {
		this.assertDatabaseConnection(this.getBasicRundowns.name)
		const basicRundowns: BasicRundown[] = await this.rundownRepository.getBasicRundowns()

		const playlists: MongoRundownPlaylist[] = (await this.getCollection()
			.find()
			.project({})
			.toArray()) as unknown as MongoRundownPlaylist[]

		const activePlaylist: MongoRundownPlaylist | undefined = playlists.find((playlist) => playlist.activationId)
		if (!activePlaylist) {
			return basicRundowns
		}

		const basicRundown: BasicRundown | undefined = basicRundowns.find(
			(basicRundown) => basicRundown.name === activePlaylist.externalId
		)
		if (!basicRundown) {
			return basicRundowns
		}

		Object.assign(
			basicRundown,
			new BasicRundown(basicRundown.id, basicRundown.name, true, basicRundown.getLastTimeModified())
		)

		return basicRundowns
	}

	async getRundown(rundownId: string): Promise<Rundown> {
		this.assertDatabaseConnection(this.getRundown.name)
		const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
		const isRundownActive = await this.isRundownActive(rundown)

		const activatedRundown: BasicRundown = new BasicRundown(
			rundown.id,
			rundown.name,
			isRundownActive,
			rundown.getLastTimeModified()
		)
		Object.assign(rundown, activatedRundown)
		return rundown
	}

	private async isRundownActive(rundown: Rundown) {
		const cursor = this.getCollection().find({ externalId: rundown.name }).project({ _id: 0, activationId: 1 })
		const activationStatus = (await cursor.toArray())[0]
		return Object.entries(activationStatus).length > 0
	}

	public saveRundown(rundown: Rundown): void {
		return this.rundownRepository.saveRundown(rundown)
	}
}
