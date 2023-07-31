import { Request, Response } from 'express'
import { BaseController, GetRequest, PutRequest, RestController } from './base-controller'
import { RundownService } from '../../business-logic/services/interfaces/rundown-service'
import { RundownRepository } from '../../data-access/repositories/interfaces/rundown-repository'
import { Rundown } from '../../model/entities/rundown'
import { RundownDto } from '../dtos/rundown-dto'
import { Exception } from '../../model/exceptions/exception'
import { Identifier } from '../../model/interfaces/identifier'
import { HttpErrorHandler } from '../interfaces/http-error-handler'

@RestController('/rundowns')
export class RundownController extends BaseController {

	private rundownService: RundownService
	private rundownRepository: RundownRepository
	private httpErrorHandler: HttpErrorHandler

	constructor(
		rundownService: RundownService,
		rundownRepository: RundownRepository,
		httpErrorHandler: HttpErrorHandler
	) {
		super()
		this.rundownService = rundownService
		this.rundownRepository = rundownRepository
		this.httpErrorHandler = httpErrorHandler
	}

	@GetRequest('/identifiers')
	public async getRundownIdentifiers(_reg: Request, res: Response): Promise<void> {
		try {
			const rundownIdentifiers: Identifier[] = await this.rundownRepository.getRundownIdentifiers()
			res.send(rundownIdentifiers)
		} catch (error) {
			this.httpErrorHandler.handleError(res, error as Exception)
		}
	}

	@GetRequest('/:rundownId')
	public async getRundown(reg: Request, res: Response): Promise<void> {
		try {
			const rundownId: string = reg.params.rundownId
			const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
			res.send(new RundownDto(rundown))
		} catch (error) {
			this.httpErrorHandler.handleError(res, error as Exception)
		}
	}

	@PutRequest('/:rundownId/activate')
	public async activate(reg: Request, res: Response): Promise<void> {
		try {
			const rundownId: string = reg.params.rundownId
			await this.rundownService.activateRundown(rundownId)
			res.send(`Rundown "${rundownId}" successfully activated`)
		} catch (error) {
			this.httpErrorHandler.handleError(res, error as Exception)
		}
	}

	@PutRequest('/:rundownId/deactivate')
	public async deactivate(reg: Request, res: Response): Promise<void> {
		try {
			const rundownId: string = reg.params.rundownId
			await this.rundownService.deactivateRundown(rundownId)
			res.send(`Rundown "${rundownId}" successfully deactivated`)
		} catch (error) {
			this.httpErrorHandler.handleError(res, error as Exception)
		}
	}

	@PutRequest('/:rundownId/takeNext')
	public async takeNext(reg: Request, res: Response): Promise<void> {
		try {
			const rundownId: string = reg.params.rundownId
			await this.rundownService.takeNext(rundownId)
			res.send(`Rundown "${rundownId}" successfully took next`)
		} catch (error) {
			this.httpErrorHandler.handleError(res, error as Exception)
		}
	}

	@PutRequest('/:rundownId/segments/:segmentId/parts/:partId/setNext')
	public async setNext(reg: Request, res: Response): Promise<void> {
		try {
			const rundownId: string = reg.params.rundownId
			const segmentId: string = reg.params.segmentId
			const partId: string = reg.params.partId
			await this.rundownService.setNext(rundownId, segmentId, partId)
			res.send(`Part "${partId}" is now set as next`)
		} catch (error) {
			this.httpErrorHandler.handleError(res, error as Exception)
		}
	}

	@PutRequest('/:rundownId/reset')
	public async resetRundown(reg: Request, res: Response): Promise<void> {
		try {
			const rundownId: string = reg.params.rundownId
			await this.rundownService.resetRundown(rundownId)
			res.send(`Rundown "${rundownId}" has been reset`)
		} catch (error) {
			this.httpErrorHandler.handleError(res, error as Exception)
		}
	}
}
