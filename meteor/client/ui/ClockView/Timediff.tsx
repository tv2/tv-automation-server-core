import * as React from 'react'
import ClassNames from 'classnames'
import { RundownUtils } from '../../lib/rundown'
import { SyncedDiffTimecode } from '../../lib/Moment'

export const Timediff = class Timediff extends React.Component<{ time: number }> {
	render() {
		const time = -this.props.time
		const isNegative = Math.floor(time / 1000) > 0

		return (
			<span
				className={ClassNames({
					'clocks-segment-countdown-red': isNegative,
					'clocks-counter-heavy': time / 1000 > -30,
				})}
			>
				<SyncedDiffTimecode
					diff={time}
					showPlus={true}
					showHours={false}
					enDashAsMinus={true}
					useSmartFloor={false}
					useSmartHours={true}
					minusPrefix={''}
					floorTime={false}
					hardFloor={true}
				/>
			</span>
		)
	}
}
