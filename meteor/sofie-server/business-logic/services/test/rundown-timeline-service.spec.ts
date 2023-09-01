import { anything, capture, instance, mock, verify, when } from 'ts-mockito'
import { Rundown } from '../../../model/entities/rundown'
import { RundownEventEmitter } from '../interfaces/rundown-event-emitter'
import { RundownRepository } from '../../../data-access/repositories/interfaces/rundown-repository'
import { TimelineRepository } from '../../../data-access/repositories/interfaces/timeline-repository'
import { AdLibPieceRepository } from '../../../data-access/repositories/interfaces/ad-lib-piece-repository'
import { TimelineBuilder } from '../interfaces/timeline-builder'
import { RundownEventBuilder } from '../interfaces/rundown-event-builder'
import { ActiveRundownException } from '../../../model/exceptions/active-rundown-exception'
import { RundownEventType } from '../../../model/enums/rundown-event-type'
import { RundownTimelineService } from '../rundown-timeline-service'
import { CallbackScheduler } from '../interfaces/callback-scheduler'
import { EntityMockFactory } from '../../../model/entities/test/entity-mock-factory'
import { RundownEvent } from '../../../model/value-objects/rundown-event'

describe(`${RundownTimelineService.name}`, () => {
	describe(`${RundownTimelineService.prototype.deleteRundown.name}`, () => {
		// eslint-disable-next-line jest/expect-expect
		it('deletes a rundown, when it receives a valid RundownId', async () => {
			const mockRundownRepository: RundownRepository = mock<RundownRepository>()
			const rundown: Rundown = EntityMockFactory.createRundown({ isRundownActive: false })

			when(mockRundownRepository.getRundown(rundown.id)).thenResolve(rundown)

			const testee: RundownTimelineService = createTestee({ rundownRepository: instance(mockRundownRepository) })

			await testee.deleteRundown(rundown.id)

			verify(mockRundownRepository.deleteRundown(rundown.id)).once()
		})

		// eslint-disable-next-line jest/expect-expect
		it('builds a rundown deleted event, when it receives a valid RundownId', async () => {
			const mockRundownRepository: RundownRepository = mock<RundownRepository>()
			const mockRundownEventBuilder: RundownEventBuilder = mock<RundownEventBuilder>()
			const rundown: Rundown = EntityMockFactory.createRundown({ isRundownActive: false })

			when(mockRundownRepository.getRundown(rundown.id)).thenResolve(rundown)
			when(mockRundownEventBuilder.buildDeletedEvent(anything())).thenReturn(
				createDeletedRundownEvent(rundown.id)
			)

			const testee: RundownTimelineService = createTestee({
				rundownRepository: instance(mockRundownRepository),
				rundownEventBuilder: instance(mockRundownEventBuilder),
			})

			await testee.deleteRundown(rundown.id)

			verify(mockRundownEventBuilder.buildDeletedEvent(anything())).once()
		})

		// eslint-disable-next-line jest/expect-expect
		it('emits a rundown deleted event, when it receives a valid RundownId', async () => {
			const mockRundownRepository: RundownRepository = mock<RundownRepository>()
			const mockRundownEventBuilder: RundownEventBuilder = mock<RundownEventBuilder>()
			const mockRundownEventEmitter: RundownEventEmitter = mock<RundownEventEmitter>()

			const rundown: Rundown = EntityMockFactory.createRundown({ isRundownActive: false })

			when(mockRundownRepository.getRundown(rundown.id)).thenResolve(rundown)
			when(mockRundownEventBuilder.buildDeletedEvent(anything())).thenReturn(
				createDeletedRundownEvent(rundown.id)
			)

			const testee: RundownTimelineService = createTestee({
				rundownRepository: instance(mockRundownRepository),
				rundownEventEmitter: instance(mockRundownEventEmitter),
				rundownEventBuilder: instance(mockRundownEventBuilder),
			})

			await testee.deleteRundown(rundown.id)
			const [rundownEvent] = capture(mockRundownEventEmitter.emitRundownEvent).last()
			expect(rundownEvent.type).toBe(RundownEventType.DELETED)
		})

		it('throws an exception, when it receives a RundownId of an active rundown', async () => {
			const mockRundownRepository: RundownRepository = mock<RundownRepository>()

			const rundown: Rundown = EntityMockFactory.createRundown({ isRundownActive: true })

			when(mockRundownRepository.getRundown(rundown.id)).thenResolve(rundown)

			const testee: RundownTimelineService = createTestee({ rundownRepository: instance(mockRundownRepository) })
			const action = async () => testee.deleteRundown(rundown.id)

			await expect(action).rejects.toThrow(ActiveRundownException)
		})
	})
})

function createDeletedRundownEvent(rundownId: string): RundownEvent {
	return {
		type: RundownEventType.DELETED,
		rundownId: rundownId,
	} as RundownEvent
}

function createTestee(params: {
	rundownEventEmitter?: RundownEventEmitter
	rundownRepository?: RundownRepository
	timelineRepository?: TimelineRepository
	adLibPieceRepository?: AdLibPieceRepository
	timelineBuilder?: TimelineBuilder
	rundownEventBuilder?: RundownEventBuilder
	callbackScheduler?: CallbackScheduler
}): RundownTimelineService {
	return new RundownTimelineService(
		params.rundownEventEmitter ?? instance(mock<RundownEventEmitter>()),
		params.rundownRepository ?? instance(mock<RundownRepository>()),
		params.timelineRepository ?? instance(mock<TimelineRepository>()),
		params.adLibPieceRepository ?? instance(mock<AdLibPieceRepository>()),
		params.timelineBuilder ?? instance(mock<TimelineBuilder>()),
		params.rundownEventBuilder ?? instance(mock<RundownEventBuilder>()),
		params.callbackScheduler ?? instance(mock<CallbackScheduler>())
	)
}
