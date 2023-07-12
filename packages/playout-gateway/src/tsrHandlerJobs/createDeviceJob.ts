import { CoreTSRDeviceHandler } from '../coreHandler'
import { Job } from './job'
import { AbortError, DeviceContainer, DeviceOptionsAny, StatusCode } from 'timeline-state-resolver'
import { TSRHandler } from '../tsrHandler'
import { Logger } from '../logger'

export interface CreateDeviceJobsResult {
	deviceContainer: DeviceContainer<DeviceOptionsAny>
	coreTsrHandler: CoreTSRDeviceHandler
}

export class CreateDeviceJob extends Job<CreateDeviceJobsResult, Partial<CreateDeviceJobsResult>> {
	protected artifacts: Partial<CreateDeviceJobsResult> = {}
	private readonly logger: Logger

	constructor(
		private deviceId: string,
		private deviceOptions: DeviceOptionsAny,
		private tsrHandler: TSRHandler,
		logger: Logger
	) {
		super()
		this.logger = logger.tag(this.constructor.name)
	}

	async run(_previousResult: unknown, abortSignal?: AbortSignal): Promise<CreateDeviceJobsResult> {
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

		const coreTsrHandler = new CoreTSRDeviceHandler(this.artifacts.deviceContainer, this.tsrHandler, this.logger)
		this.artifacts.coreTsrHandler = coreTsrHandler
		// set the status to uninitialized for now:
		coreTsrHandler.statusChanged({
			statusCode: StatusCode.UNKNOWN,
			messages: ['Device initialising...'],
		})

		return { deviceContainer: device, coreTsrHandler }
	}

	async cleanup(): Promise<void> {
		if (this.artifacts.coreTsrHandler) {
			await this.artifacts.coreTsrHandler.disposeUnexpectedly()
		} else if (this.artifacts.deviceContainer) {
			await this.tsrHandler.tsr.removeDevice(this.deviceId)
		}
	}
}
