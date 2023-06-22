export interface RundownService {
	doTake(rundownId: string): void
	resetRundown(rundownId: string): void
}
