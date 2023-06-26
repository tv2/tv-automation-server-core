import { Part } from './part'

export interface Segment {
	id: string
	name: string
	rank: number
	parts: Part[]
	isOnAir: boolean
}
