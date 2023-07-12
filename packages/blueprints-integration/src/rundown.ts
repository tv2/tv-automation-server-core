import { DeviceType as TSR_DeviceType, ExpectedPlayoutItemContent } from 'timeline-state-resolver-types'
import { ActionUserData } from './action'
import { PartEndState } from './api'
import { Time } from './common'
import { SomeContent, WithTimeline } from './content'
import { NoteSeverity } from './lib'
import { ExpectedPackage } from './package'
import { ITranslatableMessage } from './translations'

/** Playlist, as generated from Blueprints */
export interface IBlueprintResultRundownPlaylist {
	/** Rundown playlist slug - user-presentable name */
	name: string

	/** Playlist timing information */
	timing: RundownPlaylistTiming
	/** Should the rundown playlist use out-of-order timing mode (unplayed content will be played eventually) as opposed to normal timing mode (unplayed content behind the OnAir line has been skipped) */
	outOfOrderTiming?: boolean
	/** Should the rundown playlist loop at the end */
	loop?: boolean
	/** Should time-of-day clocks be used instead of countdowns by default */
	timeOfDayCountdowns?: boolean

	/** Arbitraty data used by rundowns */
	metaData?: unknown
}
/** Playlist, when reported from Core  */
export interface IBlueprintRundownPlaylist extends IBlueprintResultRundownPlaylist {
	_id: string
	/** External ID (source) of the playlist */
	externalId: string
	created: Time
	modified: Time
	/** If the playlist is active or not */
	isActive: boolean
	/** Is the playlist in rehearsal mode (can be used, when active: true) */
	rehearsal: boolean
	/** Actual time of playback starting */
	startedPlayback?: Time

	/** The number of rundowns in the playlist */
	rundownCount: number
}

export enum PlaylistTimingType {
	None = 'none',
	ForwardTime = 'forward-time',
	BackTime = 'back-time',
}

export interface PlaylistTimingBase {
	type: PlaylistTimingType
}

export interface PlaylistTimingNone {
	type: PlaylistTimingType.None
	/** Expected duration of the rundown playlist
	 *  If set, the over/under diff will be calculated based on this value. Otherwise it will be planned content duration - played out duration.
	 */
	expectedDuration?: number
}

export interface PlaylistTimingForwardTime extends PlaylistTimingBase {
	type: PlaylistTimingType.ForwardTime
	/** Expected start should be set to the expected time this rundown playlist should run on air */
	expectedStart: Time
	/** Expected duration of the rundown playlist
	 *  If set, the over/under diff will be calculated based on this value. Otherwise it will be planned content duration - played out duration.
	 */
	expectedDuration?: number
	/** Expected end time of the rundown playlist
	 *  In this timing mode this is only for display before the show starts as an "expected" end time,
	 *  during the show this display value will be calculated from expected start + remaining playlist duration.
	 *  If this is not set, `expectedDuration` will be used (if set) in addition to expectedStart.
	 */
	expectedEnd?: Time
}

export interface PlaylistTimingBackTime extends PlaylistTimingBase {
	type: PlaylistTimingType.BackTime
	/** Expected start should be set to the expected time this rundown playlist should run on air
	 *  In this timing mode this is only for display before the show starts as an "expected" start time,
	 *  during the show this display will be set to when the show actually started.
	 */
	expectedStart?: Time
	/** Expected duration of the rundown playlist
	 *  If set, the over/under diff will be calculated based on this value. Otherwise it will be planned content duration - played out duration.
	 */
	expectedDuration?: number
	/** Expected end time of the rundown playlist */
	expectedEnd: Time
}

export type RundownPlaylistTiming = PlaylistTimingNone | PlaylistTimingForwardTime | PlaylistTimingBackTime

/** The Rundown generated from Blueprint */
export interface IBlueprintRundown<TMetadata = unknown> {
	externalId: string
	/** Rundown slug - user-presentable name */
	name: string

	/** Rundown description: Longer user-presentable description of the rundown */
	description?: string

	/** Rundown timing information */
	timing: RundownPlaylistTiming

	/** Arbitrary data storage for plugins */
	metaData?: TMetadata

	/** A hint to the Core that the Rundown should be a part of a playlist */
	playlistExternalId?: string

	/**
	 * Whether the end of the rundown marks a break in the show.
	 * Allows the Next Break timer in the Rundown Header to time to the end of this rundown when looking for the next break.
	 */
	endOfRundownIsShowBreak?: boolean
}

/** The Rundown sent from Core */
export interface IBlueprintRundownDB<TMetadata = unknown>
	extends IBlueprintRundown<TMetadata>,
		IBlueprintRundownDBData {}

