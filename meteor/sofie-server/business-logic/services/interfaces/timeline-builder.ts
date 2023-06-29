import { Rundown } from "../../../model/entities/rundown";
import { Timeline } from '../../../model/entities/timeline'

export interface TimelineBuilder {
	buildTimeline(rundown: Rundown): Timeline
}
