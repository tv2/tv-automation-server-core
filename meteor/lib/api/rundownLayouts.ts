import {
	RundownLayoutBase,
	RundownLayout,
	DashboardLayout,
	RundownLayoutType,
	RundownLayoutId,
	RundownLayoutElementBase,
	RundownLayoutFilterBase,
	RundownLayoutElementType,
	RundownLayoutExternalFrame,
	RundownLayoutAdLibRegion,
	PieceDisplayStyle,
	RundownLayoutPieceCountdown,
	RundownViewLayout,
	RundownLayoutRundownHeader,
	RundownLayoutShelfBase,
	CustomizableRegions,
	RundownLayoutPlaylistStartTimer,
	RundownLayoutPlaylistEndTimer,
	RundownLayoutNextBreakTiming,
	RundownLayoutEndWords,
	RundownLayoutSegmentTiming,
	RundownLayoutPartTiming,
	RundownLayoutTextLabel,
	RundownLayoutPlaylistName,
	RundownLayoutTimeOfDay,
	RundownLayoutSytemStatus,
	RundownLayoutShowStyleDisplay,
	RundownLayoutWithFilters,
	DashboardLayoutFilter,
	RundownLayoutKeyboardPreview,
	RundownLayoutNextInfo,
	RundownLayoutPresenterView,
	RundownLayoutStudioName,
	RundownLayoutSegmentName,
	RundownLayoutPartName,
	RundownLayoutColoredBox,
	RundownLayoutMiniRundown,
} from '../collections/RundownLayouts'
import { ShowStyleBaseId } from '../collections/ShowStyleBases'
import * as _ from 'underscore'
import { literal } from '../lib'
import { TFunction } from 'i18next'
import { StudioId } from '../collections/Studios'
import { Settings } from '../Settings'

export interface NewRundownLayoutsAPI {
	createRundownLayout(
		name: string,
		type: RundownLayoutType,
		showStyleBaseId: ShowStyleBaseId,
		regionId: string
	): Promise<RundownLayoutId>
	removeRundownLayout(id: RundownLayoutId): Promise<void>
}

export enum RundownLayoutsAPIMethods {
	'removeRundownLayout' = 'rundownLayout.removeRundownLayout',
	'createRundownLayout' = 'rundownLayout.createRundownLayout',
}

export interface LayoutDescriptor {
	supportedFilters: RundownLayoutElementType[]
	filtersTitle?: string // e.g. tabs/panels
}

export interface CustomizableRegionSettingsManifest {
	_id: string
	title: string
	layouts: Array<CustomizableRegionLayout>
	navigationLink: (studioId: StudioId, layoutId: RundownLayoutId) => string
}

export interface CustomizableRegionLayout {
	_id: string
	type: RundownLayoutType
	filtersTitle?: string
	supportedFilters: RundownLayoutElementType[]
}

class RundownLayoutsRegistry {
	private shelfLayouts: Map<RundownLayoutType, LayoutDescriptor> = new Map()
	private rundownViewLayouts: Map<RundownLayoutType, LayoutDescriptor> = new Map()
	private miniShelfLayouts: Map<RundownLayoutType, LayoutDescriptor> = new Map()
	private rundownHeaderLayouts: Map<RundownLayoutType, LayoutDescriptor> = new Map()
	private presenterViewLayouts: Map<RundownLayoutType, LayoutDescriptor> = new Map()

	public registerShelfLayout(id: RundownLayoutType, description: LayoutDescriptor) {
		this.shelfLayouts.set(id, description)
	}

	public registerRundownViewLayout(id: RundownLayoutType, description: LayoutDescriptor) {
		this.rundownViewLayouts.set(id, description)
	}

	public registerMiniShelfLayout(id: RundownLayoutType, description: LayoutDescriptor) {
		this.miniShelfLayouts.set(id, description)
	}

	public registerRundownHeaderLayouts(id: RundownLayoutType, description: LayoutDescriptor) {
		this.rundownHeaderLayouts.set(id, description)
	}

	public registerPresenterViewLayout(id: RundownLayoutType, description: LayoutDescriptor) {
		this.presenterViewLayouts.set(id, description)
	}

	public isShelfLayout(regionId: CustomizableRegions) {
		return regionId === CustomizableRegions.Shelf
	}

	public isRudownViewLayout(regionId: CustomizableRegions) {
		return regionId === CustomizableRegions.RundownView
	}

	public isMiniShelfLayout(regionId: CustomizableRegions) {
		return regionId === CustomizableRegions.MiniShelf
	}

	public isRundownHeaderLayout(regionId: CustomizableRegions) {
		return regionId === CustomizableRegions.RundownHeader
	}

