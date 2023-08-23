import { Rundown } from '../../../model/entities/rundown'
import { RundownRepository } from '../interfaces/rundown-repository'
import { MongoEntityConverter, MongoRundown } from './mongo-entity-converter'
import { MongoDatabase } from './mongo-database'
import { SegmentRepository } from '../interfaces/segment-repository'
import { BaseMongoRepository } from './base-mongo-repository'
import { BasicRundown } from '../../../model/entities/basic-rundown'
import { DeletionFailedException } from '../../../model/exceptions/deletion-failed-exception'
import { NotFoundException } from '../../../model/exceptions/not-found-exception'

const RUNDOWN_COLLECTION_NAME: string = 'rundowns'

export class MongoRundownRepository extends BaseMongoRepository implements RundownRepository {
	constructor(
		mongoDatabase: MongoDatabase,
		mongoEntityConverter: MongoEntityConverter,
		private segmentRepository: SegmentRepository
	) {
		super(mongoDatabase, mongoEntityConverter)
	}

	protected getCollectionName(): string {
		return RUNDOWN_COLLECTION_NAME
	}

	public async getBasicRundowns(): Promise<BasicRundown[]> {
		this.assertDatabaseConnection(this.getBasicRundowns.name)
		const basicRundowns: MongoRundown[] = (await this.getCollection()
			.find({})
			.project({ _id: 1, name: 1, modified: 1 })
			.toArray()) as unknown as MongoRundown[]
		return this.mongoEntityConverter.convertBasicRundowns(basicRundowns)
	}

	public async getRundown(rundownId: string): Promise<Rundown> {
		this.assertDatabaseConnection(this.getRundown.name)
		const mongoRundown: MongoRundown = (await this.getCollection().findOne({
			_id: rundownId,
		})) as unknown as MongoRundown
		if (!mongoRundown) {
			throw new NotFoundException(`Failed to find a rundown with id: ${rundownId}`)
		}
		const rundown: Rundown = this.mongoEntityConverter.convertRundown(mongoRundown)
		rundown.setSegments(await this.segmentRepository.getSegments(rundown.id))
		return rundown
	}

	public saveRundown(_rundown: Rundown): void {
		throw new Error('Not implemented')
	}

	public async deleteRundown(rundownId: string): Promise<void> {
		this.assertDatabaseConnection(this.deleteRundown.name)
		const rundown = await this.getRundown(rundownId)
		await this.segmentRepository.deleteRundownSegments(rundownId)

		const rundownDeletionResult = await this.getCollection().deleteOne({
			_id: rundown.id,
		})

		// TODO: Figure out how to archive a 'false' acknowledgment, and add test case using that knowledge
		if (!rundownDeletionResult.acknowledged) {
			throw new DeletionFailedException(`Deletion of rundown was not acknowledged, for rundownId: ${rundownId}`)
		}
		if (rundownDeletionResult.deletedCount === 0) {
			throw new DeletionFailedException(
				`Expected to delete one rundown, but none was deleted, for rundownId: ${rundownId}`
			)
		}
	}
}
