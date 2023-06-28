import { Rundown } from '../../../model/entities/rundown'
import { Segment } from '../../../model/entities/segment'
import { Part } from '../../../model/entities/part'
import { Piece } from '../../../model/entities/piece'
import { PieceType } from '../../../model/enums/piece-type'
import { Timeline } from '../../../model/entities/timeline'

export interface MongoRundown {
	_id: string
	externalId: string,
	name: string,
	timing: {
		type: string
		expectedStart: number
		expectedDuration: number
		expectedEnd: number
	}
	playlistExternalId: string,
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
	rundownId: string,
	externalId: string
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
	enable: {
		start: number
		duration: number
	}
	timelineObjectsString: string
}

export interface MongoTimeline {
	_id: string
	timelineHash: string
	generated: number
	timelineBlob: string
}

export class MongoEntityConverter {

	convertRundown(mongoRundown: MongoRundown): Rundown {
		return new Rundown({
				id: mongoRundown._id,
				name: mongoRundown.name,
				isActive: false,
				segments: []
			}
		)
	}

	convertRundowns(mongoRundowns: MongoRundown[]): Rundown[] {
		return mongoRundowns.map(this.convertRundown)
	}

	convertSegment(mongoSegment: MongoSegment): Segment {
		return new Segment({
				id: mongoSegment._id,
				rundownId: mongoSegment.rundownId,
				name: mongoSegment.name,
				rank: mongoSegment._rank,
				isOnAir: false,
				parts: []
			}
		)
	}

	convertSegments(mongoSegments: MongoSegment[]): Segment[] {
		return mongoSegments.map(this.convertSegment)
	}

	convertPart(mongoPart: MongoPart): Part {
		return new Part({
				id: mongoPart._id,
				segmentId: mongoPart.segmentId,
				name: mongoPart.title,
				rank: mongoPart._rank,
				expectedDuration: mongoPart.expectedDuration,
				isOnAir: false,
				pieces: []
			}
		)
	}

	convertParts(mongoParts: MongoPart[]): Part[] {
		return mongoParts.map(this.convertPart)
	}

	convertPiece(mongoPiece: MongoPiece): Piece {
		return new Piece({
				id: mongoPiece._id,
				partId: mongoPiece.startPartId,
				name: mongoPiece.name,
				type: PieceType.UNKNOWN,
				start: mongoPiece.enable.start,
				duration: mongoPiece.enable.duration,
				timelineObjects: JSON.parse(mongoPiece.timelineObjectsString)
			}
		)
	}

	convertPieces(mongoPieces: MongoPiece[]): Piece[] {
		return mongoPieces.map(this.convertPiece)
	}

	convertToMongoTimeline(timeline: Timeline): MongoTimeline {
		return {
			_id: 'studio0',
			timelineHash: '',
			generated: new Date().getTime(),
			timelineBlob: JSON.stringify(timeline.timelineObjects)
		}
	}
}
