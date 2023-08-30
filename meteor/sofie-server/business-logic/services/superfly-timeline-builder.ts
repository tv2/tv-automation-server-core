import { TimelineBuilder } from './interfaces/timeline-builder'
import { Rundown } from '../../model/entities/rundown'
import {
	ActivePartTimelineObjectGroup,
	DeviceType,
	Timeline,
	TimelineObjectControl,
	TimelineObjectGroup,
	TimelineObjectType,
} from '../../model/entities/timeline'
import { TimelineObject } from '../../model/entities/timeline-object'
import { Part } from '../../model/entities/part'
import { Piece } from '../../model/entities/piece'
import { TimelineEnable } from '../../model/entities/timeline-enable'
import { TransitionType } from '../../model/enums/transition-type'
import { PartTimings } from '../../model/value-objects/part-timings'
import { PieceLifespan } from '../../model/enums/piece-lifespan'
import { UnsupportedOperation } from '../../model/exceptions/unsupported-operation'
import { ExhaustiveCaseChecker } from '../exhaustive-case-checker'
import { ObjectCloner } from './interfaces/object-cloner'

const BASELINE_GROUP_ID: string = 'baseline_group'

const ACTIVE_GROUP_PREFIX: string = 'active_group_'
const PREVIOUS_GROUP_PREFIX: string = 'previous_group_'
const NEXT_GROUP_PREFIX: string = 'next_group_'
const INFINITE_GROUP_PREFIX: string = 'infinite_group_'
const PIECE_PRE_ROLL_PREFIX: string = 'pre_roll_'

const PIECE_CONTROL_INFIX: string = '_piece_control_'
const PIECE_GROUP_INFIX: string = '_piece_group_'

// These priority values are the same values used by Core
const HIGH_PRIORITY: number = 5
const MEDIUM_PRIORITY: number = 1
const BASELINE_PRIORITY: number = 0
const LOW_PRIORITY: number = -1

export class SuperflyTimelineBuilder implements TimelineBuilder {
	constructor(private objectCloner: ObjectCloner) {}

	public getBaseTimeline(): Timeline {
		return { timelineGroups: [] }
	}

	public buildTimeline(rundown: Rundown): Timeline {
		const timeline: Timeline = {
			timelineGroups: [],
		}

		// TODO: Find LookAhead

		const baselineGroup: TimelineObjectGroup = this.createBaselineGroup(rundown)
		timeline.timelineGroups.push(baselineGroup)

		const activePartTimelineGroup: ActivePartTimelineObjectGroup =
			this.createTimelineObjectGroupForActivePart(rundown)
		timeline.timelineGroups.push(activePartTimelineGroup)

		const previousPart: Part | undefined = rundown.getPreviousPart()
		if (previousPart) {
			const previousPartTimelineGroup: TimelineObjectGroup = this.createTimelineObjectGroupForPreviousPart(
				previousPart,
				rundown.getActivePart(),
				activePartTimelineGroup
			)
			timeline.timelineGroups.push(previousPartTimelineGroup)
		}

		const infinitePiecesTimelineGroups: TimelineObjectGroup[] =
			this.createTimelineObjectGroupsForInfinitePieces(rundown)
		timeline.timelineGroups.push(...infinitePiecesTimelineGroups)

		if (activePartTimelineGroup.autoNextEpochTime > 0) {
			const nextPartTimeline: TimelineObjectGroup = this.createTimelineForNextPart(
				rundown,
				activePartTimelineGroup
			)
			timeline.timelineGroups.push(nextPartTimeline)

			if (Number.isNaN(activePartTimelineGroup.enable.duration)) {
				throw new UnsupportedOperation(
					`Duration of activePartTimelineGroup must be a number! Got: ${activePartTimelineGroup.enable.duration}`
				)
			}
			timeline.autoNext = {
				epochTimeToTakeNext:
					activePartTimelineGroup.autoNextEpochTime -
					rundown.getNextPart().getTimings().previousPartContinueIntoPartDuration,
			}
		}

		// TODO: Call Blueprint "onTimelineGenerate". This will most likely need some tweaks.

		return timeline
	}

	private createBaselineGroup(rundown: Rundown) {
		const baselineGroup: TimelineObjectGroup = {
			id: BASELINE_GROUP_ID,
			isGroup: true,
			children: rundown.getBaseline(),
			enable: {
				while: '1',
			},
			priority: BASELINE_PRIORITY,
			layer: '',
			content: {
				type: TimelineObjectType.GROUP,
				deviceType: DeviceType.ABSTRACT,
			},
		}
		return baselineGroup
	}

