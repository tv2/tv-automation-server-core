import { Rundown } from '../../../model/entities/rundown'
import {
	AdLibPieceInsertedEvent,
	InfiniteRundownPieceAddedEvent,
	RundownEvent,
} from '../../../model/value-objects/rundown-event'
import { AdLibPiece } from '../../../model/entities/ad-lib-piece'
import { Piece } from '../../../model/entities/piece'

export interface RundownEventBuilder {
	buildActivateEvent(rundown: Rundown): RundownEvent
	buildDeactivateEvent(rundown: Rundown): RundownEvent
	buildResetEvent(rundown: Rundown): RundownEvent
	buildTakeEvent(rundown: Rundown): RundownEvent
	buildSetNextEvent(rundown: Rundown): RundownEvent
	buildDeletedEvent(rundown: Rundown): RundownEvent
	buildAdLibPieceInsertedEvent(rundown: Rundown, adLibPiece: AdLibPiece): AdLibPieceInsertedEvent
	buildInfiniteRundownPieceAddedEvent(rundown: Rundown, infinitePiece: Piece): InfiniteRundownPieceAddedEvent
}
