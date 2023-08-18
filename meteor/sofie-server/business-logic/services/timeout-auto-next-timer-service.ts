import { AutoNextTimerService } from './interfaces/auto-next-timer-service'

export class TimeoutAutoNextTimerService implements AutoNextTimerService {
	private static instance: AutoNextTimerService

	public static getInstance(): AutoNextTimerService {
		if (!this.instance) {
			this.instance = new TimeoutAutoNextTimerService()
		}
		return this.instance
	}

	private autoNextTimeoutIdentifier?: any

	// Disabling no-empty-function because we need to mark the constructor as private since it's a singleton.
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	private constructor() {}

	public start(pointInTimeToStop: number, callback: () => void): void {
		const now: number = Date.now()
		const timeoutDuration: number = pointInTimeToStop - now
		if (timeoutDuration <= 0) {
			console.log(`### Skipping autoNext timer. Point in time for callback is in the past!`)
			return
		}
		this.autoNextTimeoutIdentifier = setTimeout(() => {
			this.autoNextTimeoutIdentifier = undefined
			callback()
		}, timeoutDuration)
	}

	public stop(): void {
		if (this.autoNextTimeoutIdentifier) {
			clearTimeout(this.autoNextTimeoutIdentifier)
			this.autoNextTimeoutIdentifier = undefined
		}
	}
}