	public isPresenterViewLayout(regionId: CustomizableRegions) {
		return regionId === CustomizableRegions.PresenterView
	}

	private wrapToCustomizableRegionLayout(
		layouts: Map<RundownLayoutType, LayoutDescriptor>,
		t: TFunction
	): CustomizableRegionLayout[] {
		return Array.from(layouts.entries()).map(([layoutType, descriptor]) => {
			return literal<CustomizableRegionLayout>({
				_id: layoutType,
				type: layoutType,
				...descriptor,
				filtersTitle: descriptor.filtersTitle ? t(descriptor.filtersTitle) : undefined,
			})
		})
	}

	public GetSettingsManifest(t: TFunction): CustomizableRegionSettingsManifest[] {
		return [
			{
				_id: CustomizableRegions.RundownView,
				title: t('Rundown View Layouts'),
				layouts: this.wrapToCustomizableRegionLayout(this.rundownViewLayouts, t),
				navigationLink: (studioId, layoutId) => `/activeRundown/${studioId}?rundownViewLayout=${layoutId}`,
			},
			{
				_id: CustomizableRegions.Shelf,
				title: t('Shelf Layouts'),
				layouts: this.wrapToCustomizableRegionLayout(this.shelfLayouts, t),
				navigationLink: (studioId, layoutId) => `/activeRundown/${studioId}/shelf?layout=${layoutId}`,
			},
			{
				_id: CustomizableRegions.MiniShelf,
				title: t('Mini Shelf Layouts'),
				layouts: this.wrapToCustomizableRegionLayout(this.miniShelfLayouts, t),
				navigationLink: (studioId, layoutId) => `/activeRundown/${studioId}?miniShelfLayout=${layoutId}`,
			},
			{
				_id: CustomizableRegions.RundownHeader,
				title: t('Rundown Header Layouts'),
				layouts: this.wrapToCustomizableRegionLayout(this.rundownHeaderLayouts, t),
				navigationLink: (studioId, layoutId) => `/activeRundown/${studioId}?rundownHeaderLayout=${layoutId}`,
			},
			{
				_id: CustomizableRegions.PresenterView,
				title: t('Presenter View Layouts'),
				layouts: this.wrapToCustomizableRegionLayout(this.presenterViewLayouts, t),
				navigationLink: (studioId, layoutId) => `/countdowns/${studioId}/presenter?presenterLayout=${layoutId}`,
			},
		]
	}
}

export namespace RundownLayoutsAPI {
	const registry = new RundownLayoutsRegistry()
	const rundownLayoutSupportedFilters = [
		RundownLayoutElementType.ADLIB_REGION,
		RundownLayoutElementType.EXTERNAL_FRAME,
		RundownLayoutElementType.FILTER,
		RundownLayoutElementType.PIECE_COUNTDOWN,
		RundownLayoutElementType.NEXT_INFO,
	]
	if (Settings.enableKeyboardPreview) {
		rundownLayoutSupportedFilters.push(RundownLayoutElementType.KEYBOARD_PREVIEW)
	}
	registry.registerShelfLayout(RundownLayoutType.RUNDOWN_LAYOUT, {
		filtersTitle: 'Tabs',
		supportedFilters: rundownLayoutSupportedFilters,
	})
	const dashboardLayoutSupportedFilters = [
		RundownLayoutElementType.ADLIB_REGION,
		RundownLayoutElementType.EXTERNAL_FRAME,
		RundownLayoutElementType.FILTER,
		RundownLayoutElementType.PIECE_COUNTDOWN,
		RundownLayoutElementType.NEXT_INFO,
		RundownLayoutElementType.TEXT_LABEL,
		RundownLayoutElementType.MINI_RUNDOWN,
	]
	if (Settings.enableKeyboardPreview) {
		rundownLayoutSupportedFilters.push(RundownLayoutElementType.KEYBOARD_PREVIEW)
	}
	registry.registerShelfLayout(RundownLayoutType.DASHBOARD_LAYOUT, {
		filtersTitle: 'Panels',
		supportedFilters: dashboardLayoutSupportedFilters,
	})
	registry.registerMiniShelfLayout(RundownLayoutType.DASHBOARD_LAYOUT, {
		supportedFilters: [RundownLayoutElementType.FILTER],
	})
	registry.registerMiniShelfLayout(RundownLayoutType.RUNDOWN_LAYOUT, {
		supportedFilters: [RundownLayoutElementType.FILTER],
	})
	registry.registerRundownViewLayout(RundownLayoutType.RUNDOWN_VIEW_LAYOUT, {
		supportedFilters: [],
	})
	registry.registerRundownHeaderLayouts(RundownLayoutType.RUNDOWN_HEADER_LAYOUT, {
		supportedFilters: [],
	})
	registry.registerRundownHeaderLayouts(RundownLayoutType.DASHBOARD_LAYOUT, {
		filtersTitle: 'Layout Elements',
		supportedFilters: [
			RundownLayoutElementType.PIECE_COUNTDOWN,
			RundownLayoutElementType.PLAYLIST_START_TIMER,
			RundownLayoutElementType.PLAYLIST_END_TIMER,
			RundownLayoutElementType.NEXT_BREAK_TIMING,
			RundownLayoutElementType.END_WORDS,
			RundownLayoutElementType.SEGMENT_TIMING,
			RundownLayoutElementType.PART_TIMING,
			RundownLayoutElementType.TEXT_LABEL,
			RundownLayoutElementType.PLAYLIST_NAME,
			RundownLayoutElementType.TIME_OF_DAY,
			RundownLayoutElementType.SHOWSTYLE_DISPLAY,
			RundownLayoutElementType.SYSTEM_STATUS,
			RundownLayoutElementType.COLORED_BOX,
		],
	})
	registry.registerPresenterViewLayout(RundownLayoutType.CLOCK_PRESENTER_VIEW_LAYOUT, {
		supportedFilters: [],
	})
	registry.registerPresenterViewLayout(RundownLayoutType.DASHBOARD_LAYOUT, {
		filtersTitle: 'Layout Elements',
		supportedFilters: [
			RundownLayoutElementType.PART_TIMING,
			RundownLayoutElementType.TEXT_LABEL,
			RundownLayoutElementType.SEGMENT_TIMING,
			RundownLayoutElementType.PLAYLIST_END_TIMER,
			RundownLayoutElementType.NEXT_BREAK_TIMING,
			RundownLayoutElementType.TIME_OF_DAY,
			RundownLayoutElementType.PLAYLIST_NAME,
			RundownLayoutElementType.STUDIO_NAME,
			RundownLayoutElementType.SEGMENT_NAME,
			RundownLayoutElementType.PART_NAME,
			RundownLayoutElementType.COLORED_BOX,
		],
	})

