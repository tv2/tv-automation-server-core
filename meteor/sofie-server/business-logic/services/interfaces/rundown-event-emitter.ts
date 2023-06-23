import { RundownEvent } from '../../../model/rundown-event'

export interface RundownEventEmitter {
	emitRundownEvent(rundownEvent: RundownEvent)
}
