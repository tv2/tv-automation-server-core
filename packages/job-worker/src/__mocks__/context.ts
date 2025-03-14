import {
	StudioId,
	RundownPlaylistId,
	ShowStyleBaseId,
	ShowStyleVariantId,
	RundownId,
} from '@sofie-automation/corelib/dist/dataModel/Ids'
import { DBShowStyleBase } from '@sofie-automation/corelib/dist/dataModel/ShowStyleBase'
import { ShowStyleCompound } from '@sofie-automation/corelib/dist/dataModel/ShowStyleCompound'
import { DBShowStyleVariant } from '@sofie-automation/corelib/dist/dataModel/ShowStyleVariant'
import { DBStudio } from '@sofie-automation/corelib/dist/dataModel/Studio'
import { EventsJobFunc } from '@sofie-automation/corelib/dist/worker/events'
import { IngestJobFunc } from '@sofie-automation/corelib/dist/worker/ingest'
import { StudioJobFunc } from '@sofie-automation/corelib/dist/worker/studio'
import { WrappedStudioBlueprint, WrappedShowStyleBlueprint } from '../blueprints/cache'
import {
	ProcessedStudioConfig,
	ProcessedShowStyleConfig,
	preprocessStudioConfig,
	preprocessShowStyleConfig,
} from '../blueprints/config'
import { ReadOnlyCacheBase } from '../cache/CacheBase'
import { PlaylistLock, RundownLock } from '../jobs/lock'
import { ReadonlyDeep } from 'type-fest'
import { ApmSpan, JobContext } from '../jobs'
import { createShowStyleCompound } from '../showStyles'
import { getMockCollections } from './collection'
import { clone } from '@sofie-automation/corelib/dist/lib'
import { IDirectCollections } from '../db'
import {
	BlueprintManifestType,
	BlueprintResultPart,
	BlueprintResultRundown,
	BlueprintResultSegment,
	ExtendedIngestRundown,
	IBlueprintActionManifest,
	IBlueprintAdLibPiece,
	IBlueprintPart,
	IBlueprintPiece,
	IBlueprintRundown,
	IBlueprintSegment,
	IngestSegment,
	ISegmentUserContext,
	IShowStyleContext,
	PlaylistTimingType,
	ShowStyleBlueprintManifest,
	StudioBlueprintManifest,
} from '@sofie-automation/blueprints-integration'
import { protectString } from '@sofie-automation/corelib/dist/protectedString'
// import _ = require('underscore')
import { defaultStudio } from './defaultCollectionObjects'
import { TimelineComplete } from '@sofie-automation/corelib/dist/dataModel/Timeline'

export function setupDefaultJobEnvironment(studioId?: StudioId): MockJobContext {
	const collections = getMockCollections()

	// We don't bother 'saving' this to the db, as usually nothing will load it
	const studio: DBStudio = {
		...defaultStudio(studioId ?? protectString('mockStudio0')),
		name: 'mockStudio',
		_rundownVersionHash: 'asdf',
		blueprintId: protectString('studioBlueprint0'),
	}

	return new MockJobContext(collections, studio)
}

export class MockJobContext implements JobContext {
	#collections: Readonly<IDirectCollections>
	#studio: ReadonlyDeep<DBStudio>

	#studioBlueprint: StudioBlueprintManifest
	#showStyleBlueprint: ShowStyleBlueprintManifest

	constructor(collections: Readonly<IDirectCollections>, studio: ReadonlyDeep<DBStudio>) {
		this.#collections = collections
		this.#studio = studio

		this.#studioBlueprint = MockStudioBlueprint()
		this.#showStyleBlueprint = MockShowStyleBlueprint()
	}

	get directCollections(): Readonly<IDirectCollections> {
		return this.#collections
	}

	get studioId(): StudioId {
		return this.#studio._id
	}
	get studio(): ReadonlyDeep<DBStudio> {
		return this.#studio
	}

	get studioBlueprint(): ReadonlyDeep<WrappedStudioBlueprint> {
		return {
			blueprintId: this.studio.blueprintId || protectString('fake'),
			blueprint: this.#studioBlueprint,
		}
	}

	trackCache(_cache: ReadOnlyCacheBase<any>): void {
		// TODO
		// throw new Error('Method not implemented.')
	}
	async lockPlaylist(playlistId: RundownPlaylistId): Promise<PlaylistLock> {
		return new MockPlaylistLock(playlistId)
	}
	async lockRundown(rundownId: RundownId): Promise<RundownLock> {
		return new MockRundownLock(rundownId)
	}

