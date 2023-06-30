import { RundownService } from '../interfaces/rundown-service'
import { RundownEvent } from '../../../model/interfaces/rundown-event'
import { RundownEventType } from '../../../model/enums/rundown-event-type'
import { RundownEventEmitter } from '../interfaces/rundown-event-emitter'
import { RundownRepository } from '../../../data-access/repositories/interfaces/rundown-repository'
import { Rundown } from '../../../model/entities/rundown'
import { TimelineRepository } from '../../../data-access/repositories/interfaces/timeline-repository'
import { TimelineBuilder } from '../interfaces/timeline-builder'
import { Timeline } from '../../../model/entities/timeline'
import { AdLibPieceRepository } from '../../../data-access/repositories/interfaces/ad-lib-piece-repository'
import { AdLibPiece } from '../../../model/entities/ad-lib-piece'

export class RundownTimelineService implements RundownService {

	private rundownEventEmitter: RundownEventEmitter
	private rundownRepository: RundownRepository
	private timelineRepository: TimelineRepository
	private adLibPieceRepository: AdLibPieceRepository
	private timelineBuilder: TimelineBuilder

	constructor(
			eventEmitter: RundownEventEmitter,
			rundownRepository: RundownRepository,
			timelineRepository: TimelineRepository,
			adLibRepository: AdLibPieceRepository,
			timelineBuilder: TimelineBuilder
	) {
		this.rundownEventEmitter = eventEmitter
		this.rundownRepository = rundownRepository
		this.timelineRepository = timelineRepository
		this.adLibPieceRepository = adLibRepository
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
		throw new Error('Not implemented exception')
	}

	async executeAdLibPiece(rundownId: string, adLibPieceId: string): Promise<void> {
		const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
		const adLibPiece: AdLibPiece = await this.adLibPieceRepository.getAdLibPiece(adLibPieceId)

		adLibPiece.executedAt = new Date().getTime()
		rundown.adAdLibPiece(adLibPiece)
		const timeline: Timeline = this.timelineBuilder.buildTimeline(rundown)

		this.timelineRepository.saveTimeline(timeline)
		this.rundownRepository.saveRundown(rundown)

		// TODO: Update Event to send relevant AdLib data to frontend
		const adLibPieceInsertedEvent: RundownEvent = {
			type: RundownEventType.AD_LIB_PIECE_INSERTED,
			rundownId: rundown.id,
			segmentId: rundown.getActiveSegment().id,
			partId: rundown.getActivePart().id
		}
		this.rundownEventEmitter.emitRundownEvent(adLibPieceInsertedEvent)
	}
}
