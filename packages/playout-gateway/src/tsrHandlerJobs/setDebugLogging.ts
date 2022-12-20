import { Job } from './job'
import { Conductor } from 'timeline-state-resolver'

export class SetDebugLoggingJob extends Job<void, void, undefined> {
	protected artifacts: undefined

	constructor(private deviceId: string, private conductor: Conductor, private debugLogging: boolean) {
		super()
	}
	async run(): Promise<void> {
		const deviceContainer = this.conductor.getDevice(this.deviceId)
		if (!deviceContainer) {
			throw new Error(`Device "${this.deviceId}" does not exist or is not initialized`)
		}
		await deviceContainer.setDebugLogging(this.debugLogging)
	}
}
