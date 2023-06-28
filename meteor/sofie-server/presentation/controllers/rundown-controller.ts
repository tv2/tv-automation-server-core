import { Request, Response } from 'express'
import { BaseController, GetRequest, PutRequest, RestController } from './base-controller'
import { RundownService } from '../../business-logic/services/interfaces/rundown-service'
import { RundownRepository } from '../../data-access/repositories/interfaces/rundown-repository'
import { Rundown } from '../../model/entities/rundown'
import { RundownDto } from '../dtos/rundown-dto'

@RestController('/rundowns')
export class RundownController extends BaseController {

	private rundownService: RundownService
	private rundownRepository: RundownRepository

	constructor(rundownService: RundownService, rundownRepository: RundownRepository) {
		super()
		this.rundownService = rundownService
		this.rundownRepository = rundownRepository
	}

	@GetRequest()
	async getRundowns(_reg: Request, res: Response): Promise<void> {
		const rundowns: Rundown[] = await this.rundownRepository.getRundowns()
		res.send(rundowns.map(rundown => new RundownDto(rundown)))
	}

	@GetRequest('/:rundownId')
	async getRundown(reg: Request, res: Response): Promise<void> {
		const rundownId: string = reg.params.rundownId
		const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
		res.send(new RundownDto(rundown))
	}

	@PutRequest('/:rundownId/activate')
	activate(reg: Request, res: Response): void {
		const rundownId: string = reg.params.rundownId
		this.rundownService.activateRundown(rundownId)
		res.send()
	}

	@PutRequest('/:rundownId/takeNext')
	takeNext(reg: Request, res: Response): void {
		const rundownId: string = reg.params.rundownId
		this.rundownService.takeNext(rundownId)
		res.send()
	}

	@PutRequest('/:rundownId/parts/:partId/setNext')
	setNext(reg: Request, res: Response): void {
		const rundownId: string = reg.params.rundownId
		const partId: string = reg.params.partId
		this.rundownService.setNext(rundownId, partId)
		res.send()
	}

	@PutRequest('/:rundownId/reset')
	resetRundown(reg: Request, res: Response): void {
		const rundownId: string = reg.params.rundownId
		this.rundownService.resetRundown(rundownId)
		res.send()
	}
}
