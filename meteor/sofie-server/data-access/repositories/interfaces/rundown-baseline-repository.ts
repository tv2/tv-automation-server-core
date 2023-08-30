import { TimelineObject } from '../../../model/entities/timeline-object'

export interface RundownBaselineRepository {
	getRundownBaseline(rundownId: string): Promise<TimelineObject[]>
}
