import { Blueprint } from '../model/value-objects/blueprint'
import { Tv2BlueprintsFacade } from './tv2/tv2-blueprints-facade'

/*
 ATTENTION: The Blueprints layer is NOT allowed to know anything from the rest of SofieServer except from the Model layer.
 If you find your self calling Facades from the other layers to instantiate your Blueprint then you are doing something wrong!
 The quickest way to assert you are not violating this contract is to ensure that your Blueprint don't have any imports from any of the other layers.

 Vice versa, the other layers are only allowed to know about the BlueprintsFacade from this layer, and it should only ever be the Facades of the other layers that calls it.
 */
export class BlueprintsFacade {
	public static createBlueprint(): Blueprint {
		return Tv2BlueprintsFacade.createBlueprint()
	}
}
