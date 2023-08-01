import { Rundown } from '../../../model/entities/rundown'
import { Timeline } from '../../../model/entities/timeline'

export interface TimelineBuilder {
	getBaseTimeline(): Timeline
	buildTimeline(rundown: Rundown): Timeline
}
