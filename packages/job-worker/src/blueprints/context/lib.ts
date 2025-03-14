import { AdLibAction } from '@sofie-automation/corelib/dist/dataModel/AdlibAction'
import { AdLibPiece } from '@sofie-automation/corelib/dist/dataModel/AdLibPiece'
import { DBPart } from '@sofie-automation/corelib/dist/dataModel/Part'
import { DBPartInstance } from '@sofie-automation/corelib/dist/dataModel/PartInstance'
import { deserializePieceTimelineObjectsBlob, PieceGeneric } from '@sofie-automation/corelib/dist/dataModel/Piece'
import {
	PieceInstance,
	PieceInstancePiece,
	ResolvedPieceInstance,
} from '@sofie-automation/corelib/dist/dataModel/PieceInstance'
import { DBRundown } from '@sofie-automation/corelib/dist/dataModel/Rundown'
import { DBSegment } from '@sofie-automation/corelib/dist/dataModel/Segment'
import { DBShowStyleBase } from '@sofie-automation/corelib/dist/dataModel/ShowStyleBase'
import { DBShowStyleVariant } from '@sofie-automation/corelib/dist/dataModel/ShowStyleVariant'
import { clone, Complete, literal } from '@sofie-automation/corelib/dist/lib'
import { unprotectString } from '@sofie-automation/corelib/dist/protectedString'
import { ReadonlyDeep } from 'type-fest'
import {
	IBlueprintActionManifest,
	IBlueprintAdLibPieceDB,
	IBlueprintConfig,
	IBlueprintMutatablePart,
	IBlueprintPartDB,
	IBlueprintPartInstance,
	IBlueprintPiece,
	IBlueprintPieceDB,
	IBlueprintPieceGeneric,
	IBlueprintPieceInstance,
	IBlueprintResolvedPieceInstance,
	IBlueprintRundownDB,
	IBlueprintSegmentDB,
	IBlueprintShowStyleBase,
	IBlueprintShowStyleVariant,
	IOutputLayer,
	ISourceLayer,
	RundownPlaylistTiming,
} from '@sofie-automation/blueprints-integration'

/**
 * Convert an object to have all the values of all keys (including optionals) be 'true'
 * This simplifies the definitions for
 */
type AllValuesAsTrue<T> = {
	[K in keyof Required<T>]: true
}
function allKeysOfObject<T>(sample: AllValuesAsTrue<T>): Array<keyof T> {
	return Object.keys(sample) as Array<keyof T>
}

// Compile a list of the keys which are allowed to be set
export const IBlueprintPieceObjectsSampleKeys = allKeysOfObject<IBlueprintPiece>({
	externalId: true,
	enable: true,
	virtual: true,
	continuesRefId: true,
	pieceType: true,
	extendOnHold: true,
	name: true,
	metaData: true,
	sourceLayerId: true,
	outputLayerId: true,
	content: true,
	transitions: true,
	lifespan: true,
	prerollDuration: true,
	postrollDuration: true,
	toBeQueued: true,
	expectedPlayoutItems: true,
	tags: true,
	expectedPackages: true,
	hasSideEffects: true,
	allowDirectPlay: true,
	notInVision: true,
})

// Compile a list of the keys which are allowed to be set
export const IBlueprintMutatablePartSampleKeys = allKeysOfObject<IBlueprintMutatablePart>({
	title: true,
	metaData: true,
	autoNext: true,
	autoNextOverlap: true,
	inTransition: true,
	disableNextInTransition: true,
	outTransition: true,
	expectedDuration: true,
	budgetDuration: true,
	holdMode: true,
	shouldNotifyCurrentPlayingPart: true,
	classes: true,
	classesForNext: true,
	displayDurationGroup: true,
	displayDuration: true,
	identifier: true,
	hackListenToMediaObjectUpdates: true,
})

