import { Exception } from './exception'
import { ErrorCode } from '../enums/error-code'

export class LastPartInSegmentException extends Exception {
	constructor() {
		super(ErrorCode.LAST_PART_IN_SEGMENT)
	}
}
