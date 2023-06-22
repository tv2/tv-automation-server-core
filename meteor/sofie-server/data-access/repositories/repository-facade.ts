import { RundownRepository } from './rundown-repository'
import { MongoRundownRepository } from './mongo/mongo-rundown-repository'
import { MongoDatabase } from './mongo/mongo-database'
import { MongoEntityConverter } from './mongo/mongo-entity-converter'
import { SegmentRepository } from './segment-repository'
import { MongoSegmentRepository } from './mongo/mongo-segment-repository'

export class RepositoryFacade {
	static createRundownRepository(): RundownRepository {
		return new MongoRundownRepository(
			MongoDatabase.getInstance(),
			new MongoEntityConverter(),
			RepositoryFacade.createSegmentRepository()
		)
	}

	static createSegmentRepository(): SegmentRepository {
		return new MongoSegmentRepository(MongoDatabase.getInstance(), new MongoEntityConverter())
	}
}
