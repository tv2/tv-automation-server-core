import { TimelineBuilder } from '../interfaces/timeline-builder'
import { Rundown } from '../../../model/entities/rundown'
import { Timeline } from '../../../model/entities/timeline'
import { Resolver } from 'superfly-timeline'
import { TimelineObject } from '../../../model/entities/timeline-object'

export class SuperflyTimelineBuilder implements TimelineBuilder {
	public getBaseTimeline(): Timeline {
		return { timelineObjects: [] }
	}

	public buildTimeline(rundown: Rundown): Timeline {
		// TODO: Work in progress
		const timelineObjectsToResolve: TimelineObject[] = []
		timelineObjectsToResolve.push(...rundown.getActivePart().getTimelineObjects())
		Resolver.resolveTimeline(timelineObjectsToResolve, { time: Date.now() })
		return {
			timelineObjects: rundown.getActivePart().getTimelineObjects(),
		}
	}
}
