import { BlueprintOnTimelineGenerate } from '../../model/value-objects/blueprint'
import { ShowStyle } from '../../model/entities/show-style'
import { DeviceType, LookAheadTimelineObject, Timeline, TimelineObjectGroup } from '../../model/entities/timeline'
import { RundownPersistentState } from '../../model/value-objects/rundown-persistent-state'
import { Studio } from '../../model/entities/studio'
import { Part } from '../../model/entities/part'
import { Tv2AbstractLayer, Tv2CasparCgLayer, Tv2SisyfosLayer } from './value-objects/tv2-layers'
import { Tv2RundownPersistentState } from './value-objects/tv2-rundown-persistent-state'
import { TimelineObject } from '../../model/entities/timeline-object'
import { Tv2PartEndState } from './value-objects/tv2-part-end-state'
import { Tv2SisyfosPersistentLayerFinder } from './helpers/tv2-sisyfos-persistent-layer-finder'
import { UnsupportedOperation } from '../../model/exceptions/unsupported-operation'
import { Tv2BlueprintTimelineObject, Tv2PieceMetaData } from './value-objects/tv2-meta-data'

interface Tv2ABSourceLayers {
	caspar: {
		clipPending: string
	}
	sisyfos: {
		clipPending: string
		playerA: string // TODO: Same approach as caspar
		playerB: string
	}
}

const A_B_SOURCE_LAYERS: Tv2ABSourceLayers = {
	caspar: {
		clipPending: Tv2CasparCgLayer.CasparPlayerClipPending,
	},
	sisyfos: {
		clipPending: Tv2SisyfosLayer.SisyfosSourceClipPending,
		playerA: Tv2SisyfosLayer.SisyfosSourceServerA,
		playerB: Tv2SisyfosLayer.SisyfosSourceServerB,
	},
}

export class Tv2OnTimelineGenerateCalculator implements BlueprintOnTimelineGenerate {
	constructor(private sisyfosPersistentLayerFinder: Tv2SisyfosPersistentLayerFinder) {}

	public onTimelineGenerate(
		_studio: Studio,
		_showStyle: ShowStyle,
		_previousRundownPersistentState: RundownPersistentState,
		activePart: Part,
		previousPart: Part | undefined,
		timeline: Timeline
	): {
		timeline: Timeline
		rundownPersistentState: RundownPersistentState
	} {
		// const studioBlueprintConfiguration: Tv2StudioBlueprintConfiguration = studio.blueprintConfiguration as Tv2StudioBlueprintConfiguration
		// const showStyleBlueprintConfiguration: Tv2ShowStyleBlueprintConfiguration = showStyle.blueprintConfiguration as Tv2ShowStyleBlueprintConfiguration
		// const rundownPersistentState: Tv2RundownPersistentState = previousRundownPersistentState as Tv2RundownPersistentState

		const newRundownPersistentState: Tv2RundownPersistentState = {
			activeMediaPlayers: new Map(),
			isNewSegment: previousPart?.segmentId !== activePart.segmentId,
		}

		if (!newRundownPersistentState.isNewSegment || this.isAnyPieceInjectedIntoPart(activePart)) {
			const sisyfosPersistedLevelsTimelineObject: TimelineObject =
				this.createSisyfosPersistedLevelsTimelineObject(activePart, previousPart, newRundownPersistentState)
			const activeTimelineObjectGroup: TimelineObjectGroup | undefined = timeline.timelineGroups.find(
				(timelineObject) => timelineObject.id.includes('active_group_')
			)
			if (!activeTimelineObjectGroup) {
				throw new UnsupportedOperation('No active group found. This should not be possible')
			}
			activeTimelineObjectGroup.children.push(sisyfosPersistedLevelsTimelineObject)
		}

		timeline = this.processServerLookAheads(activePart, timeline)

		return { rundownPersistentState: newRundownPersistentState, timeline }
	}

	private isAnyPieceInjectedIntoPart(part: Part): boolean {
		// TODO: This is a hacky way to check if a Piece is an AdLib. It should not be hidden away in meta data for Sisyfos...
		return part.getPieces().some((piece) => {
			const pieceMetaData: Tv2PieceMetaData = piece.metaData as Tv2PieceMetaData
			return pieceMetaData && pieceMetaData.sisyfosPersistMetaData?.isModifiedOrInsertedByAction
		})
	}

