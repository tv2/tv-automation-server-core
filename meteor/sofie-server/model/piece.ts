import { PieceType } from './piece-type'

export interface Piece {
	id: string
	name: string
	type: PieceType
	expectedDuration: number
}
