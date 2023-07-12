import {
	CoreConnection,
	CoreOptions,
	DDPConnectorOptions,
	CollectionObj,
} from '@sofie-automation/server-core-integration'

import {
	DeviceType,
	CasparCGDevice,
	DeviceContainer,
	HyperdeckDevice,
	QuantelDevice,
	MediaObject,
	DeviceOptionsAny,
} from 'timeline-state-resolver'

import { DeviceConfig } from './connector'
import { TSRHandler } from './tsrHandler'
import { Logger, Level } from './logger'
// eslint-disable-next-line node/no-extraneous-import
import { ThreadedClass, MemUsageReport as ThreadMemUsageReport } from 'threadedclass'
import { Process } from './process'
import { PLAYOUT_DEVICE_CONFIG } from './configManifest'
import {
	PeripheralDeviceCategory,
	PeripheralDeviceType,
	PERIPHERAL_SUBTYPE_PROCESS,
	StatusObject,
} from '@sofie-automation/shared-lib/dist/peripheralDevice/peripheralDeviceAPI'
import { protectString } from '@sofie-automation/shared-lib/dist/lib/protectedString'
import { PeripheralDeviceId } from '@sofie-automation/shared-lib/dist/core/model/Ids'
import { PeripheralDeviceAPIMethods } from '@sofie-automation/shared-lib/dist/peripheralDevice/methodsAPI'
import { StatusCode } from '@sofie-automation/shared-lib/dist/lib/status'

export interface CoreConfig {
	host: string
	port: number
	watchdog: boolean
}
export interface PeripheralDeviceCommand {
	_id: string

	deviceId: PeripheralDeviceId
	functionName: string
	args: Array<any>

	hasReply: boolean
	reply?: any
	replyError?: any

	time: number // time
}

export interface MemoryUsageReport {
	main: number
	threads: { [childId: string]: ThreadMemUsageReport }
}

/**
 * Represents a connection between the Gateway and Core
 */
export class CoreHandler {
	core!: CoreConnection
	public readonly logger: Logger
	public _observers: Array<any> = []
	public deviceSettings: { [key: string]: any } = {}

	public errorReporting = false
	public multithreading = false
	public reportAllCommands = false

	private _deviceOptions: DeviceConfig
	private _onConnected?: () => any
	private _executedFunctions: { [id: string]: boolean } = {}
	private _tsrHandler?: TSRHandler
	private _coreConfig?: CoreConfig
	private _process?: Process

	private _studioId: string | undefined
	private _timelineSubscription: string | null = null
	private _expectedItemsSubscription: string | null = null

	private _statusInitialized = false
	private _statusDestroyed = false

	constructor(logger: Logger, deviceOptions: DeviceConfig) {
		this.logger = logger.tag(this.constructor.name)
		this._deviceOptions = deviceOptions
	}

