import { ingestJobHandlers } from './jobs'
import { StudioId } from '@sofie-automation/corelib/dist/dataModel/Ids'
import { MongoClient } from 'mongodb'
import { createMongoConnection, getMongoCollections, IDirectCollections } from '../../db'
import { unprotectString } from '@sofie-automation/corelib/dist/protectedString'
import { setupApmAgent, startTransaction } from '../../profiler'
import { InvalidateWorkerDataCache, invalidateWorkerDataCache, loadWorkerDataCache, WorkerDataCache } from '../caches'
import { JobContextImpl, QueueJobFunc } from '../context'
import { AnyLockEvent, LocksManager } from '../locks'
import { FastTrackTimelineFunc, LogLineWithSourceFunc } from '../../main'
import { interceptLogging, logger } from '../../logging'
import { stringifyError } from '@sofie-automation/corelib/dist/lib'
import { setupInfluxDb } from '../../influx'
import { getIngestQueueName } from '@sofie-automation/corelib/dist/worker/ingest'
import { WorkerJobResult } from '../parent-base'

interface StaticData {
	readonly mongoClient: MongoClient
	readonly collections: IDirectCollections

	readonly dataCache: WorkerDataCache
}

export class IngestWorkerChild {
	#staticData: StaticData | undefined

	readonly #studioId: StudioId
	readonly #locks: LocksManager
	readonly #queueJob: QueueJobFunc
	readonly #fastTrackTimeline: FastTrackTimelineFunc | null

	constructor(
		studioId: StudioId,
		emitLockEvent: (event: AnyLockEvent) => Promise<void>,
		queueJob: QueueJobFunc,
		logLine: LogLineWithSourceFunc,
		fastTrackTimeline: FastTrackTimelineFunc | null
	) {
		// Intercept logging to pipe back over ipc
		interceptLogging(getIngestQueueName(studioId), logLine)

		setupApmAgent()
		setupInfluxDb()

		this.#locks = new LocksManager(emitLockEvent)
		this.#queueJob = queueJob
		this.#fastTrackTimeline = fastTrackTimeline
		this.#studioId = studioId
	}

	async init(mongoUri: string, mongoDb: string): Promise<void> {
		if (this.#staticData) throw new Error('Worker already initialised')

		const mongoClient = await createMongoConnection(mongoUri)
		const collections = getMongoCollections(mongoClient, mongoDb, false)

		// Load some 'static' data from the db
		const dataCache = await loadWorkerDataCache(collections, this.#studioId)

		this.#staticData = {
			mongoClient,
			collections,

			dataCache,
		}

		logger.info(`Ingest thread for ${this.#studioId} initialised`)
	}
	async lockChange(lockId: string, locked: boolean): Promise<void> {
		if (!this.#staticData) throw new Error('Worker not initialised')

		this.#locks.changeEvent(lockId, locked)
	}
	async invalidateCaches(data: InvalidateWorkerDataCache): Promise<void> {
		if (!this.#staticData) throw new Error('Worker not initialised')

		const transaction = startTransaction('invalidateCaches', 'worker-studio')
		if (transaction) {
			transaction.setLabel('studioId', unprotectString(this.#staticData.dataCache.studio._id))
		}

		try {
			await invalidateWorkerDataCache(this.#staticData.collections, this.#staticData.dataCache, data)
		} finally {
			transaction?.end()
		}
	}
	async runJob(jobName: string, data: unknown): Promise<WorkerJobResult> {
		if (!this.#staticData) throw new Error('Worker not initialised')

		const transaction = startTransaction(jobName, 'worker-ingest')
		if (transaction) {
			transaction.setLabel('studioId', unprotectString(this.#staticData.dataCache.studio._id))
			// transaction.setLabel('rundownId', unprotectString(staticData.rundownId))
		}

		const context = new JobContextImpl(
			this.#staticData.collections,
			this.#staticData.dataCache,
			this.#locks,
			transaction,
			this.#queueJob,
			this.#fastTrackTimeline
		)

		try {
			// Execute function, or fail if no handler
			const handler = (ingestJobHandlers as any)[jobName]
			if (handler) {
				try {
					const res = await handler(context, data)
					// explicitly await, to force the promise to resolve before the apm transaction is terminated
					return {
						result: res,
						error: null,
					}
				} catch (e) {
					logger.error(`Ingest job "${jobName}" errored: ${stringifyError(e)}`)
					return {
						result: null,
						error: e,
					}
				}
			} else {
				throw new Error(`Unknown job name: "${jobName}"`)
			}
		} finally {
			await context.cleanupResources()

			transaction?.end()
		}
	}
}
