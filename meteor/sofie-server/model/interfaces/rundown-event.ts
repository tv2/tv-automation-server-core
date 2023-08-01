import { RundownEventType } from '../enums/rundown-event-type'

export interface RundownEvent {
	type: RundownEventType
	rundownId: string
	segmentId: string
	partId: string
}

export interface AdLibPieceInsertedEvent extends RundownEvent {
	type: RundownEventType.AD_LIB_PIECE_INSERTED
	segmentId: string
	partId: string
	adLibPiece: {
		id: string
		name: string
		start: number
		duration: number
	}
}

export interface InfiniteRundownPieceAddedEvent extends RundownEvent {
	type: RundownEventType.INFINITE_RUNDOWN_PIECE_ADDED
	infinitePiece: {
		id: string
		name: string
		layer: string
	}
}
