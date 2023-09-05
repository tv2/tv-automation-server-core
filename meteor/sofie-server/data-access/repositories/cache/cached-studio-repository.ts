import { StudioRepository } from '../interfaces/studio-repository'
import { Studio } from '../../../model/entities/studio'

export class CachedStudioRepository implements StudioRepository {
	private static instance: StudioRepository

	public static getInstance(studioRepository: StudioRepository): StudioRepository {
		if (!this.instance) {
			this.instance = new CachedStudioRepository(studioRepository)
		}
		return this.instance
	}

	private cachedStudios: Map<string, Studio> = new Map()

	private constructor(private studioRepository: StudioRepository) {}

	async getStudio(studioId: string): Promise<Studio> {
		if (!this.cachedStudios.has(studioId)) {
			const studio: Studio = await this.studioRepository.getStudio(studioId)
			this.cachedStudios.set(studioId, studio)
		}
		return this.cachedStudios.get(studioId) as Studio
	}
}
