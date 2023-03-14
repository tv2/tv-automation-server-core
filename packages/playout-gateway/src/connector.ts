import { TSRHandler, TSRConfig } from './tsrHandler'
import { CoreHandler, CoreConfig } from './coreHandler'
import { Logger } from './logger'
import { Process } from './process'
import { InfluxConfig } from './influxdb'
import { PeripheralDeviceId } from '@sofie-automation/shared-lib/dist/core/model/Ids'

export interface Config {
	process: ProcessConfig
	device: DeviceConfig
	core: CoreConfig
	tsr: TSRConfig
	influx: InfluxConfig
}
export interface ProcessConfig {
	/** Will cause the Node application to blindly accept all certificates. Not recommenced unless in local, controlled networks. */
	unsafeSSL: boolean
	/** Paths to certificates to load, for SSL-connections */
	certificates: string[]
}
export interface DeviceConfig {
	deviceId: PeripheralDeviceId
	deviceToken: string
}
export class Connector {
	private tsrHandler: TSRHandler | undefined
	private coreHandler: CoreHandler | undefined
	private readonly logger: Logger
	private _process: Process | undefined

	constructor(logger: Logger) {
		this.logger = logger.tag(this.constructor.name)
	}

	public async init(config: Config): Promise<void> {
		try {
			this.logger.info('Initializing Process...')
			this._process = new Process(this.logger)
			this._process.init(config.process)
			this.logger.info('Process initialized')

			this.logger.info('Initializing Core...')
			this.coreHandler = new CoreHandler(this.logger, config.device)
			await this.coreHandler.init(config.core, this._process)
			this.logger.info('Core initialized')

			this.logger.info('Initializing TSR...')
			this.tsrHandler = new TSRHandler(this.logger)
			await this.tsrHandler.init(config.tsr, this.coreHandler)
			this.logger.info('TSR initialized')

			this.logger.info('Initialization done')
			return
		} catch (error: any) {
			this.logger.error('Error during initialization:', { data: error?.stack ?? error })

			try {
				if (this.coreHandler) {
					this.coreHandler
						.destroy()
						.catch((error) => this.logger.data(error).error('Failed destroying coreHandler:'))
				}
				if (this.tsrHandler) {
					this.tsrHandler
						.destroy()
						.catch((error) => this.logger.data(error).error('Failed destroying tsrHandler:'))
				}
			} catch (e) {
				// Handle the edge case where destroy() throws synchronously:
				this.logger.error(e)
			}

			this.logger.info('Shutting down in 10 seconds!')
			setTimeout(() => {
				// eslint-disable-next-line no-process-exit
				process.exit(0)
			}, 10 * 1000)
			return
		}
	}
}
