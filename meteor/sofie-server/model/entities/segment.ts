import { Part } from './part'
import { LastPartInSegmentException } from '../exceptions/last-part-in-segment-exception'
import { NotFoundException } from '../exceptions/not-found-exception'

export interface SegmentInterface {
	id: string
	rundownId: string
	name: string
	rank: number
	parts: Part[]
	isOnAir: boolean
}

export class Segment {
	readonly id: string
	readonly rundownId: string
	name: string
	rank: number
	isOnAir: boolean

	private parts: Part[]

	constructor(segment: SegmentInterface) {
		this.id = segment.id
		this.rundownId = segment.rundownId
		this.name = segment.name
		this.rank = segment.rank
		this.isOnAir = segment.isOnAir

		this.setParts(segment.parts ?? [])
	}

	findFirstPart(): Part {
		return this.parts[0]
	}

	putOnAir(): void {
		this.isOnAir = true
	}

	takeOffAir(): void {
		this.isOnAir = false
	}

	findNextPart(fromPart: Part): Part {
		const fromPartIndex: number = this.parts.findIndex(part => part.id === fromPart.id)
		if (fromPartIndex === -1) {
			throw new NotFoundException(`Part does not exist in Segment`)
		}
		if (fromPartIndex + 1 === this.parts.length) {
			throw new LastPartInSegmentException()
		}
		return this.parts[fromPartIndex + 1]
	}

	setParts(parts: Part[]): void {
		this.parts = parts.sort((partOne: Part, partTwo: Part) => partOne.rank - partTwo.rank)
	}
}
