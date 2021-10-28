import React from 'react'
import { WithTranslation, withTranslation } from 'react-i18next'
import { Translated } from '../../../lib/ReactMeteorData/ReactMeteorData'
import { withTiming, WithTiming } from './withTiming'
import { getCurrentTime } from '../../../../lib/lib'
import { SyncedMoment } from '../../../lib/Moment'

interface ITimeOfDayProps {}

export const TimeOfDay = withTranslation()(
	withTiming<ITimeOfDayProps & WithTranslation, {}>()(
		class RundownName extends React.Component<Translated<WithTiming<ITimeOfDayProps>>> {
			render() {
				return (
					<span className="timing-clock time-now">
						<SyncedMoment interval={0} format="HH:mm:ss" lockedDate={getCurrentTime()} />
					</span>
				)
			}
		}
	)
)
