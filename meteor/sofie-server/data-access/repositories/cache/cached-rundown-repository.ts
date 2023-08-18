import { RundownRepository } from '../interfaces/rundown-repository'
import { Rundown } from '../../../model/entities/rundown'
import { BasicRundown } from '../../../model/entities/basic-rundown'

export class CachedRundownRepository implements RundownRepository {
	private static instance: RundownRepository

	public static getInstance(rundownRepository: RundownRepository): RundownRepository {
		if (!this.instance) {
			this.instance = new CachedRundownRepository(rundownRepository)
		}
		return this.instance
	}

	private cachedRundowns: Map<string, Rundown> = new Map()

	constructor(private rundownRepository: RundownRepository) {}

	public async getRundown(rundownId: string): Promise<Rundown> {
		if (!this.cachedRundowns.has(rundownId)) {
			console.log(`### Rundown with id: "${rundownId}" not found in cache. Loading rundown from database...`)
			const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
			this.cachedRundowns.set(rundownId, rundown)
		}
		return this.cachedRundowns.get(rundownId) as Rundown
	}

	public async getBasicRundowns(): Promise<BasicRundown[]> {
		return await this.rundownRepository.getBasicRundowns()
	}

	// Only save in memory for now
	public saveRundown(rundown: Rundown): void {
		if (this.cachedRundowns.has(rundown.id)) {
			this.cachedRundowns.set(rundown.id, rundown)
		}
	}
}
