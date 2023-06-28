import { RundownService } from '../services/interfaces/rundown-service'
import { RundownEventService } from '../services/rundown-event-service'
import { RundownTimelineService } from '../services/timeline-integration/rundown-timeline-service'
import { RepositoryFacade } from '../../data-access/facades/repository-facade'

export class ServiceFacade {
	static createRundownService(): RundownService {
		// return new SofieCoreMeteorRundownService()
		return new RundownTimelineService(
			RundownEventService.getInstance(),
			RepositoryFacade.createRundownRepository(),
			RepositoryFacade.createTimelineRepository()
		)
	}
}
