import { TimelineObject } from './timeline-object'

export interface AdLibPieceInterface {
	id: string
	rundownId: string
	name: string
	duration: number
	timelineObjects: TimelineObject[]
}

export class AdLibPiece {
	id: string
	rundownId: string
	name: string
	duration: number
	timelineObjects: TimelineObject[]

	executedAt?: number

	constructor(adLib: AdLibPieceInterface) {
		this.id = adLib.id
		this.rundownId = adLib.rundownId
		this.name = adLib.name
		this.duration = adLib.duration
		this.timelineObjects = adLib.timelineObjects
	}
}
