import { Logger } from '../logger'
import { Job } from './job'
import {
	AbortError,
	CommandReport,
	DeviceOptionsAny,
	DeviceOptionsAtem,
	DeviceStatus,
	DeviceType,
	MediaObject,
	SlowFulfilledCommandInfo,
	SlowSentCommandInfo,
	StatusCode,
} from 'timeline-state-resolver'
import { TSRHandler } from '../tsrHandler'
import { StatusObject } from '@sofie-automation/shared-lib/dist/peripheralDevice/peripheralDeviceAPI'
import _ = require('underscore')
import { CreateDeviceJobsResult } from './createDeviceJob'
import { disableAtemUpload } from '../config'
import { FinishedTrace, sendTrace } from '../influxdb'
import debug = require('debug')

export class InitDeviceJob extends Job<CreateDeviceJobsResult, undefined, CreateDeviceJobsResult> {
	protected artifacts: undefined
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

	async run(previousResult: CreateDeviceJobsResult, abortSignal?: AbortSignal): Promise<CreateDeviceJobsResult> {
		if (abortSignal?.aborted) {
			throw new AbortError()
		}

		const { deviceContainer, coreTsrHandler } = previousResult
		// Set up device status
		const deviceType = deviceContainer.deviceType

		const onDeviceStatusChanged = (connectedOrStatus: Partial<DeviceStatus>) => {
			let deviceStatus: Partial<StatusObject>
			if (_.isBoolean(connectedOrStatus)) {
				// for backwards compability, to be removed later
				if (connectedOrStatus) {
					deviceStatus = {
						statusCode: StatusCode.GOOD,
					}
				} else {
					deviceStatus = {
						statusCode: StatusCode.BAD,
						messages: ['Disconnected'],
					}
				}
			} else {
				deviceStatus = connectedOrStatus
			}
			coreTsrHandler.statusChanged(deviceStatus)

			// When the status has changed, the deviceName might have changed:
			deviceContainer.reloadProps().catch((error) => {
				this.logger.data(error).error(`Error in reloadProps:`)
			})
			// hack to make sure atem has media after restart
			if (
				(deviceStatus.statusCode === StatusCode.GOOD ||
					deviceStatus.statusCode === StatusCode.WARNING_MINOR ||
					deviceStatus.statusCode === StatusCode.WARNING_MAJOR) &&
				deviceType === DeviceType.ATEM &&
				!disableAtemUpload
			) {
				const assets = (this.deviceOptions as DeviceOptionsAtem).options?.mediaPoolAssets
				if (assets && assets.length > 0) {
					try {
						this.tsrHandler.uploadFilesToAtem(
							deviceContainer,
							assets.filter((asset) => _.isNumber(asset.position) && asset.path)
						)
					} catch (e) {
						// don't worry about it.
					}
				}
			}
		}
		const onSlowSentCommand = (info: SlowSentCommandInfo) => {
			// If the internalDelay is too large, it should be logged as an error,
			// since something took too long internally.

			if (info.internalDelay > 100) {
				this.logger.data(info).error(`slowSentCommand for ${deviceContainer.deviceName}.`)
			} else {
				this.logger.data(info).warn(`slowSentCommand for ${deviceContainer.deviceName}.`)
			}
		}
		const onSlowFulfilledCommand = (info: SlowFulfilledCommandInfo) => {
			// Note: we don't emit slow fulfilled commands as error, since
			// the fulfillment of them lies on the device being controlled, not on us.

			this.logger.data(info).warn(`slowFulfilledCommand for ${deviceContainer.deviceName}.`)
		}
		const onCommandReport = (commandReport: CommandReport) => {
			if (this.tsrHandler.reportAllCommands) {
				// Todo: send these to Core
				this.logger.data(commandReport).debug('commandReport')
			}
		}
		const onCommandError = (error: any, context: any) => {
			// todo: handle this better
			this.logger.data(error).error('Received command error from device.')
			this.logger.data(context).debug('Context for reported command error:')
		}
		const onUpdateMediaObject = (collectionId: string, docId: string, doc: MediaObject | null) => {
			coreTsrHandler.onUpdateMediaObject(collectionId, docId, doc)
		}
		const onClearMediaObjectCollection = (collectionId: string) => {
			coreTsrHandler.onClearMediaObjectCollection(collectionId)
		}
		const fixError = (e: any): string => {
			const deviceName = deviceContainer.deviceName || this.deviceId
			const name = `Device '${deviceName}' (${deviceContainer.instanceId})`
			if (e.reason) e.reason = name + ': ' + e.reason
			if (e.message) e.message = name + ': ' + e.message
			if (e.stack) {
				e.stack += '\nAt device' + name
			}
			if (_.isString(e)) e = name + ': ' + e

			return e
		}

		deviceContainer.onChildClose = () => {
			// Called if a child is closed / crashed
			this.logger.warn(`Child of device ${this.deviceId} closed/crashed`)
			debug(`Trigger update devices because '${this.deviceId}' process closed`)

			onDeviceStatusChanged({
				statusCode: StatusCode.BAD,
				messages: ['Child process closed'],
			})

			this.tsrHandler.onDeviceChildClosed(this.deviceId)
		}
		// Note for the future:
		// It is important that the callbacks returns void,
		// otherwise there might be problems with threadedclass!

		await deviceContainer.device.on('connectionChanged', onDeviceStatusChanged as () => void)
		await deviceContainer.device.on('slowSentCommand', onSlowSentCommand as () => void)
		await deviceContainer.device.on('slowFulfilledCommand', onSlowFulfilledCommand as () => void)
		await deviceContainer.device.on('commandError', onCommandError as () => void)
		await deviceContainer.device.on('commandReport', onCommandReport as () => void)
		await deviceContainer.device.on('updateMediaObject', onUpdateMediaObject as () => void)
		await deviceContainer.device.on('clearMediaObjects', onClearMediaObjectCollection as () => void)

		await deviceContainer.device.on('info', ((message: any, ...args: any[]) => {
			const deviceName = deviceContainer.deviceName || this.deviceId
			this.logger.data({ args }).info(`Received info from device '${deviceName}': ${fixError(message)}`)
		}) as () => void)

		await deviceContainer.device.on('warning', ((warn: any, ...args: any[]) => {
			const deviceName = deviceContainer.deviceName || this.deviceId
			this.logger.data({ args }).warn(`Received warning from device '${deviceName}': ${fixError(warn)}`)
		}) as () => void)

		await deviceContainer.device.on('error', ((e: any, ...args: any[]) => {
			const deviceName = deviceContainer.deviceName || this.deviceId
			this.logger.data({ args }).error(`Received error from device '${deviceName}': ${fixError(e)}`)
		}) as () => void)

		await deviceContainer.device.on('debug', (...args: any[]) => {
			const deviceName = deviceContainer.deviceName || this.deviceId
			if (!deviceContainer.debugLogging && !this.tsrHandler.coreHandler.logDebug) {
				return
			}
			if (args.length === 0) {
				this.logger.debug(`Received empty debug message from device '${deviceName}'.`)
				return
			}
			this.logger.data(args).debug(`Received debug from device '${deviceName}' (${deviceContainer.instanceId}):`)
		})

		await deviceContainer.device.on('timeTrace', ((trace: FinishedTrace) => sendTrace(trace)) as () => void)

		// now initialize it
		await this.tsrHandler.tsr.initDevice(this.deviceId, this.deviceOptions, undefined, { signal: abortSignal })

		onDeviceStatusChanged(await deviceContainer.device.getStatus())
		return previousResult
	}
}
