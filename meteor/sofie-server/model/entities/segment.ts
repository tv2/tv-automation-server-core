import { Part } from './part'
import { LastPartInSegmentException } from '../exceptions/last-part-in-segment-exception'
import { NotFoundException } from '../exceptions/not-found-exception'
import { Piece } from './piece'
import { PieceLifespan } from '../enums/piece-lifespan'

export interface SegmentInterface {
	id: string
	rundownId: string
	name: string
	rank: number
	parts: Part[]
	isOnAir: boolean
	isNext: boolean
}

export class Segment {
	readonly id: string
	readonly rundownId: string
	name: string
	rank: number

	private isSegmentOnAir: boolean
	private isSegmentNext: boolean
	private parts: Part[]

	constructor(segment: SegmentInterface) {
		this.id = segment.id
		this.rundownId = segment.rundownId
		this.name = segment.name
		this.rank = segment.rank
		this.isSegmentOnAir = segment.isOnAir
		this.isSegmentNext = segment.isNext

		this.setParts(segment.parts ?? [])
	}

	public findFirstPart(): Part {
		return this.parts[0]
	}

	public putOnAir(): void {
		this.isSegmentOnAir = true
	}

	public takeOffAir(): void {
		this.isSegmentOnAir = false
	}

	public isOnAir(): boolean {
		return this.isSegmentOnAir
	}

	public setAsNext(): void {
		this.isSegmentNext = true
	}

	public removeAsNext(): void {
		this.isSegmentNext = false
	}

	public isNext(): boolean {
		return this.isSegmentNext
	}

	public findNextPart(fromPart: Part): Part {
		const fromPartIndex: number = this.parts.findIndex((part) => part.id === fromPart.id)
		if (fromPartIndex === -1) {
			throw new NotFoundException(`Part does not exist in Segment`)
		}
		if (fromPartIndex + 1 === this.parts.length) {
			throw new LastPartInSegmentException()
		}
		return this.parts[fromPartIndex + 1]
	}

	public findPart(partId: string): Part {
		const part: Part | undefined = this.parts.find((part) => part.id === partId)
		if (!part) {
			throw new NotFoundException(`Part "${partId}" does not exist in Segment "${this.id}"`)
		}
		return part
	}

	public setParts(parts: Part[]): void {
		this.parts = parts.sort((partOne: Part, partTwo: Part) => partOne.rank - partTwo.rank)
	}

	public getParts(): Part[] {
		return this.parts
	}

	public getFirstSpanningPieceForEachLayerBeforePart(part: Part, layersToIgnore: Set<string>): Piece[] {
		const indexOfPart = this.parts.findIndex(p => p.id === part.id)
		return this.getPiecesFromIndex(indexOfPart - 1, layersToIgnore, [PieceLifespan.SPANNING_UNTIL_RUNDOWN_END, PieceLifespan.SPANNING_UNTIL_SEGMENT_END])
	}

	private getPiecesFromIndex(startIndex: number, layersToIgnore: Set<string>, lifespanFilters: PieceLifespan[]): Piece[] {
		const pieces: Piece[] = []

		for (let i = startIndex; i >= 0; i--) {
			const piecesSpanningSegment: Piece[] = this.parts[i].getPieces(lifespanFilters)
			for (let j = piecesSpanningSegment.length - 1; j >= 0; j--) {
				const piece: Piece = piecesSpanningSegment[j]
				if (layersToIgnore.has(piece.layer)) {
					continue
				}
				pieces.push(piece)
				layersToIgnore.add(piece.layer)
			}
		}

		return pieces
	}

	public getFirstSpanningRundownPieceForEachLayerForAllParts(layersToIgnore: Set<string>): Piece[] {
		return this.getPiecesFromIndex(this.parts.length - 1, layersToIgnore, [PieceLifespan.SPANNING_UNTIL_RUNDOWN_END])
	}

	public doesPieceBelongToSegment(piece: Piece): boolean {
		return this.parts.findIndex(part => part.id === piece.partId) >= 0
	}
}
