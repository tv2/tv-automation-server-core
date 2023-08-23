import { anything, instance, mock, verify, when } from 'ts-mockito'
import { Rundown, RundownInterface } from '../../../model/entities/rundown'
import { RundownTimelineService } from '../timeline-integration/rundown-timeline-service'
import { RundownEventEmitter } from '../interfaces/rundown-event-emitter'
import { RundownRepository } from '../../../data-access/repositories/interfaces/rundown-repository'
import { TimelineRepository } from '../../../data-access/repositories/interfaces/timeline-repository'
import { AdLibPieceRepository } from '../../../data-access/repositories/interfaces/ad-lib-piece-repository'
import { TimelineBuilder } from '../interfaces/timeline-builder'
import { RundownEventBuilder } from '../interfaces/rundown-event-builder'
import { ActiveRundownException } from '../../../model/exceptions/active-rundown-exception'
import { RundownEventType } from '../../../model/enums/rundown-event-type'

describe(`${RundownTimelineService.name}`, () => {
	describe(`${RundownTimelineService.prototype.deleteRundown.name}`, () => {
		// eslint-disable-next-line jest/expect-expect
		it('deletes a rundown, when it receives a valid RundownId', async () => {
			const mockRundownRepository: RundownRepository = mock<RundownRepository>()

			const randomRundownId: string = 'randomRundownId'
			const randomRundown: Rundown = createInactiveRundown(randomRundownId)

			when(mockRundownRepository.getRundown(randomRundownId)).thenResolve(randomRundown)

			const testee: RundownTimelineService = createTestee({ rundownRepository: instance(mockRundownRepository) })

			await testee.deleteRundown(randomRundownId)

			verify(mockRundownRepository.deleteRundown(randomRundownId)).once()
		})

		// eslint-disable-next-line jest/expect-expect
		it('builds a rundown deleted event, when it receives a valid RundownId', async () => {
			const mockRundownRepository: RundownRepository = mock<RundownRepository>()
			const mockRundownEventBuilder: RundownEventBuilder = mock<RundownEventBuilder>()

			const randomRundownId: string = 'randomRundownId'
			const randomRundown: Rundown = createInactiveRundown(randomRundownId)

			when(mockRundownRepository.getRundown(randomRundownId)).thenResolve(randomRundown)
			when(mockRundownEventBuilder.buildDeletedEvent(anything())).thenReturn({
				type: RundownEventType.DELETED,
				rundownId: randomRundownId,
				segmentId: '',
				partId: '',
			})

			const testee: RundownTimelineService = createTestee({
				rundownRepository: instance(mockRundownRepository),
				rundownEventBuilder: instance(mockRundownEventBuilder),
			})

			await testee.deleteRundown(randomRundownId)

			verify(mockRundownEventBuilder.buildDeletedEvent(anything())).once()
		})

		// eslint-disable-next-line jest/expect-expect
		it('emits a rundown deleted event, when it receives a valid RundownId', async () => {
			const mockRundownRepository: RundownRepository = mock<RundownRepository>()
			const mockRundownEventEmitter: RundownEventEmitter = mock<RundownEventEmitter>()

			const randomRundownId: string = 'randomRundownId'
			const randomRundown: Rundown = createInactiveRundown(randomRundownId)

			when(mockRundownRepository.getRundown(randomRundownId)).thenResolve(randomRundown)

			const testee: RundownTimelineService = createTestee({
				rundownRepository: instance(mockRundownRepository),
				rundownEventEmitter: instance(mockRundownEventEmitter),
			})

			await testee.deleteRundown(randomRundownId)

			//Todo: Improve verify to ensure it is of correct event type.
			verify(mockRundownEventEmitter.emitRundownEvent(anything())).once()
		})

		it('throws an exception, when it receives a RundownId of an active rundown', async () => {
			const mockRundownRepository: RundownRepository = mock<RundownRepository>()

			const randomRundownId: string = 'randomRundownId'
			const randomRundown: Rundown = createActiveRundown(randomRundownId)

			when(mockRundownRepository.getRundown(randomRundownId)).thenResolve(randomRundown)

			const testee: RundownTimelineService = createTestee({ rundownRepository: instance(mockRundownRepository) })

			expect.assertions(1)
			try {
				await testee.deleteRundown(randomRundownId)
			} catch (error) {
				// It isn't conditional, as the test will fail, if not hit, due to the 'expect.assertions(1)'
				// eslint-disable-next-line jest/no-conditional-expect
				expect(error).toBeInstanceOf(ActiveRundownException)
			}
		})
	})
})

// TODO: Extract to Helper Class in Model layer
function createActiveRundown(rundownId?: string): Rundown {
	return new Rundown({
		id: rundownId ?? 'id' + Math.random(),
		name: 'name' + Math.random(),
		isRundownActive: true,
	} as RundownInterface)
}

// TODO: Extract to Helper Class in Model layer
function createInactiveRundown(rundownId?: string): Rundown {
	return new Rundown({
		id: rundownId ?? 'id' + Math.random(),
		name: 'name' + Math.random(),
		isRundownActive: false,
	} as RundownInterface)
}

interface TesteeBuilderParams {
	rundownEventEmitter?: RundownEventEmitter
	rundownRepository?: RundownRepository
	timelineRepository?: TimelineRepository
	adLibPieceRepository?: AdLibPieceRepository
	timelineBuilder?: TimelineBuilder
	rundownEventBuilder?: RundownEventBuilder
}

function createTestee(params: TesteeBuilderParams): RundownTimelineService {
	return new RundownTimelineService(
		params.rundownEventEmitter ?? instance(mock<RundownEventEmitter>()),
		params.rundownRepository ?? instance(mock<RundownRepository>()),
		params.timelineRepository ?? instance(mock<TimelineRepository>()),
		params.adLibPieceRepository ?? instance(mock<AdLibPieceRepository>()),
		params.timelineBuilder ?? instance(mock<TimelineBuilder>()),
		params.rundownEventBuilder ?? instance(mock<RundownEventBuilder>())
	)
}