	startSpan(_name: string): ApmSpan | null {
		// no-op
		return null
	}

	async queueIngestJob<T extends keyof IngestJobFunc>(
		_name: T,
		_data: Parameters<IngestJobFunc[T]>[0]
	): Promise<void> {
		throw new Error('Method not implemented.')
	}
	async queueStudioJob<T extends keyof StudioJobFunc>(
		_name: T,
		_data: Parameters<StudioJobFunc[T]>[0]
	): Promise<void> {
		throw new Error('Method not implemented.')
	}
	async queueEventJob<T extends keyof EventsJobFunc>(
		_name: T,
		_data: Parameters<EventsJobFunc[T]>[0]
	): Promise<void> {
		throw new Error('Method not implemented.')
	}

	getStudioBlueprintConfig(): ProcessedStudioConfig {
		return preprocessStudioConfig(this.studio, this.#studioBlueprint)
	}
	async getShowStyleBases(): Promise<ReadonlyDeep<Array<DBShowStyleBase>>> {
		return this.directCollections.ShowStyleBases.findFetch()
	}
	async getShowStyleBase(id: ShowStyleBaseId): Promise<DBShowStyleBase> {
		const style = await this.directCollections.ShowStyleBases.findOne(id)
		if (!style) throw new Error(`ShowStyleBase "${id}" Not found!`)
		return style
	}
	async getShowStyleVariants(id: ShowStyleBaseId): Promise<ReadonlyDeep<Array<DBShowStyleVariant>>> {
		return this.directCollections.ShowStyleVariants.findFetch({
			showStyleBaseId: id,
		})
	}
	async getShowStyleVariant(id: ShowStyleVariantId): Promise<DBShowStyleVariant> {
		const style = await this.directCollections.ShowStyleVariants.findOne(id)
		if (!style) throw new Error(`ShowStyleVariant "${id}" Not found!`)
		return style
	}
	async getShowStyleCompound(
		variantId: ShowStyleVariantId,
		baseId?: ShowStyleBaseId
	): Promise<ReadonlyDeep<ShowStyleCompound>> {
		const [variant, base0] = await Promise.all([
			this.getShowStyleVariant(variantId),
			baseId ? this.getShowStyleBase(baseId) : null,
		])

		const base = base0 ?? (await this.getShowStyleBase(variant.showStyleBaseId))

		const compound = createShowStyleCompound(base, variant)

		if (!compound) {
			throw new Error(`Failed to compile ShowStyleCompound for base "${base._id}" and variant  "${variant._id}"`)
		}

		return compound
	}
	async getShowStyleBlueprint(id: ShowStyleBaseId): Promise<WrappedShowStyleBlueprint> {
		const showStyle = await this.getShowStyleBase(id)

		return {
			blueprintId: showStyle.blueprintId,
			blueprint: this.#showStyleBlueprint,
		}
	}
	getShowStyleBlueprintConfig(showStyle: ReadonlyDeep<ShowStyleCompound>): ProcessedShowStyleConfig {
		return preprocessShowStyleConfig(showStyle, this.#showStyleBlueprint)
	}

	hackPublishTimelineToFastTrack(_newTimeline: TimelineComplete): void {
		// throw new Error('Method not implemented.')
	}

	/**
	 * Mock methods
	 */

	setStudio(studio: ReadonlyDeep<DBStudio>): void {
		this.#studio = clone(studio)
	}
	setShowStyleBlueprint(blueprint: ShowStyleBlueprintManifest): void {
		this.#showStyleBlueprint = blueprint
	}
	updateShowStyleBlueprint(blueprint: Partial<ShowStyleBlueprintManifest>): void {
		this.#showStyleBlueprint = {
			...this.#showStyleBlueprint,
			...blueprint,
		}
	}
	setStudioBlueprint(blueprint: StudioBlueprintManifest): void {
		this.#studioBlueprint = blueprint
	}
	updateStudioBlueprint(blueprint: Partial<StudioBlueprintManifest>): void {
		this.#studioBlueprint = {
			...this.#studioBlueprint,
			...blueprint,
		}
	}
}

const MockStudioBlueprint: () => StudioBlueprintManifest = () => ({
	blueprintType: BlueprintManifestType.STUDIO,
	blueprintVersion: '0.0.0',
	integrationVersion: '0.0.0',
	TSRVersion: '0.0.0',

	studioConfigManifest: [],
	studioMigrations: [],
	getBaseline: () => {
		return {
			timelineObjects: [],
		}
	},
	getShowStyleId: (_context, showStyles): string | null => {
		return showStyles[0]._id
	},
})