	async init(config: CoreConfig, process: Process): Promise<void> {
		this._statusInitialized = false
		this._coreConfig = config
		this._process = process

		this.core = new CoreConnection(
			this.getCoreConnectionOptions('Playout gateway', 'PlayoutCoreParent', PERIPHERAL_SUBTYPE_PROCESS)
		)

		this.core.onConnected(() => {
			this.logger.info('Core Connected!')
			this.setupObserversAndSubscriptions().catch((error) =>
				this.logger.data(error).error('Core Error during setupObserversAndSubscriptions:')
			)
			if (this._onConnected) this._onConnected()
		})
		this.core.onDisconnected(() => {
			this.logger.warn('Core Disconnected!')
		})
		this.core.onError((error) => {
			const errorMessage = typeof error === 'string' ? error : error.message || error.toString() || error
			this.logger.data(error).error(`Core Error: ${errorMessage}`)
		})

		const ddpConfig: DDPConnectorOptions = {
			host: config.host,
			port: config.port,
		}
		if (this._process && this._process.certificates.length) {
			ddpConfig.tlsOpts = {
				ca: this._process.certificates,
			}
		}

		await this.core.init(ddpConfig)

		this.logger.info(`Core id: ${this.core.deviceId}.`)
		await this.setupObserversAndSubscriptions()
		if (this._onConnected) this._onConnected()

		this._statusInitialized = true
		await this.updateCoreStatus()
	}
	setTSR(tsr: TSRHandler): void {
		this._tsrHandler = tsr
	}
	async setupObserversAndSubscriptions(): Promise<void> {
		this.logger.info('Core: Setting up subscriptions..')
		this.logger.info(`DeviceId: ${this.core.deviceId}`)
		await Promise.all([
			this.core.autoSubscribe('peripheralDevices', {
				_id: this.core.deviceId,
			}),
			this.core.autoSubscribe('studioOfDevice', this.core.deviceId),
			this.core.autoSubscribe('mappingsForDevice', this.core.deviceId),
			this.core.autoSubscribe('timelineForDevice', this.core.deviceId),
			this.core.autoSubscribe('peripheralDeviceCommands', this.core.deviceId),
			this.core.autoSubscribe('rundownsForDevice', this.core.deviceId),
		])

		this.logger.info('Core: Subscriptions are set up!')
		if (this._observers.length) {
			this.logger.info('CoreMos: Clearing observers..')
			this._observers.forEach((obs) => {
				obs.stop()
			})
			this._observers = []
		}
		// setup observers
		const observer = this.core.observe('peripheralDevices')
		observer.added = (id: string) => this.onDeviceChanged(protectString(id))
		observer.changed = (id: string) => this.onDeviceChanged(protectString(id))
		this.setupObserverForPeripheralDeviceCommands(this)
	}
	async destroy(): Promise<void> {
		this._statusDestroyed = true
		await this.updateCoreStatus()
		await this.core.destroy()
	}
	getCoreConnectionOptions(
		name: string,
		subDeviceId: string,
		subDeviceType: DeviceType | PERIPHERAL_SUBTYPE_PROCESS
	): CoreOptions {
		if (!this._deviceOptions.deviceId) {
			throw new Error('DeviceId is not set during getCoreConnectionOptions!')
		}

		const options: CoreOptions = {
			deviceId: protectString(this._deviceOptions.deviceId + subDeviceId),
			deviceToken: this._deviceOptions.deviceToken,

			deviceCategory: PeripheralDeviceCategory.PLAYOUT,
			deviceType: PeripheralDeviceType.PLAYOUT,
			deviceSubType: subDeviceType,

			deviceName: name,
			watchDog: this._coreConfig ? this._coreConfig.watchdog : true,

			configManifest: PLAYOUT_DEVICE_CONFIG,
		}

		if (!options.deviceToken) {
			this.logger.warn('Token not set, only id! This might be unsecure!')
			options.deviceToken = 'unsecureToken'
		}

		if (subDeviceType === PERIPHERAL_SUBTYPE_PROCESS) options.versions = this._getVersions()
		return options
	}
	onConnected(fcn: () => any): void {
		this._onConnected = fcn
	}
	onDeviceChanged(id: PeripheralDeviceId): void {
		if (id === this.core.deviceId) {
			const col = this.core.getCollection('peripheralDevices')
			if (!col) throw new Error('Collection "peripheralDevices" not found!')

			const device = col.findOne(id)
			if (device) {
				this.deviceSettings = device.settings || {}
			} else {
				this.deviceSettings = {}
			}

			const logLevel = this.deviceSettings['debugLogging'] ? Level.DEBUG : Level.INFO

			this.logger.setLevel(logLevel)
			this.logger.debug(`Log level changed to '${logLevel}'.`)

			if (this.deviceSettings['errorReporting'] !== this.errorReporting) {
				this.errorReporting = this.deviceSettings['errorReporting']
			}
			if (this.deviceSettings['multiThreading'] !== this.multithreading) {
				this.multithreading = this.deviceSettings['multiThreading']
			}
			if (this.deviceSettings['reportAllCommands'] !== this.reportAllCommands) {
				this.reportAllCommands = this.deviceSettings['reportAllCommands']
			}

			const studioId = device.studioId
			if (studioId !== this._studioId) {
				this._studioId = studioId

				// Set up timeline data subscription:
				if (this._timelineSubscription) {
					this.core.unsubscribe(this._timelineSubscription)
					this._timelineSubscription = null
				}
				this.core
					.autoSubscribe('timeline', {
						studioId: studioId,
					})
					.then((subscriptionId) => {
						this._timelineSubscription = subscriptionId
					})
					.catch((error) =>
						this.logger.data(error).error(`Failed subscribing to timeline for studio '${studioId}'`)
					)

				// Set up expectedPlayoutItems data subscription:
				if (this._expectedItemsSubscription) {
					this.core.unsubscribe(this._expectedItemsSubscription)
					this._expectedItemsSubscription = null
				}
				this.core
					.autoSubscribe('expectedPlayoutItems', {
						studioId: studioId,
					})
					.then((subscriptionId) => {
						this._expectedItemsSubscription = subscriptionId
					})
					.catch((error) =>
						this.logger
							.data(error)
							.error(`Failed subscribing to expectedPlayoutItems for studio '${studioId}'`)
					)
				this.logger.debug('VIZDEBUG: Subscription to expectedPlayoutItems done')
			}

			if (this._tsrHandler) {
				this._tsrHandler.onSettingsChanged()
			}
		}
	}
	get logDebug(): boolean {
		return !!this.deviceSettings['debugLogging']
	}
	get estimateResolveTimeMultiplier(): number {
		if (!isNaN(Number(this.deviceSettings['estimateResolveTimeMultiplier']))) {
			return this.deviceSettings['estimateResolveTimeMultiplier'] || 1
		} else return 1
	}

