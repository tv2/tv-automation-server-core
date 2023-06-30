import { RundownEvent } from '../../../model/interfaces/rundown-event'

export interface RundownEventEmitter {
	emitRundownEvent(rundownEvent: RundownEvent)
}
