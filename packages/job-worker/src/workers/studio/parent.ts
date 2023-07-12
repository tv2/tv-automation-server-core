import { getStudioQueueName } from '@sofie-automation/corelib/dist/worker/studio'
import type { StudioWorkerChild } from './child'
import { InvalidateWorkerDataCache } from '../caches'
import { WorkerParentBase, WorkerParentOptions, WorkerParentBaseOptions, WorkerJobResult } from '../parent-base'
import { AnyLockEvent } from '../locks'
import { Promisify, threadedClass, ThreadedClassManager } from 'threadedclass'
import { FastTrackTimelineFunc, LogLineWithSourceFunc } from '../../main'

const FREEZE_LIMIT = 2500 // how long to wait for a response to a Ping
const RESTART_TIMEOUT = 10000 // how long to wait for a restart to complete before throwing an error
const KILL_TIMEOUT = 10000 // how long to wait for a thread to terminate before throwing an error
const AUTO_RESTART_RETRY_COUNT = 0 // how many autorestart attemps are allowed (0 means it will never stop retrying)
const AUTO_RESTART_RETRY_DELAY = 1000 // how long to wait before retrying after a failed restart

export class StudioWorkerParent extends WorkerParentBase {
	readonly #thread: Promisify<StudioWorkerChild>

	private constructor(baseOptions: WorkerParentBaseOptions, thread: Promisify<StudioWorkerChild>) {
		super(baseOptions)

		this.#thread = thread
	}

	static async start(
		baseOptions: WorkerParentOptions,
		mongoUri: string,
		logLine: LogLineWithSourceFunc,
		fastTrackTimeline: FastTrackTimelineFunc | null
	): Promise<StudioWorkerParent> {
		const queueName = getStudioQueueName(baseOptions.studioId)
		const prettyName = queueName
		const emitLockEvent = async (e: AnyLockEvent) => baseOptions.locksManager.handleLockEvent(queueName, e)

		const workerThread = await threadedClass<StudioWorkerChild, typeof StudioWorkerChild>(
			'./child',
			'StudioWorkerChild',
			[baseOptions.studioId, emitLockEvent, baseOptions.jobManager.queueJob, logLine, fastTrackTimeline],
			{
				instanceName: `Studio: ${baseOptions.studioId}`,
				autoRestart: true,
				autoRestartRetryCount: AUTO_RESTART_RETRY_COUNT,
				autoRestartRetryDelay: AUTO_RESTART_RETRY_DELAY,
				freezeLimit: FREEZE_LIMIT,
				restartTimeout: RESTART_TIMEOUT,
				killTimeout: KILL_TIMEOUT,
			}
		)

		// create and start the worker
		const parent = new StudioWorkerParent({ ...baseOptions, queueName, prettyName }, workerThread)

		parent.registerStatusEvents(workerThread)

		parent.startWorkerLoop(mongoUri)
		return parent
	}

	protected async initWorker(mongoUri: string, dbName: string): Promise<void> {
		return this.#thread.init(mongoUri, dbName)
	}
	protected async invalidateWorkerCaches(invalidations: InvalidateWorkerDataCache): Promise<void> {
		return this.#thread.invalidateCaches(invalidations)
	}
	protected async runJobInWorker(name: string, data: unknown): Promise<WorkerJobResult> {
		return this.#thread.runJob(name, data)
	}
	protected async terminateWorkerThread(): Promise<void> {
		return ThreadedClassManager.destroy(this.#thread)
	}
	protected async restartWorkerThread(): Promise<void> {
		return ThreadedClassManager.restart(this.#thread, true)
	}
	public async workerLockChange(lockId: string, locked: boolean): Promise<void> {
		return this.#thread.lockChange(lockId, locked)
	}
}
