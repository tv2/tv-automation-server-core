import {
	Conductor,
	DeviceType,
	ConductorOptions,
	Device,
	TimelineTriggerTimeResult,
	DeviceOptionsAny,
	Mappings,
	DeviceContainer,
	Timeline as TimelineTypes,
	TSRTimelineObj,
	TSRTimeline,
	TSRTimelineObjBase,
	AtemMediaPoolAsset,
	StatusCode,
} from 'timeline-state-resolver'
import { CoreHandler, CoreTSRDeviceHandler } from './coreHandler'
import clone = require('fast-clone')
import * as crypto from 'crypto'
import * as cp from 'child_process'

import * as _ from 'underscore'
import { CollectionObj, CoreConnection, TableConfigManifestEntry } from '@sofie-automation/server-core-integration'
import { TimelineObjectCoreExt } from '@sofie-automation/blueprints-integration'
import { Logger } from './logger'
import Debug from 'debug'
import { FinishedTrace, sendTrace } from './influxdb'
import { PeripheralDeviceAPIMethods } from '@sofie-automation/shared-lib/dist/peripheralDevice/methodsAPI'
import {
	PartPlaybackCallbackData,
	PiecePlaybackCallbackData,
	PlayoutChangedResults,
	PlayoutChangedType,
} from '@sofie-automation/shared-lib/dist/peripheralDevice/peripheralDeviceAPI'
import { assertNever } from '@sofie-automation/shared-lib/dist/lib/lib'
import { PLAYOUT_DEVICE_CONFIG } from './configManifest'
import { ConfigManifestEntry } from '@sofie-automation/shared-lib/dist/core/deviceConfigManifest'
import { JobQueueManager } from './tsrHandlerJobs/jobQueueManager'
import { CreateDeviceJob } from './tsrHandlerJobs/createDeviceJob'
import { InitCoreTsrHandlerJob } from './tsrHandlerJobs/initCoreTsrHandlerJob'
import { InitDeviceJob } from './tsrHandlerJobs/initDeviceJob'
import { RemoveDeviceJob } from './tsrHandlerJobs/removeDeviceJob'
import * as hashObject from 'object-hash'
import { UpdateExpectedPlayoutItemsJob } from './tsrHandlerJobs/updateExpectedPlayoutItemsJob'
import { SetDebugLoggingJob } from './tsrHandlerJobs/setDebugLoggingJob'
import { JobImportance } from './tsrHandlerJobs/jobQueue'

const debug = Debug('playout-gateway')

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface TSRConfig {}
export interface TSRSettings {
	// Runtime settings from Core
	devices: {
		[deviceId: string]: DeviceOptionsAny
	}
	mappings: Mappings
	errorReporting?: boolean
	multiThreading?: boolean
	multiThreadedResolver?: boolean
	useCacheWhenResolving?: boolean
}
export interface TSRDevice {
	coreConnection: CoreConnection
	device: Device<DeviceOptionsAny>
}

// ----------------------------------------------------------------------------
// interface copied from Core lib/collections/Timeline.ts

export type TimelineEnableExt = TimelineTypes.TimelineEnable & { setFromNow?: boolean }
export interface TimelineObjGeneric extends TimelineObjectCoreExt {
	/** Unique within a timeline (ie within a studio) */
	id: string
	/** Set when the id of the object is prefixed */
	originalId?: string

	objectType: TimelineObjType

	enable: TimelineEnableExt | TimelineEnableExt[]

	/** The id of the group object this object is in  */
	inGroup?: string
}
export enum TimelineObjType {
	/** Objects played in a rundown */
	RUNDOWN = 'rundown',
	/** Objects controlling recording */
	RECORDING = 'record',
	/** Objects controlling manual playback */
	MANUAL = 'manual',
	/** "Magic object", used to calculate a hash of the timeline */
	STAT = 'stat',
}

/** This is the data-object published from Core */
export interface RoutedTimeline {
	_id: string
	/** Hash of the studio mappings */
	mappingsHash: string

	/** Hash of the Timeline */
	timelineHash: string

	/** serialized JSON Array containing all timeline-objects */
	timelineBlob: string
	generated: number

	// this is the old way of storing the timeline, kept for backwards-compatibility
	timeline?: TimelineObjGeneric[]
}
export interface RoutedMappings {
	_id: string
	mappingsHash: string | undefined
	mappings: Mappings
}
// ----------------------------------------------------------------------------

export interface TimelineContentObjectTmp extends TSRTimelineObjBase {
	inGroup?: string
}
/** Max time for device-related jobs */
const JOB_TIMEOUT = 10000

/** Delay used for debouncing Expected Playout Items updates */
const EXPECTED_PLAYOUT_ITEMS_DEBOUNCE_DELAY = 200

