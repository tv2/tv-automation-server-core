import * as React from 'react'
import { RundownLayout } from '../../../lib/collections/RundownLayouts'
import { RundownLayoutsAPI } from '../../../lib/api/rundownLayouts'
import { ExternalFramePanel } from './ExternalFramePanel'
import { ShowStyleBase } from '../../../lib/collections/ShowStyleBases'
import { OverflowingContainer } from './OverflowingContainer'
import ClassNames from 'classnames'
import { ShelfTabs, DEFAULT_TAB as SHELF_DEFAULT_TAB } from './Shelf'
import { AdLibPanel } from './AdLibPanel'
import { AdLibPieceUi } from '../../lib/shelf'
import { GlobalAdLibPanel } from './GlobalAdLibPanel'
import { HotkeyHelpPanel } from './HotkeyHelpPanel'
import { RundownPlaylist } from '../../../lib/collections/RundownPlaylists'
import { Studio } from '../../../lib/collections/Studios'
import { PieceUi } from '../SegmentTimeline/SegmentTimelineContainer'
import { useTranslation } from 'react-i18next'
import { BucketAdLibItem } from './RundownViewBuckets'
import { IAdLibListItem } from './AdLibListItem'
import { InterpolatedPropsSource, interpolatePanelStrings } from './utils/interpolatePanelStrings'

export interface IShelfRundownLayoutProps {
	rundownLayout: RundownLayout | undefined
	playlist: RundownPlaylist
	showStyleBase: ShowStyleBase
	studioMode: boolean
	studio: Studio
	selectedTab: string | undefined
	selectedPiece: BucketAdLibItem | IAdLibListItem | PieceUi | undefined

	onSwitchTab: (tab: string) => void
	onSelectPiece: (piece: AdLibPieceUi | PieceUi) => void

	hotkeys: Array<{
		key: string
		label: string
	}>
}

export function ShelfRundownLayout(props: IShelfRundownLayoutProps) {
	const { t } = useTranslation()
	const { rundownLayout, onSwitchTab } = props
	return (
		<>
			<div className="rundown-view__shelf__tabs" role="tablist">
				<OverflowingContainer className="rundown-view__shelf__tabs__tab-group">
					{!rundownLayout ? (
						<>
							<div
								className={ClassNames('rundown-view__shelf__tabs__tab', {
									selected: (props.selectedTab || SHELF_DEFAULT_TAB) === ShelfTabs.ADLIB,
								})}
								onClick={() => onSwitchTab(ShelfTabs.ADLIB)}
								tabIndex={0}
								role="tab"
							>
								{t('AdLib')}
							</div>
							<div
								className={ClassNames('rundown-view__shelf__tabs__tab', {
									selected: (props.selectedTab || SHELF_DEFAULT_TAB) === ShelfTabs.GLOBAL_ADLIB,
								})}
								onClick={() => onSwitchTab(ShelfTabs.GLOBAL_ADLIB)}
								tabIndex={0}
								role="tab"
							>
								{t('Global AdLib')}
							</div>
						</>
					) : (
						rundownLayout.filters
							.sort((a, b) => a.rank - b.rank)
							.map((panel) => (
								<div
									className={ClassNames('rundown-view__shelf__tabs__tab', {
										selected:
											(props.selectedTab || SHELF_DEFAULT_TAB) === `${ShelfTabs.ADLIB_LAYOUT_FILTER}_${panel._id}`,
									})}
									key={panel._id}
									onClick={() => onSwitchTab(`${ShelfTabs.ADLIB_LAYOUT_FILTER}_${panel._id}`)}
									tabIndex={0}
									role="tab"
								>
									{panel.name}
								</div>
							))
					)}
				</OverflowingContainer>
				<div
					className={ClassNames('rundown-view__shelf__tabs__tab', {
						selected: (props.selectedTab || SHELF_DEFAULT_TAB) === ShelfTabs.SYSTEM_HOTKEYS,
					})}
					onClick={() => onSwitchTab(ShelfTabs.SYSTEM_HOTKEYS)}
					tabIndex={0}
					role="tab"
				>
					{t('Shortcuts')}
				</div>
			</div>
			<div className="rundown-view__shelf__panel super-dark" role="tabpanel">
				{!rundownLayout ? (
					<>
						<AdLibPanel
							visible={(props.selectedTab || SHELF_DEFAULT_TAB) === ShelfTabs.ADLIB}
							selectedPiece={props.selectedPiece}
							onSelectPiece={props.onSelectPiece}
							playlist={props.playlist}
							showStyleBase={props.showStyleBase}
							studioMode={props.studioMode}
							studio={props.studio}
						></AdLibPanel>
						<GlobalAdLibPanel
							visible={(props.selectedTab || SHELF_DEFAULT_TAB) === ShelfTabs.GLOBAL_ADLIB}
							selectedPiece={props.selectedPiece}
							onSelectPiece={props.onSelectPiece}
							playlist={props.playlist}
							showStyleBase={props.showStyleBase}
							studioMode={props.studioMode}
							studio={props.studio}
						></GlobalAdLibPanel>
					</>
				) : (
					renderLayout(rundownLayout, props)
				)}
				<HotkeyHelpPanel
					visible={(props.selectedTab || SHELF_DEFAULT_TAB) === ShelfTabs.SYSTEM_HOTKEYS}
					showStyleBase={props.showStyleBase}
					hotkeys={props.hotkeys}
				></HotkeyHelpPanel>
			</div>
		</>
	)
}

function renderLayout(rundownLayout: RundownLayout, props: IShelfRundownLayoutProps) {
	const interpolableSource: InterpolatedPropsSource = {
		studio: props.studio,
		showStyleBase: props.showStyleBase,
	}
	return rundownLayout.filters
		.map((panel) => interpolatePanelStrings(panel, interpolableSource))
		.map((panel) =>
			RundownLayoutsAPI.isFilter(panel) ? (
				<AdLibPanel
					key={panel._id}
					visible={(props.selectedTab || SHELF_DEFAULT_TAB) === `${ShelfTabs.ADLIB_LAYOUT_FILTER}_${panel._id}`}
					includeGlobalAdLibs={true}
					filter={panel}
					selectedPiece={props.selectedPiece}
					onSelectPiece={props.onSelectPiece}
					playlist={props.playlist}
					showStyleBase={props.showStyleBase}
					studioMode={props.studioMode}
					studio={props.studio}
				/>
			) : RundownLayoutsAPI.isExternalFrame(panel) ? (
				<ExternalFramePanel
					key={panel._id}
					panel={panel}
					layout={rundownLayout}
					visible={(props.selectedTab || SHELF_DEFAULT_TAB) === `${ShelfTabs.ADLIB_LAYOUT_FILTER}_${panel._id}`}
					playlist={props.playlist}
				/>
			) : undefined
		)
}
