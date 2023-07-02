import { Piece } from '../../model/entities/piece'

export class PieceDto {
	readonly id: string
	readonly partId: string
	readonly name: string
	readonly start: number
	readonly duration: number
	readonly layer: string

	constructor(piece: Piece) {
		this.id = piece.id
		this.partId = piece.partId
		this.name = piece.name
		this.start = piece.start
		this.duration = piece.duration
		this.layer = piece.layer
	}
}
