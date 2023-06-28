import { Exception } from './exception'
import { ErrorCode } from '../enums/error-code'

export class MisconfigurationException extends Exception {
	constructor(message?: string) {
		super(ErrorCode.MISCONFIGURATION, message)
	}
}