/*
 * There are all very explicit manual clones of the objects, to only provide the properties the blueprint types state they will have.
 * Note: they are all intended to 'clone' the objects, to avoid mutability concerns
 */

function convertPieceInstanceToBlueprintsInner(pieceInstance: PieceInstance): Complete<IBlueprintPieceInstance> {
	const obj: Complete<IBlueprintPieceInstance> = {
		_id: unprotectString(pieceInstance._id),
		partInstanceId: unprotectString(pieceInstance.partInstanceId),
		adLibSourceId: unprotectString(pieceInstance.adLibSourceId),
		dynamicallyInserted: pieceInstance.dynamicallyInserted && { ...pieceInstance.dynamicallyInserted },
		startedPlayback: pieceInstance.startedPlayback,
		stoppedPlayback: pieceInstance.stoppedPlayback,
		infinite: pieceInstance.infinite
			? literal<Complete<IBlueprintPieceInstance['infinite']>>({
					infinitePieceId: unprotectString(pieceInstance.infinite.infinitePieceId),
					fromHold: pieceInstance.infinite.fromHold,
					fromPreviousPart: pieceInstance.infinite.fromPreviousPart,
					fromPreviousPlayhead: pieceInstance.infinite.fromPreviousPlayhead,
			  })
			: undefined,
		piece: convertPieceToBlueprints(pieceInstance.piece),
	}

	return obj
}

/**
 * Convert a PieceInstance into IBlueprintPieceInstance, for passing into the blueprints
 * @param pieceInstance the PieceInstance to convert
 * @returns a cloned complete and clean IBlueprintPieceInstance
 */
export function convertPieceInstanceToBlueprints(pieceInstance: PieceInstance): IBlueprintPieceInstance {
	return convertPieceInstanceToBlueprintsInner(pieceInstance)
}

/**
 * Convert a ResolvedPieceInstance into IBlueprintResolvedPieceInstance, for passing into the blueprints
 * @param pieceInstance the ResolvedPieceInstance to convert
 * @returns a cloned complete and clean IBlueprintResolvedPieceInstance
 */
export function convertResolvedPieceInstanceToBlueprints(
	pieceInstance: ResolvedPieceInstance
): IBlueprintResolvedPieceInstance {
	const obj: Complete<IBlueprintResolvedPieceInstance> = {
		...convertPieceInstanceToBlueprintsInner(pieceInstance),
		resolvedStart: pieceInstance.resolvedStart,
		resolvedDuration: pieceInstance.resolvedDuration,
	}

	return obj
}

/**
 * Convert a DBPartInstance into IBlueprintPartInstance, for passing into the blueprints
 * @param partInstance the DBPartInstance to convert
 * @returns a cloned complete and clean IBlueprintPartInstance
 */
export function convertPartInstanceToBlueprints(partInstance: DBPartInstance): IBlueprintPartInstance {
	const obj: Complete<IBlueprintPartInstance> = {
		_id: unprotectString(partInstance._id),
		segmentId: unprotectString(partInstance.segmentId),
		part: convertPartToBlueprints(partInstance.part),
		rehearsal: partInstance.rehearsal,
		timings: clone(partInstance.timings),
		previousPartEndState: clone(partInstance.previousPartEndState),
		orphaned: partInstance.orphaned,
		blockTakeUntil: partInstance.blockTakeUntil,
	}

	return obj
}

function convertPieceGenericToBlueprintsInner(piece: PieceGeneric): Complete<IBlueprintPieceGeneric> {
	const obj: Complete<IBlueprintPieceGeneric> = {
		externalId: piece.externalId,
		name: piece.name,
		metaData: clone(piece.metaData),
		lifespan: piece.lifespan,
		sourceLayerId: piece.sourceLayerId,
		outputLayerId: piece.outputLayerId,
		transitions: clone(piece.transitions),
		prerollDuration: piece.prerollDuration,
		postrollDuration: piece.postrollDuration,
		toBeQueued: piece.toBeQueued,
		expectedPlayoutItems: clone(piece.expectedPlayoutItems),
		tags: clone(piece.tags),
		allowDirectPlay: clone<IBlueprintPieceDB['allowDirectPlay']>(piece.allowDirectPlay),
		expectedPackages: clone(piece.expectedPackages),
		hasSideEffects: piece.hasSideEffects,
		content: {
			...clone(piece.content),
			timelineObjects: deserializePieceTimelineObjectsBlob(piece.timelineObjectsString),
		},
	}

	return obj
}

