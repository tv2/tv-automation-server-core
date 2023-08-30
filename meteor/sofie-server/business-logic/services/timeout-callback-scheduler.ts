import { CallbackScheduler } from './interfaces/callback-scheduler'

export class TimeoutCallbackScheduler implements CallbackScheduler {
	private static instance: CallbackScheduler

	public static getInstance(): CallbackScheduler {
		if (!this.instance) {
			this.instance = new TimeoutCallbackScheduler()
		}
		return this.instance
	}

	private timeoutIdentifier?: NodeJS.Timeout

	private constructor() {
		return
	}

	public start(epochTimeToExecuteCallback: number, callback: () => void): void {
		const now: number = Date.now()
		const timeoutDuration: number = epochTimeToExecuteCallback - now
		if (timeoutDuration <= 0) {
			console.log(`### Skipping execution of callback. Point in time for execution is in the past!`)
			return
		}
		this.timeoutIdentifier = setTimeout(() => {
			this.timeoutIdentifier = undefined
			callback()
		}, timeoutDuration)
	}

	public stop(): void {
		if (this.timeoutIdentifier) {
			clearTimeout(this.timeoutIdentifier)
			this.timeoutIdentifier = undefined
		}
	}
}