enum JobFailure {
	ADD_ERROR = 'add_error',
	ADD_TIMEOUT = 'add_timeout',
	REMOVE_ERROR = 'remove_error',
	REMOVE_TIMEOUT = 'remove_timeout',
}

/**
 * Represents a connection between Gateway and TSR
 */
export class TSRHandler {
	logger: Logger
	private _tsr!: Conductor
	private _coreHandler!: CoreHandler
	private _triggerUpdateExpectedPlayoutItemsTimeout: any = null
	private _coreTsrHandlers: { [deviceId: string]: CoreTSRDeviceHandler } = {}
	private _observers: Array<any> = []
	private _cachedStudioId = ''
	private _jobQueueManager: JobQueueManager
	private _deviceJobFailureStatuses = new Map<string, JobFailure>()

	private _initialized = false
	private _multiThreaded: boolean | null = null
	private _reportAllCommands: boolean | null = null
	private _errorReporting: boolean | null = null

	private _updateDevicesIsRunning = false
	private _lastReportedObjHashes: string[] = []
	private _triggerUpdateDevicesCheckAgain = false
	private _triggerUpdateDevicesTimeout: NodeJS.Timeout | undefined

	private defaultDeviceOptions: { [deviceType: string]: Record<string, any> } = {}

	constructor(logger: Logger) {
		this.logger = logger.tag(this.constructor.name)
		this._jobQueueManager = new JobQueueManager(logger)
	}

	public get tsr(): Conductor {
		return this._tsr
	}

	public get coreHandler(): CoreHandler {
		return this._coreHandler
	}

	public get reportAllCommands(): boolean | null {
		return this._reportAllCommands
	}

	public async init(_config: TSRConfig, coreHandler: CoreHandler): Promise<void> {
		// this._config = config
		this._coreHandler = coreHandler

		this._coreHandler.setTSR(this)

		this.logger.info('TSRHandler init')

		const peripheralDevice = await coreHandler.core.getPeripheralDevice()
		const settings: TSRSettings = peripheralDevice.settings || {}

		this.logger.data(settings.devices).debug('Device settings:')
		const c: ConductorOptions = {
			getCurrentTime: (): number => {
				return this._coreHandler.core.getCurrentTime()
			},
			multiThreadedResolver: settings.multiThreadedResolver === true,
			useCacheWhenResolving: settings.useCacheWhenResolving === true,
			proActiveResolve: true,
		}

		this.defaultDeviceOptions = this.loadSubdeviceConfigurations()

		this._tsr = new Conductor(c)
		this._triggerupdateTimelineAndMappings('TSRHandler.init()')

		coreHandler.onConnected(() => {
			this.setupObservers()
			this.resendStatuses()
		})
		this.setupObservers()

		this.tsr.on('error', (error, ...args) => {
			// CasparCG play and load 404 errors should be warnings:
			const msg: string = error + ''
			const cmdReply = args[0]

			if (
				msg.match(/casparcg/i) &&
				(msg.match(/PlayCommand/i) || msg.match(/LoadbgCommand/i)) &&
				cmdReply &&
				_.isObject(cmdReply) &&
				cmdReply.response &&
				cmdReply.response.code === 404
			) {
				this.logger.data({ args, error }).warn(`TSR Error: ${error.message}`)
			} else {
				this.logger.data({ args, error }).error(`TSR Error: ${error.message}`)
			}
		})
		this.tsr.on('info', (msg, ...args) => this.logger.data({ args }).info(`TSR Info: ${msg}`))
		this.tsr.on('warning', (msg, ...args) => this.logger.data({ args }).warn(`TSR Warning: ${msg}`))
		this.tsr.on('debug', (...args: any[]) => {
			if (!this._coreHandler.logDebug) {
				return
			}
			this.logger.data(args).debug(`TSR debug message with ${args.length} arguments.`)
		})

		this.tsr.on('setTimelineTriggerTime', (r: TimelineTriggerTimeResult) => {
			this._coreHandler.core
				.callMethod(PeripheralDeviceAPIMethods.timelineTriggerTime, [r])
				.catch((error) => this.logger.data(error).error('Error in setTimelineTriggerTime:'))
		})

		this.tsr.on('timelineCallback', (time, objId, callbackName, data) => {
			this.handleTSRTimelineCallback(time, objId, callbackName, data)
		})
		this.tsr.on('resolveDone', (timelineHash: string, resolveDuration: number) => {
			// Make sure we only report back once, per update timeline
			if (this._lastReportedObjHashes.includes(timelineHash)) return

			this._lastReportedObjHashes.unshift(timelineHash)
			if (this._lastReportedObjHashes.length > 10) {
				this._lastReportedObjHashes.length = 10
			}

			this._coreHandler.core
				.callMethod('peripheralDevice.reportResolveDone', [timelineHash, resolveDuration])
				.catch((error) => this.logger.data(error).error('Error in reportResolveDone:'))

			sendTrace({
				measurement: 'playout-gateway.tlResolveDone',
				tags: {},
				start: Date.now() - resolveDuration,
				duration: resolveDuration,
				ended: Date.now(),
			})
		})
		this.tsr.on('timeTrace', (trace: FinishedTrace) => sendTrace(trace))

		this.logger.debug('tsr init')
		await this.tsr.init()

		this._initialized = true
		this._triggerupdateTimelineAndMappings('TSRHandler.init(), later')
		this.onSettingsChanged()
		this._triggerUpdateDevices()
		this.logger.debug('tsr init done')
	}

