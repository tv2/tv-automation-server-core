import { Segment } from '../../model/segment'

export interface SegmentRepository {
	getSegments(rundownId: string): Promise<Segment[]>
}
