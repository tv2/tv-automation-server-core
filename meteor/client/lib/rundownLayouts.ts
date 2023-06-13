import _ from 'underscore'
import { PieceInstance } from '../../lib/collections/PieceInstances'
import { RequiresActiveLayers } from '../../lib/collections/RundownLayouts'
import { RundownPlaylist } from '../../lib/collections/RundownPlaylists'
import { DBShowStyleBase } from '../../lib/collections/ShowStyleBases'
import { invalidateAt } from './invalidatingTime'
import { memoizedIsolatedAutorun } from './reactiveData/reactiveDataHelper'
import { getUnfinishedPieceInstances } from '../../lib/Rundown'

/**
 * If the conditions of the filter are met, activePieceInstance will include the first piece instance found that matches the filter, otherwise it will be undefined.
 */
export function getIsFilterActive(
	playlist: RundownPlaylist,
	showStyleBase: DBShowStyleBase,
	panel: RequiresActiveLayers
): { active: boolean; activePieceInstance: PieceInstance | undefined } {
	const unfinishedPieces = getUnfinishedPieceInstancesReactive(playlist, showStyleBase)
	let activePieceInstance: PieceInstance | undefined
	const activeLayers = unfinishedPieces.map((p) => p.piece.sourceLayerId)
	const containsEveryRequiredLayer = panel.requireAllAdditionalSourcelayers
		? panel.additionalLayers?.length && panel.additionalLayers.every((s) => activeLayers.includes(s))
		: false
	const containsRequiredLayer = containsEveryRequiredLayer
		? true
		: panel.additionalLayers && panel.additionalLayers.length
		? panel.additionalLayers.some((s) => activeLayers.includes(s))
		: false

	if (
		(!panel.requireAllAdditionalSourcelayers || containsEveryRequiredLayer) &&
		(!panel.additionalLayers?.length || containsRequiredLayer)
	) {
		activePieceInstance =
			panel.requiredLayerIds && panel.requiredLayerIds.length
				? _.flatten(Object.values(unfinishedPieces)).find((piece: PieceInstance) => {
						return (
							(panel.requiredLayerIds || []).indexOf(piece.piece.sourceLayerId) !== -1 &&
							piece.partInstanceId === playlist.currentPartInstanceId
						)
				  })
				: undefined
	}
	return {
		active:
			activePieceInstance !== undefined || (!panel.requiredLayerIds?.length && !panel.additionalLayers?.length),
		activePieceInstance,
	}
}

export function getUnfinishedPieceInstancesReactive(playlist: RundownPlaylist, showStyleBase: DBShowStyleBase) {
	if (playlist.activationId && playlist.currentPartInstanceId) {
		return memoizedIsolatedAutorun(
			getUnfinishedPieceInstances,
			'getUnfinishedPieceInstancesReactive',
			playlist.activationId,
			playlist.currentPartInstanceId,
			showStyleBase,
			invalidateAt
		)
	}

	return []
}
