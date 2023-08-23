import { Piece } from './piece'
import { AdLibPiece } from './ad-lib-piece'
import { PieceLifespan } from '../enums/piece-lifespan'
import { PartTimings } from '../value-objects/part-timings'
import { UnsupportedOperation } from '../exceptions/unsupported-operation'
import { InTransition } from '../value-objects/in-transition'
import { OutTransition } from '../value-objects/out-transition'
import { AutoNext } from '../value-objects/auto-next'

export interface PartInterface {
	id: string
	segmentId: string
	name: string
	rank: number
	pieces: Piece[]
	isOnAir: boolean
	isNext: boolean
	expectedDuration: number

	inTransition: InTransition
	outTransition: OutTransition

	autoNext?: AutoNext
	disableNextInTransition: boolean
}

export class Part {
	readonly id: string
	readonly segmentId: string
	readonly name: string
	readonly rank: number

	readonly expectedDuration: number

	readonly inTransition: InTransition
	readonly outTransition: OutTransition

	readonly autoNext?: AutoNext
	readonly disableNextInTransition: boolean

	private pieces: Piece[]

	private isPartOnAir: boolean
	private isPartNext: boolean

	private adLibPieces: AdLibPiece[] = []

	private executedAt: number
	private timings?: PartTimings

	constructor(part: PartInterface) {
		this.id = part.id
		this.segmentId = part.segmentId
		this.name = part.name
		this.rank = part.rank
		this.pieces = part.pieces ?? []
		this.isPartOnAir = part.isOnAir
		this.isPartNext = part.isNext
		this.expectedDuration = part.expectedDuration

		this.inTransition = part.inTransition ?? { keepPreviousPartAliveDuration: 0, delayPiecesDuration: 0 }
		this.outTransition = part.outTransition ?? { keepAliveDuration: 0 }

		this.disableNextInTransition = part.disableNextInTransition
		this.autoNext = part.autoNext

		this.executedAt = 0
	}

	public putOnAir(): void {
		this.isPartOnAir = true

		const now: number = Date.now()
		this.executedAt = now
		this.pieces.forEach((piece) => piece.setExecutedAt(now))
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

	public getPieces(): Piece[] {
		return this.pieces
	}

	public setPieces(pieces: Piece[]): void {
		this.pieces = pieces
	}

	public addAdLibPiece(adLibPiece: AdLibPiece): void {
		this.adLibPieces.push(adLibPiece)
	}

	public getPiecesWithLifespan(lifespanFilters: PieceLifespan[]): Piece[] {
		return this.pieces.filter((piece) => lifespanFilters.includes(piece.pieceLifespan))
	}

	public getExecutedAt(): number {
		return this.executedAt
	}

	// TODO: This implementation currently reflects how Core implemented it. It's in dire need of a refactor.
	public calculateTimings(previousPart?: Part): void {
		const maxPreRollDurationFromPieces: number = this.pieces
			// Note: Core filters for !BlueprintPieceType.Normal and piece.enable.start !== 'now' - Will does Pieces ever have a PreRollDuration?
			.reduce((preRollDuration: number, piece: Piece) => Math.max(preRollDuration, piece.preRollDuration ?? 0), 0)

		const maxPostRollDurationForPieces: number = this.pieces
			.filter((piece) => !!piece.postRollDuration && !piece.duration)
			.reduce((postRollDuration: number, piece: Piece) => Math.max(postRollDuration, piece.postRollDuration), 0)

		let inTransition: InTransition | undefined
		let allowTransition: boolean = false

		if (previousPart /* && notInHold */) {
			if (previousPart.autoNext && previousPart.autoNext.overlap) {
				// Having "autoNext" & "autoNextOverLap" overrides the InTransition of the next Part.
				allowTransition = false
				inTransition = {
					keepPreviousPartAliveDuration: previousPart.autoNext.overlap,
					delayPiecesDuration: 0,
				}
			} else if (!previousPart.disableNextInTransition) {
				allowTransition = true
				inTransition = {
					keepPreviousPartAliveDuration: this.inTransition.keepPreviousPartAliveDuration ?? 0,
					delayPiecesDuration: this.inTransition.delayPiecesDuration ?? 0,
				}
			}
		}

		if (!inTransition || !previousPart) {
			const delayStartOfPiecesDuration: number = Math.max(
				0,
				previousPart?.outTransition.keepAliveDuration ?? 0,
				maxPreRollDurationFromPieces
			)

			this.timings = {
				inTransitionStart: undefined,
				delayStartOfPiecesDuration,
				postRollDuration: maxPostRollDurationForPieces,
				previousPartContinueIntoPartDuration:
					delayStartOfPiecesDuration + (previousPart?.getTimings().postRollDuration ?? 0),
			}
			return
		}

		const previousPartOutTransitionDuration: number = previousPart.outTransition.keepAliveDuration
			? previousPart.outTransition.keepAliveDuration - inTransition.keepPreviousPartAliveDuration
			: 0

		const preRollDurationConsideringDelay: number = maxPreRollDurationFromPieces - inTransition.delayPiecesDuration
		const delayStartOfPiecesDuration: number = Math.max(
			0,
			previousPartOutTransitionDuration,
			preRollDurationConsideringDelay
		)

		this.timings = {
			inTransitionStart: allowTransition ? delayStartOfPiecesDuration : undefined,
			delayStartOfPiecesDuration: delayStartOfPiecesDuration + inTransition.delayPiecesDuration,
			postRollDuration: maxPostRollDurationForPieces,
			previousPartContinueIntoPartDuration:
				delayStartOfPiecesDuration +
				inTransition.keepPreviousPartAliveDuration +
				previousPart.getTimings().postRollDuration,
		}
	}

	public getTimings(): PartTimings {
		if (!this.timings) {
			throw new UnsupportedOperation(`No Timings has been calculated for Part: ${this.id}`)
		}
		return this.timings
	}
}