	private loadSubdeviceConfigurations(): { [deviceType: string]: Record<string, any> } {
		const playoutGatewayDevicesConfig: ConfigManifestEntry | undefined = PLAYOUT_DEVICE_CONFIG.deviceConfig.find(
			(deviceConfig: ConfigManifestEntry) => deviceConfig.id === 'devices'
		)
		if (!playoutGatewayDevicesConfig) {
			return {}
		}
		const tableConfig: TableConfigManifestEntry = playoutGatewayDevicesConfig as TableConfigManifestEntry
		const defaultDeviceOptions: { [deviceType: string]: Record<string, any> } = {}
		for (const deviceType in tableConfig.config) {
			const configEntries = tableConfig.config[deviceType]
				.filter((configManifestEntry: ConfigManifestEntry) => configManifestEntry.defaultVal)
				.map((configManifestEntry: ConfigManifestEntry) => [
					configManifestEntry.id.replace('options.', ''),
					configManifestEntry.defaultVal,
				])
			defaultDeviceOptions[deviceType] = Object.fromEntries(configEntries)
		}
		return defaultDeviceOptions
	}

	private setupObservers(): void {
		if (this._observers.length) {
			this.logger.debug('Clearing observers..')
			this._observers.forEach((obs) => {
				obs.stop()
			})
			this._observers = []
		}
		this.logger.debug('Renewing observers')

		const timelineObserver = this._coreHandler.core.observe('studioTimeline')
		timelineObserver.added = () => {
			this._triggerupdateTimelineAndMappings('studioTimeline.added', true)
		}
		timelineObserver.changed = () => {
			this._triggerupdateTimelineAndMappings('studioTimeline.changed', true)
		}
		timelineObserver.removed = () => {
			this._triggerupdateTimelineAndMappings('studioTimeline.removed', true)
		}
		this._observers.push(timelineObserver)

		const mappingsObserver = this._coreHandler.core.observe('studioMappings')
		mappingsObserver.added = () => {
			this._triggerupdateTimelineAndMappings('studioMappings.added')
		}
		mappingsObserver.changed = () => {
			this._triggerupdateTimelineAndMappings('studioMappings.changed')
		}
		mappingsObserver.removed = () => {
			this._triggerupdateTimelineAndMappings('studioMappings.removed')
		}
		this._observers.push(mappingsObserver)

		const deviceObserver = this._coreHandler.core.observe('peripheralDevices')
		deviceObserver.added = () => {
			debug('triggerUpdateDevices from deviceObserver added')
			this._triggerUpdateDevices()
		}
		deviceObserver.changed = (_id, _oldFields, _clearedFields, newFields) => {
			// Only react to changes in the .settings property:
			if (newFields['settings'] !== undefined) {
				debug('triggerUpdateDevices from deviceObserver changed')
				this._triggerUpdateDevices()
			}
		}
		deviceObserver.removed = () => {
			debug('triggerUpdateDevices from deviceObserver removed')
			this._triggerUpdateDevices()
		}
		this._observers.push(deviceObserver)

		const expectedPlayoutItemsObserver = this._coreHandler.core.observe('expectedPlayoutItems')
		expectedPlayoutItemsObserver.added = () => {
			this._triggerUpdateExpectedPlayoutItems()
		}
		expectedPlayoutItemsObserver.changed = () => {
			this._triggerUpdateExpectedPlayoutItems()
		}
		expectedPlayoutItemsObserver.removed = () => {
			this._triggerUpdateExpectedPlayoutItems()
		}
		this._observers.push(expectedPlayoutItemsObserver)
	}
	private resendStatuses(): void {
		_.each(this._coreTsrHandlers, (tsrHandler) => {
			tsrHandler.sendStatus()
		})
	}
	async destroy(): Promise<void> {
		return this.tsr.destroy()
	}
	getTimeline(): RoutedTimeline | undefined {
		const studioId = this._getStudioId()
		if (!studioId) {
			this.logger.data({ studioId }).warn('Missing studioId in getTimeline.')
			return undefined
		}

		const timeline = this._coreHandler.core.getCollection('studioTimeline').findOne(studioId)

		return timeline as any
	}
	getMappings(): RoutedMappings | undefined {
		const studioId = this._getStudioId()
		if (!studioId) {
			return undefined
		}
		// Note: The studioMappings virtual collection contains a single object that contains all mappings
		const mappingsObject = this._coreHandler.core.getCollection('studioMappings').findOne(studioId)

		return mappingsObject as any
	}
	onDeviceChildClosed(deviceId: string): void {
		this.enqueueDeviceRemoveIfNotLast(deviceId, false)
	}
	onSettingsChanged(): void {
		if (!this._initialized) return

		if (this.tsr.logDebug !== this._coreHandler.logDebug) {
			this.logger.debug(`Log settings changed: ${this._coreHandler.logDebug}`)
			this.tsr.logDebug = this._coreHandler.logDebug
		}

		if (this._errorReporting !== this._coreHandler.errorReporting) {
			this._errorReporting = this._coreHandler.errorReporting

			this.logger.info(`ErrorReporting changed: ${this._coreHandler.errorReporting}`)
		}
		if (this.tsr.estimateResolveTimeMultiplier !== this._coreHandler.estimateResolveTimeMultiplier) {
			this.tsr.estimateResolveTimeMultiplier = this._coreHandler.estimateResolveTimeMultiplier
			this.logger.info(
				`estimateResolveTimeMultiplier changed: ${this._coreHandler.estimateResolveTimeMultiplier}`
			)
		}
		if (this._multiThreaded !== this._coreHandler.multithreading) {
			this._multiThreaded = this._coreHandler.multithreading

			this.logger.info(`Multithreading changed: ${this._multiThreaded}`)

			debug('triggerUpdateDevices from onSettingsChanged')
			this._triggerUpdateDevices()
		}
		if (this._reportAllCommands !== this._coreHandler.reportAllCommands) {
			this._reportAllCommands = this._coreHandler.reportAllCommands

			this.logger.info(`reportAllCommands changed: ${this._reportAllCommands}`)

			debug('triggerUpdateDevices from onSettingsChanged')
			this._triggerUpdateDevices()
		}
	}
	private _triggerupdateTimelineAndMappings(context: string, fromTlChange?: boolean) {
		if (!this._initialized) return

		this._updateTimelineAndMappings(context, fromTlChange)
	}
	private _updateTimelineAndMappings(context: string, fromTlChange?: boolean) {
		const timeline = this.getTimeline()
		const mappingsObject = this.getMappings()

		if (!timeline) {
			this.logger.debug(`Cancel resolving: No timeline`)
			return
		}
		if (!mappingsObject) {
			this.logger.debug(`Cancel resolving: No mappings`)
			return
		}
		// Compare mappingsHash to ensure that the timeline we've received is in sync with the mappings:
		if (timeline.mappingsHash !== mappingsObject.mappingsHash) {
			this.logger.info(
				`Cancel resolving: mappingsHash differ: "${timeline.mappingsHash}" vs "${mappingsObject.mappingsHash}"`
			)
			return
		}

		this.logger.debug(
			`Trigger new resolving (${context}, hash: ${timeline.timelineHash}, gen: ${new Date(
				timeline.generated
			).toISOString()})`
		)
		if (fromTlChange) {
			sendTrace({
				measurement: 'playout-gateway:timelineReceived',
				start: timeline.generated,
				tags: {},
				ended: Date.now(),
				duration: Date.now() - timeline.generated,
			})
		}

		const transformedTimeline = timeline.timelineBlob
			? this._transformTimeline(JSON.parse(timeline.timelineBlob) as Array<TimelineObjGeneric>)
			: timeline.timeline
			? this._transformTimeline(clone(timeline.timeline))
			: []
		this.tsr.timelineHash = timeline.timelineHash
		this.tsr.setTimelineAndMappings(transformedTimeline, mappingsObject.mappings)
	}
	private _getPeripheralDevice() {
		const peripheralDevices = this._coreHandler.core.getCollection('peripheralDevices')
		return peripheralDevices.findOne(this._coreHandler.core.deviceId)
	}
	private _getStudio(): any | null {
		const peripheralDevice = this._getPeripheralDevice()
		if (!peripheralDevice) {
			return null
		}
		const studios = this._coreHandler.core.getCollection('studios')
		return studios.findOne(peripheralDevice.studioId)
	}
	private _getStudioId(): string | null {
		if (this._cachedStudioId) return this._cachedStudioId

		const studio = this._getStudio()
		if (studio) {
			this._cachedStudioId = studio._id
			return studio._id
		}
		return null
	}
	private _triggerUpdateDevices() {
		if (!this._initialized) return

		if (this._triggerUpdateDevicesTimeout) {
			clearTimeout(this._triggerUpdateDevicesTimeout)
		}
		this._triggerUpdateDevicesTimeout = undefined

		if (this._updateDevicesIsRunning) {
			debug('triggerUpdateDevices already running, cue a check again later')
			this._triggerUpdateDevicesCheckAgain = true
			return
		}
		this._updateDevicesIsRunning = true
		debug('triggerUpdateDevices now')

		// Defer:
		setTimeout(() => {
			this._updateDevices()
				.then(
					() =>
						this._triggerUpdateDevicesCheckAgain &&
						debug('triggerUpdateDevices from updateDevices promise resolved')
				)
				.catch(
					() =>
						this._triggerUpdateDevicesCheckAgain &&
						debug('triggerUpdateDevices from updateDevices promise rejected')
				)
				.finally(() => {
					this._updateDevicesIsRunning = false
					if (!this._triggerUpdateDevicesCheckAgain) {
						return
					}
					if (this._triggerUpdateDevicesTimeout) {
						clearTimeout(this._triggerUpdateDevicesTimeout)
					}
					this._triggerUpdateDevicesTimeout = setTimeout(() => this._triggerUpdateDevices(), 1000)
					this._triggerUpdateDevicesCheckAgain = false
				})
		}, 10)
	}

