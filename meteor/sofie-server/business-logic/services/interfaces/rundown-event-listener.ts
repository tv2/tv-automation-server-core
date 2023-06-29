import { RundownEvent } from '../../../model/rundown-event'

export interface RundownEventListener {
	listenToRundownEvents(onRundownEventCallback: (rundownEvent: RundownEvent) => void)
}
