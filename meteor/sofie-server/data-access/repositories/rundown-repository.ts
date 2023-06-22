import { Rundown } from '../../model/rundown'

export interface RundownRepository {
	getRundowns(): Promise<Rundown[]>
	getRundown(rundownId: string): Promise<Rundown>
}
