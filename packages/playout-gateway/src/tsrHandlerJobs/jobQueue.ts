import { EventEmitter } from 'stream'
import { AbortError } from 'timeline-state-resolver'
import { Logger } from 'winston'
import { Job } from './job'

interface JobDescription<X> {
	id?: string
	job: Job<X, any, any>
	chained: boolean
	abortController: AbortController
	timeout?: number
	didTimeOut?: boolean
	result?: any
	importance?: JobImportance
	onFulfilled?: FulfilledCallback<X>
	onRejected?: RejectedCallback
	onTimeout?: TimeoutCallback
}

export enum JobImportance {
	HIGH = 'high',
	LOW = 'low',
}

type FulfilledCallback<T> = (queue: IJobQueue, result: T) => void
type RejectedCallback = (reason: any) => void
type TimeoutCallback = (queue: IJobQueue) => void

interface IChainableJobQueue<X> extends IJobQueue {
	chain: <T, V>(job: Job<T, X, V>, timeout?: number, importance?: JobImportance, id?: string) => IChainableJobQueue<T>
	end: (onFulfilled?: FulfilledCallback<X>, onRejected?: RejectedCallback, onTimeout?: TimeoutCallback) => void
}

export interface IJobQueue {
	get length(): number
	clear(): void
	endsWith(jobId: string): boolean
	getLastJobIdByImportance(importance: JobImportance): string | undefined
	enqueue<T, V>(
		job: Job<T, void, V>,
		timeout?: number,
		importance?: JobImportance,
		id?: string
	): IChainableJobQueue<T>
	removeJob(jobId: string): void
}

export class JobQueue extends EventEmitter implements IJobQueue {
	private queue: JobDescription<any>[] = []
	private currentJob: JobDescription<any> | null = null
	private currentJobChain: JobDescription<any>[] = []
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
		} else {
			if (this.currentJobChain.length) {
				this.currentJob = this.currentJobChain[this.currentJobChain.length - 1]

				Promise.allSettled(this.currentJobChain.map(async (job) => job.job.cleanup()))
					.then(this.handleCleanupResults)
					.finally(this.advanceJob)
				this.removeChainedJobsFromTheFront()
			}
		}
	}

	enqueue<T, U>(
		job: Job<T, void, U>,
		timeout?: number,
		importance?: JobImportance,
		id?: string
	): IChainableJobQueue<T> {
		this.queue.push({ id, job, chained: false, timeout, importance, abortController: new AbortController() })
		this.run()
		return this as IChainableJobQueue<T>
	}

	chain<T, U, V>(
		job: Job<T, U, V>,
		timeout?: number,
		importance?: JobImportance,
		id?: string
	): IChainableJobQueue<T> {
		this.queue.push({ id, job, chained: true, timeout, importance, abortController: new AbortController() })
		return this as IChainableJobQueue<T>
	}

	end<X>(onFulfilled?: FulfilledCallback<X>, onRejected?: RejectedCallback, onTimeout?: TimeoutCallback): void {
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
		this.queue = this.queue.filter((job) => job.id !== jobId && !job.chained)
	}

	endsWith(jobId: string): boolean {
		const lastJob = this.queue[this.queue.length - 1] ?? this.currentJob
		return lastJob?.id === jobId
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

	private handleJobFulfilled = (result: any): void => {
		if (!this.currentJob) return
		if (this.currentJob.abortController.signal.aborted) {
			throw new AbortError()
		}
		this.currentJob.result = result
		const nextJob = this.queue[0]
		if (nextJob?.chained) {
			this.currentJobChain.push(this.currentJob)
		}
		if (this.currentJob.onFulfilled) {
			this.currentJob.onFulfilled(this, result)
		}
	}

	private handleJobRejected = async (reason: any): Promise<PromiseSettledResult<void>[] | void> => {
		if (!this.currentJob) return
		this.logger.error(
			`Error in queue "${this.name}" at Job.run "${this.currentJob.job.constructor.name}": ${reason}`
		)
		const ps = []
		if (this.currentJobChain.length) {
			ps.push(...this.currentJobChain.map(async (job) => job.job.cleanup()))
			this.currentJobChain = []
		}
		ps.push(this.currentJob.job.cleanup())
		const lastChainedJob = this.removeChainedJobsFromTheFront() ?? this.currentJob

		const result = await Promise.allSettled(ps)
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

	private removeChainedJobsFromTheFront(): JobDescription<any> | undefined {
		let lastChainedJob: JobDescription<any> | undefined
		for (const job of this.queue) {
			if (job.chained) {
				lastChainedJob = this.queue.shift()
			} else {
				break
			}
		}
		return lastChainedJob
	}

	private abortJob = (job: JobDescription<any>) => {
		job.abortController.abort()
	}

	private advanceJob = () => {
		this.currentJob = null
		if (this.currentJobTimeout) {
			clearTimeout(this.currentJobTimeout)
			this.currentJobTimeout = null
		}

		const nextJob = this.queue[0]
		if (!nextJob?.chained && this.currentJobChain.length) {
			this.currentJobChain = []
		}
		this.run()
	}
}
