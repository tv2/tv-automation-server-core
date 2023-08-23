import { Part } from './part'
import { LastPartInSegmentException } from '../exceptions/last-part-in-segment-exception'
import { NotFoundException } from '../exceptions/not-found-exception'
import { Piece } from './piece'

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

	private infinitePieces: Map<string, Piece> = new Map()

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

	public addInfinitePieces(infinitePieces: Piece[]): void {
		infinitePieces.forEach((piece: Piece) => this.infinitePieces.set(piece.layer, piece))
	}

	public getInfinitePieces(): Piece[] {
		return Array.from(this.infinitePieces.values())
	}
}
