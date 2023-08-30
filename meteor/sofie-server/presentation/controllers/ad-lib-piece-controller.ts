import { BaseController, GetRequest, PutRequest, RestController } from './base-controller'
import { Request, Response } from 'express'
import { Identifier } from '../../model/value-objects/identifier'
import { Exception } from '../../model/exceptions/exception'
import { AdLibPieceRepository } from '../../data-access/repositories/interfaces/ad-lib-piece-repository'
import { HttpErrorHandler } from '../interfaces/http-error-handler'
import { RundownService } from '../../business-logic/services/interfaces/rundown-service'

@RestController('/adLibPieces')
export class AdLibPieceController extends BaseController {
	constructor(
		private rundownService: RundownService,
		private adLibPieceRepository: AdLibPieceRepository,
		private httpErrorHandler: HttpErrorHandler
	) {
		super()
	}

	@GetRequest('/rundowns/:rundownId')
	public async getAdLibPiecesForRundown(reg: Request, res: Response): Promise<void> {
		try {
			const rundownId: string = reg.params.rundownId
			const identifiers: Identifier[] = await this.adLibPieceRepository.getAdLibPieceIdentifiers(rundownId)
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
