import { Piece } from './piece'

export interface Part {
	id: string
	name: string
	pieces: Piece[],
	isOnAir: boolean,
	expectedDuration: number
}
