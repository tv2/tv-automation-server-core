import { PieceType } from '../enums/piece-type'
import { TimelineObject } from './timeline-object'

export interface PieceInterface {
	id: string
	partId: string
	name: string
	type: PieceType
	start: number
	duration: number
	timelineObjects: TimelineObject[]
}

export class Piece {
	readonly id: string
	readonly partId: string
	name: string
	type: PieceType
	start: number
	duration: number
	timelineObjects: TimelineObject[]

	constructor(piece: PieceInterface) {
		this.id = piece.id
		this.partId = piece.partId
		this.name = piece.name
		this.type = piece.type
		this.start = piece.start
		this.duration = piece.duration
		this.timelineObjects = piece.timelineObjects
	}

}