/** Properties added to a rundown in Core */
export interface IBlueprintRundownDBData {
	_id: string

	/** Id of the showStyle variant used */
	showStyleVariantId: string

	/** RundownPlaylist this rundown is member of */
	playlistId?: string

	/** Air-status, comes from NCS, examples: "READY" | "NOT READY" */
	airStatus?: string
}

export interface IBlueprintSegmentRundown<TMetadata = unknown> {
	externalId: string

	/** Arbitrary data storage for plugins */
	metaData?: TMetadata
}

export enum SegmentDisplayMode {
	Timeline = 'timeline',
	Storyboard = 'storyboard',
	List = 'list',
}

/** The Segment generated from Blueprint */
export interface IBlueprintSegment<TMetadata = unknown> {
	/** User-presentable name (Slug) for the Title */
	name: string
	/** Arbitrary data storage for plugins */
	metaData?: TMetadata
	/** Hide the Segment in the UI */
	isHidden?: boolean
	/** User-facing identifier that can be used by the User to identify the contents of a segment in the Rundown source system */
	identifier?: string

	/** Show the minishelf of the segment */
	showShelf?: boolean
	/** Segment display mode. Default mode is *SegmentDisplayMode.Timeline* */
	displayAs?: SegmentDisplayMode
}
/** The Segment sent from Core */
export interface IBlueprintSegmentDB<TMetadata = unknown> extends IBlueprintSegment<TMetadata> {
	_id: string
}

/** Timings for the inTransition, when supported and allowed */
export interface IBlueprintPartInTransition {
	/** Duration this transition block a take for. After this time, another take is allowed which may cut this transition off early */
	blockTakeDuration: number
	/** Duration the previous part be kept playing once the transition is started. Typically the duration of it remaining in-vision */
	previousPartKeepaliveDuration: number
	/** Duration the pieces of the part should be delayed for once the transition starts. Typically the duration until the new part is in-vision */
	partContentDelayDuration: number
}

/** Timings for the outTransition, when supported and allowed */
export interface IBlueprintPartOutTransition {
	/** How long to keep this part alive after taken out  */
	duration: number
}

export interface IBlueprintMutatablePart<TMetadata = unknown> {
	/** The story title */
	title: string
	/** Arbitrary data storage for plugins */
	metaData?: TMetadata

	/** Should this item should progress to the next automatically */
	autoNext?: boolean
	/** How much to overlap on when doing autonext */
	autoNextOverlap?: number

	/** Timings for the inTransition, when supported and allowed */
	inTransition?: IBlueprintPartInTransition

	/** Should we block the inTransition when starting the next Part */
	disableNextInTransition?: boolean

	/** Timings for the outTransition, when supported and allowed */
	outTransition?: IBlueprintPartOutTransition

	/** Expected duration of the line, in milliseconds */
	expectedDuration?: number

	/** Budget duration of this part, in milliseconds */
	budgetDuration?: number

	/** Whether this segment line supports being used in HOLD */
	holdMode?: PartHoldMode

	/** Set to true if ingest-device should be notified when this part starts playing */
	shouldNotifyCurrentPlayingPart?: boolean

	/** Classes to set on the TimelineGroupObj for this part */
	classes?: string[]
	/** Classes to set on the TimelineGroupObj for the following part */
	classesForNext?: string[]

	/**
	 * Use and provide timing to a `displayDurationGroup` with the same ID. This allows Parts to "share" timing.
	 *
	 * **NOTE**: The behavior of the system is undefined when using both `displayDurationGroups` and `budgetDuration`
	 */
	displayDurationGroup?: string
	/**
	 * How long to make the Part appear in the UI, if other than expectedDuration.
	 *
	 * **NOTE**: The behavior of the system is undefined when using both `displayDurationGroups` and `budgetDuration` */
	displayDuration?: number

	/** User-facing identifier that can be used by the User to identify the contents of a segment in the Rundown source system */
	identifier?: string

	/** MediaObjects that when created/updated, should cause the blueprint to be rerun for the Segment of this Part */
	hackListenToMediaObjectUpdates?: HackPartMediaObjectSubscription[]
}

export interface HackPartMediaObjectSubscription {
	/** The playable reference (CasparCG clip name, quantel GUID, etc) */
	mediaId: string
}

/** The Part generated from Blueprint */
export interface IBlueprintPart<TMetadata = unknown> extends IBlueprintMutatablePart<TMetadata> {
	/** Id of the part from the gateway if this part does not map directly to an IngestPart. This must be unique for each part */
	externalId: string

