import { JsonFormat, Log } from '@tv2media/logger'

export class CustomJsonFormat extends JsonFormat {
	constructor() {
		super({ isPretty: false })
	}

	apply(log: Log): string {
		log.message = this.ensureStringMessage(log.message)
		return super.apply(log)
	}

	private ensureStringMessage(message: unknown): string {
		if (typeof message === 'string') {
			return message
		}
		if (message instanceof Error) {
			return message.stack ?? message.message
		}
		return JSON.stringify(message)
	}
}
