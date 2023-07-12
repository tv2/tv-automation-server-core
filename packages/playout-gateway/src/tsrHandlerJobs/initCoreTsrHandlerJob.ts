import { Job } from './job'
import { CreateDeviceJobsResult } from './createDeviceJob'
import { AbortError } from 'timeline-state-resolver'

type InitCoreTsrHandlerJobResult = CreateDeviceJobsResult

export class InitCoreTsrHandlerJob extends Job<InitCoreTsrHandlerJobResult, undefined, CreateDeviceJobsResult> {
	protected artifacts: undefined

	async run(previousResult: CreateDeviceJobsResult, abortSignal?: AbortSignal): Promise<InitCoreTsrHandlerJobResult> {
		if (abortSignal?.aborted) {
			throw new AbortError()
		}
		await previousResult.coreTsrHandler.init()
		return previousResult
	}
}
