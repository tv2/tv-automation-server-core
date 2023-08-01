import { PieceType } from '../enums/piece-type'
import { TimelineObject } from './timeline-object'
import { PieceLifeSpan } from '../enums/piece-life-span'

export interface PieceInterface {
	id: string
	partId: string
	name: string
	layer: string
	type: PieceType
	pieceLifeSpan: PieceLifeSpan
	start: number
	duration: number
	timelineObjects: TimelineObject[]
}

export class Piece {
	readonly id: string
	readonly partId: string
	name: string
	layer: string
	type: PieceType
	pieceLifeSpan: PieceLifeSpan
	start: number
	duration: number
	timelineObjects: TimelineObject[]

	constructor(piece: PieceInterface) {
		this.id = piece.id
		this.partId = piece.partId
		this.name = piece.name
		this.layer = piece.layer
		this.type = piece.type
		this.pieceLifeSpan = piece.pieceLifeSpan
		this.start = piece.start
		this.duration = piece.duration
		this.timelineObjects = piece.timelineObjects
	}
}
