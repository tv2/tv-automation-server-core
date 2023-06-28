import { Piece } from './piece'
import { TimelineObject } from './timeline-object'

export interface PartInterface {
	id: string
	segmentId: string
	name: string
	rank: number
	pieces: Piece[]
	isOnAir: boolean
	expectedDuration: number
}

export class Part {
	readonly id: string
	readonly segmentId: string
	name: string
	rank: number
	pieces: Piece[]
	isOnAir: boolean
	expectedDuration: number

	constructor(part: PartInterface) {
		this.id = part.id
		this.segmentId = part.segmentId
		this.name = part.name
		this.rank = part.rank
		this.pieces = part.pieces ?? []
		this.isOnAir = part.isOnAir
		this.expectedDuration = part.expectedDuration
	}

	putOnAir(): void {
		this.isOnAir = true
	}

	takeOffAir(): void {
		this.isOnAir = false
	}

	getTimelineObjects(): TimelineObject[] {
		return this.pieces.flatMap(piece => piece.timelineObjects)
	}
}
