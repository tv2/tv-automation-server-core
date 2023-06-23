import EventEmitter from 'events'
import { RundownEventListener } from './interfaces/rundown-event-listener'
import { RundownEvent } from '../../model/rundown-event'
import { RundownEventEmitter } from './interfaces/rundown-event-emitter'

const RUNDOWN_EVENT: string = 'RUNDOWN_EVENT'

export class RundownEventService extends EventEmitter implements RundownEventEmitter, RundownEventListener {
	private static instance: RundownEventService

	static getInstance(): RundownEventService {
		if (!this.instance) {
			this.instance = new RundownEventService()
		}
		return this.instance
	}

	private constructor() {
		super()
	}

	emitRundownEvent(rundownEvent: RundownEvent) {
		this.emit(RUNDOWN_EVENT, rundownEvent)
	}

	onRundownEvent(onRundownEventCallback: (rundownEvent: RundownEvent) => void) {
		this.addListener(RUNDOWN_EVENT, onRundownEventCallback)
	}
}
