import { RundownId, SegmentId, IngestDataCacheObjId } from '@sofie-automation/corelib/dist/dataModel/Ids'
import {
	IngestDataCacheObj,
	IngestCacheType,
	IngestDataCacheObjRundown,
	IngestDataCacheObjSegment,
	IngestDataCacheObjPart,
} from '@sofie-automation/corelib/dist/dataModel/IngestDataCache'
import { protectString, unprotectString } from '@sofie-automation/corelib/dist/protectedString'
import { DbCacheWriteCollection } from '../cache/CacheCollection'
import { saveIntoCache } from '../cache/lib'
import { Changes } from '../db/changes'
import { getCurrentTime } from '../lib'
import { logger } from '../logging'
import _ = require('underscore')
import { IngestRundown, IngestSegment, IngestPart } from '@sofie-automation/blueprints-integration'
import { JobContext } from '../jobs'
import { getPartId, getSegmentId } from './lib'
import { SetOptional } from 'type-fest'

interface LocalIngestBase {
	modified: number
}
export interface LocalIngestRundown extends IngestRundown, LocalIngestBase {
	segments: LocalIngestSegment[]
}
export interface LocalIngestSegment extends IngestSegment, LocalIngestBase {
	parts: LocalIngestPart[]
}
export interface LocalIngestPart extends IngestPart, LocalIngestBase {}
export function isLocalIngestRundown(o: IngestRundown | LocalIngestRundown): o is LocalIngestRundown {
	return 'modified' in o
}
export function makeNewIngestRundown(ingestRundown: SetOptional<IngestRundown, 'segments'>): LocalIngestRundown {
	return {
		...ingestRundown,
		segments: ingestRundown.segments ? _.map(ingestRundown.segments, makeNewIngestSegment) : [],
		modified: getCurrentTime(),
	}
}
export function makeNewIngestSegment(ingestSegment: IngestSegment): LocalIngestSegment {
	return {
		...ingestSegment,
		parts: _.map(ingestSegment.parts, makeNewIngestPart),
		modified: getCurrentTime(),
	}
}
export function makeNewIngestPart(ingestPart: IngestPart): LocalIngestPart {
	return { ...ingestPart, modified: getCurrentTime() }
}

export class RundownIngestDataCache {
	private constructor(
		private readonly context: JobContext,
		private readonly rundownId: RundownId,
		private readonly collection: DbCacheWriteCollection<IngestDataCacheObj>
	) {}

	static async create(context: JobContext, rundownId: RundownId): Promise<RundownIngestDataCache> {
		const col = await DbCacheWriteCollection.createFromDatabase(
			context,
			context.directCollections.IngestDataCache,
			{ rundownId }
		)

		return new RundownIngestDataCache(context, rundownId, col)
	}

	fetchRundown(): LocalIngestRundown | undefined {
		const span = this.context.startSpan('ingest.ingestCache.loadCachedRundownData')

		const cacheEntries = this.collection.findFetch({})

		const cachedRundown = cacheEntries.find((e) => e.type === IngestCacheType.RUNDOWN)
		if (!cachedRundown) {
			span?.end()
			return undefined
		}

		const ingestRundown = cachedRundown.data as LocalIngestRundown
		ingestRundown.modified = cachedRundown.modified

		const hasSegmentId = (obj: IngestDataCacheObj): obj is IngestDataCacheObjSegment | IngestDataCacheObjPart => {
			return !!obj.segmentId
		}

		const segmentMap = _.groupBy(cacheEntries.filter(hasSegmentId), (e) => unprotectString(e.segmentId))
		_.each(segmentMap, (objs) => {
			const segmentEntry = objs.find((e) => e.type === IngestCacheType.SEGMENT)
			if (segmentEntry) {
				const ingestSegment = segmentEntry.data as LocalIngestSegment
				ingestSegment.modified = segmentEntry.modified

				for (const entry of objs) {
					if (entry.type === IngestCacheType.PART) {
						const ingestPart = entry.data as LocalIngestPart
						ingestPart.modified = entry.modified

						ingestSegment.parts.push(ingestPart)
					}
				}

				ingestSegment.parts = _.sortBy(ingestSegment.parts, (s) => s.rank)
				ingestRundown.segments.push(ingestSegment)
			}
		})

		ingestRundown.segments = _.sortBy(ingestRundown.segments, (s) => s.rank)

		span?.end()
		return ingestRundown
	}

