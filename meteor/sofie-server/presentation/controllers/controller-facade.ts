import { RundownController } from './rundown-controller'
import { ServiceFacade } from '../../business-logic/services/service-facade'
import { RepositoryFacade } from '../../data-access/repositories/repository-facade'

export class ControllerFacade {
	static createRundownController(): RundownController {
		return new RundownController(
			ServiceFacade.createRundownService(),
			RepositoryFacade.createRundownRepository()
		)
	}
}
