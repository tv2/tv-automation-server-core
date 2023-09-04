import { RundownEventBuilder } from './interfaces/rundown-event-builder'
import { Rundown } from '../../model/entities/rundown'
import {
	AdLibPieceInsertedEvent,
	InfiniteRundownPieceAddedEvent,
	RundownEvent,
} from '../../model/value-objects/rundown-event'
import { RundownEventType } from '../../model/enums/rundown-event-type'
import { AdLibPiece } from '../../model/entities/ad-lib-piece'
import { Piece } from '../../model/entities/piece'

export class RundownEventBuilderImplementation implements RundownEventBuilder {
	public buildDeletedEvent(rundown: Rundown): RundownEvent {
		return {
			type: RundownEventType.DELETED,
			rundownId: rundown.id,
			segmentId: '',
			partId: '',
		}
	}

	public buildActivateEvent(rundown: Rundown): RundownEvent {
		return {
			type: RundownEventType.ACTIVATE,
			rundownId: rundown.id,
			segmentId: rundown.getActiveSegment().id,
			partId: rundown.getActivePart().id,
		}
	}

	public buildDeactivateEvent(rundown: Rundown): RundownEvent {
		return {
			type: RundownEventType.DEACTIVATE,
			rundownId: rundown.id,
			segmentId: '',
			partId: '',
		}
	}

	public buildResetEvent(rundown: Rundown): RundownEvent {
		return {
			type: RundownEventType.RESET,
			rundownId: rundown.id,
			segmentId: '',
			partId: '',
		}
	}

	public buildTakeEvent(rundown: Rundown): RundownEvent {
		return {
			type: RundownEventType.TAKE,
			rundownId: rundown.id,
			segmentId: rundown.getActiveSegment().id,
			partId: rundown.getActivePart().id,
		}
	}

	public buildSetNextEvent(rundown: Rundown): RundownEvent {
		return {
			type: RundownEventType.SET_NEXT,
			rundownId: rundown.id,
			segmentId: rundown.getNextSegment().id,
			partId: rundown.getNextPart().id,
		}
	}

	public buildAdLibPieceInsertedEvent(rundown: Rundown, adLibPiece: AdLibPiece): AdLibPieceInsertedEvent {
		return {
			type: RundownEventType.AD_LIB_PIECE_INSERTED,
			rundownId: rundown.id,
			segmentId: rundown.getActiveSegment().id,
			partId: rundown.getActivePart().id,
			adLibPiece: {
				id: adLibPiece.id,
				name: adLibPiece.name,
				start: adLibPiece.getExecutedAt(),
				duration: adLibPiece.duration,
			},
		}
	}

	public buildInfiniteRundownPieceAddedEvent(rundown: Rundown, infinitePiece: Piece): InfiniteRundownPieceAddedEvent {
		return {
			type: RundownEventType.INFINITE_RUNDOWN_PIECE_ADDED,
			rundownId: rundown.id,
			segmentId: '',
			partId: '',
			infinitePiece,
		}
	}
}
