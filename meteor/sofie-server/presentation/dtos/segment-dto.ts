import { PartDto } from './part-dto'
import { Segment } from '../../model/entities/segment'

export class SegmentDto {
	readonly id: string
	readonly rundownId: string
	readonly name: string
	readonly parts: PartDto[]
	readonly isOnAir: boolean
	readonly isNext: boolean

	constructor(segment: Segment) {
		this.id = segment.id
		this.rundownId = segment.rundownId
		this.name = segment.name
		this.parts = segment.getParts().map((part) => new PartDto(part))
		this.isOnAir = segment.isOnAir()
		this.isNext = segment.isNext()
	}
}