	private async _updateDevices(): Promise<void> {
		this.logger.debug('updateDevices start')

		const peripheralDevices = this._coreHandler.core.getCollection('peripheralDevices')
		const peripheralDevice = peripheralDevices.findOne(this._coreHandler.core.deviceId)

		const deviceOptions = new Map<string, DeviceOptionsAny>()

		if (peripheralDevice) {
			const settings: TSRSettings = peripheralDevice.settings || {}

			for (const [deviceId, device] of Object.entries(settings.devices)) {
				if (!device.disable) {
					deviceOptions.set(deviceId, device)
				}
			}

			this.cleanUpRemovedDeviceStatus(deviceOptions)

			for (const [deviceId, orgDeviceOptions] of deviceOptions.entries()) {
				const oldDevice: DeviceContainer<DeviceOptionsAny> | undefined = this.tsr.getDevice(deviceId, true)

				const deviceOptions: DeviceOptionsAny = _.extend(
					{
						// Defaults:
						limitSlowSentCommand: 40,
						limitSlowFulfilledCommand: 100,
						options: {},
					},
					this.populateDefaultValuesIfMissing(orgDeviceOptions)
				)

				if (this._multiThreaded !== null && deviceOptions.isMultiThreaded === undefined) {
					deviceOptions.isMultiThreaded = this._multiThreaded
				}
				if (this._reportAllCommands !== null && deviceOptions.reportAllCommands === undefined) {
					deviceOptions.reportAllCommands = this._reportAllCommands
				}

				if (!oldDevice) {
					if (deviceOptions.options) {
						this.logger.data(deviceOptions).info(`Initializing device '${deviceId}' with options:`)
						this.enqueueDeviceAddIfNotLast(deviceId, deviceOptions)
					}
				} else if (
					deviceOptions.options &&
					!_.isEqual(_.omit(oldDevice.deviceOptions, 'debug'), _.omit(deviceOptions, 'debug'))
				) {
					deviceOptions.debug = this.getDeviceDebug(orgDeviceOptions)

					this.logger
						.data({
							oldDeviceOptions: oldDevice.deviceOptions,
							newDeviceOptions: deviceOptions,
						})
						.info(`Re-initializing device: ${deviceId}`)
					this.enqueueDeviceAddIfNotLast(deviceId, deviceOptions)
				} else if (deviceOptions && this.getDeviceDebug(deviceOptions) !== oldDevice.debugLogging) {
					this.logger.info(`Setting logDebug of device '${deviceId}' to ${debug}.`)
					this.enqueueSetDebugLogging(deviceId, this.getDeviceDebug(deviceOptions))
				}
			}

			for (const oldDevice of this.tsr.getDevices(true)) {
				const deviceId = oldDevice.deviceId
				if (!deviceOptions.has(deviceId)) {
					this.logger.info(`Un-initializing device: ${deviceId}`)
					this.enqueueDeviceRemoveIfNotLast(deviceId, true)
				}
			}
		}

		this.logger.debug('updateDevices end')
	}

