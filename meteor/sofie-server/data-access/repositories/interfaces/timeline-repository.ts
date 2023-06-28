import { Timeline } from '../../../model/entities/timeline'

export interface TimelineRepository {
	saveTimeline(timeline: Timeline): void
}
