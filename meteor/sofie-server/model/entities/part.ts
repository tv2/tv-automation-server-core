import { Piece } from './piece'

export interface Part {
	id: string
	name: string
	rank: number
	pieces: Piece[]
	isOnAir: boolean
	expectedDuration: number
}
