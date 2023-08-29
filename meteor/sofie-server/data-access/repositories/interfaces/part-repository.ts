import { Part } from '../../../model/entities/part'

export interface PartRepository {
	getParts(segmentId: string): Promise<Part[]>
	save(part: Part): Promise<void>
	deletePartsForSegment(segmentId: string): Promise<void>
}