/**
 * Convert a Piece into IBlueprintPieceDB, for passing into the blueprints
 * @param piece the Piece to convert
 * @returns a cloned complete and clean IBlueprintPieceDB
 */
export function convertPieceToBlueprints(piece: PieceInstancePiece): IBlueprintPieceDB {
	const obj: Complete<IBlueprintPieceDB> = {
		...convertPieceGenericToBlueprintsInner(piece),
		_id: unprotectString(piece._id),
		enable: clone(piece.enable),
		virtual: piece.virtual,
		continuesRefId: unprotectString(piece.continuesRefId),
		pieceType: piece.pieceType,
		extendOnHold: piece.extendOnHold,
		notInVision: piece.notInVision,
	}

	return obj
}

/**
 * Convert a DBPart into IBlueprintPartDB, for passing into the blueprints
 * @param part the Part to convert
 * @returns a cloned complete and clean IBlueprintPartDB
 */
export function convertPartToBlueprints(part: DBPart): IBlueprintPartDB {
	const obj: Complete<IBlueprintPartDB> = {
		_id: unprotectString(part._id),
		segmentId: unprotectString(part.segmentId),
		externalId: part.externalId,
		invalid: part.invalid,
		invalidReason: clone(part.invalidReason),
		untimed: part.untimed,
		floated: part.floated,
		gap: part.gap,
		title: part.title,
		metaData: clone(part.metaData),
		autoNext: part.autoNext,
		autoNextOverlap: part.autoNextOverlap,
		inTransition: clone(part.inTransition),
		disableNextInTransition: part.disableNextInTransition,
		outTransition: clone(part.outTransition),
		expectedDuration: part.expectedDuration,
		budgetDuration: part.budgetDuration,
		holdMode: part.holdMode,
		shouldNotifyCurrentPlayingPart: part.shouldNotifyCurrentPlayingPart,
		classes: clone(part.classes),
		classesForNext: clone(part.classesForNext),
		displayDurationGroup: part.displayDurationGroup,
		displayDuration: part.displayDuration,
		identifier: part.identifier,
		hackListenToMediaObjectUpdates: part.hackListenToMediaObjectUpdates,
	}

	return obj
}

/**
 * Convert a AdLibPiece into IBlueprintAdLibPieceDB, for passing into the blueprints
 * @param adLib the AdLibPiece to convert
 * @returns a cloned complete and clean IBlueprintAdLibPieceDB
 */
export function convertAdLibPieceToBlueprints(adLib: AdLibPiece): IBlueprintAdLibPieceDB {
	const obj: Complete<IBlueprintAdLibPieceDB> = {
		...convertPieceGenericToBlueprintsInner(adLib),
		_id: unprotectString(adLib._id),
		_rank: adLib._rank,
		invalid: adLib.invalid,
		expectedDuration: adLib.expectedDuration,
		floated: adLib.floated,
		currentPieceTags: clone(adLib.currentPieceTags),
		nextPieceTags: clone(adLib.nextPieceTags),
		uniquenessId: adLib.uniquenessId,
		invertOnAirState: adLib.invertOnAirState,
	}

	return obj
}

/**
 * Convert a AdLibAction into IBlueprintActionManifest, for passing into the blueprints
 * @param action the AdLibAction to convert
 * @returns a cloned complete and clean IBlueprintActionManifest
 */
