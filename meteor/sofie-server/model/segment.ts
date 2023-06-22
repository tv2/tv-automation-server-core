import { Part } from './part'

export interface Segment {
	id: string
	name: string
	parts: Part[]
	isOnAir: boolean
}
