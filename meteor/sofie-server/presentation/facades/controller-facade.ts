import { RundownController } from '../controllers/rundown-controller'
import { ServiceFacade } from '../../business-logic/facades/service-facade'
import { RepositoryFacade } from '../../data-access/facades/repository-facade'
import { ExpressErrorHandler } from '../express-error-handler'
import { AdLibPieceController } from '../controllers/ad-lib-piece-controller'
import { BaseController } from '../controllers/base-controller'

export class ControllerFacade {
	public static getControllers(): BaseController[] {
		return [this.createRundownController(), this.createAdLibPieceController()]
	}

	private static createRundownController(): RundownController {
		return new RundownController(
			ServiceFacade.createRundownService(),
			RepositoryFacade.createRundownRepository(),
			new ExpressErrorHandler()
		)
	}

	private static createAdLibPieceController(): AdLibPieceController {
		return new AdLibPieceController(
			ServiceFacade.createRundownService(),
			RepositoryFacade.createAdLibRepository(),
			new ExpressErrorHandler()
		)
	}
}
