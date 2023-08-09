import { anything, instance, mock, verify, when } from 'ts-mockito'
import { Rundown, RundownInterface } from '../../../model/entities/rundown'
import { RundownTimelineService } from '../timeline-integration/rundown-timeline-service'
import { RundownEventEmitter } from '../interfaces/rundown-event-emitter'
import { RundownRepository } from '../../../data-access/repositories/interfaces/rundown-repository'
import { TimelineRepository } from '../../../data-access/repositories/interfaces/timeline-repository'
import { AdLibPieceRepository } from '../../../data-access/repositories/interfaces/ad-lib-piece-repository'
import { TimelineBuilder } from '../interfaces/timeline-builder'
import { RundownEventBuilder } from '../interfaces/rundown-event-builder'
import { RundownActiveException } from '../../../model/exceptions/rundown-active-exception'
import { DeletionFailedException } from '../../../model/exceptions/deletion-failed-exception'
import { RundownEventType } from '../../../model/enums/rundown-event-type'

describe(`${RundownTimelineService.name}`, () => {
	describe(`${RundownTimelineService.prototype.deleteRundown.name}`, () => {
		// eslint-disable-next-line jest/expect-expect
		it('receives a RundownId deletes a rundown', async () => {
			const mockRundownRepository: RundownRepository = mock<RundownRepository>()

			const randomRundownId: string = 'randomRundownId'
			const randomRundown: Rundown = new Rundown({ id: randomRundownId, isActive: false } as RundownInterface)

			when(mockRundownRepository.getRundown(randomRundownId)).thenReturn(Promise.resolve(randomRundown))
			when(mockRundownRepository.deleteRundown(randomRundownId)).thenReturn(Promise.resolve(true))

			const testee: RundownTimelineService = createTestee({ rundownRepository: instance(mockRundownRepository) })

			await testee.deleteRundown(randomRundownId)

			verify(mockRundownRepository.deleteRundown(randomRundownId)).once()
		})

		// eslint-disable-next-line jest/expect-expect
		it('receives a RundownId builds a rundown deleted event', async () => {
			const mockRundownRepository: RundownRepository = mock<RundownRepository>()
			const mockRundownEventBuilder: RundownEventBuilder = mock<RundownEventBuilder>()

			const randomRundownId: string = 'randomRundownId'
			const randomRundown: Rundown = new Rundown({ id: randomRundownId, isActive: false } as RundownInterface)

			when(mockRundownRepository.getRundown(randomRundownId)).thenReturn(Promise.resolve(randomRundown))
			when(mockRundownRepository.deleteRundown(randomRundownId)).thenReturn(Promise.resolve(true))
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
		it('receives a RundownId emits a rundown deleted event', async () => {
			const mockRundownRepository: RundownRepository = mock<RundownRepository>()
			const mockRundownEventEmitter: RundownEventEmitter = mock<RundownEventEmitter>()
			const mockRundownEventBuilder: RundownEventBuilder = mock<RundownEventBuilder>()

			const randomRundownId: string = 'randomRundownId'
			const randomRundown: Rundown = new Rundown({ id: randomRundownId, isActive: false } as RundownInterface)

			when(mockRundownRepository.getRundown(randomRundownId)).thenReturn(Promise.resolve(randomRundown))
			when(mockRundownRepository.deleteRundown(randomRundownId)).thenReturn(Promise.resolve(true))

			const testee: RundownTimelineService = createTestee({
				rundownRepository: instance(mockRundownRepository),
				rundownEventEmitter: instance(mockRundownEventEmitter),
				rundownEventBuilder: instance(mockRundownEventBuilder),
			})

			await testee.deleteRundown(randomRundownId)

			verify(mockRundownRepository.deleteRundown(randomRundownId)).once()
		})

		it('receives a RundownId of an active rundown throwing an exception', async () => {
			const mockRundownRepository: RundownRepository = mock<RundownRepository>()

			const randomRundownId: string = 'randomRundownId'
			const randomRundown: Rundown = new Rundown({ id: randomRundownId, isActive: true } as RundownInterface)

			when(mockRundownRepository.getRundown(randomRundownId)).thenReturn(Promise.resolve(randomRundown))

			const testee: RundownTimelineService = createTestee({ rundownRepository: instance(mockRundownRepository) })

			expect.assertions(1)
			try {
				await testee.deleteRundown(randomRundownId)
			} catch (error) {
				// It isn't conditional, as the test will fail, if not hit, due to the 'expect.assertions(1)'
				// eslint-disable-next-line jest/no-conditional-expect
				expect(error).toBeInstanceOf(RundownActiveException)
			}
		})

		it('receives a RundownId but failes to delete the rundown throwing an exception', async () => {
			const mockRundownRepository: RundownRepository = mock<RundownRepository>()

			const randomRundownId: string = 'randomRundownId'
			const randomRundown: Rundown = new Rundown({ id: randomRundownId, isActive: false } as RundownInterface)

			when(mockRundownRepository.getRundown(randomRundownId)).thenReturn(Promise.resolve(randomRundown))
			when(mockRundownRepository.deleteRundown(randomRundownId)).thenReturn(Promise.resolve(false))

			const testee: RundownTimelineService = createTestee({ rundownRepository: instance(mockRundownRepository) })

			expect.assertions(1)
			try {
				await testee.deleteRundown(randomRundownId)
			} catch (error) {
				// It isn't conditional, as the test will fail, if not hit, due to the 'expect.assertions(1)'
				// eslint-disable-next-line jest/no-conditional-expect
				expect(error).toBeInstanceOf(DeletionFailedException)
			}
		})
	})
})

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
