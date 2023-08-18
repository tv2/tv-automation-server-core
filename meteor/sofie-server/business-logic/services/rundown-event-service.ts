import { RundownEventListener } from './interfaces/rundown-event-listener'
import { RundownEvent } from '../../model/value-objects/rundown-event'
import { RundownEventEmitter } from './interfaces/rundown-event-emitter'

export class RundownEventService implements RundownEventEmitter, RundownEventListener {
	private static instance: RundownEventService

	public static getInstance(): RundownEventService {
		if (!this.instance) {
			this.instance = new RundownEventService()
		}
		return this.instance
	}

	private callbacks: ((rundownEvent: RundownEvent) => void)[] = []

	// Disabling no-empty-function because we need to mark the constructor as private since it's a singleton.
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	private constructor() {}

	public emitRundownEvent(rundownEvent: RundownEvent) {
		this.callbacks.forEach((cb) => cb(rundownEvent))
	}

	public listenToRundownEvents(onRundownEventCallback: (rundownEvent: RundownEvent) => void) {
		this.callbacks.push(onRundownEventCallback)
	}
}
