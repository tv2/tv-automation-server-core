import { CoreTSRDeviceHandler } from '../coreHandler'
import { Logger } from '../logger'
import { Job } from './job'

export class RemoveDeviceJob extends Job<void> {
	protected artifacts: undefined
	private readonly logger: Logger

	constructor(
		private deviceId: string,
		private coreTsrHandlers: { [deviceId: string]: CoreTSRDeviceHandler },
		private expected: boolean,
		logger: Logger
	) {
		super()
		this.logger = logger.tag(this.constructor.name)
	}

	async run(): Promise<void> {
		if (!this.coreTsrHandlers[this.deviceId]) {
			return
		}
		try {
			if (this.expected) {
				await this.coreTsrHandlers[this.deviceId].disposeExpectedly()
			} else {
				await this.coreTsrHandlers[this.deviceId].disposeUnexpectedly()
			}
			this.logger.debug(`Disposed device '${this.deviceId}'`)
		} catch (error) {
			this.logger.data(error).error(`Error when removing device '${this.deviceId}'`)
		} finally {
			delete this.coreTsrHandlers[this.deviceId]
		}
	}
}
