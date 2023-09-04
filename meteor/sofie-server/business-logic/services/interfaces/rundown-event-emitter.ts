import { RundownEvent } from '../../../model/value-objects/rundown-event'

export interface RundownEventEmitter {
	emitRundownEvent(rundownEvent: RundownEvent)
}
