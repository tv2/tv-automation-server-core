import { RundownEventType } from '../enums/rundown-event-type'

export interface RundownEvent {
	type: RundownEventType
	rundownId: string
	segmentId: string
	partId: string
}

export interface AdLibPieceInsertedRundownEvent extends RundownEvent {
	type: RundownEventType.AD_LIB_PIECE_INSERTED,
	adLibPiece: {
		id: string
		name: string,
		start: number,
		duration: number
	}
}
