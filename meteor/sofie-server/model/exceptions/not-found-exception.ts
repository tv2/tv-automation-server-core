import { Exception } from './exception'
import { ErrorCode } from '../enums/error-code'

export class NotFoundException extends Exception {
	constructor(message?: string) {
		super(ErrorCode.NOT_FOUND, message)
	}
}