	/**
	 * When something bad has happened, we can mark the part as invalid, which will prevent the user from TAKEing it.
	 * Situations where a part can be marked as invalid include:
	 *  - part could not be handled by the blueprint, but NRCS would expect it to exist in Rundown (f.g. no part type in ENPS)
	 *  - part was handled by the blueprint, but blueprint could not produce a playable result (f.g. the part is a VT clip, but no clip information was present in NRCS)
	 *  - part was handled by the blueprint, but business logic prevents it from being played (f.g. the part has been marked as "Not approved" by the editor)
	 *  - there is another issue preventing the part from being playable, but the user expects it to be there
	 *
	 * Invalid means that in Sofie:
	 * * The Part is not playable
	 * * The Part is displayed in the Rundown GUI (as invalid)
	 * * The Part is still used in timing calculations as normal
	 * * The Part is still showed in prompter, etc, as normal
	 * * The Part has Adlibs that are playable
	 * * Infinites still works as normal
	 */
	invalid?: boolean

	/**
	 * Provide additional information about the reason a part is invalid. The `key` is the string key from blueprints
	 * translations. Args will be used to replace placeholders within the translated file. If `key` is not found in the
	 * translation, it will be interpollated using the `args` and used as the string to be displayed.
	 * The blueprints can also provide a color hint that the UI can use when displaying the part.
	 * Color needs to be in #xxxxxx RGB hexadecimal format.
	 *
	 * @type {{
	 * 		message: ITranslatableMessage,
	 *      severity?: NoteSeverity
	 * 		color?: string
	 * 	}}
	 * @memberof IBlueprintPart
	 */
	invalidReason?: {
		message: ITranslatableMessage
		/** Set the severity of the displayed invalid part note */
		severity?: NoteSeverity
		color?: string
	}

	/**
	 * Take a part out of timing considerations for a Rundown & Rundown Playlist. This part can be TAKEN but will not
	 * update playlist's startedPlayback and will not count time in the GUI.
	 *
	 * Some parts shouldn't count towards the various timing information in Sofie. Specifically, it may be useful to
	 * have some Parts execute Timelines outside of the regular flow of time, such as when doing an ad break or
	 * performing some additional actions before a show actually begins (such as when there's a bit of a buffer before
	 * the On Air time of a Show and when the MCR cuts to the PGM, because the previous show ended quicker).
	 */
	untimed?: boolean

	/** When the NRCS informs us that the producer marked the part as floated, we can prevent the user from TAKE'ing and NEXT'ing it, but still have it visible and allow manipulation */
	floated?: boolean

	/** When this part is just a filler to fill space in a segment. Generally, used with invalid: true */
	gap?: boolean
}
/** The Part sent from Core */
export interface IBlueprintPartDB<TMetadata = unknown> extends IBlueprintPart<TMetadata> {
	_id: string
	/** The segment ("Title") this line belongs to */
	segmentId: string
}
/** The Part instance sent from Core */
export interface IBlueprintPartInstance<TMetadata = unknown> {
	_id: string
	/** The segment ("Title") this line belongs to */
	segmentId: string

	part: IBlueprintPartDB<TMetadata>

	/** If the playlist was in rehearsal mode when the PartInstance was created */
	rehearsal: boolean
	/** Playout timings, in here we log times when playout happens */
	timings?: IBlueprintPartInstanceTimings

	/** The end state of the previous part, to allow for bits of this to part to be based on what the previous did/was */
	previousPartEndState?: PartEndState

	/** Whether the PartInstance is an orphan (the Part referenced does not exist). Indicates the reason it is orphaned */
	orphaned?: 'adlib-part' | 'deleted'

	/** If taking out of the current part is blocked, this is the time it is blocked until */
	blockTakeUntil?: number
}

export interface IBlueprintPartInstanceTimings {
	/** Point in time the Part was taken, (ie the time of the user action) */
	take?: Time
	/** Point in time the "take" action has finished executing */
	takeDone?: Time
	/** Point in time the Part started playing (ie the time of the playout) */
	startedPlayback?: Time
	/** Point in time the Part stopped playing (ie the time of the user action) */
	takeOut?: Time
	/** Point in time the Part stopped playing (ie the time of the playout) */
	stoppedPlayback?: Time
	/** Point in time the Part was set as Next (ie the time of the user action) */
	next?: Time
}

export enum PartHoldMode {
	NONE = 0,
	FROM = 1,
	TO = 2,
}

export declare enum PieceTransitionType {
	MIX = 'MIX',
	WIPE = 'WIPE',
}
export interface PieceTransition {
	type: PieceTransitionType
	duration: number
}

