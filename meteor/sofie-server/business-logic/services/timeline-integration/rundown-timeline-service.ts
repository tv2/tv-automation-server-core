import { RundownService } from '../interfaces/rundown-service'
import { RundownEvent } from '../../../model/rundown-event'
import { RundownEventType } from '../../../model/enums/rundown-event-type'
import { RundownEventEmitter } from '../interfaces/rundown-event-emitter'
import { RundownRepository } from '../../../data-access/repositories/interfaces/rundown-repository'
import { TimelineObject } from '../../../model/entities/timeline-object'
import { Rundown } from '../../../model/entities/rundown'
import { TimelineRepository } from '../../../data-access/repositories/interfaces/timeline-repository'

export class RundownTimelineService implements RundownService {

	private rundownEventEmitter: RundownEventEmitter
	private rundownRepository: RundownRepository
	private timelineRepository: TimelineRepository

	constructor(
			eventEmitter: RundownEventEmitter,
			rundownRepository: RundownRepository,
			timelineRepository: TimelineRepository
	) {
		this.rundownEventEmitter = eventEmitter
		this.rundownRepository = rundownRepository
		this.timelineRepository = timelineRepository
	}

	async activateRundown(rundownId: string): Promise<void> {
		const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)

		const timelineObjects: TimelineObject[] = rundown.activate()
		this.rundownRepository.saveRundown(rundown)
		this.timelineRepository.saveTimeline({ timelineObjects: timelineObjects })

		const activateEvent: RundownEvent = {
			type: RundownEventType.ACTIVATE,
			rundownId: rundown.id,
			segmentId: rundown.getActiveSegment().id,
			partId: rundown.getActivePart().id
		}
		this.rundownEventEmitter.emitRundownEvent(activateEvent)
	}

	async takeNext(rundownId: string): Promise<void> {
		const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)

		const timelineObjects: TimelineObject[] = rundown.takeNext()
		this.timelineRepository.saveTimeline({ timelineObjects })

		const takeEvent: RundownEvent = {
			type: RundownEventType.TAKE,
			rundownId: rundown.id,
			segmentId: rundown.getActiveSegment().id,
			partId: rundown.getActivePart().id
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
