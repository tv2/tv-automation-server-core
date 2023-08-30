import { RundownEvent } from '../../../model/value-objects/rundown-event'

export interface RundownEventListener {
	listenToRundownEvents(onRundownEventCallback: (rundownEvent: RundownEvent) => void)
}
