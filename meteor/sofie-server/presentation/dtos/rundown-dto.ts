import { SegmentDto } from './segment-dto'
import { Rundown } from '../../model/entities/rundown'

export class RundownDto {
	readonly id: string
	readonly name: string
	readonly segments: SegmentDto[]
	readonly isActive: boolean

	constructor(rundown: Rundown) {
		this.id = rundown.id
		this.name = rundown.name
		this.segments = rundown.getSegments().map(segment => new SegmentDto(segment))
		this.isActive = rundown.isActive()
	}
}
