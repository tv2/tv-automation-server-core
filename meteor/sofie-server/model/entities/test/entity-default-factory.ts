import { Segment, SegmentInterface } from '../segment'
import { Part, PartInterface } from '../part'
import { Piece, PieceInterface } from '../piece'
import { PieceType } from '../../enums/piece-type'
import { PieceLifespan } from '../../enums/piece-lifespan'
import { Rundown } from '../rundown'

export class EntityDefaultFactory {
	public static createActiveRundown(segments: Segment[]): Rundown {
		const rundown: Rundown = new Rundown({
			id: 'someId',
			name: 'someName',
			isActive: false,
			segments,
		})
		rundown.activate()
		return rundown
	}

	public static createSegment(segmentInterface: SegmentInterface): Segment {
		return new Segment({
			id: segmentInterface.rank ? `segment${segmentInterface.rank}` : 'segmentId',
			name: segmentInterface.name ?? 'segmentName',
			isNext: segmentInterface.isNext,
			isOnAir: segmentInterface.isOnAir,
			rank: segmentInterface.rank ?? 1,
			rundownId: segmentInterface.rundownId ?? 'rundownId',
			parts: segmentInterface.parts ?? [],
		})
	}

	public static createPart(partInterface: PartInterface): Part {
		const partInterfaceWithDefaultValues: PartInterface = {
			id: partInterface.id ?? (partInterface.rank ? `part${partInterface.rank}` : 'partId'),
			segmentId: partInterface.segmentId ?? 'segmentId',
			rank: partInterface.rank ?? 1,
			name: partInterface.name ?? 'partName',
			isNext: partInterface.isNext,
			isOnAir: partInterface.isOnAir,
			expectedDuration: partInterface.expectedDuration ?? 0,
			pieces: partInterface.pieces ?? [],
			inTransition: partInterface.inTransition,
			outTransition: partInterface.outTransition,
			autoNext: partInterface.autoNext,
			autoNextOverlap: partInterface.autoNextOverlap,
			disableNextInTransition: partInterface.disableNextInTransition,
		}
		return new Part(partInterfaceWithDefaultValues)
	}

	public static createPiece(pieceInterface: PieceInterface): Piece {
		return new Piece({
			id: pieceInterface.id ?? 'pieceId',
			name: pieceInterface.name ?? 'pieceName',
			partId: pieceInterface.partId ?? 'partId',
			type: pieceInterface.type ?? PieceType.UNKNOWN,
			layer: pieceInterface.layer ?? 'layer',
			start: pieceInterface.start ?? 0,
			duration: pieceInterface.duration ?? 0,
			pieceLifespan: pieceInterface.pieceLifespan ?? PieceLifespan.WITHIN_PART,
			timelineObjects: pieceInterface.timelineObjects ?? [],
			preRollDuration: pieceInterface.preRollDuration,
			postRollDuration: pieceInterface.postRollDuration,
			transitionType: pieceInterface.transitionType,
		})
	}
}
