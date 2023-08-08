import { ErrorCode } from '../enums/error-code'
import { Exception } from './exception'

export class RundownActiveException extends Exception {
	constructor(message?: string) {
		super(ErrorCode.RUNDOWN_IS_ACTIVE, message)
	}
}
