import { Part } from '../../model/entities/part'
import { PieceDto } from './piece-dto'

export class PartDto {
	readonly id: string
	readonly segmentId: string
	readonly name: string
	readonly pieces: PieceDto[]
	readonly isOnAir: boolean
	readonly isNext: boolean

	constructor(part: Part) {
		this.id = part.id
		this.segmentId = part.segmentId
		this.name = part.name
		this.pieces = part.getPieces().map((piece) => new PieceDto(piece))
		this.isOnAir = part.isOnAir()
		this.isNext = part.isNext()
	}
}
