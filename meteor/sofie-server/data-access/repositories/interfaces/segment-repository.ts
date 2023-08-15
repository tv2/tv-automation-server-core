import { Segment } from '../../../model/entities/segment'

export interface SegmentRepository {
	getSegments(rundownId: string): Promise<Segment[]>
	deleteSegments(rundownId: string): Promise<void>;
}
