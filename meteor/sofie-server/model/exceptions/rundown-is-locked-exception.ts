import { Exception } from './exception'
import { ErrorCode } from '../enums/error-code'

export class RundownIsLockedException extends Exception {

	constructor(message?: string) {
		super(ErrorCode.RUNDOWN_IS_LOCKED, message)
	}
}