	executeFunction(cmd: PeripheralDeviceCommand, fcnObject: CoreHandler | CoreTSRDeviceHandler): void {
		if (cmd) {
			if (this._executedFunctions[cmd._id]) return // prevent it from running multiple times
			this.logger.debug(`Executing function '${cmd.functionName}', args: ${JSON.stringify(cmd.args)}`)
			this._executedFunctions[cmd._id] = true
			const cb = (error: any, res?: any) => {
				if (error) {
					this.logger.data(error).error('executeFunction error')
				}
				fcnObject.core
					.callMethod(PeripheralDeviceAPIMethods.functionReply, [cmd._id, error, res])
					.catch((error) => this.logger.data(error).error('Failed sending reply to core.'))
			}
			// @ts-expect-error Untyped bunch of functions
			// eslint-disable-next-line @typescript-eslint/ban-types
			const fcn: Function = fcnObject[cmd.functionName]
			try {
				if (!fcn) throw new Error(`Function '${cmd.functionName}' not found on device '${cmd.deviceId}'!`)

				Promise.resolve(fcn.apply(fcnObject, cmd.args))
					.then((result) => cb(null, result))
					.catch((error) => cb(error.toString(), null))
			} catch (e: any) {
				cb(e.toString(), null)
			}
		}
	}
	retireExecuteFunction(cmdId: string): void {
		delete this._executedFunctions[cmdId]
	}
	setupObserverForPeripheralDeviceCommands(functionObject: CoreTSRDeviceHandler | CoreHandler): void {
		const observer = functionObject.core.observe('peripheralDeviceCommands')
		functionObject.killProcess(0)
		functionObject._observers.push(observer)
		const addedChangedCommand = (id: string) => {
			const cmds = functionObject.core.getCollection('peripheralDeviceCommands')
			if (!cmds) {
				throw new Error('"peripheralDeviceCommands" collection not found!')
			}

			const cmd = cmds.findOne(id) as PeripheralDeviceCommand
			if (!cmd) {
				throw new Error(`PeripheralCommand '${id}' not found!`)
			}

			if (cmd.deviceId !== functionObject.core.deviceId) {
				return
			}
			this.executeFunction(cmd, functionObject)
		}
		observer.added = (id: string) => {
			addedChangedCommand(id)
		}
		observer.changed = (id: string) => {
			addedChangedCommand(id)
		}
		observer.removed = (id: string) => {
			this.retireExecuteFunction(id)
		}
		const cmds = functionObject.core.getCollection('peripheralDeviceCommands')
		if (!cmds) throw new Error('"peripheralDeviceCommands" collection not found!')
		cmds.find({}).forEach((cmd0: CollectionObj) => {
			const cmd = cmd0 as PeripheralDeviceCommand
			if (cmd.deviceId === functionObject.core.deviceId) {
				this.executeFunction(cmd, functionObject)
			}
		})
	}
	killProcess(actually: number): boolean {
		const delayMs = 1000
		if (actually === 1) {
			this.logger.info(`KillProcess command received, shutting down in ${delayMs}ms!`)
			setTimeout(() => {
				// eslint-disable-next-line no-process-exit
				process.exit(0)
			}, delayMs)
			return true
		}
		return false
	}
	async devicesMakeReady(okToDestroyStuff?: boolean, activeRundownId?: string): Promise<any> {
		if (!this._tsrHandler) {
			throw new Error('TSR is not set up during devicesMakeReady!')
		}
		return this._tsrHandler.tsr.devicesMakeReady(okToDestroyStuff, activeRundownId)
	}
	async devicesStandDown(okToDestroyStuff?: boolean): Promise<any> {
		if (!this._tsrHandler) {
			throw new Error('TSR is not set up during devicesStandDown!')
		}
		return this._tsrHandler.tsr.devicesStandDown(okToDestroyStuff)
	}
	pingResponse(message: string): void {
		this.core.setPingResponse(message)
	}
	getSnapshot(): any {
		this.logger.debug('getSnapshot')
		const timeline = this._tsrHandler ? this._tsrHandler.getTimeline() : []
		const mappings = this._tsrHandler ? this._tsrHandler.getMappings() : []
		return {
			timeline: timeline,
			mappings: mappings,
		}
	}
	getDevicesInfo(): any {
		this.logger.debug('getDevicesInfo')

		const devices: any[] = []
		if (this._tsrHandler) {
			for (const device of this._tsrHandler.tsr.getDevices()) {
				devices.push({
					instanceId: device.instanceId,
					deviceId: device.deviceId,
					deviceName: device.deviceName,
					startTime: device.startTime,
					upTime: Date.now() - device.startTime,
				})
			}
		}
		return devices
	}
	async getMemoryUsage(): Promise<MemoryUsageReport> {
		if (!this._tsrHandler) {
			throw new Error('TSR not set up during getMemoryUsage!')
		}

		/** Convert all properties from bytes to MB */
		const toMB = (o: any) => {
			if (typeof o === 'object') {
				const o2: any = {}
				for (const key of Object.keys(o)) {
					o2[key] = toMB(o[key])
				}
				return o2
			} else if (typeof o === 'number') {
				return o / 1024 / 1024
			}
			return o
		}

		const values: MemoryUsageReport = {
			main: toMB(process.memoryUsage()),
			threads: toMB(await this._tsrHandler.tsr.getThreadsMemoryUsage()),
		}

		return toMB(values)
	}
	async restartCasparCG(deviceId: string): Promise<any> {
		if (!this._tsrHandler) {
			throw new Error('TSR is not set up during restartCasparCG!')
		}

		const device = this._tsrHandler.tsr.getDevice(deviceId)?.device as ThreadedClass<CasparCGDevice>
		if (!device) throw new Error(`TSR Device '${deviceId}' not found during restartCasparCG!`)

		return device.restartCasparCG()
	}
	async restartQuantel(deviceId: string): Promise<any> {
		if (!this._tsrHandler) {
			throw new Error('TSR is not set up during restartQuantel!')
		}

		const device = this._tsrHandler.tsr.getDevice(deviceId)?.device as ThreadedClass<QuantelDevice>
		if (!device) throw new Error(`TSR Device '${deviceId}' not found during restartQuantel!`)

		return device.restartGateway()
	}
	async formatHyperdeck(deviceId: string): Promise<void> {
		if (!this._tsrHandler) {
			throw new Error('TSR is not set up during formatHyperdeck!')
		}

		const device = this._tsrHandler.tsr.getDevice(deviceId)?.device as ThreadedClass<HyperdeckDevice>
		if (!device) throw new Error(`TSR Device '${deviceId}' not found during formatHyperdeck!`)

		await device.formatDisks()
	}
	async updateCoreStatus(): Promise<any> {
		let statusCode = StatusCode.GOOD
		const messages: Array<string> = []

		if (!this._statusInitialized) {
			statusCode = StatusCode.BAD
			messages.push('Starting up...')
		}
		if (this._statusDestroyed) {
			statusCode = StatusCode.BAD
			messages.push('Shut down')
		}

		return this.core.setStatus({
			statusCode: statusCode,
			messages: messages,
		})
	}
	private _getVersions(): Record<string, string> {
		const versions: Record<string, string> = {}

		if (process.env.npm_package_version) {
			versions['_process'] = process.env.npm_package_version
		}

		const packageNames = [
			'timeline-state-resolver',
			'atem-connection',
			'atem-state',
			'casparcg-connection',
			'casparcg-state',
			'emberplus-connection',
			'superfly-timeline',
		]
		for (const packageName of packageNames) {
			try {
				versions[packageName] = this.getPackageVersion(packageName)
			} catch (error) {
				this.logger.data(error).error(`Failed to load package.json for lib '${packageName}'.`)
			}
		}
		return versions
	}

