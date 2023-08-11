import * as React from 'react'
import * as _ from 'underscore'
import { Translated, translateWithTracker } from '../../lib/ReactMeteorData/ReactMeteorData'
import { MeteorReactComponent } from '../../lib/MeteorReactComponent'
import { SegmentUi } from '../SegmentTimeline/SegmentTimelineContainer'
import { normalizeArray, unprotectString } from '../../../lib/lib'
import { RundownPlaylist } from '../../../lib/collections/RundownPlaylists'
import { ShowStyleBase } from '../../../lib/collections/ShowStyleBases'
import { DashboardPieceButton } from '../Shelf/DashboardPieceButton'
import { IBlueprintActionTriggerMode, IOutputLayer, ISourceLayer } from '@sofie-automation/blueprints-integration'
import { Studio } from '../../../lib/collections/Studios'
import {
	contextMenuHoldToDisplayTime,
	ensureHasTrailingSlash,
	UserAgentPointer,
	USER_AGENT_POINTER_PROPERTY,
} from '../../lib/lib'
import {
	DashboardLayoutFilter,
	PieceDisplayStyle,
	RundownLayoutFilterBase,
} from '../../../lib/collections/RundownLayouts'
import { NoticeLevel, Notification, NotificationCenter } from '../../lib/notifications/notifications'
import { memoizedIsolatedAutorun } from '../../lib/reactiveData/reactiveDataHelper'
import { PartInstanceId } from '../../../lib/collections/PartInstances'
import { PieceId } from '../../../lib/collections/Pieces'
import { doUserAction, UserAction } from '../../lib/userAction'
import { MeteorCall } from '../../../lib/api/methods'
import {
	AdLibPieceUi,
	AdlibSegmentUi,
	getNextPieceInstancesGrouped,
	getUnfinishedPieceInstancesGrouped,
	isAdLibNext,
	isAdLibOnAir,
} from '../../lib/shelf'
import { ContextMenuTrigger } from '@jstarpl/react-contextmenu'
import { ContextType, setShelfContextMenuContext } from '../Shelf/ShelfContextMenu'

interface IRundownViewShelfProps {
	studio: Studio
	segment: SegmentUi
	playlist: RundownPlaylist
	showStyleBase: ShowStyleBase
	adLibSegmentUi: AdlibSegmentUi
	hotkeyGroup: string
	studioMode: boolean
	miniShelfFilter: RundownLayoutFilterBase | undefined
}

interface IRundownViewShelfTrackedProps {
	outputLayers: {
		[key: string]: IOutputLayer
	}
	sourceLayers: {
		[key: string]: ISourceLayer
	}
	unfinishedAdLibIds: PieceId[]
	unfinishedTags: string[]
	nextAdLibIds: PieceId[]
	nextTags: string[]
}

interface IRundownViewShelfState {
	singleClickMode: boolean
}

class RundownViewShelfInner extends MeteorReactComponent<
	Translated<IRundownViewShelfProps & IRundownViewShelfTrackedProps>,
	IRundownViewShelfState
