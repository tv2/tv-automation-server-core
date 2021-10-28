import React from 'react'
import { WithTranslation, withTranslation } from 'react-i18next'
import { Translated } from '../../../lib/ReactMeteorData/ReactMeteorData'
import { withTiming, WithTiming } from './withTiming'
import { RundownPlaylist } from '../../../../lib/collections/RundownPlaylists'
import { getCurrentTime } from '../../../../lib/lib'
import ClassNames from 'classnames'
import { PlaylistTiming } from '../../../../lib/rundown/rundownTiming'
import { SyncedDiffTimecode, SyncedMoment } from '../../../lib/Moment'

interface IEndTimingProps {
	rundownPlaylist: RundownPlaylist
	hidePlannedStart?: boolean
	hideDiff?: boolean
	plannedStartText?: string
}

export const PlaylistStartTiming = withTranslation()(
	withTiming<IEndTimingProps & WithTranslation, {}>()(
		class PlaylistStartTiming extends React.Component<Translated<WithTiming<IEndTimingProps>>> {
			render() {
				const { t, rundownPlaylist } = this.props
				const playlistExpectedStart = PlaylistTiming.getExpectedStart(rundownPlaylist.timing)
				const playlistExpectedEnd = PlaylistTiming.getExpectedEnd(rundownPlaylist.timing)
				const playlistExpectedDuration = PlaylistTiming.getExpectedDuration(rundownPlaylist.timing)
				const expectedStart = playlistExpectedStart
					? playlistExpectedStart
					: playlistExpectedDuration && playlistExpectedEnd
					? playlistExpectedEnd - playlistExpectedDuration
					: undefined

				return (
					<React.Fragment>
						{!this.props.hidePlannedStart &&
							(rundownPlaylist.startedPlayback && rundownPlaylist.activationId && !rundownPlaylist.rehearsal ? (
								<span className="timing-clock plan-start left">
									<span className="timing-clock-label left">{t('Started')}</span>
									<SyncedMoment interval={0} format="HH:mm:ss" lockedDate={rundownPlaylist.startedPlayback} />
								</span>
							) : playlistExpectedStart ? (
								<span className="timing-clock plan-start left">
									<span className="timing-clock-label left">{this.props.plannedStartText || t('Planned Start')}</span>
									<SyncedMoment interval={0} format="HH:mm:ss" lockedDate={playlistExpectedStart} />
								</span>
							) : playlistExpectedEnd && playlistExpectedDuration ? (
								<span className="timing-clock plan-start left">
									<span className="timing-clock-label left">{this.props.plannedStartText || t('Expected Start')}</span>
									<SyncedMoment
										interval={0}
										format="HH:mm:ss"
										lockedDate={playlistExpectedEnd - playlistExpectedDuration}
									/>
								</span>
							) : null)}
						{!this.props.hideDiff && expectedStart && (
							<span
								className={ClassNames('timing-clock heavy-light left', {
									heavy: getCurrentTime() > expectedStart,
									light: getCurrentTime() <= expectedStart,
								})}
							>
								<span className="timing-clock-label">{t('Diff')}</span>
								{rundownPlaylist.startedPlayback ? (
									<SyncedDiffTimecode
										diff={rundownPlaylist.startedPlayback - expectedStart}
										showPlus={true}
										showHours={false}
										enDashAsMinus={true}
										useSmartFloor={true}
										useSmartHours={true}
									/>
								) : (
									<SyncedDiffTimecode
										diff={getCurrentTime() - expectedStart}
										showPlus={true}
										showHours={false}
										enDashAsMinus={true}
										useSmartFloor={true}
										useSmartHours={true}
									/>
								)}
							</span>
						)}
					</React.Fragment>
				)
			}
		}
	)
)
