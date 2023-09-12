import { PartEndState } from './part-end-state'
import { Part } from '../entities/part'
import { RundownPersistentState } from './rundown-persistent-state'
import { Timeline } from '../entities/timeline'
import { Studio } from '../entities/studio'
import { ShowStyle } from '../entities/show-style'

export interface Blueprint extends BlueprintOnTimelineGenerate, BlueprintGetEndStateForPart {}

export interface BlueprintOnTimelineGenerate {
	onTimelineGenerate(
		studio: Studio,
		showStyle: ShowStyle,
		previousRundownPersistentState: RundownPersistentState,
		activePart: Part,
		previousPart: Part | undefined,
		timeline: Timeline
	): {
		timeline: Timeline
		rundownPersistentState: RundownPersistentState
	}
}

export interface BlueprintGetEndStateForPart {
	getEndStateForPart(
		part: Part,
		previousPart: Part | undefined,
		time: number,
		rundownPersistentState?: RundownPersistentState
	): PartEndState
}