	private createTimelineObjectGroupForActivePart(rundown: Rundown): ActivePartTimelineObjectGroup {
		const now: number = Date.now()

		const activePart: Part = rundown.getActivePart()

		const currentPartEnable: TimelineEnable = {
			start: now,
		}

		let autoNextEpochTime: number = 0
		if (activePart.autoNext && !!activePart.expectedDuration) {
			currentPartEnable.duration =
				activePart.expectedDuration + activePart.getTimings().delayStartOfPiecesDuration
			autoNextEpochTime = now + currentPartEnable.duration
		}

		const activeGroup: ActivePartTimelineObjectGroup = {
			id: `${ACTIVE_GROUP_PREFIX}${activePart.id}`,
			priority: HIGH_PRIORITY,
			isGroup: true,
			children: [],
			enable: currentPartEnable,
			layer: '',
			autoNextEpochTime,
			content: {
				type: TimelineObjectType.GROUP,
				deviceType: DeviceType.ABSTRACT,
			},
		}

		activeGroup.children = activePart
			.getPieces()
			.flatMap((piece) => this.generateGroupsAndTimelineObjectsForPiece(piece, activePart, activeGroup))
		return activeGroup
	}

	private generateGroupsAndTimelineObjectsForPiece(
		piece: Piece,
		part: Part,
		parentGroup: TimelineObjectGroup
	): TimelineObject[] {
		const timelineObjectsToReturn: TimelineObject[] = []
		const pieceEnable: TimelineEnable | undefined = this.createTimelineEnableForPiece(part, piece, parentGroup)

		if (!pieceEnable) {
			return []
		}

		if (pieceEnable.start === 'now') {
			// TODO: We would like to try to not use "now", but they might be necessary for AdLibs. We have to double check when implementing AdLibs.
			// TODO: This is mainly to alert of if we ever find a Piece with start==="now" while implementing the Timeline. Should be removed when done.
			throw new UnsupportedOperation(
				`Found an enable.start="now" for control for Piece: ${piece.id}. We are trying to avoid those if possible.`
			)
		}

		const controlForPiece: TimelineObjectControl = this.createTimelineObjectControl(parentGroup, piece, pieceEnable)
		timelineObjectsToReturn.push(controlForPiece)

		const childGroupForPiece: TimelineObjectGroup = this.createTimelineObjectGroupForPiece(
			parentGroup,
			piece,
			controlForPiece
		)
		timelineObjectsToReturn.push(childGroupForPiece)

		if (this.shouldPieceHavePreRollGroup(controlForPiece, piece)) {
			const preRollControlForPiece: TimelineObjectControl = this.createPreRollGroupForControl(
				controlForPiece,
				parentGroup
			)
			timelineObjectsToReturn.push(preRollControlForPiece)

			controlForPiece.enable.start = `#${preRollControlForPiece.id} + ${piece.preRollDuration}`
		}

		// TODO: Core resolves Endcaps, but endCaps seems to be related to when a PieceInstance was stopped which is a concept we don't use.
		// TODO: EnaCaps seems to be used to check when infinite pieces should stop. That logic should be in Rundown.ts so we shouldn't need to worry about that here
		// TODO: EndCaps also seems to be used if the Part/Piece needs to stop i.e. a Server will end at some point or an overlay "bundt" is only shown for x seconds. But Blueprint define that on ingest on the TimelineObjects?
		// TODO: Trying to leave out EndCaps for now and see how the Rundown behaves. Downside? We might have issues with "pieceStartOffset", whatever that is.

		childGroupForPiece.children = piece.timelineObjects.map((timelineObject) =>
			this.mapToTimelineObjectForPieceGroup(timelineObject, childGroupForPiece, piece)
		)

		return timelineObjectsToReturn
	}

	private createTimelineEnableForPiece(
		part: Part,
		piece: Piece,
		parentGroup: TimelineObjectGroup
	): TimelineEnable | undefined {
		const partCalculatedTimings: PartTimings = part.getTimings()
		switch (piece.transitionType) {
			case TransitionType.IN_TRANSITION: {
				return this.createInTransitionTimelineEnable(partCalculatedTimings, piece)
			}
			case TransitionType.OUT_TRANSITION: {
				return this.createOutTransitionTimelineEnable(part, partCalculatedTimings, parentGroup)
			}
			case TransitionType.NO_TRANSITION: {
				return this.createNoTransitionTimelineEnable(partCalculatedTimings, piece, parentGroup)
			}
			default: {
				ExhaustiveCaseChecker.assertAllCases(piece.transitionType)
			}
		}
	}

	// TODO: Find a way to remove undefined from the 'createXTimelineEnable' methods
	private createInTransitionTimelineEnable(
		partCalculatedTimings: PartTimings,
		piece: Piece
	): TimelineEnable | undefined {
		if (!partCalculatedTimings.inTransitionStart || partCalculatedTimings.inTransitionStart <= 0) {
			return
		}

		const startOffset: number = piece.start
		return {
			start: partCalculatedTimings.inTransitionStart + startOffset,
			duration: piece.duration,
		}
	}

