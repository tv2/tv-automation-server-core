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
import { ObjectId } from 'mongodb'

export interface MongoIdentifier {
	_id: string
	name: string
}

export interface MongoRundownPlaylist {
	_id: ObjectId
	externalId: string
	name: string
	activationId: string
}

export interface MongoRundown {
	_id: ObjectId
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
	isActive: boolean
}

export interface MongoSegment {
	_id: ObjectId
	name: string
	_rank: number
	rundownId: string
	externalId: string
	isHidden: boolean
	isOnAir: boolean
	isNext: boolean
}

export interface MongoPart {
	_id: ObjectId
	segmentId: string
	title: string
	_rank: number
	expectedDuration: number
	isOnAir: boolean
	isNext: boolean
}

export interface MongoPiece {
	_id: ObjectId
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
	_id: ObjectId
	timelineHash: string
	generated: number
	timelineBlob: string
}

export interface MongoAdLibPiece {
	_id: ObjectId
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
		return mongoIdentifiers.map(this.convertIdentifier.bind(this))
	}

	public convertRundown(mongoRundown: MongoRundown): Rundown {
		return new Rundown({
			id: mongoRundown._id.toString(),
			name: mongoRundown.name,
			isRundownActive: mongoRundown.isActive,
			segments: [],
			modifiedAt: mongoRundown.modified,
		})
	}

	public convertRundowns(mongoRundowns: MongoRundown[]): Rundown[] {
		return mongoRundowns.map(this.convertRundown.bind(this))
	}

	public convertToMongoRundown(rundown: Rundown): MongoRundown {
		return {
			isActive: rundown.isActive(),
			externalId: '', // Todo: figure out where the value for this attribute is
			metaData: { rank: 0 }, // Todo: figure out where the value for this attribute is
			modified: rundown.getLastTimeModified(),
			notes: [], // Todo: figure out where the value for this attribute is
			organizationId: '', // Todo: figure out where the value for this attribute is
			playlistExternalId: '', // Todo: figure out where the value for this attribute is
			showStyleBaseId: '', // Todo: figure out where the value for this attribute is
			showStyleVariantId: '', // Todo: figure out where the value for this attribute is
			studioId: '', // Todo: figure out where the value for this attribute is
			timing: { expectedDuration: 0, expectedEnd: 0, expectedStart: 0, type: '' }, // Todo: figure out where the value for this attribute is
			_id: new ObjectId(rundown.id),
			name: rundown.name,
		}
	}

	public convertToMongoRundowns(rundowns: Rundown[]): MongoRundown[] {
		return rundowns.map(this.convertToMongoRundown.bind(this))
	}

	public convertToBasicRundown(mongoRundown: MongoRundown): BasicRundown {
		return new BasicRundown(
			mongoRundown._id.toString(),
			mongoRundown.name,
			mongoRundown.isActive,
			mongoRundown.modified
		)
	}

	public convertToBasicRundowns(mongoRundowns: MongoRundown[]): BasicRundown[] {
		return mongoRundowns.map(this.convertToBasicRundown.bind(this))
	}

	public convertSegment(mongoSegment: MongoSegment): Segment {
		return new Segment({
			id: mongoSegment._id.toString(),
			rundownId: mongoSegment.rundownId,
			name: mongoSegment.name,
			rank: mongoSegment._rank,
			isOnAir: false,
			isNext: false,
			parts: [],
		})
	}

	public convertSegments(mongoSegments: MongoSegment[]): Segment[] {
		return mongoSegments.filter((segment) => !segment.isHidden).map(this.convertSegment.bind(this))
	}

	public convertToMongoSegment(segment: Segment): MongoSegment {
		return {
			externalId: '', // Todo: figure out where the value for this attribute is
			isHidden: false, // Todo: figure out where the value for this attribute is
			_id: new ObjectId(segment.id),
			name: segment.name,
			rundownId: segment.rundownId,
			_rank: segment.rank,
			isOnAir: segment.isOnAir(),
			isNext: segment.isNext(),
		}
	}

	public convertToMongoSegments(segments: Segment[]): MongoSegment[] {
		return segments.map(this.convertToMongoSegment.bind(this))
	}

	public convertPart(mongoPart: MongoPart): Part {
		return new Part({
			id: mongoPart._id.toString(),
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
		return mongoParts.map(this.convertPart.bind(this))
	}

	public convertToMongoPart(part: Part): MongoPart {
		return {
			expectedDuration: part.expectedDuration,
			title: part.name,
			_id: new ObjectId(part.id),
			segmentId: part.segmentId,
			_rank: part.rank,
			isOnAir: part.isOnAir(),
			isNext: part.isNext(),
		}
	}

	public convertToMongoParts(parts: Part[]): MongoPart[] {
		return parts.map(this.convertToMongoPart.bind(this))
	}

	public convertPiece(mongoPiece: MongoPiece): Piece {
		return new Piece({
			id: mongoPiece._id.toString(),
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

	public convertToMongoPiece(piece: Piece): MongoPiece {
		return {
			enable: { duration: piece.duration, start: piece.start },
			lifespan: piece.pieceLifeSpan,
			sourceLayerId: piece.layer,
			timelineObjectsString: '',
			_id: new ObjectId(piece.id),
			startPartId: piece.partId,
			name: piece.name,
		}
	}

	public convertToMongoPieces(pieces: Piece[]): MongoPiece[] {
		return pieces.map(this.convertToMongoPiece.bind(this))
	}

	public convertToMongoTimeline(timeline: Timeline): MongoTimeline {
		return {
			_id: new ObjectId('studio0'),
			timelineHash: '',
			generated: new Date().getTime(),
			timelineBlob: JSON.stringify(timeline.timelineObjects),
		}
	}

	public convertMongoAdLibPieceToIdentifier(mongoAdLibPiece: MongoAdLibPiece): Identifier {
		return {
			id: mongoAdLibPiece._id.toString(),
			name: mongoAdLibPiece.name,
		}
	}

	public convertMongoAdLibPiecesToIdentifiers(mongoAdLibPieces: MongoAdLibPiece[]): Identifier[] {
		return mongoAdLibPieces.map((piece) => this.convertMongoAdLibPieceToIdentifier(piece))
	}

	public convertAdLib(mongoAdLibPiece: MongoAdLibPiece): AdLibPiece {
		return new AdLibPiece({
			id: mongoAdLibPiece._id.toString(),
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
