import { Part } from '../../../model/entities/part'

export interface PartRepository {
	getParts(segmentId: string): Promise<Part[]>
	savePart(part: Part): Promise<void>
	deletePartsForSegment(segmentId: string): Promise<void>
}
