import { EventEmitter } from 'stream'
import { AbortError } from 'timeline-state-resolver'
import { Logger } from 'winston'
import { Job } from './job'

interface JobDescription<ResultType> {
	id?: string
	job: Job<ResultType, unknown, unknown>
	isChained: boolean
	abortController: AbortController
	timeout?: number
	didTimeOut?: boolean
	result?: ResultType
	importance?: JobImportance
	onFulfilled?: FulfilledCallback<ResultType>
	onRejected?: RejectedCallback
	onTimeout?: TimeoutCallback
}

export enum JobImportance {
	HIGH = 'high',
	LOW = 'low',
}

type FulfilledCallback<ResultType> = (queue: IJobQueue, result: ResultType) => void
type RejectedCallback = (reason: any) => void
type TimeoutCallback = (queue: IJobQueue) => void

interface ChainableJobQueue<PreviousResultType> extends IJobQueue {
	chain: <ResultType, ArtifactType>(
		job: Job<ResultType, ArtifactType, PreviousResultType>,
		timeout?: number,
		importance?: JobImportance,
		id?: string
	) => ChainableJobQueue<ResultType>
	end: (
		onFulfilled?: FulfilledCallback<PreviousResultType>,
		onRejected?: RejectedCallback,
		onTimeout?: TimeoutCallback
	) => void
}

export interface IJobQueue {
	get length(): number
	clear(): void
	getLastJobIdByImportance(importance: JobImportance): string | undefined
	enqueue<ResultType, ArtifactsType, PreviousResultType>(
		job: Job<ResultType, ArtifactsType, PreviousResultType>,
		timeout?: number,
		importance?: JobImportance,
		id?: string
	): ChainableJobQueue<ResultType>
	removeJob(jobId: string): void
}

export class JobQueue extends EventEmitter implements IJobQueue {
	private queue: JobDescription<unknown>[] = []
	private currentJob: JobDescription<unknown> | null = null
	private currentJobChain: JobDescription<unknown>[] = []
	private currentJobTimeout: NodeJS.Timeout | null = null

	constructor(private name: string, private logger: Logger) {
		super()
	}

	get length(): number {
		return this.queue.length
	}

	clear(): void {
		if (this.currentJob) {
			this.abortJob(this.currentJob)
			return
		}
		if (!this.currentJobChain.length) return

		this.currentJob = this.currentJobChain[this.currentJobChain.length - 1]

		Promise.allSettled(this.currentJobChain.map(async (jobDescription) => jobDescription.job.cleanup()))
			.then(this.handleCleanupResults)
			.finally(this.advanceJob)
		this.removeChainedJobsFromTheFront()
	}

	enqueue<ResultType, ArtifactsType, PreviousResultType>(
		job: Job<ResultType, ArtifactsType, PreviousResultType>,
		timeout?: number,
		importance?: JobImportance,
		id?: string
	): ChainableJobQueue<ResultType> {
		this.queue.push({ id, job, isChained: false, timeout, importance, abortController: new AbortController() })
		this.run()
		return this as ChainableJobQueue<ResultType>
	}

	chain<ResultType, ArtifactsType, PreviousResultType>(
		job: Job<ResultType, ArtifactsType, PreviousResultType>,
		timeout?: number,
		importance?: JobImportance,
		id?: string
	): ChainableJobQueue<ResultType> {
		this.queue.push({ id, job, isChained: true, timeout, importance, abortController: new AbortController() })
		return this as ChainableJobQueue<ResultType>
	}

	end(onFulfilled?: FulfilledCallback<unknown>, onRejected?: RejectedCallback, onTimeout?: TimeoutCallback): void {
		const lastJob = this.queue[this.queue.length - 1]
		if (!lastJob) return
		lastJob.onFulfilled = onFulfilled
		lastJob.onRejected = onRejected
		lastJob.onTimeout = onTimeout
	}

