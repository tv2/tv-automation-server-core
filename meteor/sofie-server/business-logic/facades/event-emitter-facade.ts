import { RundownEventListener } from '../services/interfaces/rundown-event-listener'
import { RundownEventService } from '../services/rundown-event-service'

export class EventEmitterFacade {
	static createRundownEventListener(): RundownEventListener {
		return RundownEventService.getInstance()
	}
}
