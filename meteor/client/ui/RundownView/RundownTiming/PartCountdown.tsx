import React, { ReactNode } from 'react'
import { PartId } from '../../../../lib/collections/Parts'
import { withTiming, WithTiming } from './withTiming'
import { unprotectString } from '../../../../lib/lib'
import { RundownUtils } from '../../../lib/rundown'
import { RundownPlaylist } from '../../../../lib/collections/RundownPlaylists'
import { PlaylistTiming } from '../../../../lib/rundown/rundownTiming'
import { SyncedMoment } from '../../../lib/Moment'

interface IPartCountdownProps {
	partId?: PartId
	hideOnZero?: boolean
	label?: ReactNode
	useWallClock?: boolean
	playlist: RundownPlaylist
}

/**
 * A presentational component that will render a countdown to a given Part
 * @function PartCountdown
 * @extends React.Component<WithTiming<IPartCountdownProps>>
 */
export const PartCountdown = withTiming<IPartCountdownProps, {}>()(function PartCountdown(
	props: WithTiming<IPartCountdownProps>
) {
	if (!props.partId || !props.timingDurations?.partCountdown) return null
	const thisPartCountdown = props.timingDurations.partCountdown[unprotectString(props.partId)] as number | undefined

	const shouldShow = thisPartCountdown !== undefined && (props.hideOnZero !== true || thisPartCountdown > 0)

	return shouldShow ? (
		<>
			{props.label}
			<span>
				{props.useWallClock ? (
					<SyncedMoment
						interval={0}
						format="HH:mm:ss"
						lockedDate={
							(props.playlist.activationId
								? // if show is activated, use currentTime as base
								  props.timingDurations.currentTime ?? 0
								: // if show is not activated, use expectedStart or currentTime, whichever is later
								  Math.max(
										PlaylistTiming.getExpectedStart(props.playlist.timing) ?? 0,
										props.timingDurations.currentTime ?? 0
								  )) + (thisPartCountdown || 0)
						}
					/>
				) : (
					RundownUtils.formatTimeToShortTime(
						thisPartCountdown! // shouldShow will be false if thisPartCountdown is undefined
					)
				)}
			</span>
		</>
	) : null
})
