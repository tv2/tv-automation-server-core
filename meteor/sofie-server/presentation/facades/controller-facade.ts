import { RundownController } from '../controllers/rundown-controller'
import { ServiceFacade } from '../../business-logic/facades/service-facade'
import { RepositoryFacade } from '../../data-access/facades/repository-facade'
import { ExpressErrorHandler } from '../express-error-handler'

export class ControllerFacade {
	public static createRundownController(): RundownController {
		return new RundownController(
			ServiceFacade.createRundownService(),
			RepositoryFacade.createRundownRepository(),
			RepositoryFacade.createAdLibRepository(),
			new ExpressErrorHandler()
		)
	}
}
