import { Request, Response } from 'express'
import { BaseController, GetRequest, Path, PutRequest } from './base-controller'
import { RundownService } from '../../business-logic/services/rundown-service-interface'

@Path('/rundowns')
export class RundownController extends BaseController {

	private rundownService: RundownService

	constructor(rundownService: RundownService) {
		super()
		this.rundownService = rundownService
	}

	@GetRequest()
	test(_reg: Request, res: Response): void {
		res.send('Hello World from RundownController')
	}

	@PutRequest('/:rundownId/doTake')
	doTake(reg: Request, res: Response): void {
		const rundownId: string = reg.params.rundownId
		// TODO: Validate input
		this.rundownService.doTake(rundownId)
		res.send()
	}
}
