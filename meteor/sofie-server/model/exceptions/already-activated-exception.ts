import { Exception } from './exception'
import { ErrorCode } from '../enums/error-code'

export class AlreadyActivatedException extends Exception {
	constructor(message?: string) {
		super(ErrorCode.ALREADY_ACTIVATED, message)
	}
}