	fetchSegment(segmentId: SegmentId): LocalIngestSegment | undefined {
		const cacheEntries = this.collection.findFetch({ segmentId: segmentId })

		const segmentEntries = cacheEntries.filter((e) => e.type === IngestCacheType.SEGMENT)
		if (segmentEntries.length > 1)
			logger.warn(
				`There are multiple segments (${cacheEntries.length}) in IngestDataCache for rundownId: "${this.rundownId}", segmentId: "${segmentId}"`
			)

		const segmentEntry = segmentEntries[0]
		if (!segmentEntry) return undefined
		if (segmentEntry.type !== IngestCacheType.SEGMENT) throw new Error('Wrong type on cached segment')

		const ingestSegment = segmentEntry.data as LocalIngestSegment
		ingestSegment.modified = segmentEntry.modified

		for (const entry of cacheEntries) {
			if (entry.type === IngestCacheType.PART) {
				const ingestPart = entry.data as LocalIngestPart
				ingestPart.modified = entry.modified

				ingestSegment.parts.push(ingestPart)
			}
		}

		ingestSegment.parts = _.sortBy(ingestSegment.parts, (s) => s.rank)

		return ingestSegment
	}

	update(ingestRundown: LocalIngestRundown): void {
		// cache the Data:
		const cacheEntries: IngestDataCacheObj[] = generateCacheForRundown(this.rundownId, ingestRundown)
		saveIntoCache<IngestDataCacheObj>(this.context, this.collection, {}, cacheEntries)
	}

	delete(): void {
		this.collection.remove({})
	}

	async saveToDatabase(): Promise<Changes> {
		return this.collection.updateDatabaseWithData()
	}
}

function generateCacheForRundown(rundownId: RundownId, ingestRundown: LocalIngestRundown): IngestDataCacheObj[] {
	// cache the Data
	const cacheEntries: IngestDataCacheObj[] = []
	const rundown: IngestDataCacheObjRundown = {
		_id: protectString<IngestDataCacheObjId>(unprotectString(rundownId)),
		type: IngestCacheType.RUNDOWN,
		rundownId: rundownId,
		modified: ingestRundown.modified,
		data: {
			..._.omit(ingestRundown, 'modified'),
			segments: [], // omit the segments, they come as separate objects
		},
	}
	cacheEntries.push(rundown)
	_.each(ingestRundown.segments, (segment) => cacheEntries.push(...generateCacheForSegment(rundownId, segment)))
	return cacheEntries
}
function generateCacheForSegment(rundownId: RundownId, ingestSegment: LocalIngestSegment): IngestDataCacheObj[] {
	const segmentId = getSegmentId(rundownId, ingestSegment.externalId)
	const cacheEntries: Array<IngestDataCacheObjSegment | IngestDataCacheObjPart> = []

	const segment: IngestDataCacheObjSegment = {
		_id: protectString<IngestDataCacheObjId>(`${rundownId}_${segmentId}`),
		type: IngestCacheType.SEGMENT,
		rundownId: rundownId,
		segmentId: segmentId,
		modified: ingestSegment.modified,
		data: {
			..._.omit(ingestSegment, 'modified'),
			parts: [], // omit the parts, they come as separate objects
		},
	}
	cacheEntries.push(segment)

	_.each(ingestSegment.parts, (part) => {
		cacheEntries.push(generateCacheForPart(rundownId, segmentId, part))
	})

	return cacheEntries
}
function generateCacheForPart(
	rundownId: RundownId,
	segmentId: SegmentId,
	part: LocalIngestPart
): IngestDataCacheObjPart {
	const partId = getPartId(rundownId, part.externalId)
	return {
		_id: protectString<IngestDataCacheObjId>(`${rundownId}_${partId}`),
		type: IngestCacheType.PART,
		rundownId: rundownId,
		segmentId: segmentId,
		partId: partId,
		modified: part.modified,
		data: _.omit(part, 'modified'),
	}
}
