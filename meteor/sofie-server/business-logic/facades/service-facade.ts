import { RundownService } from '../services/interfaces/rundown-service'
import { RundownEventService } from '../services/rundown-event-service'
import { RundownTimelineService } from '../services/timeline-integration/rundown-timeline-service'
import { RepositoryFacade } from '../../data-access/facades/repository-facade'
import { TimelineBuilder } from '../services/interfaces/timeline-builder'
import { SuperflyTimelineBuilder } from '../services/timeline-integration/superfly-timeline-builder'
import { RundownEventBuilderImplementation } from '../services/rundown-event-builder-implementation'
import { RundownEventBuilder } from '../services/interfaces/rundown-event-builder'

export class ServiceFacade {
	public static createRundownService(): RundownService {
		return new RundownTimelineService(
			RundownEventService.getInstance(),
			RepositoryFacade.createRundownRepository(),
			RepositoryFacade.createTimelineRepository(),
			RepositoryFacade.createAdLibRepository(),
			ServiceFacade.createTimelineBuilder(),
			ServiceFacade.createRundownEventBuilder()
		)
	}

	public static createTimelineBuilder(): TimelineBuilder {
		return new SuperflyTimelineBuilder()
	}

	public static createRundownEventBuilder(): RundownEventBuilder {
		return new RundownEventBuilderImplementation()
	}
}
