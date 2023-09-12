import { Blueprint } from '../../model/value-objects/blueprint'
import { Tv2Blueprint } from './tv2-blueprint'
import { Tv2EndStateForPartCalculator } from './tv2-end-state-for-part-calculator'
import { Tv2SisyfosPersistentLayerFinder } from './helpers/tv2-sisyfos-persistent-layer-finder'
import { Tv2OnTimelineGenerateCalculator } from './tv2-on-timeline-generate-calculator'

export class Tv2BlueprintsFacade {
	public static createBlueprint(): Blueprint {
		return new Tv2Blueprint(
			new Tv2EndStateForPartCalculator(new Tv2SisyfosPersistentLayerFinder()),
			new Tv2OnTimelineGenerateCalculator(new Tv2SisyfosPersistentLayerFinder())
		)
	}
}