const MockShowStyleBlueprint: () => ShowStyleBlueprintManifest = () => ({
	blueprintType: BlueprintManifestType.SHOWSTYLE,
	blueprintVersion: '0.0.0',
	integrationVersion: '0.0.0',
	TSRVersion: '0.0.0',

	showStyleConfigManifest: [],
	showStyleMigrations: [],
	getShowStyleVariantId: (_context, variants): string | null => {
		return variants[0]._id
	},
	getRundown: (_context: IShowStyleContext, ingestRundown: ExtendedIngestRundown): BlueprintResultRundown => {
		const rundown: IBlueprintRundown = {
			externalId: ingestRundown.externalId,
			name: ingestRundown.name,
			// expectedStart?:
			// expectedDuration?: number;
			metaData: {
				payload: ingestRundown.payload,
				airStatus: ingestRundown.coreData?.airStatus,
			},
			timing: {
				type: PlaylistTimingType.None,
			},
		}

		// Allow the rundown to specify a playlistExternalId that should be used
		const playlistId = ingestRundown.payload?.ForcePlaylistExternalId
		if (playlistId) rundown.playlistExternalId = playlistId

		return {
			rundown,
			globalAdLibPieces: [],
			globalActions: [],
			baseline: { timelineObjects: [] },
		}
	},
	getSegment: (_context: ISegmentUserContext, ingestSegment: IngestSegment): BlueprintResultSegment => {
		const segment: IBlueprintSegment = {
			name: ingestSegment.name ? ingestSegment.name : ingestSegment.externalId,
			metaData: ingestSegment.payload,
			isHidden: ingestSegment.payload?.hidden,
		}
		const parts: BlueprintResultPart[] = []

		for (const ingestPart of ingestSegment.parts) {
			const part: IBlueprintPart = {
				externalId: ingestPart.externalId,
				title: ingestPart.name,
				metaData: ingestPart.payload,
				// autoNext?: boolean;
				// autoNextOverlap?: number;
				// prerollDuration?: number;
				// transitionPrerollDuration?: number | null;
				// transitionKeepaliveDuration?: number | null;
				// transitionDuration?: number | null;
				// disableOutTransition?: boolean;
				// expectedDuration?: number;
				// holdMode?: PartHoldMode;
				// updateStoryStatus?: boolean;
				// classes?: string[];
				// classesForNext?: string[];
				// displayDurationGroup?: string;
				// displayDuration?: number;
				// invalid?: boolean
			}
			const pieces: IBlueprintPiece[] = ingestPart.payload?.pieces ?? []
			const adLibPieces: IBlueprintAdLibPiece[] = []
			const actions: IBlueprintActionManifest[] = []
			parts.push({
				part,
				pieces,
				adLibPieces,
				actions,
			})
		}

		return {
			segment,
			parts,
		}
	},
	// onRundownActivate?: (context: EventContext & RundownContext) => Promise<void>,
	// onRundownFirstTake?: (context: EventContext & PartEventContext) => Promise<void>,
	// onRundownDeActivate?: (context: EventContext & RundownContext) => Promise<void>,
	// onPreTake?: (context: EventContext & PartEventContext) => Promise<void>,
	// onPostTake?: (context: EventContext & PartEventContext) => Promise<void>,
	// onTimelineGenerate?: (context: EventContext & RundownContext, timeline: Timeline.TimelineObject[]) => Promise<Timeline.TimelineObject[]>,
	// onAsRunEvent?: (context: EventContext & AsRunEventContext) => Promise<IBlueprintExternalMessageQueueObj[]>,
})

class MockPlaylistLock extends PlaylistLock {
	#locked = true

	constructor(playlistId: RundownPlaylistId) {
		super(playlistId)
	}

	get isLocked(): boolean {
		return this.#locked
	}
	async release(): Promise<void> {
		if (!this.#locked) throw new Error('Already unlocked!')
		this.#locked = false

		for (const fcn of this.deferedFunctions) {
			await fcn()
		}
	}
}

class MockRundownLock extends RundownLock {
	#locked = true

	constructor(rundownId: RundownId) {
		super(rundownId)
	}

	get isLocked(): boolean {
		return this.#locked
	}
	async release(): Promise<void> {
		if (!this.#locked) throw new Error('Already unlocked!')
		this.#locked = false

		for (const fcn of this.deferedFunctions) {
			await fcn()
		}
	}
}