	private cleanUpRemovedDeviceStatus(deviceOptions: Map<string, DeviceOptionsAny>) {
		for (const device of this._deviceJobFailureStatuses) {
			if (!deviceOptions.has(device[0])) {
				this.updateDeviceStatus(device[0])
			}
		}
	}

	private enqueueDeviceRemoveIfNotLast(deviceId: string, expected: boolean) {
		const jobQueue = this._jobQueueManager.get(deviceId)
		const jobId = 'remove'
		if (jobQueue.getLastJobIdByImportance(JobImportance.HIGH) === jobId) {
			return
		}
		jobQueue.clear()
		jobQueue
			.enqueue(
				new RemoveDeviceJob(deviceId, this._coreTsrHandlers, expected, this.logger),
				JOB_TIMEOUT,
				JobImportance.HIGH,
				jobId
			)
			.end(
				() => {
					if (jobQueue.length) return
					this.updateDeviceStatus(deviceId)
					this._triggerUpdateDevices()
				},
				() => {
					this.updateDeviceStatus(deviceId, JobFailure.REMOVE_ERROR)
					this._triggerUpdateDevices()
				},
				() => {
					this.updateDeviceStatus(deviceId, JobFailure.REMOVE_TIMEOUT)
					this._triggerUpdateDevices()
				}
			)
	}