	private getPackageVersion(packageName: string): string {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const packageInfo = require(`${packageName}/package.json`)
		return packageInfo.version ?? 'N/A'
	}
}

export class CoreTSRDeviceHandler {
	core!: CoreConnection
	public _observers: Array<any> = []
	public _device: DeviceContainer<DeviceOptionsAny>
	private _coreParentHandler: CoreHandler
	private readonly logger: Logger
	private _tsrHandler: TSRHandler
	private _subscriptions: Array<string> = []
	private _hasGottenStatusChange = false
	private _deviceStatus: StatusObject = {
		statusCode: StatusCode.BAD,
		messages: ['Starting up...'],
	}

	constructor(device: DeviceContainer<DeviceOptionsAny>, tsrHandler: TSRHandler, logger: Logger) {
		this._coreParentHandler = tsrHandler.coreHandler
		this._device = device
		this._tsrHandler = tsrHandler
		this.logger = logger.tag(this.constructor.name)
	}

	async init(): Promise<void> {
		const deviceId = this._device.deviceId
		const deviceName = `${deviceId} (${this._device.deviceName})`

		this.core = new CoreConnection(
			this._coreParentHandler.getCoreConnectionOptions(
				deviceName,
				`Playout${deviceId}`,
				this._device.deviceOptions.type
			)
		)
		this.core.onError((error) => this.logger.data(error).error('Core Error:'))
		await this.core.init(this._coreParentHandler.core)

		if (!this._hasGottenStatusChange) {
			this._deviceStatus = {
				statusCode: (await this._device.device.canConnect)
					? (await this._device.device.connected)
						? StatusCode.GOOD
						: StatusCode.BAD
					: StatusCode.GOOD,
			}
			this.sendStatus()
		}
		await this.setupSubscriptionsAndObservers()
		this.logger.debug('setupSubscriptionsAndObservers done')
	}
	async setupSubscriptionsAndObservers(): Promise<void> {
		if (this._observers.length) {
			this.logger.info('CoreTSRDevice: Clearing observers..')
			this._observers.forEach((obs) => {
				obs.stop()
			})
			this._observers = []
		}
		const deviceId = this._device.deviceId

		this.logger.info(
			`CoreTSRDevice: Setting up subscriptions for '${this.core.deviceId}' for device '${deviceId}'...`
		)
		this._subscriptions = []
		try {
			const sub = await this.core.autoSubscribe('peripheralDeviceCommands', this.core.deviceId)
			this._subscriptions.push(sub)
		} catch (error) {
			this.logger
				.data(error)
				.error(`Failed subscribing to peripheralDeviceCommands for deviceId '${this.core.deviceId}'.`)
		}

		this.logger.info('CoreTSRDevice: Setting up observers..')

		// setup observers
		this._coreParentHandler.setupObserverForPeripheralDeviceCommands(this)
	}
	statusChanged(deviceStatus: Partial<StatusObject>): void {
		this._hasGottenStatusChange = true

		this._deviceStatus = {
			...this._deviceStatus,
			...deviceStatus,
		}
		this.sendStatus()
	}
	/** Send the device status to Core */
	sendStatus(): void {
		if (!this.core) return // not initialized yet

		this.core
			.setStatus(this._deviceStatus)
			.catch((error) => this.logger.data(error).error('Error when setting status.'))
	}
	onCommandError(
		errorMessage: string,
		ref: {
			rundownId?: string
			partId?: string
			pieceId?: string
			context: string
			timelineObjId: string
		}
	): void {
		this.core
			.callMethodLowPrio(PeripheralDeviceAPIMethods.reportCommandError, [errorMessage, ref])
			.catch((error) => this.logger.data(error).error(`Error when callMethodLowPrio.`))
	}
	onUpdateMediaObject(collectionId: string, docId: string, doc: MediaObject | null): void {
		this.core
			.callMethodLowPrio(PeripheralDeviceAPIMethods.updateMediaObject, [collectionId, docId, doc])
			.catch((error) => this.logger.data(error).error(`Error when updating Media Object.`))
	}
	onClearMediaObjectCollection(collectionId: string): void {
		this.core
			.callMethodLowPrio(PeripheralDeviceAPIMethods.clearMediaObjectCollection, [collectionId])
			.catch((error) => this.logger.data(error).error(`Error when clearing Media Objects collection:`))
	}

