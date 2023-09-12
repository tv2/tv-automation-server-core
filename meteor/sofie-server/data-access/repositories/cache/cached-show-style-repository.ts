import { ShowStyleRepository } from '../interfaces/show-style-repository'
import { ShowStyle } from '../../../model/entities/show-style'

export class CachedShowStyleRepository implements ShowStyleRepository {
	private static instance: ShowStyleRepository

	public static getInstance(showStyleRepository: ShowStyleRepository): ShowStyleRepository {
		if (!this.instance) {
			this.instance = new CachedShowStyleRepository(showStyleRepository)
		}
		return this.instance
	}

	private cachedShowStyles: Map<string, ShowStyle> = new Map()

	private constructor(private showStyleRepository: ShowStyleRepository) {}

	async getShowStyle(showStyleId: string): Promise<ShowStyle> {
		if (!this.cachedShowStyles.has(showStyleId)) {
			const showStyle: ShowStyle = await this.showStyleRepository.getShowStyle(showStyleId)
			this.cachedShowStyles.set(showStyleId, showStyle)
		}
		return this.cachedShowStyles.get(showStyleId) as ShowStyle
	}
}
