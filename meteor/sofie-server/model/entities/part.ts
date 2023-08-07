import { Piece } from './piece'
import { TimelineObject } from './timeline-object'
import { AdLibPiece } from './ad-lib-piece'
import { PieceLifespan } from '../enums/piece-lifespan'

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

	private adLibPieces: AdLibPiece[] = []

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

	public putOnAir(): void {
		this.isPartOnAir = true
	}

	public takeOffAir(): void {
		this.isPartOnAir = false
	}

	public isOnAir(): boolean {
		return this.isPartOnAir
	}

	public setAsNext(): void {
		this.isPartNext = true
	}

	public removeAsNext(): void {
		this.isPartNext = false
	}

	public isNext(): boolean {
		return this.isPartNext
	}

	public getTimelineObjects(): TimelineObject[] {
		const now: number = new Date().getTime()
		const adLibTimelineObjects: TimelineObject[] = this.adLibPieces
			.filter((piece) => this.shouldAdLibPieceBeShown(piece, now))
			.flatMap((piece) => piece.timelineObjects)
		const pieceTimelineObjects: TimelineObject[] = this.pieces.flatMap((piece) => piece.timelineObjects)
		return adLibTimelineObjects.concat(pieceTimelineObjects)
	}

	private shouldAdLibPieceBeShown(adLibPiece: AdLibPiece, executionTime: number): boolean {
		return (
			adLibPiece.getExecutedAt() > 0 &&
			adLibPiece.getExecutedAt() <= executionTime &&
			adLibPiece.getExecutedAt() + adLibPiece.duration > executionTime
		)
	}

	public addAdLibPiece(adLibPiece: AdLibPiece): void {
		this.adLibPieces.push(adLibPiece)
	}

	public getPieces(lifespanFilters: PieceLifespan[]): Piece[] {
		return this.pieces.filter((piece) => lifespanFilters.includes(piece.pieceLifespan))
	}
}
