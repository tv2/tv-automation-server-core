import { ErrorCode } from '../enums/error-code'
import { Exception } from './exception'

export class DeletionFailedException extends Exception {
	constructor(message: string) {
		super(ErrorCode.DELETION_FAILED, message)
	}
}
