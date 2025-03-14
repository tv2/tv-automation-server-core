import {
	MosConnection,
	IMOSDevice,
	IMOSConnectionStatus,
	IMOSRunningOrder,
	IMOSROAck,
	MosString128,
	IMOSRunningOrderBase,
	IMOSRunningOrderStatus,
	IMOSStoryStatus,
	IMOSItemStatus,
	IMOSStoryAction,
	IMOSROStory,
	IMOSROAction,
	IMOSItemAction,
	IMOSItem,
	IMOSROReadyToAir,
	IMOSROFullStory,
	IConnectionConfig,
	IMOSDeviceConnectionOptions,
	MosDevice,
	IMOSListMachInfo,
} from 'mos-connection'
import * as Winston from 'winston'
import { CoreHandler, CoreMosDeviceHandler } from './coreHandler'
import { CollectionObj } from '@sofie-automation/server-core-integration'
import {
	DEFAULT_MOS_TIMEOUT_TIME,
	DEFAULT_MOS_HEARTBEAT_INTERVAL,
} from '@sofie-automation/shared-lib/dist/core/constants'

export interface MosConfig {
	self: IConnectionConfig
	// devices: Array<IMOSDeviceConnectionOptions>
}
export interface MosDeviceSettings {
	mosId: string
	devices: {
		[deviceId: string]: MosDeviceSettingsDevice
	}
	debugLogging: boolean
}
export interface MosDeviceSettingsDevice {
	primary: MosDeviceSettingsDeviceOptions
	secondary?: MosDeviceSettingsDeviceOptions
}
export interface MosDeviceSettingsDeviceOptions {
	id: string
	host: string
	timeout?: number
}

export class MosHandler {
	public mos: MosConnection | undefined

	public mosOptions: MosConfig | undefined
	public debugLogging = false

	private allMosDevices: { [id: string]: { mosDevice: IMOSDevice; coreMosHandler?: CoreMosDeviceHandler } } = {}
	private _ownMosDevices: { [deviceId: string]: MosDevice } = {}
	private _logger: Winston.Logger
	private _disposed = false
	private _settings?: MosDeviceSettings
	private _coreHandler: CoreHandler | undefined
	private _observers: Array<any> = []
	private _triggerupdateDevicesTimeout: any = null

