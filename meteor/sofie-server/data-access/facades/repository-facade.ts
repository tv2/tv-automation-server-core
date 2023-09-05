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
import { AdLibPieceRepository } from '../repositories/interfaces/ad-lib-piece-repository'
import { MongoAdLibPieceRepository } from '../repositories/mongo/mongo-ad-lib-piece-repository'
import { CachedRundownRepository } from '../repositories/cache/cached-rundown-repository'
import { MongoRundownPlaylistRepository } from '../repositories/mongo/mongo-rundown-playlist-repository'
import { RundownBaselineRepository } from '../repositories/interfaces/rundown-baseline-repository'
import { MongoRundownBaselineRepository } from '../repositories/mongo/mongo-rundown-baseline-repository'
import { StudioRepository } from '../repositories/interfaces/studio-repository'
import { CachedStudioRepository } from '../repositories/cache/cached-studio-repository'
import { MongoStudioRepository } from '../repositories/mongo/mongo-studio-repository'

export class RepositoryFacade {
	public static createRundownRepository(): RundownRepository {
		const mongoRundownRepository: RundownRepository = new MongoRundownRepository(
			MongoDatabase.getInstance(),
			new MongoEntityConverter(),
			this.createRundownBaselineRepository(),
			this.createSegmentRepository()
		)

		const mongoRundownPlaylistRepository: RundownRepository = new MongoRundownPlaylistRepository(
			MongoDatabase.getInstance(),
			new MongoEntityConverter(),
			mongoRundownRepository
		)
		return CachedRundownRepository.getInstance(mongoRundownPlaylistRepository)
	}

	public static createRundownBaselineRepository(): RundownBaselineRepository {
		return new MongoRundownBaselineRepository(MongoDatabase.getInstance(), new MongoEntityConverter())
	}

	public static createSegmentRepository(): SegmentRepository {
		return new MongoSegmentRepository(
			MongoDatabase.getInstance(),
			new MongoEntityConverter(),
			this.createPartRepository()
		)
	}

	public static createPartRepository(): PartRepository {
		return new MongoPartRepository(
			MongoDatabase.getInstance(),
			new MongoEntityConverter(),
			this.createPieceRepository()
		)
	}

	public static createPieceRepository(): PieceRepository {
		return new MongoPieceRepository(MongoDatabase.getInstance(), new MongoEntityConverter())
	}

	public static createTimelineRepository(): TimelineRepository {
		return new MongoTimelineRepository(MongoDatabase.getInstance(), new MongoEntityConverter())
	}

	public static createAdLibRepository(): AdLibPieceRepository {
		return new MongoAdLibPieceRepository(MongoDatabase.getInstance(), new MongoEntityConverter())
	}

	public static createStudioRepository(): StudioRepository {
		const studioRepository: StudioRepository = new MongoStudioRepository(
			MongoDatabase.getInstance(),
			new MongoEntityConverter()
		)
		return CachedStudioRepository.getInstance(studioRepository)
	}
}
