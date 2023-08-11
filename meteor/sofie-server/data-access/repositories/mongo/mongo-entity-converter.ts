import { Rundown } from '../../../model/entities/rundown'
import { Segment } from '../../../model/entities/segment'
import { Part } from '../../../model/entities/part'
import { Piece } from '../../../model/entities/piece'
import { PieceType } from '../../../model/enums/piece-type'
import { Timeline } from '../../../model/entities/timeline'
import { Identifier } from '../../../model/interfaces/identifier'
import { AdLibPiece } from '../../../model/entities/ad-lib-piece'
import { PieceLifeSpan } from '../../../model/enums/piece-life-span'
import { BasicRundown } from '../../../model/entities/basic-rundown'

export interface MongoIdentifier {
	_id: string
	name: string
}

export interface MongoRundownPlaylist {
	_id: string
	externalId: string
	name: string
	activationId: string
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
	modified: number
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
}

export interface MongoPiece {
	_id: string
	startPartId: string
	name: string
	sourceLayerId: string
	enable: {
		start: number
		duration: number
	}
	timelineObjectsString: string
	lifespan: string
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
			isRundownActive: false,
			segments: [],
			modifiedAt: mongoRundown.modified,
		})
	}

	public convertRundowns(mongoRundowns: MongoRundown[]): Rundown[] {
		return mongoRundowns.map(this.convertRundown)
	}

	public convertBasicRundown(mongoRundown: MongoRundown): BasicRundown {
		return new BasicRundown(mongoRundown._id, mongoRundown.name, false, mongoRundown.modified)
	}

	public convertBasicRundowns(mongoRundowns: MongoRundown[]): BasicRundown[] {
		return mongoRundowns.map(this.convertBasicRundown)
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
			pieceLifeSpan: this.mapMongoPieceLifeSpan(mongoPiece.lifespan),
			start: mongoPiece.enable.start,
			duration: mongoPiece.enable.duration,
			timelineObjects: JSON.parse(mongoPiece.timelineObjectsString),
		})
	}

	private mapMongoPieceLifeSpan(mongoPieceLifeSpan: string): PieceLifeSpan {
		switch (mongoPieceLifeSpan) {
			case 'showstyle-end':
			case 'rundown-end':
			case 'rundown-change': {
				return PieceLifeSpan.INFINITE_RUNDOWN
			}
			case 'segment-end':
			case 'segment-change': {
				return PieceLifeSpan.INFINITE_SEGMENT
			}
			case 'part-only':
			default: {
				return PieceLifeSpan.WITHIN_PART
			}
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
			timelineBlob: JSON.stringify(timeline.timelineObjects),
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