	private enqueueDeviceAddIfNotLast(deviceId: string, deviceOptions: DeviceOptionsAny) {
		const jobQueue = this._jobQueueManager.get(deviceId)
		const jobId = `init_${hashObject(_.omit(deviceOptions, 'debug'))}`
		if (jobQueue.getLastJobIdByImportance(JobImportance.HIGH) === jobId) {
			return
		}
		this.enqueueDeviceRemoveIfNotLast(deviceId, true)
		jobQueue
			.enqueue(new CreateDeviceJob(deviceId, deviceOptions, this), JOB_TIMEOUT, JobImportance.HIGH)
			.chain(new InitCoreTsrHandlerJob(), JOB_TIMEOUT, JobImportance.HIGH)
			.chain(
				new InitDeviceJob(deviceId, deviceOptions, this, this.logger),
				JOB_TIMEOUT,
				JobImportance.HIGH,
				jobId
			)
			.end(
				(result) => {
					this.updateDeviceStatus(deviceId)
					this._coreTsrHandlers[deviceId] = result.coreTsrHandler
					const { groupedExpectedItems, rundowns } = this.getExpectedPlayoutItems()
					this.enqueueExpectedPlayoutItemsUpdate(groupedExpectedItems, rundowns, deviceId)
				},
				() => {
					this.updateDeviceStatus(deviceId, JobFailure.ADD_ERROR)
					this._triggerUpdateDevices()
				},
				() => {
					this.updateDeviceStatus(deviceId, JobFailure.ADD_TIMEOUT)
					this._triggerUpdateDevices()
				}
			)
	}

	private enqueueSetDebugLogging(deviceId: string, debugLogging: boolean) {
		const jobQueue = this._jobQueueManager.get(deviceId)
		const jobId = 'enqueueSetDebugLogging'
		jobQueue.removeJob(jobId)
		jobQueue
			.enqueue(new SetDebugLoggingJob(deviceId, this.tsr, debugLogging), JOB_TIMEOUT, JobImportance.LOW, jobId)
			.end(undefined, (error) => {
				this.logger.data(error).error(`Error when setting debug logging on device '${deviceId}'`)
			})
	}

	private getExpectedPlayoutItems(): {
		groupedExpectedItems: Record<string, CollectionObj[]>
		rundowns: Record<string, CollectionObj>
	} {
		const expectedPlayoutItems = this._coreHandler.core.getCollection('expectedPlayoutItems')
		const peripheralDevice = this._getPeripheralDevice()

		const expectedItems = expectedPlayoutItems.find({
			studioId: peripheralDevice.studioId,
		})
		const rundowns = _.indexBy(
			this._coreHandler.core.getCollection('rundowns').find({
				studioId: peripheralDevice.studioId,
			}),
			'_id'
		)
		const groupedExpectedItems = _.groupBy(expectedItems, 'deviceSubType')
		return { groupedExpectedItems, rundowns }
	}

	private enqueueExpectedPlayoutItemsUpdate(
		groupedExpectedItems: Record<string, CollectionObj[]>,
		rundowns: Record<string, CollectionObj>,
		deviceId: string
	) {
		const jobQueue = this._jobQueueManager.get(deviceId)
		const jobId = 'updateExpectedPlayoutItems'
		jobQueue.removeJob(jobId)
		jobQueue
			.enqueue(
				new UpdateExpectedPlayoutItemsJob(deviceId, this.tsr, groupedExpectedItems, rundowns),
				undefined,
				JobImportance.LOW,
				jobId
			)
			.end(undefined, (error) => {
				this.logger.data(error).error(`Error when updating expected playout items on device '${deviceId}'`)
			})
	}

	private updateDeviceStatus(deviceId: string, failure?: JobFailure) {
		if (!failure) {
			this._deviceJobFailureStatuses.delete(deviceId)
		} else {
			this._deviceJobFailureStatuses.set(deviceId, failure)
		}
		this.reportStatusToCore().catch((error) => {
			this.logger.data(error).error(`Error when reporting device status`)
		})
	}

