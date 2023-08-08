import { Rundown } from '../../../model/entities/rundown'

export interface RundownRepository {
	getBasicRundowns(): Promise<Rundown[]>
	getRundown(rundownId: string): Promise<Rundown>
	saveRundown(rundown: Rundown): void
}
