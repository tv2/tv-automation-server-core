import { Rundown } from '../../../model/entities/rundown'
import { Timeline } from '../../../model/entities/timeline'
import { Studio } from '../../../model/entities/studio'

export interface TimelineBuilder {
	getBaseTimeline(): Timeline
	buildTimeline(rundown: Rundown, studio: Studio): Timeline
}
