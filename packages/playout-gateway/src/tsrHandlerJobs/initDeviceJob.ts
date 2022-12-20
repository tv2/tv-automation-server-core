import { Logger } from 'winston'
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

export class InitDeviceJob extends Job<CreateDeviceJobsResult, CreateDeviceJobsResult, undefined> {
	protected artifacts: undefined

	constructor(
		private deviceId: string,
		private deviceOptions: DeviceOptionsAny,
		private tsrHandler: TSRHandler,
		private logger: Logger
	) {
		super()
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
			deviceContainer.reloadProps().catch((err) => {
				this.logger.error(`Error in reloadProps: ${err}`)
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
				this.logger.error('slowSentCommand', {
					deviceName: deviceContainer.deviceName,
					...info,
				})
			} else {
				this.logger.warn('slowSentCommand', {
					deviceName: deviceContainer.deviceName,
					...info,
				})
			}
		}
		const onSlowFulfilledCommand = (info: SlowFulfilledCommandInfo) => {
			// Note: we don't emit slow fulfilled commands as error, since
			// the fulfillment of them lies on the device being controlled, not on us.

			this.logger.warn('slowFulfilledCommand', {
				deviceName: deviceContainer.deviceName,
				...info,
			})
		}
		const onCommandReport = (commandReport: CommandReport) => {
			if (this.tsrHandler.reportAllCommands) {
				// Todo: send these to Core
				this.logger.info('commandReport', {
					commandReport: commandReport,
				})
			}
		}
		const onCommandError = (error: any, context: any) => {
			// todo: handle this better
			this.logger.error(error)
			this.logger.debug(context)
		}
		const onUpdateMediaObject = (collectionId: string, docId: string, doc: MediaObject | null) => {
			coreTsrHandler.onUpdateMediaObject(collectionId, docId, doc)
		}
		const onClearMediaObjectCollection = (collectionId: string) => {
			coreTsrHandler.onClearMediaObjectCollection(collectionId)
		}
		const fixError = (e: any): string => {
			const name = `Device "${deviceContainer.deviceName || this.deviceId}" (${deviceContainer.instanceId})`
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
			debug(`Trigger update devices because "${this.deviceId}" process closed`)

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
		// await device.device.on('slowCommand', onSlowCommand)
		await deviceContainer.device.on('slowSentCommand', onSlowSentCommand as () => void)
		await deviceContainer.device.on('slowFulfilledCommand', onSlowFulfilledCommand as () => void)
		await deviceContainer.device.on('commandError', onCommandError as () => void)
		await deviceContainer.device.on('commandReport', onCommandReport as () => void)
		await deviceContainer.device.on('updateMediaObject', onUpdateMediaObject as () => void)
		await deviceContainer.device.on('clearMediaObjects', onClearMediaObjectCollection as () => void)

		await deviceContainer.device.on('info', ((e: any, ...args: any[]) => {
			this.logger.info(fixError(e), ...args)
		}) as () => void)
		await deviceContainer.device.on('warning', ((e: any, ...args: any[]) => {
			this.logger.warn(fixError(e), ...args)
		}) as () => void)
		await deviceContainer.device.on('error', ((e: any, ...args: any[]) => {
			this.logger.error(fixError(e), ...args)
		}) as () => void)

		await deviceContainer.device.on('debug', (...args: any[]) => {
			if (!deviceContainer.debugLogging && !this.tsrHandler.coreHandler.logDebug) {
				return
			}
			if (args.length === 0) {
				this.logger.debug('>empty message<')
				return
			}
			const data = args.map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : arg))
			this.logger.debug(
				`Device "${deviceContainer.deviceName || this.deviceId}" (${deviceContainer.instanceId})`,
				{ data }
			)
		})

		await deviceContainer.device.on('timeTrace', ((trace: FinishedTrace) => sendTrace(trace)) as () => void)

		// now initialize it
		await this.tsrHandler.tsr.initDevice(this.deviceId, this.deviceOptions, undefined, { signal: abortSignal })

		onDeviceStatusChanged(await deviceContainer.device.getStatus())
		return previousResult
	}
}
