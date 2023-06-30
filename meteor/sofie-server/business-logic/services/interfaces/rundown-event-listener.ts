import { RundownEvent } from '../../../model/interfaces/rundown-event'

export interface RundownEventListener {
	listenToRundownEvents(onRundownEventCallback: (rundownEvent: RundownEvent) => void)
}
