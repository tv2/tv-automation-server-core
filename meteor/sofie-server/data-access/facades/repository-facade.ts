import { RundownRepository } from '../repositories/interfaces/rundown-repository'
import { MongoRundownRepository } from '../repositories/mongo/mongo-rundown-repository'
import { MongoDatabase } from '../repositories/mongo/mongo-database'
import { MongoEntityConverter } from '../repositories/mongo/mongo-entity-converter'
import { SegmentRepository } from '../repositories/interfaces/segment-repository'
import { MongoSegmentRepository } from '../repositories/mongo/mongo-segment-repository'

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