	export function getSettingsManifest(t: TFunction): CustomizableRegionSettingsManifest[] {
		return registry.GetSettingsManifest(t)
	}

	export function isLayoutWithFilters(layout: RundownLayoutBase): layout is RundownLayoutWithFilters {
		return Object.keys(layout).includes('filters')
	}

	export function isLayoutForShelf(layout: RundownLayoutBase): layout is RundownLayoutShelfBase {
		return registry.isShelfLayout(layout.regionId)
	}

	export function isLayoutForPresenterView(layout: RundownLayoutBase): layout is RundownLayoutPresenterView {
		return registry.isPresenterViewLayout(layout.regionId)
	}

	export function isLayoutForRundownView(layout: RundownLayoutBase): layout is RundownViewLayout {
		return registry.isRudownViewLayout(layout.regionId)
	}

	export function isLayoutForMiniShelf(layout: RundownLayoutBase): layout is RundownLayoutShelfBase {
		return registry.isMiniShelfLayout(layout.regionId)
	}

	export function isLayoutForRundownHeader(layout: RundownLayoutBase): layout is RundownLayoutRundownHeader {
		return registry.isRundownHeaderLayout(layout.regionId)
	}

	export function isRundownViewLayout(layout: RundownLayoutBase): layout is RundownViewLayout {
		return layout.type === RundownLayoutType.RUNDOWN_VIEW_LAYOUT
	}

	export function isRundownLayout(layout: RundownLayoutBase): layout is RundownLayout {
		// we need to check if filters are defined, because RundownLayout is a RundownLayoutWithFilters, and RundownLayoutBase doesn't require it
		return layout.type === RundownLayoutType.RUNDOWN_LAYOUT && (layout as RundownLayout).filters !== undefined
	}

	export function isDashboardLayout(layout: RundownLayoutBase): layout is DashboardLayout {
		// we need to check if filters are defined, because DashboardLayout is a RundownLayoutWithFilters, and RundownLayoutBase doesn't require it
		return layout.type === RundownLayoutType.DASHBOARD_LAYOUT && (layout as DashboardLayout).filters !== undefined
	}

	export function isRundownHeaderLayout(layout: RundownLayoutBase): layout is RundownLayoutRundownHeader {
		return layout.type === RundownLayoutType.RUNDOWN_HEADER_LAYOUT
	}

	export function isDefaultLayout(layout: RundownLayoutBase): boolean {
		return layout.isDefaultLayout
	}

	export function isFilter(element: RundownLayoutElementBase): element is RundownLayoutFilterBase {
		return element.type === undefined || element.type === RundownLayoutElementType.FILTER
	}