	private async reportStatusToCore() {
		if (this._deviceJobFailureStatuses.size === 0) {
			await this._coreHandler.core.setStatus({
				statusCode: StatusCode.GOOD,
				messages: [],
			})
			return
		}
		const failedDevices: Record<JobFailure, string[]> = {
			[JobFailure.ADD_ERROR]: [],
			[JobFailure.ADD_TIMEOUT]: [],
			[JobFailure.REMOVE_ERROR]: [],
			[JobFailure.REMOVE_TIMEOUT]: [],
		}
		for (const entry of this._deviceJobFailureStatuses) {
			failedDevices[entry[1]].push(entry[0])
		}
		const timeoutCount =
			failedDevices[JobFailure.ADD_TIMEOUT].length + failedDevices[JobFailure.REMOVE_TIMEOUT].length

		if (timeoutCount > 0) {
			this.logger
				.data([...failedDevices[JobFailure.ADD_TIMEOUT], ...failedDevices[JobFailure.REMOVE_TIMEOUT]])
				.warn(`Timeout in _updateDevices:`)
		}

		await this._coreHandler.core.setStatus({
			statusCode: timeoutCount > 0 ? StatusCode.FATAL : StatusCode.BAD,
			messages: [
				failedDevices[JobFailure.ADD_ERROR].length > 0
					? `Unable to initialize devices, check configuration: ${stringifyIds(
							failedDevices[JobFailure.ADD_ERROR]
					  )}`
					: null,
				failedDevices[JobFailure.REMOVE_ERROR].length > 0
					? `Failed to remove devices: ${stringifyIds(failedDevices[JobFailure.REMOVE_ERROR])}`
					: null,
				failedDevices[JobFailure.ADD_TIMEOUT].length > 0
					? `Time-out when adding devices: ${stringifyIds(failedDevices[JobFailure.ADD_TIMEOUT])}`
					: null,
				failedDevices[JobFailure.REMOVE_TIMEOUT].length > 0
					? `Time-out when removing devices: ${stringifyIds(failedDevices[JobFailure.REMOVE_TIMEOUT])}`
					: null,
			].filter(Boolean) as string[],
		})
	}

	private populateDefaultValuesIfMissing(deviceOptions: DeviceOptionsAny): DeviceOptionsAny {
		const options = Object.fromEntries(
			Object.entries({ ...deviceOptions.options }).filter(([_key, value]) => value !== '')
		)
		deviceOptions.options = { ...this.defaultDeviceOptions[deviceOptions.type], ...options }
		return deviceOptions
	}

	private getDeviceDebug(deviceOptions: DeviceOptionsAny): boolean {
		return deviceOptions.debug || this._coreHandler.logDebug || false
	}

	/**
	 * This function is a quick and dirty solution to load a still to the atem mixers.
	 * This does not serve as a proper implementation! And needs to be refactored
	 * // @todo: proper atem media management
	 * /Balte - 22-08
	 */
	uploadFilesToAtem(device: DeviceContainer<DeviceOptionsAny>, files: AtemMediaPoolAsset[]): void {
		if (!device || device.deviceType !== DeviceType.ATEM) {
			return
		}
		this.logger.data(files.map(({ path }) => path)).info(`Trying to load ${files.length} to atem:`)
		const options = device.deviceOptions.options as { host: string }
		if (!options || !options.host) {
			this.logger.data(options).debug('ATEM host options is missing from:')
			throw Error('ATEM host option not set')
		}
		this.logger.info(`Trying to upload files to ${options.host}`)
		const process = cp.spawn(`node`, [`./dist/atemUploader.js`, options.host, JSON.stringify(files)])
		process.stdout.on('data', (data) => this.logger.debug(data.toString()))
		process.stderr.on('data', (data) => this.logger.debug(data.toString()))
		process.on('close', () => process.removeAllListeners())
	}

	private _triggerUpdateExpectedPlayoutItems() {
		if (!this._initialized) return
		if (this._triggerUpdateExpectedPlayoutItemsTimeout) {
			clearTimeout(this._triggerUpdateExpectedPlayoutItemsTimeout)
		}
		this._triggerUpdateExpectedPlayoutItemsTimeout = setTimeout(() => {
			const { groupedExpectedItems, rundowns } = this.getExpectedPlayoutItems()
			this.tsr.getDevices().forEach((device) => {
				this.enqueueExpectedPlayoutItemsUpdate(groupedExpectedItems, rundowns, device.deviceId)
			})
		}, EXPECTED_PLAYOUT_ITEMS_DEBOUNCE_DELAY)
	}
	/**
	 * Go through and transform timeline and generalize the Core-specific things
	 * @param timeline
	 */
	private _transformTimeline(timeline: Array<TimelineObjGeneric>): TSRTimeline {
		// _transformTimeline (timeline: Array<TimelineObj>): Array<TimelineContentObject> | null {

		const transformObject = (obj: TimelineObjGeneric): TimelineContentObjectTmp => {
			// TODO - this cast to any feels dangerous. Are any of these 'fixes' necessary?
			const transformedObj: any = obj

			if (!transformedObj.content) transformedObj.content = {}
			if (transformedObj.isGroup) {
				if (!transformedObj.content.objects) transformedObj.content.objects = []
			}

			return transformedObj
		}

		// First, transform and convert timeline to a key-value store, for fast referencing:
		const objects: { [id: string]: TimelineContentObjectTmp } = {}
		_.each(timeline, (obj: TimelineObjGeneric) => {
			const transformedObj = transformObject(obj)
			objects[transformedObj.id] = transformedObj
		})

		// Go through all objects:
		const transformedTimeline: Array<TSRTimelineObj> = []
		_.each(objects, (obj: TimelineContentObjectTmp) => {
			if (!obj.inGroup) {
				// Add object to timeline
				delete obj.inGroup
				transformedTimeline.push(obj as TSRTimelineObj)
				return
			}
			const groupObj = objects[obj.inGroup]
			if (!groupObj) {
				// referenced group not found
				this.logger.error(`Referenced group "${obj.inGroup}" not found! Referenced by "${obj.id}"`)
				return
			}
			// Add object into group:
			if (!groupObj.children) groupObj.children = []
			if (groupObj.children) {
				delete obj.inGroup
				groupObj.children.push(obj)
			}
		})
		return transformedTimeline
	}

