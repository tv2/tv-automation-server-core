export interface RundownService {
	deleteRundown(rundownId: string): Promise<void>
	activateRundown(rundownId: string): Promise<void>
	deactivateRundown(rundownId: string): Promise<void>
	takeNext(rundownId: string): Promise<void>
	setNext(rundownId: string, segmentId: string, partId: string): Promise<void>
	resetRundown(rundownId: string): Promise<void>
	executeAdLibPiece(rundownId: string, adLibPieceId: string): Promise<void>
}
