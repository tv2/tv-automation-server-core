import { RundownEvent } from '../../../model/rundown-event'

export interface RundownEventListener {
	onRundownEvent(onRundownEventCallback: (rundownEvent: RundownEvent) => void)
}
