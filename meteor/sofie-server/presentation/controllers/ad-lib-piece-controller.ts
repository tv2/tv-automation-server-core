import { BaseController, GetRequest, PutRequest, RestController } from './base-controller'
import { Request, Response } from 'express'
import { Identifier } from '../../model/interfaces/identifier'
import { Exception } from '../../model/exceptions/exception'
import { AdLibPieceRepository } from '../../data-access/repositories/interfaces/ad-lib-piece-repository'
import { HttpErrorHandler } from '../interfaces/http-error-handler'
import { RundownService } from '../../business-logic/services/interfaces/rundown-service'

@RestController('/adLibPieces')
export class AdLibPieceController extends BaseController {

	private rundownService: RundownService
	private adLibRepository: AdLibPieceRepository
	private httpErrorHandler: HttpErrorHandler

	constructor(
		rundownService: RundownService,
		adLibPieceRepository: AdLibPieceRepository,
		httpErrorHandler: HttpErrorHandler
	) {
		super()
		this.rundownService = rundownService
		this.adLibRepository = adLibPieceRepository
		this.httpErrorHandler = httpErrorHandler
	}

	@GetRequest('/rundowns/:rundownId')
	public async getAdLibPiecesForRundown(reg: Request, res: Response): Promise<void> {
		try {
			const rundownId: string = reg.params.rundownId
			const identifiers: Identifier[] = await this.adLibRepository.getAdLibPieceIdentifiers(rundownId)
			res.send(identifiers)
		} catch (error) {
			this.httpErrorHandler.handleError(res, error as Exception)
		}
	}

	@PutRequest('/:adLibPieceId/rundowns/:rundownId')
	public async executeAdLibPiece(reg: Request, res: Response): Promise<void> {
		try {
			const rundownId: string = reg.params.rundownId
			const adLibId: string = reg.params.adLibPieceId
			await this.rundownService.executeAdLibPiece(rundownId, adLibId)
			res.send(`Successfully executed AdLib ${adLibId} on Rundown ${rundownId}`)
		} catch (error) {
			this.httpErrorHandler.handleError(res, error as Exception)
		}
	}
}
