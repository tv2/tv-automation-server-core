import React from 'react'
import { WithTranslation, withTranslation } from 'react-i18next'
import Moment from 'react-moment'
import { getCurrentTime } from '../../../../lib/lib'
import { Translated } from '../../../lib/ReactMeteorData/ReactMeteorData'
import { RundownUtils } from '../../../lib/rundown'
import { withTiming, WithTiming } from './withTiming'
import ClassNames from 'classnames'
import { RundownPlaylist } from '../../../../lib/collections/RundownPlaylists'
import { PlaylistTiming } from '../../../../lib/rundown/rundownTiming'
import { SyncedDiffTimecode, SyncedMoment } from '../../../lib/Moment'

interface IEndTimingProps {
	rundownPlaylist: RundownPlaylist
	loop?: boolean
	expectedStart?: number
	expectedDuration?: number
	expectedEnd?: number
	endLabel?: string
	hidePlannedEndLabel?: boolean
	hideDiffLabel?: boolean
	hidePlannedEnd?: boolean
	hideCountdown?: boolean
	hideDiff?: boolean
	rundownCount: number
}

export const PlaylistEndTiming = withTranslation()(
	withTiming<IEndTimingProps & WithTranslation, {}>()(
		class PlaylistEndTiming extends React.Component<Translated<WithTiming<IEndTimingProps>>> {
			render() {
				const { t } = this.props
				const { rundownPlaylist, expectedStart, expectedEnd, expectedDuration } = this.props

				const now = this.props.timingDurations.currentTime ?? getCurrentTime()

				const frontAnchor = PlaylistTiming.isPlaylistTimingForwardTime(rundownPlaylist.timing)
					? Math.max(now, rundownPlaylist.startedPlayback ?? expectedStart!)
					: now

				const backAnchor = PlaylistTiming.isPlaylistTimingForwardTime(rundownPlaylist.timing)
					? expectedEnd ?? (rundownPlaylist.startedPlayback ?? expectedStart!) + (expectedDuration ?? 0)
					: expectedEnd ?? 0

				const diff = PlaylistTiming.isPlaylistTimingNone(rundownPlaylist.timing)
					? (this.props.timingDurations.asPlayedPlaylistDuration || 0) -
					  (expectedDuration ?? this.props.timingDurations.totalPlaylistDuration ?? 0)
					: frontAnchor + (this.props.timingDurations.remainingPlaylistDuration || 0) - backAnchor

				return (
					<React.Fragment>
						{!this.props.hidePlannedEnd ? (
							this.props.expectedEnd ? (
								!rundownPlaylist.startedPlayback ? (
									<span className="timing-clock plan-end right visual-last-child">
										{!this.props.hidePlannedEndLabel && (
											<span className="timing-clock-label right">{this.props.endLabel ?? t('Planned End')}</span>
										)}
										<SyncedMoment interval={0} format="HH:mm:ss" lockedDate={expectedEnd} />
									</span>
								) : (
									<span className="timing-clock plan-end right visual-last-child">
										{!this.props.hidePlannedEndLabel && (
											<span className="timing-clock-label right">{this.props.endLabel ?? t('Expected End')}</span>
										)}
										<SyncedMoment interval={0} format="HH:mm:ss" lockedDate={expectedEnd} />
									</span>
								)
							) : this.props.timingDurations ? (
								this.props.rundownPlaylist.loop ? (
									this.props.timingDurations.partCountdown &&
									rundownPlaylist.activationId &&
									rundownPlaylist.currentPartInstanceId ? (
										<span className="timing-clock plan-end right visual-last-child">
											{!this.props.hidePlannedEndLabel && (
												<span className="timing-clock-label right">{t('Next Loop at')}</span>
											)}
											<SyncedMoment
												interval={0}
												format="HH:mm:ss"
												lockedDate={
													now +
													(this.props.timingDurations.partCountdown[
														Object.keys(this.props.timingDurations.partCountdown)[0]
													] || 0)
												}
											/>
										</span>
									) : null
								) : (
									<span className="timing-clock plan-end right visual-last-child">
										{!this.props.hidePlannedEndLabel && (
											<span className="timing-clock-label right">{this.props.endLabel ?? t('Expected End')}</span>
										)}
										<SyncedMoment
											interval={0}
											format="HH:mm:ss"
											lockedDate={(expectedStart || now) + (this.props.timingDurations.remainingPlaylistDuration || 0)}
										/>
									</span>
								)
							) : null
						) : null}
						{!this.props.loop &&
							!this.props.hideCountdown &&
							(expectedEnd ? (
								<span className="timing-clock countdown plan-end right">
									<SyncedDiffTimecode diff={now - expectedEnd} showPlus={true} showHours={true} enDashAsMinus={true} />
								</span>
							) : expectedStart && expectedDuration ? (
								<span className="timing-clock countdown plan-end right">
									<SyncedDiffTimecode
										diff={getCurrentTime() - (expectedStart + expectedDuration)}
										showPlus={true}
										showHours={true}
										enDashAsMinus={true}
									/>
								</span>
							) : null)}
						{!this.props.hideDiff ? (
							this.props.timingDurations ? ( // TEMPORARY: disable the diff counter for playlists longer than one rundown -- Jan Starzak, 2021-05-06
								<span
									className={ClassNames('timing-clock heavy-light right', {
										heavy: diff < 0,
										light: diff > 0,
									})}
								>
									{!this.props.hideDiffLabel && <span className="timing-clock-label right">{t('Diff')}</span>}
									<SyncedDiffTimecode
										diff={diff}
										showPlus={true}
										showHours={false}
										enDashAsMinus={true}
										useSmartFloor={true}
										useSmartHours={true}
										floorTime={true}
									/>
								</span>
							) : null
						) : null}
					</React.Fragment>
				)
			}
		}
	)
)
