import { RundownController } from './rundown-controller'
import { ServiceFacade } from '../../business-logic/services/service-facade'

export class ControllerFacade {
	static createRundownController(): RundownController {
		return new RundownController(ServiceFacade.createRundownService())
	}
}
