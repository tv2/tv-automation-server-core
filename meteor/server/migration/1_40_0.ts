import { addMigrationSteps } from './databaseMigration'
import { Studios } from '../../lib/collections/Studios'
import { Settings } from '../../lib/Settings'

// Release 40 (Skipped)

interface ISettingsOld {
	/** The framerate (frames per second) used to convert internal timing information (in milliseconds)
	 * into timecodes and timecode-like strings and interpret timecode user input
	 * Default: 25
	 */
	frameRate: number
	/* Should the segment in the Rundown view automatically rewind after it stops being live? Default: false */
	autoRewindLeavingSegment: boolean
	/** Disable blur border in RundownView */
	disableBlurBorder: boolean
	/** Default time scale zooming for the UI. Default: 1  */
	defaultTimeScale: number
	// Allow grabbing the entire timeline
	allowGrabbingTimeline: boolean
	/** If true, enables security measures, access control and user accounts. */
	enableUserAccounts: boolean
	/** Preserve unsynced segment contents when the playing segment is removed, rather than removing all but the playing part */
	preserveUnsyncedPlayingSegmentContents: boolean
	/** Allow resets while a rundown is on-air */
	allowRundownResetOnAir: boolean
	/** Default duration to use to render parts when no duration is provided */
	defaultDisplayDuration: number
	/** If true, allows creation of new playlists in the Lobby Gui (rundown list). If false; only pre-existing playlists are allowed. */
	allowMultiplePlaylistsInGUI: boolean
	/** How many segments of history to show when scrolling back in time (0 = show current segment only) */
	followOnAirSegmentsHistory: number
	/** Clean up stuff that are older than this [ms] */
	maximumDataAge: number

	/** If set, enables a check to ensure that the system time doesn't differ too much from the speficied NTP server time. */
	enableNTPTimeChecker: null | {
		host: string
		port?: number
		maxAllowedDiff: number
	}
}
const OldSettings = Settings as Partial<ISettingsOld>
const oldFrameRate = OldSettings.frameRate ?? 25

export const addSteps = addMigrationSteps('1.40.0', [
	// Add some migrations!

	{
		id: `Studio.settings.frameRate`,
		canBeRunAutomatically: true,
		validate: () => {
			const count = Studios.find({
				'settings.frameRate': {
					$exists: false,
				},
			}).count()
			if (count > 0) return `${count} studios need to be updated`
			return false
		},
		migrate: () => {
			Studios.update(
				{
					'settings.frameRate': {
						$exists: false,
					},
				},
				{
					$set: {
						'settings.frameRate': oldFrameRate,
					},
				}
			)
		},
	},
	{
		id: `Studio.settings.preserveUnsyncedPlayingSegmentContents`,
		canBeRunAutomatically: true,
		validate: () => {
			if (OldSettings.preserveUnsyncedPlayingSegmentContents !== undefined) {
				const count = Studios.find({
					'settings.preserveUnsyncedPlayingSegmentContents': {
						$exists: false,
					},
				}).count()
				if (count > 0) return `${count} studios need to be updated`
			}
			return false
		},
		migrate: () => {
			if (OldSettings.preserveUnsyncedPlayingSegmentContents !== undefined) {
				Studios.update(
					{
						'settings.preserveUnsyncedPlayingSegmentContents': {
							$exists: false,
						},
					},
					{
						$set: {
							'settings.preserveUnsyncedPlayingSegmentContents':
								OldSettings.preserveUnsyncedPlayingSegmentContents,
						},
					}
				)
			}
		},
	},
	{
		id: `Studio.settings.allowRundownResetOnAir`,
		canBeRunAutomatically: true,
		validate: () => {
			if (OldSettings.allowRundownResetOnAir !== undefined) {
				const count = Studios.find({
					'settings.allowRundownResetOnAir': {
						$exists: false,
					},
				}).count()
				if (count > 0) return `${count} studios need to be updated`
			}
			return false
		},
		migrate: () => {
			if (OldSettings.allowRundownResetOnAir !== undefined) {
				Studios.update(
					{
						'settings.allowRundownResetOnAir': {
							$exists: false,
						},
					},
					{
						$set: {
							'settings.allowRundownResetOnAir': OldSettings.allowRundownResetOnAir,
						},
					}
				)
			}
		},
	},
])
