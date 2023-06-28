import { Exception } from './exception'
import { ErrorCode } from '../enums/error-code'

export class DatabaseNotConnectedException extends Exception {
	constructor(message?: string) {
		super(ErrorCode.DATABASE_NOT_CONNECTED, message)
	}
}
