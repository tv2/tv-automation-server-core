import { Response } from 'express'
import { Exception } from '../model/exceptions/exception'
import { ErrorCode } from '../model/enums/error-code'
import { HttpStatusCode } from './http-status-code'
import { HttpErrorHandler } from './interfaces/http-error-handler'

export class ExpressErrorHandler implements HttpErrorHandler {
	public handleError(response: Response, exception: Exception): void {
		console.log(`Caught Exception: "${exception.errorCode}". Message: ${exception.message}`)
		console.log(exception.stack)

		response.status(this.getStatusCode(exception.errorCode)).send(`${exception.errorCode} - ${exception.message}`)
	}

	private getStatusCode(errorCode: ErrorCode): number {
		switch (errorCode) {
			case ErrorCode.NOT_ACTIVATED:
			case ErrorCode.ALREADY_ACTIVATED:
			case ErrorCode.END_OF_RUNDOWN:
			case ErrorCode.RUNDOWN_IS_ACTIVE:
			case ErrorCode.LAST_PART_IN_SEGMENT: {
				return HttpStatusCode.BAD_REQUEST
			}
			case ErrorCode.NOT_FOUND: {
				return HttpStatusCode.NOT_FOUND
			}
			case ErrorCode.MISCONFIGURATION:
			case ErrorCode.DELETION_FAILED: {
				return HttpStatusCode.INTERNAL_SERVER_ERROR
			}
			case ErrorCode.DATABASE_NOT_CONNECTED: {
				return HttpStatusCode.SERVICE_UNAVAILABLE
			}
			default: {
				return HttpStatusCode.INTERNAL_SERVER_ERROR
			}
		}
	}
}