	constructor(logger: Winston.Logger) {
		this._logger = logger
	}
	async init(config: MosConfig, coreHandler: CoreHandler): Promise<void> {
		this.mosOptions = config
		this._coreHandler = coreHandler
		/*{
			mosID: 'seff-tv-automation',
			acceptsConnections: true, // default:true
			// accepsConnectionsFrom: ['127.0.0.1'],
			profiles: {
				'0': true,
				'1': true,
				'2': true,
				'3': false,
				'4': false,
				'5': false,
				'6': false,
				'7': false
			}
		}
		*/
		if (!coreHandler) {
			throw Error('coreHandler is undefined!')
		}

		if (!coreHandler.core) {
			throw Error('coreHandler.core is undefined!')
		}

		const peripheralDevice = await coreHandler.core.getPeripheralDevice()

		this._settings = peripheralDevice.settings || {}

		await this._initMosConnection()

		if (!this._coreHandler) throw Error('_coreHandler is undefined!')
		this._coreHandler.onConnected(() => {
			// This is called whenever a connection to Core has been (re-)established
			this.setupObservers()
			this.sendStatusOfAllMosDevices()
		})
		this.setupObservers()

		return this._updateDevices()
	}
	async dispose(): Promise<void> {
		this._disposed = true
		if (this.mos) {
			return this.mos.dispose()
		} else {
			return Promise.resolve()
		}
	}
	setupObservers(): void {
		if (this._observers.length) {
			this._observers.forEach((obs) => {
				obs.stop()
			})
			this._observers = []
		}
		this._logger.info('Renewing observers')

		if (!this._coreHandler) {
			throw Error('_coreHandler is undefined!')
		}

		if (!this._coreHandler.core) {
			throw Error('_coreHandler.core is undefined!')
		}

		const deviceObserver = this._coreHandler.core.observe('peripheralDevices')
		deviceObserver.added = () => {
			this._deviceOptionsChanged()
		}
		deviceObserver.changed = () => {
			this._deviceOptionsChanged()
		}
		deviceObserver.removed = () => {
			this._deviceOptionsChanged()
		}
		this._observers.push(deviceObserver)

		this._deviceOptionsChanged()
	}
	// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
	debugLog(msg: any, ...args: any[]): void {
		if (this.debugLogging) {
			this._logger.debug(msg, ...args)
		}
	}
	private _deviceOptionsChanged() {
		const peripheralDevice = this.getThisPeripheralDevice()
		if (peripheralDevice) {
			const settings: MosDeviceSettings = peripheralDevice.settings || {}
			if (this.debugLogging !== settings.debugLogging) {
				this._logger.info('Changing debugLogging to ' + settings.debugLogging)

				this.debugLogging = settings.debugLogging

				if (!this.mos) {
					throw Error('mos is undefined!')
				}
				this.mos.setDebug(settings.debugLogging)

				if (settings.debugLogging) {
					this._logger.level = 'debug'
				} else {
					this._logger.level = 'info'
				}
				this._logger.info('log level ' + this._logger.level)
				this._logger.info('test log info')
				console.log('test console.log')
				this._logger.debug('test log debug')
			}
		}
		if (this._triggerupdateDevicesTimeout) {
			clearTimeout(this._triggerupdateDevicesTimeout)
		}
		this._triggerupdateDevicesTimeout = setTimeout(() => {
			this._updateDevices().catch((e) => {
				this._logger.error(e)
			})
		}, 20)
	}
	private async _initMosConnection(): Promise<void> {
		if (this._disposed) return Promise.resolve()
		if (!this._settings) throw Error('Mos-Settings are not set')

		this._logger.info('Initializing MosConnection...')

		if (!this.mosOptions) {
			throw Error('mosOptions is undefined!')
		}

		const connectionConfig: IConnectionConfig = this.mosOptions.self

		if (!this._settings.mosId) throw Error('mosId missing in settings!')
		connectionConfig.mosID = this._settings.mosId

		this.mos = new MosConnection(connectionConfig)
		this.mos.on('rawMessage', (source, type, message) => {
			// Filter out heartbeat messages, to reduce log amount:
			if (`${message}`.indexOf('<heartbeat') >= 0) {
				return
			}
			this.debugLog('rawMessage', source, type, message)
		})
		this.mos.on('info', (message: any) => {
			this._logger.info(message)
		})
		this.mos.on('error', (error: any) => {
			this._logger.error(error)
		})
		this.mos.on('warning', (warning: any) => {
			this._logger.error(warning)
		})

		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		this.mos.onConnection(async (mosDevice: IMOSDevice): Promise<void> => {
			// a new connection to a device has been made
			this._logger.info('new mosConnection established: ' + mosDevice.idPrimary + ', ' + mosDevice.idSecondary)
			try {
				this.allMosDevices[mosDevice.idPrimary] = { mosDevice: mosDevice }

				if (!this._coreHandler) throw Error('_coreHandler is undefined!')

				const coreMosHandler = await this._coreHandler.registerMosDevice(mosDevice, this)
				// this._logger.info('mosDevice registered -------------')
				// Setup message flow between the devices:

				this.allMosDevices[mosDevice.idPrimary].coreMosHandler = coreMosHandler

				// Initial Status check:
				const connectionStatus = mosDevice.getConnectionStatus()
				coreMosHandler.onMosConnectionChanged(connectionStatus) // initial check
				// Profile 0: -------------------------------------------------
				mosDevice.onConnectionChange((newStatus: IMOSConnectionStatus) => {
					//  MOSDevice >>>> Core
					coreMosHandler.onMosConnectionChanged(newStatus)
				})
				coreMosHandler.onMosConnectionChanged(mosDevice.getConnectionStatus())
				mosDevice.onRequestMachineInfo(async () => {
					// MOSDevice >>>> Core
					return coreMosHandler.getMachineInfo()
				})

				// Profile 1: -------------------------------------------------
				/*
					mosDevice.onRequestMOSObject((objId: string) => {
						// coreMosHandler.fetchMosObject(objId)
						// return Promise<IMOSObject | null>
					})
					*/
				// onRequestMOSObject: (cb: (objId: string) => Promise<IMOSObject | null>) => void
				// onRequestAllMOSObjects: (cb: () => Promise<Array<IMOSObject>>) => void
				// getMOSObject: (objId: string) => Promise<IMOSObject>
				// getAllMOSObjects: () => Promise<Array<IMOSObject>>
				// Profile 2: -------------------------------------------------
				mosDevice.onCreateRunningOrder(async (ro: IMOSRunningOrder) => {
					// MOSDevice >>>> Core
					return this._getROAck(ro.ID, coreMosHandler.mosRoCreate(ro))
				})
				mosDevice.onReplaceRunningOrder(async (ro: IMOSRunningOrder) => {
					// MOSDevice >>>> Core
					return this._getROAck(ro.ID, coreMosHandler.mosRoReplace(ro))
				})
				mosDevice.onDeleteRunningOrder(async (runningOrderId: MosString128) => {
					// MOSDevice >>>> Core
					return this._getROAck(runningOrderId, coreMosHandler.mosRoDelete(runningOrderId))
				})
				mosDevice.onMetadataReplace(async (ro: IMOSRunningOrderBase) => {
					// MOSDevice >>>> Core
					return this._getROAck(ro.ID, coreMosHandler.mosRoMetadata(ro))
				})
				mosDevice.onRunningOrderStatus(async (status: IMOSRunningOrderStatus) => {
					// MOSDevice >>>> Core
					return this._getROAck(status.ID, coreMosHandler.mosRoStatus(status))
				})
				mosDevice.onStoryStatus(async (status: IMOSStoryStatus) => {
					// MOSDevice >>>> Core
					return this._getROAck(status.RunningOrderId, coreMosHandler.mosRoStoryStatus(status))
				})
				mosDevice.onItemStatus(async (status: IMOSItemStatus) => {
					// MOSDevice >>>> Core
					return this._getROAck(status.RunningOrderId, coreMosHandler.mosRoItemStatus(status))
				})
				mosDevice.onROInsertStories(async (Action: IMOSStoryAction, Stories: Array<IMOSROStory>) => {
					// MOSDevice >>>> Core
					return this._getROAck(Action.RunningOrderID, coreMosHandler.mosRoStoryInsert(Action, Stories))
				})
				mosDevice.onROInsertItems(async (Action: IMOSItemAction, Items: Array<IMOSItem>) => {
					// MOSDevice >>>> Core
					return this._getROAck(Action.RunningOrderID, coreMosHandler.mosRoItemInsert(Action, Items))
				})
				mosDevice.onROReplaceStories(async (Action: IMOSStoryAction, Stories: Array<IMOSROStory>) => {
					// MOSDevice >>>> Core
					return this._getROAck(Action.RunningOrderID, coreMosHandler.mosRoStoryReplace(Action, Stories))
				})
				mosDevice.onROReplaceItems(async (Action: IMOSItemAction, Items: Array<IMOSItem>) => {
					// MOSDevice >>>> Core
					return this._getROAck(Action.RunningOrderID, coreMosHandler.mosRoItemReplace(Action, Items))
				})
				mosDevice.onROMoveStories(async (Action: IMOSStoryAction, Stories: Array<MosString128>) => {
					// MOSDevice >>>> Core
					return this._getROAck(Action.RunningOrderID, coreMosHandler.mosRoStoryMove(Action, Stories))
				})
				mosDevice.onROMoveItems(async (Action: IMOSItemAction, Items: Array<MosString128>) => {
					// MOSDevice >>>> Core
					return this._getROAck(Action.RunningOrderID, coreMosHandler.mosRoItemMove(Action, Items))
				})
				mosDevice.onRODeleteStories(async (Action: IMOSROAction, Stories: Array<MosString128>) => {
					// MOSDevice >>>> Core
					return this._getROAck(Action.RunningOrderID, coreMosHandler.mosRoStoryDelete(Action, Stories))
				})
				mosDevice.onRODeleteItems(async (Action: IMOSStoryAction, Items: Array<MosString128>) => {
					// MOSDevice >>>> Core
					return this._getROAck(Action.RunningOrderID, coreMosHandler.mosRoItemDelete(Action, Items))
				})
				mosDevice.onROSwapStories(
					async (Action: IMOSROAction, StoryID0: MosString128, StoryID1: MosString128) => {
						// MOSDevice >>>> Core
						return this._getROAck(
							Action.RunningOrderID,
							coreMosHandler.mosRoStorySwap(Action, StoryID0, StoryID1)
						)
					}
				)
				mosDevice.onROSwapItems(
					async (Action: IMOSStoryAction, ItemID0: MosString128, ItemID1: MosString128) => {
						// MOSDevice >>>> Core
						return this._getROAck(
							Action.RunningOrderID,
							coreMosHandler.mosRoItemSwap(Action, ItemID0, ItemID1)
						)
					}
				)
				mosDevice.onReadyToAir(async (Action: IMOSROReadyToAir) => {
					// MOSDevice >>>> Core
					return this._getROAck(Action.ID, coreMosHandler.mosRoReadyToAir(Action))
				})
				// ----------------------------------------------------------------
				// Init actions
				/*
					mosDevice.getMachineInfo()
						.then((machineInfo: IMOSListMachInfo) => {
						})
					*/
				// Profile 3: -------------------------------------------------
				// Profile 4: -------------------------------------------------
				// onStory: (cb: (story: IMOSROFullStory) => Promise<any>) => void
				mosDevice.onRunningOrderStory(async (story: IMOSROFullStory) => {
					// MOSDevice >>>> Core
					return this._getROAck(story.RunningOrderId, coreMosHandler.mosRoFullStory(story))
				})
			} catch (e) {
				this._logger.error('Error:', e)
			}
		})

		// Open mos-server for connections:
		await this.mos.init()
	}
	private sendStatusOfAllMosDevices() {
		// Send an update to Core of the status of all mos devices
		for (const handler of Object.values(this.allMosDevices)) {
			if (handler.coreMosHandler) {
				handler.coreMosHandler.onMosConnectionChanged(handler.mosDevice.getConnectionStatus())
			}
		}
	}
	private getThisPeripheralDevice(): CollectionObj | undefined {
		if (!this._coreHandler) {
			throw Error('_coreHandler is undefined!')
		}

		if (!this._coreHandler.core) {
			throw Error('_coreHandler.core is undefined')
		}

		const peripheralDevices = this._coreHandler.core.getCollection('peripheralDevices')
		return peripheralDevices.findOne(this._coreHandler.core.deviceId)
	}
	private async _updateDevices(): Promise<void> {
		if (this._disposed) return Promise.resolve()
		if (!this.mos) {
			await this._initMosConnection()
		}

		const peripheralDevice = this.getThisPeripheralDevice()

		if (peripheralDevice) {
			const settings: MosDeviceSettings = peripheralDevice.settings || {}

			const devices = settings.devices || {}

			const devicesToAdd: { [id: string]: MosDeviceSettingsDevice } = {}
			const devicesToRemove: { [id: string]: true } = {}

			for (const [deviceId, device] of Object.entries(devices)) {
				if (device) {
					if (device.secondary) {
						// If the host isn't set, don't use secondary:
						if (!device.secondary.host || !device.secondary.id) delete device.secondary
					}

					const oldDevice: MosDevice | null = this._getDevice(deviceId)

					if (!oldDevice) {
						this._logger.info('Initializing new device: ' + deviceId)
						devicesToAdd[deviceId] = device
					} else {
						if (
							(oldDevice.primaryId || '') !== device.primary.id ||
							(oldDevice.primaryHost || '') !== device.primary.host ||
							(oldDevice.secondaryId || '') !== ((device.secondary || { id: '' }).id || '') ||
							(oldDevice.secondaryHost || '') !== ((device.secondary || { host: '' }).host || '')
						) {
							this._logger.info('Re-initializing device: ' + deviceId)
							devicesToRemove[deviceId] = true
							devicesToAdd[deviceId] = device
						}
					}
				}
			}

			for (const [deviceId, oldDevice] of Object.entries(this._ownMosDevices)) {
				if (oldDevice && !devices[deviceId]) {
					this._logger.info('Un-initializing device: ' + deviceId)
					devicesToRemove[deviceId] = true
				}
			}

			await Promise.all(
				Object.keys(devicesToRemove).map(async (deviceId) => {
					return this._removeDevice(deviceId)
				})
			)

			await Promise.all(
				Object.entries(devicesToAdd).map(async ([deviceId, device]) => {
					return this._addDevice(deviceId, device)
				})
			)
		}
	}
	private async _addDevice(deviceId: string, deviceOptions: IMOSDeviceConnectionOptions): Promise<MosDevice> {
		if (this._getDevice(deviceId)) {
			// the device is already there
			throw new Error('Unable to add device "' + deviceId + '", because it already exists!')
		}

		if (!this.mos) {
			throw Error('mos is undefined, call _initMosConnection first!')
		}

		deviceOptions = JSON.parse(JSON.stringify(deviceOptions)) // deep clone

		// Note: This is useful to do when debugging locally, and running a mos-server on localhost:
		// deviceOptions.primary.ports = {
		// 	lower: 11540,
		// 	upper: 11541,
		// 	query: 11542,
		// }
		deviceOptions.primary.timeout = deviceOptions.primary.timeout || DEFAULT_MOS_TIMEOUT_TIME

		deviceOptions.primary.heartbeatInterval =
			deviceOptions.primary.heartbeatInterval || DEFAULT_MOS_HEARTBEAT_INTERVAL

		const mosDevice: MosDevice = await this.mos.connect(deviceOptions)
		this._ownMosDevices[deviceId] = mosDevice

		try {
			const getMachineInfoUntilConnected = async (): Promise<IMOSListMachInfo> =>
				mosDevice.requestMachineInfo().catch(async (e: any) => {
					if (
						e &&
						((e + '').match(/no connection available for failover/i) ||
							(e + '').match(/failover connection/i))
					) {
						// TODO: workaround (mos.connect resolves too soon, before the connection is actually initialted)
						return new Promise((resolve) => {
							setTimeout(() => {
								resolve(getMachineInfoUntilConnected())
							}, 2000)
						})
					} else {
						throw e
					}
				})

			const machInfo = await getMachineInfoUntilConnected()
			this._logger.info('Connected to Mos-device', machInfo)
			const machineId: string | undefined = machInfo.ID && machInfo.ID.toString()
			if (
				!(
					machineId === deviceOptions.primary.id ||
					(deviceOptions.secondary && machineId === deviceOptions.secondary.id)
				)
			) {
				throw new Error(
					'Mos-device has ID "' +
						machineId +
						'" but specified ncs-id is "' +
						(deviceOptions.primary.id || (deviceOptions.secondary || { id: '' }).id) +
						'"'
				)
			}
			return mosDevice
		} catch (e) {
			// something went wrong during init:
			if (!this.mos) {
				throw Error('mos is undefined!')
			}

			this.mos.disposeMosDevice(mosDevice).catch((e2) => {
				this._logger.error(e2)
			})
			throw e
		}
	}
	private async _removeDevice(deviceId: string): Promise<void> {
		const mosDevice = this._getDevice(deviceId) as MosDevice

		delete this._ownMosDevices[deviceId]
		if (mosDevice) {
			if (!this.mos) {
				throw Error('mos is undefined!')
			}

			const mosDevice0 =
				this.mos.getDevice(mosDevice.idPrimary) ||
				(mosDevice.idSecondary && this.mos.getDevice(mosDevice.idSecondary))

			if (mosDevice0) {
				await this.mos.disposeMosDevice(mosDevice)
				if (!this._coreHandler) throw Error('_coreHandler is undefined!')
				await this._coreHandler.unRegisterMosDevice(mosDevice)

				delete this._ownMosDevices[mosDevice.idPrimary]
				if (mosDevice.idSecondary) delete this._ownMosDevices[mosDevice.idSecondary]
			} else {
				// device not found in mosConnection
			}
		} else {
			// no device found
		}
		return Promise.resolve()
	}
	private _getDevice(deviceId: string): MosDevice | null {
		return this._ownMosDevices[deviceId] || null
	}
	private async _getROAck(roId: MosString128, p: Promise<IMOSROAck>) {
		return p
			.then(() => {
				const roAck: IMOSROAck = {
					ID: roId,
					Status: new MosString128('OK'),
					Stories: [], // Array<IMOSROAckStory> // todo: implement this later (?) (unknown if we really need to)
				}
				return roAck
			})
			.catch((err) => {
				this._logger.error('ROAck error:', err)
				const roAck: IMOSROAck = {
					ID: roId,
					Status: new MosString128('Error: ' + err.toString()),
					Stories: [], // Array<IMOSROAckStory> // todo: implement this later (?) (unknown if we really need to)
				}
				return roAck
			})
	}
}