> {
	usedHotkeys: Array<string> = []

	constructor(props) {
		super(props)
		this.state = {
			singleClickMode: false,
		}
	}

	protected setRef = (ref: HTMLDivElement) => {
		const _panel = ref
		if (_panel) {
			const style = window.getComputedStyle(_panel)
			// check if a special variable is set through CSS to indicate that we shouldn't expect
			// double clicks to trigger AdLibs
			const value = style.getPropertyValue(USER_AGENT_POINTER_PROPERTY)
			const shouldBeSingleClick = !!value.match(UserAgentPointer.NO_POINTER)
			if (this.state.singleClickMode !== shouldBeSingleClick) {
				this.setState({
					singleClickMode: shouldBeSingleClick,
				})
			}
		}
	}

	isAdLibOnAir(adLib: AdLibPieceUi) {
		return isAdLibOnAir(this.props.unfinishedAdLibIds, this.props.unfinishedTags, adLib)
	}

	isAdLibNext(adLib: AdLibPieceUi) {
		return isAdLibNext(this.props.nextAdLibIds, this.props.nextTags, adLib)
	}

	onClearAllSourceLayers = (sourceLayers: ISourceLayer[], e: any) => {
		const { t } = this.props
		if (this.props.playlist && this.props.playlist.currentPartInstanceId) {
			const playlistId = this.props.playlist._id
			const currentPartInstanceId = this.props.playlist.currentPartInstanceId
			doUserAction(t, e, UserAction.CLEAR_SOURCELAYER, (e, ts) =>
				MeteorCall.userAction.sourceLayerOnPartStop(
					e,
					ts,
					playlistId,
					currentPartInstanceId,
					_.map(sourceLayers, (sl) => sl._id)
				)
			)
		}
	}

	onToggleSticky = (sourceLayerId: string, e: any) => {
		if (this.props.playlist && this.props.playlist.currentPartInstanceId && this.props.playlist.activationId) {
			const { t } = this.props
			doUserAction(t, e, UserAction.START_STICKY_PIECE, (e, ts) =>
				MeteorCall.userAction.sourceLayerStickyPieceStart(e, ts, this.props.playlist._id, sourceLayerId)
			)
		}
	}

	onToggleAdLib = (adlibPiece: AdLibPieceUi, queue: boolean, e: any, mode?: IBlueprintActionTriggerMode) => {
		const { t } = this.props

		if (adlibPiece.invalid) {
			NotificationCenter.push(
				new Notification(
					t('Invalid AdLib'),
					NoticeLevel.WARNING,
					t('Cannot play this AdLib because it is marked as Invalid'),
					'toggleAdLib'
				)
			)
			return
		}
		if (adlibPiece.floated) {
			NotificationCenter.push(
				new Notification(
					t('Floated AdLib'),
					NoticeLevel.WARNING,
					t('Cannot play this AdLib because it is marked as Floated'),
					'toggleAdLib'
				)
			)
			return
		}

		const sourceLayer = this.props.sourceLayers[adlibPiece.sourceLayerId]

		if (queue && sourceLayer && !sourceLayer.isQueueable) {
			console.log(`Item "${adlibPiece._id}" is on sourceLayer "${adlibPiece.sourceLayerId}" that is not queueable.`)
			queue = false
		}
		if (this.props.playlist && this.props.playlist.currentPartInstanceId) {
			const currentPartInstanceId = this.props.playlist.currentPartInstanceId
			if (!this.isAdLibOnAir(adlibPiece) || !(sourceLayer && sourceLayer.isClearable)) {
				if (adlibPiece.isAction && adlibPiece.adlibAction) {
					const action = adlibPiece.adlibAction
					doUserAction(t, e, adlibPiece.isGlobal ? UserAction.START_GLOBAL_ADLIB : UserAction.START_ADLIB, (e, ts) =>
						MeteorCall.userAction.executeAction(
							e,
							ts,
							this.props.playlist._id,
							action._id,
							action.actionId,
							action.userData,
							mode?.data
						)
					)
				} else if (!adlibPiece.isGlobal && !adlibPiece.isAction) {
					doUserAction(t, e, UserAction.START_ADLIB, (e, ts) =>
						MeteorCall.userAction.segmentAdLibPieceStart(
							e,
							ts,
							this.props.playlist._id,
							currentPartInstanceId,
							adlibPiece._id,
							queue || false
						)
					)
				} else if (adlibPiece.isGlobal && !adlibPiece.isSticky) {
					doUserAction(t, e, UserAction.START_GLOBAL_ADLIB, (e, ts) =>
						MeteorCall.userAction.baselineAdLibPieceStart(
							e,
							ts,
							this.props.playlist._id,
							currentPartInstanceId,
							adlibPiece._id,
							queue || false
						)
					)
				} else if (adlibPiece.isSticky) {
					this.onToggleSticky(adlibPiece.sourceLayerId, e)
				}
			} else {
				if (sourceLayer && sourceLayer.isClearable) {
					this.onClearAllSourceLayers([sourceLayer], e)
				}
			}
		}
	}

	render() {
		const { pieces } = this.props.adLibSegmentUi
		if (!pieces.length) return null
		return (
			<div className="rundown-view-shelf dashboard-panel" ref={this.setRef}>
				<div className="rundown-view-shelf__identifier">{this.props.segment.identifier}</div>
				<div className="dashboard-panel__panel">
					{pieces.map((adLibPiece) => {
						return (
							<ContextMenuTrigger
								id="shelf-context-menu"
								collect={() =>
									setShelfContextMenuContext({
										type: ContextType.ADLIB,
										details: {
											adLib: adLibPiece,
											onToggle: !adLibPiece.disabled ? this.onToggleAdLib : undefined,
											disabled: adLibPiece.disabled,
										},
									})
								}
								displayStyle={PieceDisplayStyle.BUTTONS}
								widthScale={3.27} // @todo: css
								isSelected={false}
								renderTag="span"
								key={unprotectString(adLibPiece._id)}
								holdToDisplay={contextMenuHoldToDisplayTime()}
							>
								<DashboardPieceButton
									key={unprotectString(adLibPiece._id)}
									piece={adLibPiece}
									studio={this.props.studio}
									layer={this.props.sourceLayers[adLibPiece.sourceLayerId]}
									outputLayer={this.props.outputLayers[adLibPiece.outputLayerId]}
									onToggleAdLib={this.onToggleAdLib}
									onSelectAdLib={() => {
										/* no-op */
									}}
									playlist={this.props.playlist}
									isOnAir={this.isAdLibOnAir(adLibPiece)}
									isNext={this.isAdLibNext(adLibPiece)}
									mediaPreviewUrl={
										this.props.studio
											? ensureHasTrailingSlash(this.props.studio.settings.mediaPreviewsUrl + '' || '') || ''
											: ''
									}
									displayStyle={PieceDisplayStyle.BUTTONS}
									widthScale={3.27} // @todo: css
									isSelected={false}
									toggleOnSingleClick={
										(this.props.miniShelfFilter as DashboardLayoutFilter)?.toggleOnSingleClick ||
										this.state.singleClickMode
									}
								>
									{adLibPiece.name}
								</DashboardPieceButton>
							</ContextMenuTrigger>
						)
					})}
				</div>
			</div>
		)
	}
}

