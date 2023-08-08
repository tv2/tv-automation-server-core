import { Rundown } from '../../../model/entities/rundown'
import { Identifier } from '../../../model/interfaces/identifier'

export interface RundownRepository {
	getRundownIdentifiers(): Promise<Identifier[]>
	getRundown(rundownId: string): Promise<Rundown>
	saveRundown(rundown: Rundown): void
	deleteRundown(rundownId: string): Promise<boolean>
}