	export function isExternalFrame(element: RundownLayoutElementBase): element is RundownLayoutExternalFrame {
		return element.type === RundownLayoutElementType.EXTERNAL_FRAME
	}

	export function isAdLibRegion(element: RundownLayoutElementBase): element is RundownLayoutAdLibRegion {
		return element.type === RundownLayoutElementType.ADLIB_REGION
	}

	export function isPieceCountdown(element: RundownLayoutElementBase): element is RundownLayoutPieceCountdown {
		return element.type === RundownLayoutElementType.PIECE_COUNTDOWN
	}

	export function isDashboardLayoutFilter(element: RundownLayoutElementBase): element is DashboardLayoutFilter {
		return element.type === RundownLayoutElementType.FILTER
	}

	export function isKeyboardMap(element: RundownLayoutElementBase): element is RundownLayoutKeyboardPreview {
		return element.type === RundownLayoutElementType.KEYBOARD_PREVIEW
	}

	export function isNextInfo(element: RundownLayoutElementBase): element is RundownLayoutNextInfo {
		return element.type === RundownLayoutElementType.NEXT_INFO
	}

	export function isMiniRundown(element: RundownLayoutElementBase): element is RundownLayoutMiniRundown {
		return element.type === RundownLayoutElementType.MINI_RUNDOWN
	}

	export function isPlaylistStartTimer(
		element: RundownLayoutElementBase
	): element is RundownLayoutPlaylistStartTimer {
		return element.type === RundownLayoutElementType.PLAYLIST_START_TIMER
	}

	export function isPlaylistEndTimer(element: RundownLayoutElementBase): element is RundownLayoutPlaylistEndTimer {
		return element.type === RundownLayoutElementType.PLAYLIST_END_TIMER
	}

	export function isNextBreakTiming(element: RundownLayoutElementBase): element is RundownLayoutNextBreakTiming {
		return element.type === RundownLayoutElementType.NEXT_BREAK_TIMING
	}

	export function isEndWords(element: RundownLayoutElementBase): element is RundownLayoutEndWords {
		return element.type === RundownLayoutElementType.END_WORDS
	}

	export function isSegmentTiming(element: RundownLayoutElementBase): element is RundownLayoutSegmentTiming {
		return element.type === RundownLayoutElementType.SEGMENT_TIMING
	}

	export function isPartTiming(element: RundownLayoutElementBase): element is RundownLayoutPartTiming {
		return element.type === RundownLayoutElementType.PART_TIMING
	}

	export function isTextLabel(element: RundownLayoutElementBase): element is RundownLayoutTextLabel {
		return element.type === RundownLayoutElementType.TEXT_LABEL
	}

	export function isPlaylistName(element: RundownLayoutElementBase): element is RundownLayoutPlaylistName {
		return element.type === RundownLayoutElementType.PLAYLIST_NAME
	}

	export function isStudioName(element: RundownLayoutElementBase): element is RundownLayoutStudioName {
		return element.type === RundownLayoutElementType.STUDIO_NAME
	}

	export function isTimeOfDay(element: RundownLayoutElementBase): element is RundownLayoutTimeOfDay {
		return element.type === RundownLayoutElementType.TIME_OF_DAY
	}

	export function isSystemStatus(element: RundownLayoutElementBase): element is RundownLayoutSytemStatus {
		return element.type === RundownLayoutElementType.SYSTEM_STATUS
	}

	export function isShowStyleDisplay(element: RundownLayoutElementBase): element is RundownLayoutShowStyleDisplay {
		return element.type === RundownLayoutElementType.SHOWSTYLE_DISPLAY
	}

	export function isSegmentName(element: RundownLayoutElementBase): element is RundownLayoutSegmentName {
		return element.type === RundownLayoutElementType.SEGMENT_NAME
	}

	export function isPartName(element: RundownLayoutElementBase): element is RundownLayoutPartName {
		return element.type === RundownLayoutElementType.PART_NAME
	}

	export function isColoredBox(element: RundownLayoutElementBase): element is RundownLayoutColoredBox {
		return element.type === RundownLayoutElementType.COLORED_BOX
	}

	export function adLibRegionToFilter(element: RundownLayoutAdLibRegion): RundownLayoutFilterBase {
		return {
			..._.pick(element, '_id', 'name', 'rank', 'tags'),
			rundownBaseline: true,
			type: RundownLayoutElementType.FILTER,
			sourceLayerIds: [],
			sourceLayerTypes: [],
			outputLayerIds: [],
			label: [],
			displayStyle: PieceDisplayStyle.BUTTONS,
			currentSegment: false,
			showThumbnailsInList: false,
			nextInCurrentPart: false,
			oneNextPerSourceLayer: false,
			hideDuplicates: false,
			disableHoverInspector: false,
		}
	}
}
