import { RundownRepository } from '../interfaces/rundown-repository'
import { Rundown } from '../../../model/entities/rundown'

export class CachedRundownRepository implements RundownRepository {

	private static instance: RundownRepository

	static getInstance(rundownRepository?: RundownRepository): RundownRepository {
		if (!this.instance) {
			if (!rundownRepository) {
				throw new Error(`No RundownRepository provided. Unable to create instance of ${CachedRundownRepository.name}`)
			}
			this.instance = new CachedRundownRepository(rundownRepository)
		}
		return this.instance
	}

	private rundownRepository: RundownRepository

	private cachedRundowns: Map<string, Rundown> = new Map()

	constructor(rundownRepository: RundownRepository) {
		this.rundownRepository = rundownRepository
	}

	async getRundown(rundownId: string): Promise<Rundown> {
		if (!this.cachedRundowns.has(rundownId)) {
			console.log(`### Rundown with id: "${rundownId}" not found in cache. Loading rundown from database...`)
			const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
			this.cachedRundowns.set(rundownId, rundown)
		}
		return this.cachedRundowns.get(rundownId) as Rundown
	}

	/**
	 * ATTENTION: We currently have no way of knowing if we have all Rundowns loaded in cache or not.
	 * Since the functionality of "getRundowns" most likely isn't needed (and hence will be deleted),
	 * it won't be implementing a cache for now.
	 */
	async getRundowns(): Promise<Rundown[]> {
		return this.rundownRepository.getRundowns()
	}

	// Only save in memory for now
	saveRundown(rundown: Rundown): void {
		console.log('### Checking to save Rundown')
		if (this.cachedRundowns.has(rundown.id)) {
			console.log('### Saving Rundown')
			this.cachedRundowns.set(rundown.id, rundown)
		}
	}
}
