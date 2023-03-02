export abstract class Job<ResultType, ArtifactsType = undefined, PreviousResultType = unknown> {
	protected abstract readonly artifacts: ArtifactsType

	/**
	 * Main logic of the Job
	 */
	abstract run(previousResult: PreviousResultType, abortSignal?: AbortSignal): Promise<ResultType>

	async cleanup(): Promise<void> {
		return Promise.resolve()
	}
}
