import { RundownEventType } from '../enums/rundown-event-type'

export interface RundownEvent {
	type: RundownEventType
	rundownId: string
	segmentId: string
	partId: string
}
