import { Request, Response } from 'express'
import { BaseController, GetRequest, PutRequest, RestController } from './base-controller'
import { RundownService } from '../../business-logic/services/interfaces/rundown-service'
import { RundownRepository } from '../../data-access/repositories/interfaces/rundown-repository'
import { Rundown } from '../../model/entities/rundown'
import { RundownDto } from '../dtos/rundown-dto'
import { Exception } from '../../model/exceptions/exception'

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
	async activate(reg: Request, res: Response): Promise<void> {
		const rundownId: string = reg.params.rundownId
		try {
			await this.rundownService.activateRundown(rundownId)
			res.send(`Rundown "${rundownId}" successfully activated`)
		} catch (error) {
			this.handleError(res, error as Exception)
		}
	}

	handleError(res: Response, exception: Exception) {
		console.log(`Caught Exception: "${exception.errorCode}". Message: ${exception.message}`)
		console.log(exception.stack)

		res.status(500).send(`${exception.errorCode} - ${exception.message}`)
	}

	@PutRequest('/:rundownId/deactivate')
	async deactivate(reg: Request, res: Response): Promise<void> {
		const rundownId: string = reg.params.rundownId
		try {
			await this.rundownService.deactivateRundown(rundownId)
			res.send(`Rundown "${rundownId}" successfully deactivated`)
		} catch (error) {
			this.handleError(res, error as Exception)
		}
	}

	@PutRequest('/:rundownId/takeNext')
	async takeNext(reg: Request, res: Response): Promise<void> {
		const rundownId: string = reg.params.rundownId
		try {
			await this.rundownService.takeNext(rundownId)
			res.send(`Rundown "${rundownId}" successfully took next`)
		} catch (error) {
			this.handleError(res, error as Exception)
		}
	}

	@PutRequest('/:rundownId/segments/:segmentId/parts/:partId/setNext')
	async setNext(reg: Request, res: Response): Promise<void> {
		const rundownId: string = reg.params.rundownId
		const segmentId: string = reg.params.segmentId
		const partId: string = reg.params.partId

		try {
			await this.rundownService.setNext(rundownId, segmentId, partId)
			res.send(`Part "${partId}" is now set as next`)
		} catch (error) {
			this.handleError(res, error as Exception)
		}
	}

	@PutRequest('/:rundownId/reset')
	async resetRundown(reg: Request, res: Response): Promise<void> {
		const rundownId: string = reg.params.rundownId
		try {
			await this.rundownService.resetRundown(rundownId)
			res.send(`Rundown "${rundownId}" has been reset`)
		} catch (error) {
			this.handleError(res, error as Exception)
		}
	}
}
