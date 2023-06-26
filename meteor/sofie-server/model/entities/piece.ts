import { PieceType } from '../enums/piece-type'

export interface Piece {
	id: string
	name: string
	type: PieceType
	start: number
	duration: number
}
