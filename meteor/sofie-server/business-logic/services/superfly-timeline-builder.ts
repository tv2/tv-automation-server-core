import { TimelineBuilder } from './interfaces/timeline-builder'
import { Rundown } from '../../model/entities/rundown'
import {
	ActivePartTimelineObjectGroup,
	DeviceType,
	LookAheadTimelineObject,
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
import { Studio } from '../../model/entities/studio'
import { StudioLayer } from '../../model/value-objects/studio-layer'
import { LookAheadMode } from '../../model/enums/look-ahead-mode'
import { Exception } from '../../model/exceptions/exception'
import { ErrorCode } from '../../model/enums/error-code'

const BASELINE_GROUP_ID: string = 'baseline_group'
const LOOK_AHEAD_GROUP_ID: string = 'look_ahead_group'

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
const LOOK_AHEAD_PRIORITY: number = 0.1
const BASELINE_PRIORITY: number = 0
const LOW_PRIORITY: number = -1

export class SuperflyTimelineBuilder implements TimelineBuilder {
	constructor(private objectCloner: ObjectCloner) {}

	public getBaseTimeline(): Timeline {
		return { timelineGroups: [] }
	}

	public buildTimeline(rundown: Rundown, studio: Studio): Timeline {
		let timeline: Timeline = this.createTimelineWithBaseline(rundown)

		// TODO: Support that there might not be an active Part.
		const activePartTimelineGroup: ActivePartTimelineObjectGroup = this.createActivePartGroup(rundown)
		timeline.timelineGroups.push(activePartTimelineGroup)

		timeline = this.createTimelineWithPreviousPartGroup(rundown, activePartTimelineGroup, timeline)
		timeline = this.createTimelineWithNextPartGroup(rundown, activePartTimelineGroup, timeline)
		timeline = this.createTimelineWithLookAheadGroup(rundown, studio, activePartTimelineGroup, timeline)
		timeline = this.createTimelineWithInfiniteGroups(rundown, timeline)

		// TODO: Call Blueprint "onTimelineGenerate". This will most likely need some tweaks.

		return timeline
	}

	private createTimelineWithBaseline(rundown: Rundown): Timeline {
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

		return {
			timelineGroups: [baselineGroup],
		}
	}

	private createActivePartGroup(rundown: Rundown): ActivePartTimelineObjectGroup {
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
		if (partCalculatedTimings.inTransitionStart === undefined) {
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
		const duration: string | number =
			partCalculatedTimings.postRollDuration && !piece.duration
				? `#${parentGroup.id} - ${partCalculatedTimings.postRollDuration}`
				: piece.duration

		return {
			// TODO: Core only adds "delayStartOfPiecesDuration" if it's not an adLib or if it is an adLib then only if it has been adLibbed into next Part
			// TODO: Since handling AdLibs is no longer Part of building the Timeline, we should be safe to always add this? It should evaluate to zero in most cases.
			// TODO: Verify when we implement adLibs.
			start: piece.start + partCalculatedTimings.delayStartOfPiecesDuration,
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

	private createTimelineWithLookAheadGroup(
		rundown: Rundown,
		studio: Studio,
		activeGroup: TimelineObjectGroup,
		timeline: Timeline
	): Timeline {
		const lookAheadLayers: StudioLayer[] = studio.layers.filter(
			(layer) => layer.lookAheadMode !== LookAheadMode.NONE
		)

		const futureLookAheadObjects: TimelineObject[] = lookAheadLayers.flatMap((layer) => {
			const lookAheadObjects: LookAheadTimelineObject[] = this.findLookAheadTimelineObjectsForFutureParts(
				rundown,
				layer,
				activeGroup
			)

			const activePartLookAheadObjects: LookAheadTimelineObject[] =
				this.findLookAheadTimelineObjectsForActivePart(rundown, layer, activeGroup)
			lookAheadObjects.push(...activePartLookAheadObjects)

			return lookAheadObjects
		})

		// TODO: Test server with in-transition to see if we need to do something about it with lookAhead

		const lookAheadTimelineObjectGroup: TimelineObjectGroup = {
			id: LOOK_AHEAD_GROUP_ID,
			isGroup: true,
			children: futureLookAheadObjects,
			enable: {
				while: '1',
			},
			priority: LOOK_AHEAD_PRIORITY,
			layer: '',
			content: {
				type: TimelineObjectType.GROUP,
				deviceType: DeviceType.ABSTRACT,
			},
		}

		timeline.timelineGroups.push(lookAheadTimelineObjectGroup)
		return timeline
	}

	private findLookAheadTimelineObjectsForFutureParts(
		rundown: Rundown,
		layer: StudioLayer,
		activeGroup: TimelineObjectGroup
	): LookAheadTimelineObject[] {
		const lookAheadEnable: TimelineEnable = {
			while: `#${activeGroup.id}`,
		}
		const lookAheadObjects: LookAheadTimelineObject[] = []
		let partToGetLookAheadObjectsFrom: Part = rundown.getNextPart()

		for (let i = 0; i < layer.maximumLookAheadSearchDistance; i++) {
			if (lookAheadObjects.length >= layer.amountOfLookAheadObjectsToFind) {
				return lookAheadObjects
			}

			lookAheadObjects.push(
				...this.createLookAheadTimelineObjectsForPart(partToGetLookAheadObjectsFrom, layer, lookAheadEnable)
			)
			try {
				partToGetLookAheadObjectsFrom = rundown.getPartAfter(partToGetLookAheadObjectsFrom)
			} catch (exception) {
				if ((exception as Exception).errorCode !== ErrorCode.LAST_PART_IN_RUNDOWN) {
					throw exception
				}
				return lookAheadObjects
			}
		}
		return lookAheadObjects
	}

	private createLookAheadTimelineObjectsForPart(
		part: Part,
		layer: StudioLayer,
		enable: TimelineEnable
	): LookAheadTimelineObject[] {
		return part
			.getPieces()
			.filter((piece) => piece.pieceLifespan === PieceLifespan.WITHIN_PART)
			.flatMap((piece) => piece.timelineObjects)
			.filter((timelineObject) => timelineObject.layer === layer.name)
			.map((timelineObject) => this.mapTimelineObjectToLookAheadTimelineObject(timelineObject, enable, layer))
	}

	/*
	 * Since the active Part might be delayed slightly, from when the Take happens to when the active Part is actually OnAir (i.e. Pre- and PostRoll etc),
	 * we need to show the lookAhead objects from the "previous next" Part which is now the active Part.
	 * We only need to show these lookAhead objects until the active Part starts playing. Once that happens, the actual
	 * lookAhead objects will take over.
	 */
	private findLookAheadTimelineObjectsForActivePart(
		rundown: Rundown,
		layer: StudioLayer,
		activeGroup: TimelineObjectGroup
	): LookAheadTimelineObject[] {
		const activePartTimelineObjectEnable: TimelineEnable = {
			start: 0,
			end: `#${activeGroup.id}.start`,
		}
		return this.createLookAheadTimelineObjectsForPart(
			rundown.getActivePart(),
			layer,
			activePartTimelineObjectEnable
		)
	}

	private mapTimelineObjectToLookAheadTimelineObject(
		timelineObject: TimelineObject,
		enable: TimelineEnable,
		studioLayer: StudioLayer
	): LookAheadTimelineObject {
		const lookAheadTimelineObject: LookAheadTimelineObject = {
			...this.objectCloner.clone(timelineObject),
			id: `${LOOK_AHEAD_GROUP_ID}_${timelineObject.id}`,
			priority: LOOK_AHEAD_PRIORITY,
			isLookahead: true,
			enable,
			inGroup: LOOK_AHEAD_GROUP_ID,
		}
		if (studioLayer.lookAheadMode === LookAheadMode.PRELOAD) {
			lookAheadTimelineObject.lookaheadForLayer = lookAheadTimelineObject.layer
			lookAheadTimelineObject.layer = `${lookAheadTimelineObject.layer}_lookahead`
		}
		return lookAheadTimelineObject
	}

	private createTimelineWithPreviousPartGroup(
		rundown: Rundown,
		activeGroup: TimelineObjectGroup,
		timeline: Timeline
	): Timeline {
		const previousPart: Part | undefined = rundown.getPreviousPart()
		if (!previousPart) {
			return timeline
		}

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
				end: `#${activeGroup.id}.start + ${
					rundown.getActivePart().getTimings().previousPartContinueIntoPartDuration
				}`,
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

		timeline.timelineGroups.push(previousGroup)
		return timeline
	}

	private createTimelineWithInfiniteGroups(rundown: Rundown, timeline: Timeline): Timeline {
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

		timeline.timelineGroups.push(...infinitePieceTimelineObjectGroups)
		return timeline
	}

	private createTimelineWithNextPartGroup(
		rundown: Rundown,
		activeGroup: ActivePartTimelineObjectGroup,
		timeline: Timeline
	): Timeline {
		if (activeGroup.autoNextEpochTime === 0) {
			return timeline
		}

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

		if (Number.isNaN(activeGroup.enable.duration)) {
			throw new UnsupportedOperation(
				`Duration of activeGroup must be a number! Got: ${activeGroup.enable.duration}`
			)
		}
		timeline.autoNext = {
			epochTimeToTakeNext:
				activeGroup.autoNextEpochTime - rundown.getNextPart().getTimings().previousPartContinueIntoPartDuration,
		}

		timeline.timelineGroups.push(nextGroup)
		return timeline
	}
}
