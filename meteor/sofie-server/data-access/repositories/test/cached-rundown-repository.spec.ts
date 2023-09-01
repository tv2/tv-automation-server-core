import { CachedRundownRepository } from '../cache/cached-rundown-repository'
import { RundownRepository } from '../interfaces/rundown-repository'
import { instance, mock, verify, when } from 'ts-mockito'
import { Rundown, RundownInterface } from '../../../model/entities/rundown'

describe('cached-rundown-repository', () => {
	describe('getRundown', () => {
		it('receives a RundownId returns a rundown', async () => {
			const mockRepo: RundownRepository = mock<RundownRepository>()

			const randomRundownId: string = 'randomRundownId'
			const randomRundown: Rundown = new Rundown({ id: randomRundownId } as RundownInterface)

			when(mockRepo.getRundown(randomRundownId)).thenReturn(Promise.resolve(randomRundown))

			const testee: CachedRundownRepository = new CachedRundownRepository(instance(mockRepo))

			const result: Rundown = await testee.getRundown(randomRundownId)
			expect(result).toBe(randomRundown)
		})

		// eslint-disable-next-line jest/expect-expect
		it('receives two request to fetch the same Rundown, only call the database once', async () => {
			const mockRepo: RundownRepository = mock<RundownRepository>()

			const randomRundownId: string = 'randomRundownId'
			const randomRundown: Rundown = new Rundown({ id: randomRundownId } as RundownInterface)

			when(mockRepo.getRundown(randomRundownId)).thenReturn(Promise.resolve(randomRundown))

			const testee: CachedRundownRepository = new CachedRundownRepository(instance(mockRepo))

			await testee.getRundown(randomRundownId)
			await testee.getRundown(randomRundownId)

			verify(mockRepo.getRundown(randomRundownId)).once()
		})
	})
})
