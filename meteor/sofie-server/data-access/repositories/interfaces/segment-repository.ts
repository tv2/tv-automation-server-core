import { Segment } from '../../../model/entities/segment'

export interface SegmentRepository {
	getSegments(rundownId: string): Promise<Segment[]>
	deleteRundownSegments(rundownId: string): Promise<void>
}
