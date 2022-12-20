import { CoreTSRDeviceHandler } from '../coreHandler'
import { Logger } from 'winston'
import { Job } from './job'

export class RemoveDeviceJob extends Job<void, any, undefined> {
	protected artifacts: undefined

	constructor(
		private deviceId: string,
		private coreTsrHandlers: { [deviceId: string]: CoreTSRDeviceHandler },
		private expected: boolean,
		private logger: Logger
	) {
		super()
	}
	async run(): Promise<void> {
		if (this.coreTsrHandlers[this.deviceId]) {
			try {
				await this.coreTsrHandlers[this.deviceId].dispose(this.expected)
				this.logger.debug('Disposed device ' + this.deviceId)
			} catch (error) {
				this.logger.error(`Error when removing device "${this.deviceId}"`, { data: error })
			} finally {
				delete this.coreTsrHandlers[this.deviceId]
			}
		}
	}
}
