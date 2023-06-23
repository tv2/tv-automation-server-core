export interface RundownService {
	takeNext(rundownId: string): void
	setNext(rundownId: string, partId: string): void
	resetRundown(rundownId: string): void
}
