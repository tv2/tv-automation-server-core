import { Segment } from '../../../model/entities/segment'

export interface SegmentRepository {
	getSegments(rundownId: string): Promise<Segment[]>
	save(segment: Segment): Promise<void>
	deleteSegmentsForRundown(rundownId: string): Promise<void>
}