	getLastJobIdByImportance(importance: JobImportance): string | undefined {
		for (let i = this.queue.length - 1; i >= 0; --i) {
			if (this.queue[i].importance === importance) {
				return this.queue[i].id
			}
		}
		if (this.currentJob?.importance === importance) {
			return this.currentJob.id
		}
		return undefined
	}

	removeJob(jobId: string): void {
		this.queue = this.queue.filter((job) => job.id !== jobId && !job.isChained)
	}

	private run(): void {
		setImmediate(() => {
			if (this.currentJob) {
				return
			}
			if (this.queue.length === 0 && this.currentJobChain.length === 0) {
				this.emit('done')
			}
			this.currentJob = this.queue.shift() ?? null
			if (!this.currentJob) return
			const jobChainTop = this.currentJobChain[this.currentJobChain.length - 1]
			const prevResult = jobChainTop?.result
			const currentJob = this.currentJob
			if (this.currentJob.timeout) {
				this.currentJobTimeout = setTimeout(() => {
					this.abortJob(currentJob)
					currentJob.didTimeOut = true
				}, this.currentJob.timeout)
			}
			this.currentJob.job
				.run(prevResult, this.currentJob.abortController.signal)
				.then(this.handleJobFulfilled)
				.catch(this.handleJobRejected)
				.then(this.handleCleanupResults)
				.finally(this.advanceJob)
		})
	}

	private handleJobFulfilled = (result: unknown): void => {
		if (!this.currentJob) return
		if (this.currentJob.abortController.signal.aborted) {
			throw new AbortError()
		}
		this.currentJob.result = result
		const nextJob = this.queue[0]
		if (nextJob?.isChained) {
			this.currentJobChain.push(this.currentJob)
		}
		if (this.currentJob.onFulfilled) {
			this.currentJob.onFulfilled(this, result)
		}
	}

	private handleJobRejected = async (reason: unknown): Promise<PromiseSettledResult<void>[] | void> => {
		if (!this.currentJob) return
		this.logger.error(
			`Error in queue "${this.name}" at Job.run "${this.currentJob.job.constructor.name}": ${reason}`
		)
		const cleanupPromises = []
		if (this.currentJobChain.length) {
			cleanupPromises.push(...this.currentJobChain.map(async (job) => job.job.cleanup()))
			this.currentJobChain = []
		}
		cleanupPromises.push(this.currentJob.job.cleanup())
		const lastChainedJob = this.removeChainedJobsFromTheFront() ?? this.currentJob

		const result = await Promise.allSettled(cleanupPromises)
		if (this.currentJob.didTimeOut && lastChainedJob?.onTimeout) {
			lastChainedJob.onTimeout(this)
		} else if (lastChainedJob?.onRejected) {
			lastChainedJob.onRejected(reason)
		}
		return result
	}

	private handleCleanupResults = (results: PromiseSettledResult<void>[] | void) => {
		if (!results) {
			return
		}
		const failedCleanups = results.filter((result) => result.status === 'rejected') as PromiseRejectedResult[]
		for (const result of failedCleanups) {
			this.logger.error(`Error in queue "${this.name}" at Job.cleanup: ${result.reason}`)
		}
	}

	private removeChainedJobsFromTheFront(): JobDescription<unknown> | undefined {
		let lastChainedJob: JobDescription<unknown> | undefined
		for (const job of this.queue) {
			if (job.isChained) {
				lastChainedJob = this.queue.shift()
			} else {
				break
			}
		}
		return lastChainedJob
	}

	private abortJob = (job: JobDescription<unknown>) => {
		job.abortController.abort()
	}

	private advanceJob = () => {
		this.currentJob = null
		if (this.currentJobTimeout) {
			clearTimeout(this.currentJobTimeout)
			this.currentJobTimeout = null
		}

		const nextJob = this.queue[0]
		if (!nextJob?.isChained && this.currentJobChain.length) {
			this.currentJobChain = []
		}
		this.run()
	}
}
