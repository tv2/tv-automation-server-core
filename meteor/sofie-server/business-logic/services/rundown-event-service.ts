import { RundownEventListener } from './interfaces/rundown-event-listener'
import { RundownEvent } from '../../model/rundown-event'
import { RundownEventEmitter } from './interfaces/rundown-event-emitter'

export class RundownEventService implements RundownEventEmitter, RundownEventListener {
	private static instance: RundownEventService

	static getInstance(): RundownEventService {
		if (!this.instance) {
			this.instance = new RundownEventService()
		}
		return this.instance
	}

	private callbacks: ((rundownEvent: RundownEvent) => void)[] = []

	emitRundownEvent(rundownEvent: RundownEvent) {
		this.callbacks.forEach(cb => cb(rundownEvent))
	}

	listenToRundownEvents(onRundownEventCallback: (rundownEvent: RundownEvent) => void) {
		this.callbacks.push(onRundownEventCallback)
	}
}
