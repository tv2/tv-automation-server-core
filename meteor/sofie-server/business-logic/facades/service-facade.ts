import { RundownService } from '../services/interfaces/rundown-service'
import { RundownEventService } from '../services/rundown-event-service'
import { RundownTimelineService } from '../services/timeline-integration/rundown-timeline-service'
import { RepositoryFacade } from '../../data-access/facades/repository-facade'
import { TimelineBuilder } from '../services/interfaces/timeline-builder'
import { TimelineBuilderImplementation } from '../services/timeline-integration/timeline-builder-implementation'
import { RundownEventBuilderImplementation } from '../services/rundown-event-builder-implementation'
import { RundownEventBuilder } from '../services/interfaces/rundown-event-builder'
import { RundownLockService } from '../services/rundown-lock-service'

export class ServiceFacade {
	public static createRundownService(): RundownService {
		const timelineService: RundownService = new RundownTimelineService(
			RundownEventService.getInstance(),
			RepositoryFacade.createRundownRepository(),
			RepositoryFacade.createTimelineRepository(),
			RepositoryFacade.createAdLibRepository(),
			ServiceFacade.createTimelineBuilder(),
			ServiceFacade.createRundownEventBuilder()
		)
		return RundownLockService.getInstance(timelineService)
	}

	public static createTimelineBuilder(): TimelineBuilder {
		return new TimelineBuilderImplementation()
	}

	public static createRundownEventBuilder(): RundownEventBuilder {
		return new RundownEventBuilderImplementation()
	}
}
