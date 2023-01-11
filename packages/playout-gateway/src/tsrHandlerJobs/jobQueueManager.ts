import { Logger } from 'winston'
import { IJobQueue, JobQueue } from './jobQueue'

export class JobQueueManager {
	private jobQueues = new Map<string, JobQueue>()

	constructor(private logger: Logger) {}

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
