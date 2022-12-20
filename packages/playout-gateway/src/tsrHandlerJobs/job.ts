interface IJob<OwnResultType, PrevResultType> {
	/**
	 * Main logic of the Job
	 */
	run(previousResult?: PrevResultType, abortSignal?: AbortSignal): Promise<OwnResultType>
	cleanup(): Promise<void>
}

export abstract class Job<OwnResultType, PrevResultType, ArtifactsType> implements IJob<OwnResultType, PrevResultType> {
	protected abstract readonly artifacts: ArtifactsType
	/**
	 * Main logic of the Job
	 */
	abstract run(previousResult: PrevResultType, abortSignal?: AbortSignal): Promise<OwnResultType>
	async cleanup(): Promise<void> {
		return Promise.resolve()
	}
}
