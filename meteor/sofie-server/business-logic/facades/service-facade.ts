import { RundownService } from '../services/interfaces/rundown-service'
import { RundownTimelineService } from '../services/rundown-timeline-service'
import { RundownEventService } from '../services/rundown-event-service'

export class ServiceFacade {
	static createRundownService(): RundownService {
		// return new SofieCoreMeteorRundownService()
		return new RundownTimelineService(RundownEventService.getInstance())
	}
}
