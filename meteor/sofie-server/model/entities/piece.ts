import { PieceType } from '../enums/piece-type'
import { TimelineObject } from './timeline-object'
import { PieceLifespan } from '../enums/piece-lifespan'
import { TransitionType } from '../enums/transition-type'

export interface PieceInterface {
	id: string
	partId: string
	name: string
	layer: string
	type: PieceType
	pieceLifespan: PieceLifespan
	start: number
	duration: number
	preRollDuration: number
	postRollDuration: number
	transitionType: TransitionType
	timelineObjects: TimelineObject[]

	metaData?: unknown
	content?: unknown
	tags: string[]
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
	preRollDuration: number
	postRollDuration: number
	transitionType: TransitionType
	timelineObjects: TimelineObject[]

	readonly metaData?: unknown
	content?: unknown
	tags: string[]

	private executedAt: number

	constructor(piece: PieceInterface) {
		this.id = piece.id
		this.partId = piece.partId
		this.name = piece.name
		this.layer = piece.layer
		this.type = piece.type
		this.pieceLifespan = piece.pieceLifespan
		this.start = piece.start
		this.duration = piece.duration
		this.preRollDuration = piece.preRollDuration
		this.postRollDuration = piece.postRollDuration
		this.transitionType = piece.transitionType
		this.timelineObjects = piece.timelineObjects

		this.metaData = piece.metaData
		this.content = piece.content
		this.tags = piece.tags
	}

	public setExecutedAt(executedAt: number): void {
		if (this.pieceLifespan === PieceLifespan.WITHIN_PART) {
			// Only care about executedAt for infinite Pieces
			// since Pieces within Part always needs to be "executed" when the Part is taken.
			return
		}
		this.executedAt = executedAt
	}

	public resetExecutedAt(): void {
		this.executedAt = 0
	}

	public getExecutedAt(): number {
		return this.executedAt
	}
}
