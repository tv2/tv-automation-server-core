import { RundownController } from '../controllers/rundown-controller'
import { ServiceFacade } from '../../business-logic/facades/service-facade'
import { RepositoryFacade } from '../../data-access/facades/repository-facade'

export class ControllerFacade {
	static createRundownController(): RundownController {
		return new RundownController(
			ServiceFacade.createRundownService(),
			RepositoryFacade.createRundownRepository()
		)
	}
}
