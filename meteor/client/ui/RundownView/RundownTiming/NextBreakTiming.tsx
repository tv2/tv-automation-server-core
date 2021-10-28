import React from 'react'
import { WithTranslation, withTranslation } from 'react-i18next'
import Moment from 'react-moment'
import { Rundown } from '../../../../lib/collections/Rundowns'
import { Translated } from '../../../lib/ReactMeteorData/ReactMeteorData'
import { WithTiming, withTiming } from './withTiming'
import ClassNames from 'classnames'
import { PlaylistTiming } from '../../../../lib/rundown/rundownTiming'
import { SyncedMoment } from '../../../lib/Moment'

interface INextBreakTimingProps {
	loop?: boolean
	rundownsBeforeBreak?: Rundown[]
	breakText?: string
	lastChild?: boolean
}

export const NextBreakTiming = withTranslation()(
	withTiming<INextBreakTimingProps & WithTranslation, {}>()(
		class NextBreakTiming extends React.Component<Translated<WithTiming<INextBreakTimingProps>>> {
			render() {
				const { t, rundownsBeforeBreak: _rundownsBeforeBreak } = this.props
				const rundownsBeforeBreak = _rundownsBeforeBreak || this.props.timingDurations.rundownsBeforeNextBreak || []
				const breakRundown = rundownsBeforeBreak.length
					? rundownsBeforeBreak[rundownsBeforeBreak.length - 1]
					: undefined

				if (!breakRundown) {
					return null
				}

				const expectedEnd = PlaylistTiming.getExpectedEnd(breakRundown.timing)

				return (
					<React.Fragment>
						<span className={ClassNames('timing-clock plan-end right', { 'visual-last-child': this.props.lastChild })}>
							<span className="timing-clock-label right">{t(this.props.breakText || 'Next Break')}</span>
							<SyncedMoment interval={0} format="HH:mm:ss" lockedDate={expectedEnd} />
						</span>
					</React.Fragment>
				)
			}
		}
	)
)
