import { instance, mock, verify, when } from 'ts-mockito'
import { Rundown, RundownInterface } from '../../../model/entities/rundown'
import { RundownTimelineService } from '../timeline-integration/rundown-timeline-service'
import { RundownEventEmitter } from '../interfaces/rundown-event-emitter'
import { RundownRepository } from '../../../data-access/repositories/interfaces/rundown-repository'
import { TimelineRepository } from '../../../data-access/repositories/interfaces/timeline-repository'
import { AdLibPieceRepository } from '../../../data-access/repositories/interfaces/ad-lib-piece-repository'
import { TimelineBuilder } from '../interfaces/timeline-builder'
import { RundownEventBuilder } from '../interfaces/rundown-event-builder'

describe(`${RundownTimelineService.name}`, () => {
	describe(`${RundownTimelineService.prototype.deleteRundown.name}`, () => {
		// eslint-disable-next-line jest/expect-expect
		it('receives a RundownId deletes a rundown', async () => {
			const mockRundownRepository: RundownRepository = mock<RundownRepository>()

			const randomRundownId: string = 'randomRundownId'
			const randomRundown: Rundown = new Rundown({ id: randomRundownId, isActive: false } as RundownInterface)

			when(mockRundownRepository.getRundown(randomRundownId)).thenReturn(Promise.resolve(randomRundown))
			when(mockRundownRepository.deleteRundown(randomRundownId)).thenResolve(await Promise.resolve(true))

			const testee: RundownTimelineService = createTestee({ rundownRepository: instance(mockRundownRepository) })

			await testee.deleteRundown(randomRundownId)

			verify(mockRundownRepository.getRundown(randomRundownId)).once()
			verify(mockRundownRepository.deleteRundown(randomRundownId)).once()
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