export enum IBlueprintDirectPlayType {
	AdLibPiece = 'adlib',
	AdLibAction = 'action',
}
export interface IBlueprintDirectPlayBase {
	type: IBlueprintDirectPlayType
}
export interface IBlueprintDirectPlayAdLibPiece extends IBlueprintDirectPlayBase {
	type: IBlueprintDirectPlayType.AdLibPiece
}
export interface IBlueprintDirectPlayAdLibAction extends IBlueprintDirectPlayBase {
	type: IBlueprintDirectPlayType.AdLibAction
	/** Id of the action */
	actionId: string
	/** Properties defining the action behaviour */
	userData: ActionUserData
}
export type IBlueprintDirectPlay = IBlueprintDirectPlayAdLibPiece | IBlueprintDirectPlayAdLibAction

export interface IBlueprintPieceGeneric<TMetadata = unknown> {
	/**
	 * An identifier for this Piece
	 * It should be unique within the part it belongs to, and consistent across ingest updates
	 */
	externalId: string
	/** User-presentable name for the timeline item */
	name: string
	/** Arbitrary data storage for plugins */
	metaData?: TMetadata

	/** Whether and how the piece is infinite */
	lifespan: PieceLifespan

	/** Source layer the timeline item belongs to */
	sourceLayerId: string
	/** Layer output this piece belongs to */
	outputLayerId: string
	/** The object describing the item in detail */
	content: WithTimeline<SomeContent>

	/** The transition used by this piece to transition to and from the piece */
	/** @deprecated */
	transitions?: {
		/** In transition for the piece */
		inTransition?: PieceTransition
		/** The out transition for the piece */
		outTransition?: PieceTransition
	}

	/**
	 * How long this piece needs to prepare its content before it will have an effect on the output.
	 * This allows for flows such as starting a clip playing, then cutting to it after some ms once the player is outputting frames.
	 */
	prerollDuration?: number

	/**
	 * How long this piece needs to continue it's content after a take has been done to ensure a
	 * seemless transition into the next part.
	 */
	postrollDuration?: number

	/** Whether the adlib should always be inserted queued */
	toBeQueued?: boolean
	/** Array of items expected to be played out. This is used by playout-devices to preload stuff.
	 * @deprecated replaced by .expectedPackages
	 */
	expectedPlayoutItems?: ExpectedPlayoutItemGeneric[]
	/** User-defined tags that can be used for filtering adlibs in the shelf and identifying pieces by actions */
	tags?: string[]

	/** Allow this part to be direct played (eg, by double clicking in the rundown timeline view) */
	allowDirectPlay?: IBlueprintDirectPlay

	/**
	 * An array of which Packages this Piece uses. This is used by a Package Manager to ensure that the Package is in place for playout.
	 * @todo
	 */
	expectedPackages?: ExpectedPackage.Any[]

	/** HACK: Some pieces have side effects on other pieces, and pruning them when they have finished playback will cause playout glitches. This will tell core to not always preserve it */
	hasSideEffects?: boolean
}

/** @deprecated */
export interface ExpectedPlayoutItemGeneric {
	/** What type of playout device this item should be handled by */
	deviceSubType: TSR_DeviceType // subset of PeripheralDeviceAPI.DeviceSubType
	/** Which playout device this item should be handled by */
	// deviceId: string // Todo: implement deviceId support (later)
	/** Content of the expectedPlayoutItem */
	content: ExpectedPlayoutItemContent
}
export { ExpectedPlayoutItemContent }

/** Special types of pieces. Some are not always used in all circumstances */
export enum IBlueprintPieceType {
	Normal = 'normal',
	InTransition = 'in-transition',
	OutTransition = 'out-transition',
}

/** A Single item in a "line": script, VT, cameras. Generated by Blueprint */
export interface IBlueprintPiece<TMetadata = unknown> extends IBlueprintPieceGeneric<TMetadata> {
	/** Timeline enabler. When the piece should be active on the timeline. */
	enable: {
		start: number | 'now' // TODO - now will be removed from this eventually, but as it is not an acceptable value 99% of the time, that is not really breaking
		duration?: number
	}

	/** Whether the piece is a real piece, or exists as a marker to stop an infinite piece. If virtual, it does not add any contents to the timeline */
	virtual?: boolean
	/** The id of the item this item is a continuation of. If it is a continuation, the inTranstion must not be set, and trigger must be 0 */
	continuesRefId?: string // TODO - is this useful to define from the blueprints?

	/** Whether this piece is a special piece */
	pieceType?: IBlueprintPieceType

	/** Whether this piece should be extended into the next part when HOLD is used */
	extendOnHold?: boolean

