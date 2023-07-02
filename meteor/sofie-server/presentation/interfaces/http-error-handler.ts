import { Response } from 'express'
import { Exception } from '../../model/exceptions/exception'

export interface HttpErrorHandler {
	handleError(response: Response, exception: Exception): void
}
