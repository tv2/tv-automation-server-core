import { Logger } from '../logger'
import { IJobQueue, JobQueue } from './jobQueue'

export class JobQueueManager {
	private jobQueues = new Map<string, JobQueue>()
	private readonly logger: Logger

	constructor(logger: Logger) {
		this.logger = logger.tag(this.constructor.name)
	}

	get(queueName: string): IJobQueue {
		let queue = this.jobQueues.get(queueName)
		if (!queue) {
			queue = new JobQueue(queueName, this.logger)
			queue.once('done', () => this.jobQueues.delete(queueName))
			this.jobQueues.set(queueName, queue)
		}
		return queue
	}
}
