export interface RundownService {
	activateRundown(rundownId: string): void
	takeNext(rundownId: string): void
	setNext(rundownId: string, partId: string): void
	resetRundown(rundownId: string): void
}
