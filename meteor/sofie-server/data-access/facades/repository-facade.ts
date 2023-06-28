import { RundownRepository } from '../repositories/interfaces/rundown-repository'
import { MongoRundownRepository } from '../repositories/mongo/mongo-rundown-repository'
import { MongoDatabase } from '../repositories/mongo/mongo-database'
import { MongoEntityConverter } from '../repositories/mongo/mongo-entity-converter'
import { SegmentRepository } from '../repositories/interfaces/segment-repository'
import { MongoSegmentRepository } from '../repositories/mongo/mongo-segment-repository'
import { PartRepository } from '../repositories/interfaces/part-repository'
import { PieceRepository } from '../repositories/interfaces/piece-repository'
import { MongoPieceRepository } from '../repositories/mongo/mongo-piece-repository'
import { MongoPartRepository } from '../repositories/mongo/mongo-part-repository'
import { TimelineRepository } from '../repositories/interfaces/timeline-repository'
import { MongoTimelineRepository } from '../repositories/mongo/mongo-timeline-repository'
import { CachedRundownRepository } from '../repositories/cache/cached-rundown-repository'

export class RepositoryFacade {
	static createRundownRepository(): RundownRepository {
		return CachedRundownRepository.getInstance(
			new MongoRundownRepository(
				MongoDatabase.getInstance(),
				new MongoEntityConverter(),
				this.createSegmentRepository()
			)
		)
	}

	static createSegmentRepository(): SegmentRepository {
		return new MongoSegmentRepository(
			MongoDatabase.getInstance(),
			new MongoEntityConverter(),
			this.createPartRepository()
		)
	}

	static createPartRepository(): PartRepository {
		return new MongoPartRepository(
			MongoDatabase.getInstance(),
			new MongoEntityConverter(),
			this.createPieceRepository()
		)
	}

	static createPieceRepository(): PieceRepository {
		return new MongoPieceRepository(
			MongoDatabase.getInstance(),
			new MongoEntityConverter()
		)
	}

	static createTimelineRepository(): TimelineRepository {
		return new MongoTimelineRepository(
			MongoDatabase.getInstance(),
			new MongoEntityConverter()
		)
	}
}
