import { Rundown } from '../../../model/entities/rundown'
import { BasicRundown } from '../../../model/entities/basic-rundown'

export interface RundownRepository {
	getBasicRundowns(): Promise<BasicRundown[]>
	getRundown(rundownId: string): Promise<Rundown>
	saveRundown(rundown: Rundown): void
	deleteRundown(rundownId: string): Promise<boolean>
}
