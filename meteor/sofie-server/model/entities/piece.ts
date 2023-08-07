import { PieceType } from '../enums/piece-type'
import { TimelineObject } from './timeline-object'
import { PieceLifespan } from '../enums/piece-lifespan'

export interface PieceInterface {
	id: string
	partId: string
	name: string
	layer: string
	type: PieceType
	pieceLifespan: PieceLifespan
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
	pieceLifespan: PieceLifespan
	start: number
	duration: number
	timelineObjects: TimelineObject[]

	constructor(piece: PieceInterface) {
		this.id = piece.id
		this.partId = piece.partId
		this.name = piece.name
		this.layer = piece.layer
		this.type = piece.type
		this.pieceLifespan = piece.pieceLifespan
		this.start = piece.start
		this.duration = piece.duration
		this.timelineObjects = piece.timelineObjects
	}
}