export const RundownViewShelf = translateWithTracker<
	IRundownViewShelfProps,
	IRundownViewShelfState,
	IRundownViewShelfTrackedProps
>(
	(props: IRundownViewShelfProps) => {
		const sourceLayerLookup = normalizeArray(props.showStyleBase && props.showStyleBase.sourceLayers, '_id') // @todo: optimize
		const outputLayerLookup = normalizeArray(props.showStyleBase && props.showStyleBase.outputLayers, '_id')

		const { unfinishedAdLibIds, unfinishedTags, nextAdLibIds, nextTags } = memoizedIsolatedAutorun(
			(_currentPartInstanceId: PartInstanceId | null, _nextPartInstanceId: PartInstanceId | null) => {
				const { unfinishedAdLibIds, unfinishedTags } = getUnfinishedPieceInstancesGrouped(
					props.playlist.activationId,
					props.playlist.currentPartInstanceId,
					props.showStyleBase
				)
				const { nextAdLibIds, nextTags } = getNextPieceInstancesGrouped(props.playlist, props.showStyleBase)
				return {
					unfinishedAdLibIds,
					unfinishedTags,
					nextAdLibIds,
					nextTags,
				}
			},
			'unfinishedAndNextAdLibsAndTags',
			props.playlist.currentPartInstanceId,
			props.playlist.nextPartInstanceId
		)

		return {
			sourceLayers: sourceLayerLookup,
			outputLayers: outputLayerLookup,
			unfinishedAdLibIds,
			unfinishedTags,
			nextAdLibIds,
			nextTags,
		}
	},
	(_data, props: IRundownViewShelfProps, nextProps: IRundownViewShelfProps) => {
		return !_.isEqual(props, nextProps)
	}
)(RundownViewShelfInner)
