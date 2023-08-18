import { Rundown } from '../../../model/entities/rundown'
import { Segment } from '../../../model/entities/segment'
import { Part } from '../../../model/entities/part'
import { Piece } from '../../../model/entities/piece'
import { PieceType } from '../../../model/enums/piece-type'
import { Timeline } from '../../../model/entities/timeline'
import { Identifier } from '../../../model/value-objects/identifier'
import { AdLibPiece } from '../../../model/entities/ad-lib-piece'
import { PieceLifespan } from '../../../model/enums/piece-lifespan'
import { TransitionType } from '../../../model/enums/transition-type'

export interface MongoIdentifier {
	_id: string
	name: string
}

export interface MongoRundown {
	_id: string
	externalId: string
	name: string
	timing: {
		type: string
		expectedStart: number
		expectedDuration: number
		expectedEnd: number
	}
	playlistExternalId: string
	metaData: {
		rank: number
	}
	notes: any[]
	organizationId: string
	studioId: string
	showStyleVariantId: string
	showStyleBaseId: string
}

export interface MongoSegment {
	_id: string
	name: string
	_rank: number
	rundownId: string
	externalId: string
	isHidden: boolean
}

export interface MongoPart {
	_id: string
	segmentId: string
	title: string
	_rank: number
	expectedDuration: number
	inTransition?: {
		previousPartKeepaliveDuration: number
		partContentDelayDuration: number
	}
	outTransition?: {
		duration: number
	}
	autoNext: boolean
	autoNextOverlap: number
	disableNextInTransition: boolean
}

export interface MongoPiece {
	_id: string
	startPartId: string
	name: string
	sourceLayerId: string
	enable: {
		start: number | string
		duration: number
	}
	prerollDuration: number
	postrollDuration: number
	timelineObjectsString: string
	lifespan: string
	pieceType: string
}

export interface MongoTimeline {
	_id: string
	timelineHash: string
	generated: number
	timelineBlob: string
}

export interface MongoAdLibPiece {
	_id: string
	rundownId: string
	name: string
	expectedDuration: number
	timelineObjectsString: string
}

export class MongoEntityConverter {
	public convertIdentifier(mongoIdentifier: MongoIdentifier): Identifier {
		return {
			id: mongoIdentifier._id,
			name: mongoIdentifier.name,
		}
	}

	public convertIdentifiers(mongoIdentifiers: MongoIdentifier[]): Identifier[] {
		return mongoIdentifiers.map(this.convertIdentifier)
	}

	public convertRundown(mongoRundown: MongoRundown): Rundown {
		return new Rundown({
			id: mongoRundown._id,
			name: mongoRundown.name,
			isActive: false,
			segments: [],
		})
	}

	public convertRundowns(mongoRundowns: MongoRundown[]): Rundown[] {
		return mongoRundowns.map(this.convertRundown)
	}

	public convertSegment(mongoSegment: MongoSegment): Segment {
		return new Segment({
			id: mongoSegment._id,
			rundownId: mongoSegment.rundownId,
			name: mongoSegment.name,
			rank: mongoSegment._rank,
			isOnAir: false,
			isNext: false,
			parts: [],
		})
	}

	public convertSegments(mongoSegments: MongoSegment[]): Segment[] {
		return mongoSegments.filter((segment) => !segment.isHidden).map(this.convertSegment)
	}

	public convertPart(mongoPart: MongoPart): Part {
		return new Part({
			id: mongoPart._id,
			segmentId: mongoPart.segmentId,
			name: mongoPart.title,
			rank: mongoPart._rank,
			expectedDuration: mongoPart.expectedDuration,
			isOnAir: false,
			isNext: false,
			pieces: [],
			inTransition: {
				keepPreviousPartAliveDuration: mongoPart.inTransition?.previousPartKeepaliveDuration ?? 0,
				delayPiecesDuration: mongoPart.inTransition?.partContentDelayDuration ?? 0,
			},
			outTransition: {
				keepAliveDuration: mongoPart.outTransition?.duration ?? 0,
			},
			autoNext: mongoPart.autoNext,
			autoNextOverlap: mongoPart.autoNextOverlap,
			disableNextInTransition: mongoPart.disableNextInTransition,
		})
	}

	public convertParts(mongoParts: MongoPart[]): Part[] {
		return mongoParts.map(this.convertPart)
	}

	public convertPiece(mongoPiece: MongoPiece): Piece {
		return new Piece({
			id: mongoPiece._id,
			partId: mongoPiece.startPartId,
			name: mongoPiece.name,
			layer: mongoPiece.sourceLayerId,
			type: PieceType.UNKNOWN,
			pieceLifespan: this.mapMongoPieceLifeSpan(mongoPiece.lifespan),
			start: typeof mongoPiece.enable.start === 'number' ? mongoPiece.enable.start : 0,
			duration: mongoPiece.enable.duration,
			preRollDuration: mongoPiece.prerollDuration,
			postRollDuration: mongoPiece.prerollDuration,
			transitionType: this.mapMongoPieceTypeToTransitionType(mongoPiece.pieceType),
			timelineObjects: JSON.parse(mongoPiece.timelineObjectsString),
		})
	}

	private mapMongoPieceLifeSpan(mongoPieceLifeSpan: string): PieceLifespan {
		switch (mongoPieceLifeSpan) {
			case 'showstyle-end':
			case 'rundown-change': {
				return PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE
			}
			case 'rundown-end': {
				return PieceLifespan.SPANNING_UNTIL_RUNDOWN_END
			}
			case 'segment-change': {
				return PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE
			}
			case 'segment-end': {
				return PieceLifespan.SPANNING_UNTIL_SEGMENT_END
			}
			case 'part-only':
			default: {
				return PieceLifespan.WITHIN_PART
			}
		}
	}

	private mapMongoPieceTypeToTransitionType(type: string): TransitionType {
		switch (type) {
			case 'in-transition':
				return TransitionType.IN_TRANSITION
			case 'out-transition':
				return TransitionType.OUT_TRANSITION
			case 'normal':
			default:
				return TransitionType.NO_TRANSITION
		}
	}

	public convertPieces(mongoPieces: MongoPiece[]): Piece[] {
		return mongoPieces.map((mongoPiece) => this.convertPiece(mongoPiece))
	}

	public convertToMongoTimeline(timeline: Timeline): MongoTimeline {
		return {
			_id: 'studio0',
			timelineHash: '',
			generated: new Date().getTime(),
			timelineBlob: JSON.stringify(timeline.timelineGroups),
		}
	}

	public convertMongoAdLibPieceToIdentifier(mongoAdLibPiece: MongoAdLibPiece): Identifier {
		return {
			id: mongoAdLibPiece._id,
			name: mongoAdLibPiece.name,
		}
	}

	public convertMongoAdLibPiecesToIdentifiers(mongoAdLibPieces: MongoAdLibPiece[]): Identifier[] {
		return mongoAdLibPieces.map((piece) => this.convertMongoAdLibPieceToIdentifier(piece))
	}

	public convertAdLib(mongoAdLibPiece: MongoAdLibPiece): AdLibPiece {
		return new AdLibPiece({
			id: mongoAdLibPiece._id,
			rundownId: mongoAdLibPiece.rundownId,
			name: mongoAdLibPiece.name,
			duration: mongoAdLibPiece.expectedDuration,
			timelineObjects: JSON.parse(mongoAdLibPiece.timelineObjectsString),
		})
	}

	public convertAdLibs(mongoAdLibPieces: MongoAdLibPiece[]): AdLibPiece[] {
		return mongoAdLibPieces.map((piece) => this.convertAdLib(piece))
	}
}
