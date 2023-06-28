import {
	OnGenerateTimelineObjExt,
	TimelineContentTypeOther,
	TimelineObjGroupRundown,
	TimelineObjPieceAbstract,
	TimelineObjRundown,
	TimelineObjType,
} from '../dataModel/Timeline'
import { ReadonlyDeep } from 'type-fest'
import { TSR } from '@sofie-automation/blueprints-integration'
import { PieceInstanceId, RundownPlaylistId } from '../dataModel/Ids'
import { clone, literal } from '../lib'
import { getPieceControlObjectId, getPieceGroupId } from './ids'
import { unprotectString } from '../protectedString'
import { PieceInstanceWithTimings } from './infinites'
import { PlayoutChangedType } from '@sofie-automation/shared-lib/dist/peripheralDevice/peripheralDeviceAPI'

export interface PieceTimelineMetadata {
	/** Indicate that this is a PieceTimeline object */
	isPieceTimeline: true
	/** If this object should be used as timing for a PieceInstance */
	pieceInstanceGroupId?: PieceInstanceId
	/** If this object should be used to in onTriggerTime to de-now a PieceInstance */
	triggerPieceInstanceId?: PieceInstanceId
}

export function createPieceGroupAndCap(
	playlistId: RundownPlaylistId,
	pieceInstance: Pick<
		ReadonlyDeep<PieceInstanceWithTimings>,
		| '_id'
		| 'rundownId'
		| 'piece'
		| 'infinite'
		| 'resolvedEndCap'
		| 'priority'
		| 'partInstanceId'
		| 'userDuration'
		| 'dynamicallyInserted'
	>,
	controlObjClasses?: string[],
	partGroup?: TimelineObjRundown,
	parentGroup?: TimelineObjRundown,
	pieceEnable?: TSR.Timeline.TimelineEnable,
	pieceStartOffset?: number
): {
	controlObj: TimelineObjPieceAbstract & OnGenerateTimelineObjExt<PieceTimelineMetadata>
	childGroup: TimelineObjGroupRundown & OnGenerateTimelineObjExt<PieceTimelineMetadata>
	capObjs: Array<TimelineObjRundown & OnGenerateTimelineObjExt<PieceTimelineMetadata>>
} {
	if (pieceEnable) {
		pieceEnable = clone(pieceEnable)
	} else {
		if (pieceInstance.userDuration) {
			pieceEnable = {
				start: pieceInstance.piece.enable.start,
				end: pieceInstance.userDuration.end,
			}
		} else {
			pieceEnable = clone(pieceInstance.piece.enable)
		}
	}

	const controlObj = literal<TimelineObjPieceAbstract & OnGenerateTimelineObjExt<PieceTimelineMetadata>>({
		id: getPieceControlObjectId(pieceInstance),
		pieceInstanceId: unprotectString(pieceInstance._id),
		infinitePieceInstanceId: pieceInstance.infinite?.infiniteInstanceId,
		partInstanceId: pieceInstance.partInstanceId,
		objectType: TimelineObjType.RUNDOWN,
		enable: pieceEnable,
		layer: pieceInstance.piece.sourceLayerId,
		priority: pieceInstance.priority,
		content: {
			deviceType: TSR.DeviceType.ABSTRACT,
			type: 'callback',
			callBack: PlayoutChangedType.PIECE_PLAYBACK_STARTED,
			callBackData: {
				rundownPlaylistId: playlistId,
				partInstanceId: pieceInstance.partInstanceId,
				pieceInstanceId: pieceInstance._id,
				dynamicallyInserted: pieceInstance.dynamicallyInserted !== undefined,
			},
			callBackStopped: PlayoutChangedType.PIECE_PLAYBACK_STOPPED, // Will cause a callback to be called, when the object stops playing:
		},
		classes: controlObjClasses,
		inGroup: parentGroup && parentGroup.id,
		metaData: {
			isPieceTimeline: true,
		},
	})

	const piecePreroll = pieceInstance.piece.prerollDuration ?? 0
	const childGroup = literal<TimelineObjGroupRundown & OnGenerateTimelineObjExt<PieceTimelineMetadata>>({
		id: getPieceGroupId(pieceInstance),
		content: {
			deviceType: TSR.DeviceType.ABSTRACT,
			type: TimelineContentTypeOther.GROUP,
		},
		children: [],
		inGroup: parentGroup && parentGroup.id,
		isGroup: true,
		pieceInstanceId: unprotectString(pieceInstance._id),
		infinitePieceInstanceId: pieceInstance.infinite?.infiniteInstanceId,
		partInstanceId: pieceInstance.partInstanceId,
		objectType: TimelineObjType.RUNDOWN,
		enable: {
			start: `#${controlObj.id}.start - ${piecePreroll}`,
			end: `#${controlObj.id}.end + ${pieceInstance.piece.postrollDuration ?? 0}`,
		},
		layer: '',
		metaData: {
			isPieceTimeline: true,
			pieceInstanceGroupId: pieceInstance._id,
		},
	})

	const capObjs: Array<TimelineObjRundown & OnGenerateTimelineObjExt<PieceTimelineMetadata>> = []

	if (controlObj.enable.start === 'now' && piecePreroll > 0) {
		// Use a dedicated now object, as we need to delay the start of the control object to allow the piece_group to preroll
		const startNowObj = literal<TimelineObjRundown & OnGenerateTimelineObjExt<PieceTimelineMetadata>>({
			objectType: TimelineObjType.RUNDOWN,
			id: `${controlObj.id}_start_now`,
			enable: {
				start: 'now',
			},
			inGroup: parentGroup && parentGroup.id,
			layer: '',
			content: {
				deviceType: TSR.DeviceType.ABSTRACT,
			},
			partInstanceId: controlObj.partInstanceId,
			metaData: {
				isPieceTimeline: true,
				triggerPieceInstanceId: pieceInstance._id,
			},
		})
		capObjs.push(startNowObj)

		controlObj.enable.start = `#${startNowObj.id} + ${piecePreroll}`
	} else {
		// No preroll necessary, so let the control object trigger the de-nowify
		controlObj.metaData.triggerPieceInstanceId = pieceInstance._id
	}

	let resolvedEndCap = pieceInstance.resolvedEndCap
	if (resolvedEndCap === 'now') {
		// TODO - there could already be a piece with a cap of 'now' that we could use as our end time
		// As the cap is for 'now', rather than try to get tsr to understand `end: 'now'`, we can create a 'now' object to tranlate it
		const nowObj = literal<TimelineObjRundown & OnGenerateTimelineObjExt<PieceTimelineMetadata>>({
			objectType: TimelineObjType.RUNDOWN,
			id: `${controlObj.id}_cap_now`,
			enable: {
				start: 'now',
			},
			layer: '',
			content: {
				deviceType: TSR.DeviceType.ABSTRACT,
			},
			partInstanceId: controlObj.partInstanceId,
			metaData: literal<PieceTimelineMetadata>({
				isPieceTimeline: true,
			}),
		})
		capObjs.push(nowObj)
		resolvedEndCap = `#${nowObj.id}.start`
	} else if (pieceStartOffset && resolvedEndCap !== undefined) {
		// If the start has been adjusted, the end needs to be updated to compensate
		if (typeof resolvedEndCap === 'number') {
			resolvedEndCap -= pieceStartOffset
		} else {
			resolvedEndCap = `${resolvedEndCap} - ${pieceStartOffset}`
		}
	}

	if (controlObj.enable.duration !== undefined || controlObj.enable.end !== undefined) {
		let updatedControlObj = false
		if (typeof resolvedEndCap === 'number') {
			// If everything is numeric, we can keep it simple and flatten it out here
			if (typeof controlObj.enable.end === 'number') {
				updatedControlObj = true
				controlObj.enable.end = Math.min(controlObj.enable.end, resolvedEndCap)
			} else if (typeof controlObj.enable.start === 'number' && typeof controlObj.enable.duration === 'number') {
				updatedControlObj = true
				controlObj.enable.end = Math.min(controlObj.enable.start + controlObj.enable.duration, resolvedEndCap)
				delete controlObj.enable.duration
			}
		}

		if (!updatedControlObj && resolvedEndCap !== undefined) {
			// Create a wrapper group to apply the end cap
			const pieceEndCapGroup = literal<TimelineObjGroupRundown & OnGenerateTimelineObjExt<PieceTimelineMetadata>>(
				{
					objectType: TimelineObjType.RUNDOWN,
					id: `${controlObj.id}_cap`,
					enable: {
						start: 0,
						end: resolvedEndCap,
					},
					layer: '',
					children: [],
					content: {
						deviceType: TSR.DeviceType.ABSTRACT,
						type: TimelineContentTypeOther.GROUP,
					},
					isGroup: true,
					inGroup: parentGroup && parentGroup.id,
					partInstanceId: controlObj.partInstanceId,
					metaData: literal<PieceTimelineMetadata>({
						isPieceTimeline: true,
					}),
				}
			)
			capObjs.push(pieceEndCapGroup)
			controlObj.inGroup = pieceEndCapGroup.id
		}
	} else {
		if (typeof resolvedEndCap !== undefined && partGroup) {
			resolvedEndCap = `#${partGroup.id}.start + ${resolvedEndCap}`
		}
		controlObj.enable.end = resolvedEndCap
	}

	return { controlObj, childGroup, capObjs }
}