	/** Whether the piece affects the output of the Studio or is describing an invisible state within the Studio */
	notInVision?: boolean
}
export interface IBlueprintPieceDB<TMetadata = unknown> extends IBlueprintPiece<TMetadata> {
	_id: string
}
export interface IBlueprintPieceInstance<TMetadata = unknown> {
	_id: string
	/** The part instace this piece belongs to */
	partInstanceId: string

	/** If this piece has been created play-time using an AdLibPiece, this should be set to it's source piece */
	adLibSourceId?: string
	/** If this piece has been insterted during run of rundown (such as adLibs), then this is set and includes the timestamp when it was inserted */
	dynamicallyInserted?: {
		/** Timestamp when this piece was inserted */
		time: Time
		/** If this piece has been inserted into the next part (not yet playing at the time of insertion) */
		intoNextPart?: boolean
	}

	piece: IBlueprintPieceDB<TMetadata>

	/** The time the system started playback of this part, undefined if not yet played back (milliseconds since epoch) */
	startedPlayback?: Time
	/** Whether the piece has stopped playback (the most recent time it was played), undefined if not yet played back or is currently playing.
	 * This is set from a callback from the playout gateway (milliseconds since epoch)
	 */
	stoppedPlayback?: Time

	infinite?: {
		infinitePieceId: string
		/** When the instance was a copy made from hold */
		fromHold?: boolean

		/** Whether this was 'copied' from the previous PartInstance or Part */
		fromPreviousPart: boolean
		/** Whether this was 'copied' from the previous PartInstance via the playhead, rather than from a Part */
		fromPreviousPlayhead?: boolean
	}
}
export interface IBlueprintResolvedPieceInstance<TMetadata = unknown> extends IBlueprintPieceInstance<TMetadata> {
	resolvedStart: number
	resolvedDuration?: number
}

export interface IBlueprintAdLibPiece<TMetadata = unknown> extends IBlueprintPieceGeneric<TMetadata> {
	/** Used for sorting in the UI */
	_rank: number
	/** When something bad has happened, we can mark the AdLib as invalid, which will prevent the user from TAKE:ing it */
	invalid?: boolean
	/** Expected duration of the piece, in milliseconds */
	expectedDuration?: number
	/** When the NRCS informs us that the producer marked the part as floated, we can prevent the user from TAKE'ing it, but still have it visible and allow manipulation */
	floated?: boolean
	/** Piece tags to use to determine if action is currently active */
	currentPieceTags?: string[]
	/** Piece tags to use to determine if action is set as next */
	nextPieceTags?: string[]
	/**
	 * String that can be used to identify adlibs that are equivalent to each other,
	 * if there are multiple Adlibs with the same uniquenessId,
	 * only one of them should be displayed in the GUI.
	 */
	uniquenessId?: string
	/** When not playing, display in the UI as playing, and vice versa. Useful for Adlibs that toggle something off when taken */
	invertOnAirState?: boolean
}
/** The AdLib piece sent from Core */
export interface IBlueprintAdLibPieceDB<TMetadata = unknown> extends IBlueprintAdLibPiece<TMetadata> {
	_id: string
}

export enum PieceLifespan {
	/** The Piece will only exist in it's designated Part. As soon as the playhead leaves the Part, the Piece will stop */
	WithinPart = 'part-only',
	/** The Piece will only exist in it's designated Segment. It will begin playing when taken and will stop when the
	 * playhead leaves the Segment */
	OutOnSegmentChange = 'segment-change',
	/** The Piece will only exist in it's designated Segment. It will begin playing when taken and will stop when the
	 * playhead leaves the Segment or the playhead moves before the beginning of the Piece */
	OutOnSegmentEnd = 'segment-end',
	/** The Piece will only exist in it's designated Rundown. It will begin playing when taken and will stop when the
	 * playhead leaves the Rundown */
	OutOnRundownChange = 'rundown-change',
	/** The Piece will only exist in its designated Rundown. It will begin playing when taken and will stop when the
	 * playhead leaves the Rundown. It will begin playing when entering the Segment through any Part, and any preceding
	 * Part in that Segment includes this piece. */
	OutOnRundownChangeWithSegmentLookback = 'rundown-change-segment-lookback',
	/** The Piece will only exist in it's designated Rundown. It will begin playing when taken and will stop when the
	 * playhead leaves the Rundown or the playhead moves before the beginning of the Piece */
	OutOnRundownEnd = 'rundown-end',
	/** The Piece will only exist while the ShowStyle doesn't change. It will begin playing when taken and will stop
	 * when the playhead leaves the Rundown into a new Rundown with a different ShowStyle */
	OutOnShowStyleEnd = 'showstyle-end',
}