export function convertAdLibActionToBlueprints(action: AdLibAction): IBlueprintActionManifest {
	const obj: Complete<IBlueprintActionManifest> = {
		externalId: action.externalId,
		actionId: action.actionId,
		userData: clone(action.userData),
		partId: unprotectString(action.partId),
		allVariants: action.allVariants,
		userDataManifest: clone(action.userDataManifest),
		display: clone(action.display), // TODO - type mismatch
		triggerModes: clone(action.triggerModes), // TODO - type mismatch
		expectedPlayoutItems: clone(action.expectedPlayoutItems),
		expectedPackages: clone(action.expectedPackages),
	}

	return obj
}

/**
 * Convert a DBSegment into IBlueprintSegmentDB, for passing into the blueprints
 * @param segment the DBSegment to convert
 * @returns a cloned complete and clean IBlueprintSegmentDB
 */
export function convertSegmentToBlueprints(segment: ReadonlyDeep<DBSegment>): IBlueprintSegmentDB {
	const obj: Complete<IBlueprintSegmentDB> = {
		_id: unprotectString(segment._id),
		name: segment.name,
		metaData: clone(segment.metaData),
		isHidden: segment.isHidden,
		identifier: segment.identifier,
		displayAs: segment.displayAs,
		showShelf: segment.showShelf,
	}

	return obj
}

/**
 * Convert a DBRundown into IBlueprintRundownDB, for passing into the blueprints
 * @param rundown the DBRundown to convert
 * @returns a cloned complete and clean IBlueprintRundownDB
 */
export function convertRundownToBlueprints(rundown: ReadonlyDeep<DBRundown>): IBlueprintRundownDB {
	const obj: Complete<IBlueprintRundownDB> = {
		externalId: rundown.externalId,
		name: rundown.name,
		description: rundown.description,
		timing: clone<RundownPlaylistTiming>(rundown.timing),
		metaData: clone(rundown.metaData),
		playlistExternalId: rundown.playlistExternalId,
		endOfRundownIsShowBreak: rundown.endOfRundownIsShowBreak,
		_id: unprotectString(rundown._id),
		showStyleVariantId: unprotectString(rundown.showStyleVariantId),
		playlistId: unprotectString(rundown.playlistId),
		airStatus: rundown.airStatus,
	}

	return obj
}

/**
 * Convert a DBShowStyleBase into IBlueprintShowStyleBase, for passing into the blueprints
 * @param showStyleBase the DBShowStyleBase to convert
 * @returns a cloned complete and clean IBlueprintShowStyleBase
 */
export function convertShowStyleBaseToBlueprints(
	showStyleBase: ReadonlyDeep<DBShowStyleBase>
): IBlueprintShowStyleBase {
	const obj: Complete<IBlueprintShowStyleBase> = {
		_id: unprotectString(showStyleBase._id),
		blueprintId: unprotectString(showStyleBase.blueprintId),
		outputLayers: clone<IOutputLayer[]>(showStyleBase.outputLayers),
		sourceLayers: clone<ISourceLayer[]>(showStyleBase.sourceLayers),
		blueprintConfig: clone<IBlueprintConfig>(showStyleBase.blueprintConfig),
	}

	return obj
}

/**
 * Convert a DBShowStyleVariant into IBlueprintShowStyleVariant, for passing into the blueprints
 * @param showStyleVariant the DBShowStyleVariant to convert
 * @returns a cloned complete and clean IBlueprintShowStyleVariant
 */
export function convertShowStyleVariantToBlueprints(
	showStyleVariant: ReadonlyDeep<DBShowStyleVariant>
): IBlueprintShowStyleVariant {
	const obj: Complete<IBlueprintShowStyleVariant> = {
		_id: unprotectString(showStyleVariant._id),
		name: showStyleVariant.name,
		blueprintConfig: clone<IBlueprintConfig>(showStyleVariant.blueprintConfig),
	}

	return obj
}
