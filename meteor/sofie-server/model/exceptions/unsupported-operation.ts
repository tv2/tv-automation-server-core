import { Exception } from './exception'
import { ErrorCode } from '../enums/error-code'

export class UnsupportedOperation extends Exception {
	constructor(message: string) {
		super(ErrorCode.UNSUPPORTED_OPERATION, message)
	}
}
