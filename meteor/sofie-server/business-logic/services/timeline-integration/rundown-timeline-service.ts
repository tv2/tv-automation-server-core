import { RundownService } from '../interfaces/rundown-service'
import {
	AdLibPieceInsertedEvent,
	InfiniteRundownPieceAddedEvent,
	RundownEvent,
} from '../../../model/interfaces/rundown-event'
import { RundownEventEmitter } from '../interfaces/rundown-event-emitter'
import { RundownRepository } from '../../../data-access/repositories/interfaces/rundown-repository'
import { Rundown } from '../../../model/entities/rundown'
import { TimelineRepository } from '../../../data-access/repositories/interfaces/timeline-repository'
import { TimelineBuilder } from '../interfaces/timeline-builder'
import { Timeline } from '../../../model/entities/timeline'
import { AdLibPieceRepository } from '../../../data-access/repositories/interfaces/ad-lib-piece-repository'
import { AdLibPiece } from '../../../model/entities/ad-lib-piece'
import { Piece } from '../../../model/entities/piece'
import { RundownEventBuilder } from '../interfaces/rundown-event-builder'

export class RundownTimelineService implements RundownService {
	constructor(
		private rundownEventEmitter: RundownEventEmitter,
		private rundownRepository: RundownRepository,
		private timelineRepository: TimelineRepository,
		private adLibPieceRepository: AdLibPieceRepository,
		private timelineBuilder: TimelineBuilder,
		private rundownEventBuilder: RundownEventBuilder
	) {}

	public async activateRundown(rundownId: string): Promise<void> {
		const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)

		rundown.activate()

		const timeline: Timeline = this.timelineBuilder.buildTimeline(rundown)
		this.timelineRepository.saveTimeline(timeline)

		this.emitAddInfinitePieces(rundown, [])

		this.rundownRepository.saveRundown(rundown)

		const activateEvent: RundownEvent = this.rundownEventBuilder.buildActivateEvent(rundown)
		this.rundownEventEmitter.emitRundownEvent(activateEvent)

		const setNextEvent: RundownEvent = this.rundownEventBuilder.buildSetNextEvent(rundown)
		this.rundownEventEmitter.emitRundownEvent(setNextEvent)
	}

	public async deactivateRundown(rundownId: string): Promise<void> {
		const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)

		rundown.deactivate()
		const timeline: Timeline = this.timelineBuilder.getBaseTimeline()

		this.timelineRepository.saveTimeline(timeline)
		this.rundownRepository.saveRundown(rundown)

		const deactivateEvent: RundownEvent = this.rundownEventBuilder.buildDeactivateEvent(rundown)
		this.rundownEventEmitter.emitRundownEvent(deactivateEvent)
	}

	public async takeNext(rundownId: string): Promise<void> {
		const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
		const infinitePiecesBefore: Piece[] = rundown.getInfinitePieces()

		rundown.takeNext()

		const timeline: Timeline = this.timelineBuilder.buildTimeline(rundown)
		this.timelineRepository.saveTimeline(timeline)

		this.emitAddInfinitePieces(rundown, infinitePiecesBefore)
		// TODO: Emit if any infinite Pieces no longer exist e.g. we had a Segment infinite Piece and we changed Segment

		this.rundownRepository.saveRundown(rundown)

		const takeEvent: RundownEvent = this.rundownEventBuilder.buildTakeEvent(rundown)
		this.rundownEventEmitter.emitRundownEvent(takeEvent)

		const setNextEvent: RundownEvent = this.rundownEventBuilder.buildSetNextEvent(rundown)
		this.rundownEventEmitter.emitRundownEvent(setNextEvent)
	}

	private emitAddInfinitePieces(rundown: Rundown, infinitePiecesBefore: Piece[]): void {
		const infinitePiecesAfter: Piece[] = rundown.getInfinitePieces()
		infinitePiecesAfter
			.filter((piece) => !infinitePiecesBefore.includes(piece))
			.forEach((piece) => {
				const infinitePieceAddedEvent: InfiniteRundownPieceAddedEvent =
					this.rundownEventBuilder.buildInfiniteRundownPieceAddedEvent(rundown, piece)
				this.rundownEventEmitter.emitRundownEvent(infinitePieceAddedEvent)
			})
	}

	public async setNext(rundownId: string, segmentId: string, partId: string): Promise<void> {
		const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
		rundown.setNext(segmentId, partId)
		this.rundownRepository.saveRundown(rundown)

		const setNextEvent: RundownEvent = this.rundownEventBuilder.buildSetNextEvent(rundown)
		this.rundownEventEmitter.emitRundownEvent(setNextEvent)
	}

	public async resetRundown(rundownId: string): Promise<void> {
		const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
		rundown.reset()

		const timeline: Timeline = this.timelineBuilder.buildTimeline(rundown)

		this.timelineRepository.saveTimeline(timeline)
		this.rundownRepository.saveRundown(rundown)

		const resetEvent: RundownEvent = this.rundownEventBuilder.buildResetEvent(rundown)
		this.rundownEventEmitter.emitRundownEvent(resetEvent)
	}

	public async executeAdLibPiece(rundownId: string, adLibPieceId: string): Promise<void> {
		const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
		const adLibPiece: AdLibPiece = await this.adLibPieceRepository.getAdLibPiece(adLibPieceId)

		adLibPiece.setExecutedAt(new Date().getTime())
		rundown.adAdLibPiece(adLibPiece)
		const timeline: Timeline = this.timelineBuilder.buildTimeline(rundown)

		this.timelineRepository.saveTimeline(timeline)
		this.rundownRepository.saveRundown(rundown)

		const adLibPieceInsertedEvent: AdLibPieceInsertedEvent = this.rundownEventBuilder.buildAdLibPieceInsertedEvent(
			rundown,
			adLibPiece
		)
		this.rundownEventEmitter.emitRundownEvent(adLibPieceInsertedEvent)
	}
}
