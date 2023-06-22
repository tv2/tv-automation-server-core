import { Segment } from './segment'

export interface Rundown {
	id: string
	name: string
	segments: Segment[]
	isActive: boolean
}