	private createOutTransitionTimelineEnable(
		part: Part,
		partCalculatedTimings: PartTimings,
		parentGroup: TimelineObjectGroup
	): TimelineEnable | undefined {
		if (!part.outTransition.keepAliveDuration) {
			return
		}

		const postRollDurationPostFix: string = partCalculatedTimings.postRollDuration
			? ` - ${partCalculatedTimings.postRollDuration}`
			: ''
		return {
			start: `#${parentGroup.id}.end - ${part.outTransition.keepAliveDuration}${postRollDurationPostFix}`,
		}
	}

	private createNoTransitionTimelineEnable(
		partCalculatedTimings: PartTimings,
		piece: Piece,
		parentGroup: TimelineObjectGroup
	): TimelineEnable | undefined {
		// TODO: Check for dynamically inserted and if the Piece.duration is a number (which it should be).
		// TODO: If it is, set enable.start += partCalculatedTimings.toPartDelay-
		// TODO: This is something Core does. Might just be used for AdLibs, if used at all?

		// TODO: This hurts...
		const duration: string | number =
			partCalculatedTimings.postRollDuration && !piece.duration
				? `#${parentGroup.id} - ${partCalculatedTimings.postRollDuration}`
				: piece.duration

		return {
			start: piece.start,
			duration: duration,
		}
	}

	private createTimelineObjectControl(
		parentGroup: TimelineObjectGroup,
		piece: Piece,
		pieceEnable: TimelineEnable
	): TimelineObjectControl {
		return {
			id: `${parentGroup.id}${PIECE_CONTROL_INFIX}${piece.id}`,
			enable: pieceEnable,
			layer: piece.layer,
			priority: MEDIUM_PRIORITY,
			content: {
				type: TimelineObjectType.CONTROL,
				deviceType: DeviceType.ABSTRACT,
			},
			isGroup: false,
			inGroup: parentGroup.id,
		}
	}

	private createTimelineObjectGroupForPiece(
		parentGroup: TimelineObjectGroup,
		piece: Piece,
		controlForPiece: TimelineObjectControl
	): TimelineObjectGroup {
		return {
			id: `${parentGroup.id}${PIECE_GROUP_INFIX}${piece.id}`,
			content: {
				type: TimelineObjectType.GROUP,
				deviceType: DeviceType.ABSTRACT,
			},
			isGroup: true,
			inGroup: parentGroup.id,
			children: [],
			enable: {
				start: `#${controlForPiece.id}.start${piece.preRollDuration ? ` - ${piece.preRollDuration}` : ''}`,
				end: `#${controlForPiece.id}.end${piece.postRollDuration ? ` - ${piece.postRollDuration}` : ''}`,
			},
			layer: '',
		}
	}

	private shouldPieceHavePreRollGroup(controlForPiece: TimelineObjectControl, piece: Piece): boolean {
		// TODO: If we can't get rid of start="now" then we need to check for "now" here.
		return (controlForPiece.enable as TimelineEnable).start === 0 && piece.preRollDuration > 0
	}

	private createPreRollGroupForControl(
		controlObject: TimelineObjectControl,
		parentGroup: TimelineObjectGroup
	): TimelineObjectControl {
		return {
			id: `${PIECE_PRE_ROLL_PREFIX}${controlObject.id}`,
			enable: {
				start: `#${parentGroup.id}.start`,
			},
			layer: '',
			content: {
				type: TimelineObjectType.CONTROL,
				deviceType: DeviceType.ABSTRACT,
			},
		}
	}

	private mapToTimelineObjectForPieceGroup(
		timelineObject: TimelineObject,
		childGroupForPiece: TimelineObjectGroup,
		piece: Piece
	): TimelineObject {
		// TODO: Core checks "HoldMode" on the timelineObject - ignore for now
		const timelineObjectCopy: TimelineObject = this.objectCloner.clone(timelineObject)
		timelineObjectCopy.id = `${childGroupForPiece.id}_${piece.id}_${timelineObject.id}`
		timelineObjectCopy.inGroup = childGroupForPiece.id
		return timelineObjectCopy
	}

