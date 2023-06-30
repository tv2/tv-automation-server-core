import { Piece } from './piece'
import { TimelineObject } from './timeline-object'

export interface PartInterface {
	id: string
	segmentId: string
	name: string
	rank: number
	pieces: Piece[]
	isOnAir: boolean
	isNext: boolean
	expectedDuration: number
}

export class Part {
	readonly id: string
	readonly segmentId: string
	name: string
	rank: number
	pieces: Piece[]
	expectedDuration: number

	private isPartOnAir: boolean
	private isPartNext: boolean

	constructor(part: PartInterface) {
		this.id = part.id
		this.segmentId = part.segmentId
		this.name = part.name
		this.rank = part.rank
		this.pieces = part.pieces ?? []
		this.isPartOnAir = part.isOnAir
		this.isPartNext = part.isNext
		this.expectedDuration = part.expectedDuration
	}

	putOnAir(): void {
		this.isPartOnAir = true
	}

	takeOffAir(): void {
		this.isPartOnAir = false
	}

	isOnAir(): boolean {
		return this.isPartOnAir
	}

	setAsNext(): void {
		this.isPartNext = true
	}

	removeAsNext(): void {
		this.isPartNext = false
	}

	isNext(): boolean {
		return this.isPartNext
	}

	getTimelineObjects(): TimelineObject[] {
		return this.pieces.flatMap(piece => piece.timelineObjects)
	}
}