	async disposeExpectedly(): Promise<void> {
		return this.dispose(StatusCode.UNKNOWN)
	}

	async disposeUnexpectedly(): Promise<void> {
		return this.dispose(StatusCode.BAD)
	}

	private async dispose(statusCode: StatusCode): Promise<void> {
		this._observers.forEach((obs) => {
			obs.stop()
		})

		await this._tsrHandler.tsr.removeDevice(this._device.deviceId)
		if (this.core) {
			await this.core.setStatus({
				statusCode,
				messages: ['Uninitialized'],
			})
			await this.core.destroy()
		}
	}
	killProcess(actually: number): boolean {
		return this._coreParentHandler.killProcess(actually)
	}
	async restartCasparCG(): Promise<any> {
		const device = this._device.device as ThreadedClass<CasparCGDevice>
		if (device.restartCasparCG) {
			return device.restartCasparCG()
		} else {
			return Promise.reject('device.restartCasparCG not set')
		}
	}
	async restartQuantel(): Promise<any> {
		const device = this._device.device as ThreadedClass<QuantelDevice>
		if (device.restartGateway) {
			return device.restartGateway()
		} else {
			return Promise.reject('device.restartGateway not set')
		}
	}
	async formatHyperdeck(): Promise<any> {
		const device = this._device.device as ThreadedClass<HyperdeckDevice>
		if (device.formatDisks) {
			return device.formatDisks()
		} else {
			return Promise.reject('device.formatHyperdeck not set')
		}
	}
}
