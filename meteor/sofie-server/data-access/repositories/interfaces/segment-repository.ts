import { Segment } from '../../../model/entities/segment'

export interface SegmentRepository {
	getSegments(rundownId: string): Promise<Segment[]>
	deleteSegmentsForRundown(rundownId: string): Promise<void>
}
