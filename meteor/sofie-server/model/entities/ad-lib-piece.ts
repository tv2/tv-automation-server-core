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

	private executedAt?: number

	constructor(adLib: AdLibPieceInterface) {
		this.id = adLib.id
		this.rundownId = adLib.rundownId
		this.name = adLib.name
		this.duration = adLib.duration
		this.timelineObjects = adLib.timelineObjects
	}

	public setExecutedAt(executionTime: number): void {
		this.executedAt = executionTime
		if (this.duration <= 0) {
			return
		}
		this.hackSetProperEnableBecauseOfTheWayOurBlueprintsGenerateEnableForAdLibHtmlGraphics()
	}

	private hackSetProperEnableBecauseOfTheWayOurBlueprintsGenerateEnableForAdLibHtmlGraphics(): void {
		this.timelineObjects = this.timelineObjects.map((object) => {
			if (object.enable && object.enable['while'] === '!.full') {
				object.enable['while'] = undefined
				object.enable['start'] = this.executedAt
				object.enable['duration'] = this.duration
			}
			return object
		})
	}

	public getExecutedAt(): number {
		return this.executedAt ?? 0
	}
}
