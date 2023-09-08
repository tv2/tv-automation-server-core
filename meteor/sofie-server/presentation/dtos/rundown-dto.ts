import { SegmentDto } from './segment-dto'
import { Rundown } from '../../model/entities/rundown'
import { PieceDto } from './piece-dto'

export class RundownDto {
	readonly id: string
	readonly name: string
	readonly isActive: boolean
	readonly infinitePieces: PieceDto[]
	readonly segments: SegmentDto[]
	readonly modifiedAt: number

	constructor(rundown: Rundown) {
		this.id = rundown.id
		this.name = rundown.name
		this.isActive = rundown.isActive() ?? false
		this.infinitePieces = rundown.getInfinitePieces().map((piece) => new PieceDto(piece))
		this.segments = rundown.getSegments().map((segment) => new SegmentDto(segment))
		this.modifiedAt = rundown.getLastTimeModified()
	}
}
