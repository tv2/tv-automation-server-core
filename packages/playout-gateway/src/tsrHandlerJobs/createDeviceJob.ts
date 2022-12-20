import { CoreTSRDeviceHandler } from '../coreHandler'
import { Job } from './job'
import { AbortError, DeviceContainer, DeviceOptionsAny, StatusCode } from 'timeline-state-resolver'
import { TSRHandler } from '../tsrHandler'

export interface CreateDeviceJobsResult {
	deviceContainer: DeviceContainer<DeviceOptionsAny>
	coreTsrHandler: CoreTSRDeviceHandler
}

export class CreateDeviceJob extends Job<CreateDeviceJobsResult, any, Partial<CreateDeviceJobsResult>> {
	protected artifacts: Partial<CreateDeviceJobsResult> = {}

	constructor(private deviceId: string, private deviceOptions: DeviceOptionsAny, private tsrHandler: TSRHandler) {
		super()
	}
	async run(_previousResult?: undefined, abortSignal?: AbortSignal): Promise<CreateDeviceJobsResult> {
		if (abortSignal?.aborted) {
			throw new AbortError()
		}

		const device = await this.tsrHandler.tsr.createDevice(this.deviceId, this.deviceOptions, {
			signal: abortSignal,
		})
		this.artifacts.deviceContainer = device

		if (abortSignal?.aborted) {
			throw new AbortError()
		}

		const coreTsrHandler = new CoreTSRDeviceHandler(this.artifacts.deviceContainer, this.deviceId, this.tsrHandler)
		this.artifacts.coreTsrHandler = coreTsrHandler
		// set the status to uninitialized for now:
		coreTsrHandler.statusChanged({
			statusCode: StatusCode.BAD,
			messages: ['Device initialising...'],
		})

		return { deviceContainer: device, coreTsrHandler }
	}
	async cleanup(): Promise<void> {
		if (this.artifacts.coreTsrHandler) {
			await this.artifacts.coreTsrHandler.dispose(false)
		} else if (this.artifacts.deviceContainer) {
			await this.tsrHandler.tsr.removeDevice(this.deviceId)
		}
	}
}
