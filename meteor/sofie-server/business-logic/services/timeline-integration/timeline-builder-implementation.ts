import { TimelineBuilder } from '../interfaces/timeline-builder'
import { Rundown } from '../../../model/entities/rundown'
import { Timeline } from '../../../model/entities/timeline'

export class TimelineBuilderImplementation implements TimelineBuilder {
	public getBaseTimeline(): Timeline {
		return { timelineObjects: [] }
	}

	public buildTimeline(rundown: Rundown): Timeline {
		return {
			timelineObjects: rundown.getActivePart().getTimelineObjects(),
		}
	}
}
