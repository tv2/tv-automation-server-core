import { Studio } from '../../../model/entities/studio'

export interface StudioRepository {
	getStudio(studioId: string): Promise<Studio>
}