	private createSisyfosPersistedLevelsTimelineObject(
		part: Part,
		previousPart: Part | undefined,
		rundownPersistentState: Tv2RundownPersistentState
	): TimelineObject {
		// TODO: Camera is not accepting persisted Audio?
		const previousPartEndState: Tv2PartEndState = previousPart?.getEndState() as Tv2PartEndState
		const layersWantingToPersistFromPreviousPart: string[] =
			previousPartEndState && !rundownPersistentState.isNewSegment
				? previousPartEndState.sisyfosPersistenceMetaData.sisyfosLayers
				: []
		const layersToPersist: string[] = this.sisyfosPersistentLayerFinder.findLayersToPersist(
			part,
			undefined,
			layersWantingToPersistFromPreviousPart
		)
		return {
			id: 'sisyfosPersistenceObject',
			enable: {
				start: 0,
			},
			layer: Tv2SisyfosLayer.SisyfosPersistedLevels,
			// TODO: Find a way to let "content" be typed.
			content: {
				deviceType: DeviceType.SISYFOS,
				type: 'channels',
				overridePriority: 1,
				channels: layersToPersist.map((layer) => {
					return {
						mappedLayer: layer,
						isPgm: 1,
					}
				}),
			},
		}
	}

	// TODO: This probably needs a rewrite
	private processServerLookAheads(currentPart: Part, timeline: Timeline): Timeline {
		const serverLayers: string[] = [
			A_B_SOURCE_LAYERS.caspar.clipPending,
			this.getCasparCgPlayerClipLayer(1),
			this.getCasparCgPlayerClipLayer(2),
		]
		const serverTimelineObjects: TimelineObject[] = currentPart
			.getPieces()
			.flatMap((piece) => piece.timelineObjects)
			.filter((timelineObject) => {
				if (!timelineObject.enable.while) {
					return false
				}
				const lookAheadTimelineObject: LookAheadTimelineObject = timelineObject as LookAheadTimelineObject
				return serverLayers.includes(timelineObject.layer) && !lookAheadTimelineObject.isLookahead
			})

		const mediaPlayerSessions: string[] = serverTimelineObjects.reduce((mediaPlayerSessions, timelineObject) => {
			const blueprintTimelineObject: Tv2BlueprintTimelineObject = timelineObject as Tv2BlueprintTimelineObject
			if (blueprintTimelineObject.metaData?.mediaPlayerSession) {
				mediaPlayerSessions.push(blueprintTimelineObject.metaData.mediaPlayerSession)
			}
			return mediaPlayerSessions
		}, [] as string[])

		// TODO: Find a better way of finding the correct group
		const lookAheadGroup: TimelineObjectGroup | undefined = timeline.timelineGroups.find(
			(timelineObject) => timelineObject.id === 'look_ahead_group'
		)
		if (!lookAheadGroup) {
			throw new UnsupportedOperation('No LookAhead group found. This should not be possible')
		}
		// Filter out lookAheads for servers that are currently in Program
		const notInProgramLookAheadTimelineObjects: TimelineObject[] = lookAheadGroup.children.filter(
			(timelineObject) => {
				const blueprintTimelineObject: Tv2BlueprintTimelineObject = timelineObject as Tv2BlueprintTimelineObject
				if (!blueprintTimelineObject.metaData?.mediaPlayerSession) {
					return true
				}

				const lookAheadTimelineObject: LookAheadTimelineObject = timelineObject as LookAheadTimelineObject
				if (
					blueprintTimelineObject.layer === Tv2AbstractLayer.SERVER_ENABLE_PENDING &&
					lookAheadTimelineObject.isLookahead
				) {
					return false
				}

				const lookAheadServerLayers: string[] = serverLayers.map((layer) => `${layer}_lookahead`)
				return !(
					lookAheadServerLayers.includes(timelineObject.layer) &&
					lookAheadTimelineObject.isLookahead &&
					mediaPlayerSessions.includes(blueprintTimelineObject.metaData?.mediaPlayerSession)
				)
			}
		)
		lookAheadGroup.children = notInProgramLookAheadTimelineObjects

		return timeline
	}

	private getCasparCgPlayerClipLayer(index: number): string {
		return `casparcg_player_clip_${index}`
	}
}
