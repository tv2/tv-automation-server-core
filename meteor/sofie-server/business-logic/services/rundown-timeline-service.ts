import { RundownService } from './interfaces/rundown-service'
import { RundownEvent } from '../../model/rundown-event'
import { RundownEventType } from '../../model/enums/rundown-event-type'
import { RundownEventEmitter } from './interfaces/rundown-event-emitter'

export class RundownTimelineService implements RundownService {

	private rundownEventEmitter: RundownEventEmitter

	constructor(eventEmitter: RundownEventEmitter) {
		this.rundownEventEmitter = eventEmitter
	}

	takeNext(rundownId: string): void {
		const takeEvent: RundownEvent = {
			type: RundownEventType.TAKE,
			rundownId,
			segmentId: 'someSegmentIdFromTheServer',
			partId: 'somePartIdFromTheServer'
		}
		this.rundownEventEmitter.emitRundownEvent(takeEvent)
	}

	setNext(rundownId: string, partId: string): void {
		const setNextEvent: RundownEvent = {
			type: RundownEventType.SET_NEXT,
			rundownId,
			segmentId: 'someSegmentIdFromTheServer',
			partId
		}
		this.rundownEventEmitter.emitRundownEvent(setNextEvent)
	}

	resetRundown(_rundownId: string): void {
		throw new Error(`NotImplementedException: Method not yet implemented in: ${RundownTimelineService.name}`)
	}
}
