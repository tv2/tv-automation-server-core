import { SegmentRepository } from '../interfaces/segment-repository'
import { Segment } from '../../../model/entities/segment'
import { MongoDatabase } from './mongo-database'
import { MongoEntityConverter, MongoSegment } from './mongo-entity-converter'
import { BaseMongoRepository } from './base-mongo-repository'
import { PartRepository } from '../interfaces/part-repository'
import { DeletionFailedException } from '../../../model/exceptions/deletion-failed-exception'
import { DeleteResult } from 'mongodb'

const SEGMENT_COLLECTION_NAME: string = 'segments'

export class MongoSegmentRepository extends BaseMongoRepository implements SegmentRepository {
	constructor(
		mongoDatabase: MongoDatabase,
		mongoEntityConverter: MongoEntityConverter,
		private partRepository: PartRepository
	) {
		super(mongoDatabase, mongoEntityConverter)
	}

	protected getCollectionName(): string {
		return SEGMENT_COLLECTION_NAME
	}

	public async getSegments(rundownId: string): Promise<Segment[]> {
		this.assertDatabaseConnection(this.getSegments.name)
		const mongoSegments: MongoSegment[] = (await this.getCollection()
			.find({ rundownId: rundownId })
			.toArray()) as unknown as MongoSegment[]
		const segments: Segment[] = this.mongoEntityConverter.convertSegments(mongoSegments)
		return Promise.all(
			segments.map(async (segment) => {
				segment.setParts(await this.partRepository.getParts(segment.id))
				return segment
			})
		)
	}

	public async saveSegment(segment: Segment): Promise<void> {
		const mongoSegment: MongoSegment = this.mongoEntityConverter.convertToMongoSegment(segment)
		await this.getCollection().updateOne({ _id: segment.id }, { $set: mongoSegment })
		for (const part of segment.getParts()) {
			await this.partRepository.savePart(part)
		}
	}

	public async deleteSegmentsForRundown(rundownId: string): Promise<void> {
		this.assertDatabaseConnection(this.deleteSegmentsForRundown.name)
		const segments: Segment[] = await this.getSegments(rundownId)

		await Promise.all(segments.map(async (segment) => this.partRepository.deletePartsForSegment(segment.id)))

		const segmentDeleteResult: DeleteResult = await this.getCollection().deleteMany({ rundownId: rundownId })

		if (!segmentDeleteResult.acknowledged) {
			throw new DeletionFailedException(`Deletion of segments was not acknowledged, for rundownId: ${rundownId}`)
		}
		if (segmentDeleteResult.deletedCount === 0) {
			throw new DeletionFailedException(
				`Expected to delete one or more segments, but none was deleted, for rundownId: ${rundownId}`
			)
		}
	}
}
