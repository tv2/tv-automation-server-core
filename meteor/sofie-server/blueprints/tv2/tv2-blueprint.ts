import { Blueprint } from '../../model/value-objects/blueprint'
import { RundownPersistentState } from '../../model/value-objects/rundown-persistent-state'
import { Part } from '../../model/entities/part'
import { PartEndState } from '../../model/value-objects/part-end-state'
import { Tv2EndStateForPartCalculator } from './tv2-end-state-for-part-calculator'
import { ShowStyle } from '../../model/entities/show-style'
import { Timeline } from '../../model/entities/timeline'
import { Studio } from '../../model/entities/studio'
import { Tv2OnTimelineGenerateCalculator } from './tv2-on-timeline-generate-calculator'

export class Tv2Blueprint implements Blueprint {
	constructor(
		private endStateForPartCalculator: Tv2EndStateForPartCalculator,
		private onTimelineGenerateCalculator: Tv2OnTimelineGenerateCalculator
	) {}

	public getEndStateForPart(
		part: Part,
		previousPart: Part,
		time: number,
		rundownPersistentState?: RundownPersistentState
	): PartEndState {
		return this.endStateForPartCalculator.getEndStateForPart(part, previousPart, time, rundownPersistentState)
	}

	public onTimelineGenerate(
		studio: Studio,
		showStyle: ShowStyle,
		previousRundownPersistentState: RundownPersistentState,
		currentPart: Part,
		previousPart: Part,
		timeline: Timeline
	): {
		timeline: Timeline
		rundownPersistentState: RundownPersistentState
	} {
		return this.onTimelineGenerateCalculator.onTimelineGenerate(
			studio,
			showStyle,
			previousRundownPersistentState,
			currentPart,
			previousPart,
			timeline
		)
	}
}
