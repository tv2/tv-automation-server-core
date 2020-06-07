import * as React from 'react'
import * as _ from 'underscore'
import * as ClassNames from 'classnames'
import { RundownLayoutBase, RundownLayoutPartCountdown, DashboardLayoutPartCountdown } from '../../../lib/collections/RundownLayouts'
import { RundownLayoutsAPI } from '../../../lib/api/rundownLayouts'
import { dashboardElementPosition } from './DashboardPanel'
import { Rundown } from '../../../lib/collections/Rundowns'
import { Piece } from '../../../lib/collections/Pieces'
import { withTracker } from '../../lib/ReactMeteorData/ReactMeteorData'
import { MeteorReactComponent } from '../../lib/MeteorReactComponent'
import { RundownUtils } from '../../lib/rundown'
import { RundownTiming, TimingEvent, RundownTimingProvider } from '../RundownView/RundownTiming'
import { Parts, Part } from '../../../lib/collections/Parts'
import { getUnfinishedPiecesReactive } from './AdLibRegionPanel'

interface IPartCountdownPanelProps {
	visible?: boolean
	layout: RundownLayoutBase
	panel: RundownLayoutPartCountdown
	rundown: Rundown
}

interface IPartCountdownPanelTrackedProps {
	unfinishedPieces: {
		[key: string]: Piece[]
	}
	livePiece?: Piece
	livePart?: Part
}

interface IState {
	displayTimecode: number
}

export class PartCountdownPanelInner extends MeteorReactComponent<IPartCountdownPanelProps & IPartCountdownPanelTrackedProps, IState> {
	constructor (props) {
		super(props)
		this.state = {
			displayTimecode: 0
		}
		this.updateTimecode = this.updateTimecode.bind(this)
	}

	componentDidMount () {
		window.addEventListener(RundownTiming.Events.timeupdateHR, this.updateTimecode)
	}

	componentWillUnmount () {
		window.removeEventListener(RundownTiming.Events.timeupdateHR, this.updateTimecode)
	}

	updateTimecode (e: TimingEvent) {
		let timecode = 0
		if (this.props.livePiece && this.props.livePart && this.props.livePart.startedPlayback && this.props.livePiece.partId === this.props.livePart._id) {
			const partDuration = this.props.livePart.duration || this.props.livePart.expectedDuration || 0
			const startedPlayback = this.props.livePart.getLastStartedPlayback()
			if (startedPlayback) {
				timecode = e.detail.currentTime - (startedPlayback + partDuration)
			}
		}
		this.setState({
			displayTimecode: timecode
		})
	}

	render () {
		return <div className='part-countdown-panel'
		style={
			_.extend(
				RundownLayoutsAPI.isDashboardLayout(this.props.layout) ?
					dashboardElementPosition(this.props.panel as DashboardLayoutPartCountdown) :
					{},
				{
					'visibility': this.props.visible ? 'visible' : 'hidden'
				}
			)
		}>
			<RundownTimingProvider rundown={this.props.rundown} >
				<span className={ClassNames('part-countdown-panel__timecode', {
					'overtime': !!(Math.floor(this.state.displayTimecode / 1000) > 0)
				})}>
					{RundownUtils.formatDiffToTimecode(this.state.displayTimecode || 0, true, false, true, false, true, '', false, true)}
				</span>
			</RundownTimingProvider>
		</div>
	}
}

export const PartCountdownPanel = withTracker<IPartCountdownPanelProps, IState, IPartCountdownPanelTrackedProps>((props: IPartCountdownPanelProps & IPartCountdownPanelTrackedProps) => {
	const unfinishedPieces = getUnfinishedPiecesReactive(props.rundown._id, props.rundown.currentPartId)
	const livePiece: Piece | undefined = props.panel.sourceLayerIds && props.panel.sourceLayerIds.length ?
	_.find(_.flatten(_.values(unfinishedPieces)), piece => {
		return (props.panel.sourceLayerIds || []).indexOf(piece.sourceLayerId) !== -1
	}) : undefined
	const livePart = props.rundown.currentPartId ? Parts.findOne(props.rundown.currentPartId) : undefined
	return Object.assign({}, {
		unfinishedPieces,
		livePiece,
		livePart
	})
}, (_data, props: IPartCountdownPanelProps, nextProps: IPartCountdownPanelProps) => {
	return !_.isEqual(props, nextProps)
})(PartCountdownPanelInner)