	private changedResults: PlayoutChangedResults | undefined = undefined
	private sendCallbacksTimeout: NodeJS.Timer | undefined = undefined

	private sendChangedResults = (): void => {
		this.sendCallbacksTimeout = undefined
		this._coreHandler.core
			.callMethod(PeripheralDeviceAPIMethods.playoutPlaybackChanged, [this.changedResults])
			.catch((error) => this.logger.data(error).error('Error in timelineCallback'))
		this.changedResults = undefined
	}

	private handleTSRTimelineCallback(
		time: number,
		objId: string,
		callbackName0: string,
		data: PartPlaybackCallbackData | PiecePlaybackCallbackData
	): void {
		if (
			![
				PlayoutChangedType.PART_PLAYBACK_STARTED,
				PlayoutChangedType.PART_PLAYBACK_STOPPED,
				PlayoutChangedType.PIECE_PLAYBACK_STARTED,
				PlayoutChangedType.PIECE_PLAYBACK_STOPPED,
			].includes(callbackName0 as PlayoutChangedType)
		) {
			// @ts-expect-error Untyped bunch of methods
			const method = PeripheralDeviceAPIMethods[callbackName]
			if (!method) {
				this.logger.error(`Unknown callback method '${callbackName0}'`)
				return
			}
			this._coreHandler.core
				.callMethod(method, [
					Object.assign({}, data, {
						objId: objId,
						time: time,
					}),
				])
				.catch((error) => this.logger.data(error).error('Error in timelineCallback:'))
			return
		}
		const callbackName = callbackName0 as PlayoutChangedType
		// debounce
		if (this.changedResults && this.changedResults.rundownPlaylistId !== data.rundownPlaylistId) {
			// The playlistId changed. Send what we have right away and reset:
			this._coreHandler.core
				.callMethod(PeripheralDeviceAPIMethods.playoutPlaybackChanged, [this.changedResults])
				.catch((error) => this.logger.data(error).error('Error in timelineCallback:'))
			this.changedResults = undefined
		}
		if (!this.changedResults) {
			this.changedResults = {
				rundownPlaylistId: data.rundownPlaylistId,
				changes: [],
			}
		}

		switch (callbackName) {
			case PlayoutChangedType.PART_PLAYBACK_STARTED:
			case PlayoutChangedType.PART_PLAYBACK_STOPPED:
				this.changedResults.changes.push({
					type: callbackName,
					objId,
					data: {
						time,
						partInstanceId: (data as PartPlaybackCallbackData).partInstanceId,
					},
				})
				break
			case PlayoutChangedType.PIECE_PLAYBACK_STARTED:
			case PlayoutChangedType.PIECE_PLAYBACK_STOPPED:
				this.changedResults.changes.push({
					type: callbackName,
					objId,
					data: {
						time,
						partInstanceId: (data as PiecePlaybackCallbackData).partInstanceId,
						pieceInstanceId: (data as PiecePlaybackCallbackData).pieceInstanceId,
					},
				})
				break
			default:
				assertNever(callbackName)
		}

		// Based on the use-case, we generally expect the callbacks to come in batches, so it only makes sense
		// to wait a little bit to collect the changed callbacks
		if (!this.sendCallbacksTimeout) {
			this.sendCallbacksTimeout = setTimeout(this.sendChangedResults, 20)
		}
	}
}

export function getHash(str: string): string {
	const hash = crypto.createHash('sha1')
	return hash.update(str).digest('base64').replace(/[+/=]/g, '_') // remove +/= from strings, because they cause troubles
}

export function stringifyIds(ids: string[]): string {
	return ids.map((id) => `"${id}"`).join(', ')
}
