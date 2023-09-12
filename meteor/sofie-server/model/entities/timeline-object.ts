import { TimelineObject as SuperFlyTimelineObject } from 'superfly-timeline'
import { TimelineEnable } from './timeline-enable'

export type TimelineObject = SuperFlyTimelineObject & {
	enable: TimelineEnable
	layer: string
	inGroup?: string
	children?: TimelineObject[]
}
