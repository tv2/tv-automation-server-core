import { Rundown } from '../../../model/entities/rundown'

export interface RundownRepository {
	getRundowns(): Promise<Rundown[]>
	getRundown(rundownId: string): Promise<Rundown>
}
