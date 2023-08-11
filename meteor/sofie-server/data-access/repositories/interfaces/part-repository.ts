import { Part } from '../../../model/entities/part'

export interface PartRepository {
	getParts(segmentId: string): Promise<Part[]>

	deleteParts(segmentId: string): Promise<boolean>;
}
