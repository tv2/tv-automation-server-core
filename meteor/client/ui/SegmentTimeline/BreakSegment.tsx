import React from 'react'
import { withTranslation } from 'react-i18next'
import Moment from 'react-moment'
import { getCurrentTime } from '../../../lib/lib'
import { MeteorReactComponent } from '../../lib/MeteorReactComponent'
import { SyncedDiffTimecode, SyncedMoment } from '../../lib/Moment'
import { Translated } from '../../lib/ReactMeteorData/ReactMeteorData'
import { RundownUtils } from '../../lib/rundown'
import { RundownTiming } from '../RundownView/RundownTiming/RundownTiming'

interface IProps {
	breakTime: number | undefined
}

interface IState {
	displayTimecode: number | undefined
}

class BreakSegmentInner extends MeteorReactComponent<Translated<IProps>, IState> {
	constructor(props: IProps) {
		super(props)

		this.state = {
			displayTimecode: undefined,
		}

		this.updateTimecode = this.updateTimecode.bind(this)
	}

	componentDidMount() {
		window.addEventListener(RundownTiming.Events.timeupdate, this.updateTimecode)
	}

	componentWillUnmount() {
		window.removeEventListener(RundownTiming.Events.timeupdate, this.updateTimecode)
	}

	updateTimecode() {
		this.setState({
			displayTimecode: this.props.breakTime ? this.props.breakTime - getCurrentTime() : undefined,
		})
	}

	render() {
		const { t } = this.props

		return (
			<div className="segment-timeline has-break">
				<div className="segment-timeline__title">
					<h2 className="segment-timeline__title__label">
						{this.props.breakTime && <SyncedMoment interval={0} format="HH:mm:ss" lockedDate={this.props.breakTime} />}
						&nbsp;
						{t('BREAK')}
					</h2>
				</div>
				{this.state.displayTimecode && (
					<div className="segment-timeline__timeUntil">
						<span className="segment-timeline__timeUntil__label">{t('Break In')}</span>
						<span>
							<SyncedDiffTimecode diff={this.state.displayTimecode} showPlus={false} useSmartHours={true} />
						</span>
					</div>
				)}
			</div>
		)
	}
}

export const BreakSegment = withTranslation()(BreakSegmentInner)
