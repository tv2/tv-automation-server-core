import { RundownService } from '../interfaces/rundown-service'
import { RundownEvent } from '../../../model/rundown-event'
import { RundownEventType } from '../../../model/enums/rundown-event-type'
import { RundownEventEmitter } from '../interfaces/rundown-event-emitter'
import { RundownRepository } from '../../../data-access/repositories/interfaces/rundown-repository'
import { Rundown } from '../../../model/entities/rundown'
import { TimelineRepository } from '../../../data-access/repositories/interfaces/timeline-repository'
import { TimelineBuilder } from '../interfaces/timeline-builder'
import { Timeline } from '../../../model/entities/timeline'

export class RundownTimelineService implements RundownService {

	private rundownEventEmitter: RundownEventEmitter
	private rundownRepository: RundownRepository
	private timelineRepository: TimelineRepository
	private timelineBuilder: TimelineBuilder

	constructor(
			eventEmitter: RundownEventEmitter,
			rundownRepository: RundownRepository,
			timelineRepository: TimelineRepository,
			timelineBuilder: TimelineBuilder
	) {
		this.rundownEventEmitter = eventEmitter
		this.rundownRepository = rundownRepository
		this.timelineRepository = timelineRepository
		this.timelineBuilder = timelineBuilder
	}

	async activateRundown(rundownId: string): Promise<void> {
		const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)

		rundown.activate()
		const timeline: Timeline = this.timelineBuilder.buildTimeline(rundown)

		this.timelineRepository.saveTimeline(timeline)
		this.rundownRepository.saveRundown(rundown)

		const activateEvent: RundownEvent = {
			type: RundownEventType.ACTIVATE,
			rundownId: rundown.id,
			segmentId: rundown.getActiveSegment().id,
			partId: rundown.getActivePart().id
		}
		this.rundownEventEmitter.emitRundownEvent(activateEvent)

		const setNextEvent: RundownEvent = {
			type: RundownEventType.SET_NEXT,
			rundownId: rundown.id,
			segmentId: rundown.getNextSegment().id,
			partId: rundown.getNextPart().id
		}
		this.rundownEventEmitter.emitRundownEvent(setNextEvent)
	}

	async deactivateRundown(rundownId: string): Promise<void> {
		const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)

		rundown.deactivate()
		const timeline: Timeline = this.timelineBuilder.getBaseTimeline()

		this.timelineRepository.saveTimeline(timeline)
		this.rundownRepository.saveRundown(rundown)

		const activateEvent: RundownEvent = {
			type: RundownEventType.DEACTIVATE,
			rundownId: rundown.id,
			segmentId: '',
			partId: ''
		}
		this.rundownEventEmitter.emitRundownEvent(activateEvent)
	}

	async takeNext(rundownId: string): Promise<void> {
		const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)

		rundown.takeNext()
		const timeline: Timeline = this.timelineBuilder.buildTimeline(rundown)

		this.timelineRepository.saveTimeline(timeline)
		this.rundownRepository.saveRundown(rundown)

		const takeEvent: RundownEvent = {
			type: RundownEventType.TAKE,
			rundownId: rundown.id,
			segmentId: rundown.getActiveSegment().id,
			partId: rundown.getActivePart().id
		}
		this.rundownEventEmitter.emitRundownEvent(takeEvent)

		const setNextEvent: RundownEvent = {
			type: RundownEventType.SET_NEXT,
			rundownId: rundown.id,
			segmentId: rundown.getNextSegment().id,
			partId: rundown.getNextPart().id
		}
		this.rundownEventEmitter.emitRundownEvent(setNextEvent)
	}

	async setNext(rundownId: string, segmentId: string, partId: string): Promise<void> {
		const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
		rundown.setNext(segmentId, partId)
		this.rundownRepository.saveRundown(rundown)

		const setNextEvent: RundownEvent = {
			type: RundownEventType.SET_NEXT,
			rundownId: rundown.id,
			segmentId: rundown.getNextSegment().id,
			partId: rundown.getNextPart().id
		}
		this.rundownEventEmitter.emitRundownEvent(setNextEvent)
	}

	async resetRundown(_rundownId: string): Promise<void> {
		throw new Error(`NotImplementedException: Method not yet implemented in: ${RundownTimelineService.name}`)
	}
}
