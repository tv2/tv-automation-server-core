import { Timeline } from '../../../model/entities/timeline'

export interface TimelineRepository {
	getTimeline(): Promise<Timeline>
	saveTimeline(timeline: Timeline): void
}