	private createTimelineObjectGroupForPreviousPart(
		previousPart: Part,
		activePart: Part,
		activeGroup: TimelineObjectGroup
	): TimelineObjectGroup {
		// TODO: This if-statement shouldn't be necessary in production
		if (previousPart.getExecutedAt() <= 0) {
			throw new Error(
				`Previous Part: ${previousPart.name} does not have a valid "executedAt" - something went wrong when setting the previous Part.`
			)
		}

		const previousGroup: TimelineObjectGroup = {
			id: `${PREVIOUS_GROUP_PREFIX}${previousPart.id}`,
			priority: LOW_PRIORITY,
			isGroup: true,
			children: [],
			enable: {
				start: previousPart.getExecutedAt(),
				// end: `#${activeGroup.id}.start`
				end: `#${activeGroup.id}.start + ${activePart.getTimings().previousPartContinueIntoPartDuration}`,
			},
			layer: '',
			content: {
				type: TimelineObjectType.GROUP,
				deviceType: DeviceType.ABSTRACT,
			},
		}

		previousGroup.children = previousPart
			.getPiecesWithLifespan([PieceLifespan.WITHIN_PART])
			.flatMap((piece) => this.generateGroupsAndTimelineObjectsForPiece(piece, previousPart, previousGroup))

		return previousGroup
	}

	private createTimelineObjectGroupsForInfinitePieces(rundown: Rundown): TimelineObjectGroup[] {
		const activePart: Part = rundown.getActivePart()
		const infinitePieceTimelineObjectGroups: TimelineObjectGroup[] = []
		rundown
			.getInfinitePieces()
			.filter(
				(piece) =>
					piece.transitionType ===
					TransitionType.NO_TRANSITION /* TODO: && filter for not disabled - if that becomes a thing */
			)
			.filter((piece) => piece.partId !== activePart.id)
			.forEach((piece) => {
				if (!piece.getExecutedAt()) {
					throw new UnsupportedOperation(
						`Found infinite Piece: ${piece.id} without an "executedAt". Infinite Pieces must have an "executedAt"! ${piece.pieceLifespan}`
					)
				}

				const infiniteGroup: TimelineObjectGroup = {
					id: `${INFINITE_GROUP_PREFIX}${activePart.id}_${piece.id}`,
					priority: MEDIUM_PRIORITY,
					isGroup: true,
					children: [],
					enable: {
						start: piece.getExecutedAt(),
					},
					layer: piece.layer,
					content: {
						type: TimelineObjectType.GROUP,
						deviceType: DeviceType.ABSTRACT,
					},
				}

				// TODO: Do infinite Pieces need a PreRoll group? In current implementation Piece.executedAt already includes PreRoll
				// if (piece.preRollDuration > 0) {
				//     // Create a new "startNow" object that is used to run in the preRoll.
				//     const preRollInfiniteGroupForPiece: TimelineObjectGroup = {
				//         id: `${PIECE_PRE_ROLL_PREFIX}${infiniteGroup.id}`,
				//         enable: {
				//             // start: now // TODO: Core sets this to "now", but Core also handles the initial addition of an infinite Piece to the Timeline differently than we do.
				//             start: piece.executedAt
				//         },
				//         layer: '',
				//         isGroup: true,
				//         children: [],
				//         content: {
				//             type: TimelineObjectType.GROUP,
				//             deviceType: DeviceType.ABSTRACT
				//         }
				//     }
				//     infiniteGroup.enable.start = `#${preRollInfiniteGroupForPiece.id} + ${piece.preRollDuration}`
				//     infinitePieceTimelineObjectGroups.push(preRollInfiniteGroupForPiece)
				// }

				infiniteGroup.children = piece.timelineObjects.flatMap((timelineObject) =>
					this.mapToTimelineObjectForPieceGroup(timelineObject, infiniteGroup, piece)
				)

				infinitePieceTimelineObjectGroups.push(infiniteGroup)
			})

		return infinitePieceTimelineObjectGroups
	}

	private createTimelineForNextPart(rundown: Rundown, activeGroup: TimelineObjectGroup): TimelineObjectGroup {
		const activePart: Part = rundown.getActivePart()
		const nextPart: Part = rundown.getNextPart()

		nextPart.calculateTimings(activePart)

		const nextGroup: TimelineObjectGroup = {
			id: `${NEXT_GROUP_PREFIX}${nextPart.id}`,
			priority: HIGH_PRIORITY,
			isGroup: true,
			children: [],
			enable: {
				start: `#${activeGroup.id}.end - ${nextPart.getTimings().previousPartContinueIntoPartDuration}`,
				// TODO: Core sets the duration to the enable.duration of the nextPart group which is being created with no enable.duration...
				// TODO: Start should be enough. We call the "TakeNext" again when it's time to autoNext, and then duration will be set.
			},
			layer: '',
			content: {
				type: TimelineObjectType.GROUP,
				deviceType: DeviceType.ABSTRACT,
			},
		}

		nextGroup.children = nextPart
			.getPiecesWithLifespan([PieceLifespan.WITHIN_PART])
			.flatMap((piece) => this.generateGroupsAndTimelineObjectsForPiece(piece, nextPart, nextGroup))

		return nextGroup
	}
}
