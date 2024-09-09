import { TSRConfig, TSRHandler } from './tsrHandler'
import { CoreConfig, CoreHandler } from './coreHandler'
import { Logger } from './logger'
import { Process } from './process'
import { InfluxConfig } from './influxdb'
import { PeripheralDeviceId } from '@sofie-automation/shared-lib/dist/core/model/Ids'
import * as Koa from 'koa'
import * as KoaRouter from 'koa-router'

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

interface KoaContext {
	query: Record<string, string | string[] | undefined>
	body: any
}

export class Connector {
	private tsrHandler: TSRHandler | undefined
	private coreHandler: CoreHandler | undefined
	private readonly logger: Logger
	private _process: Process | undefined

	constructor(logger: Logger) {
		this.logger = logger.tag(this.constructor.name)
		this.setupKoaEndpoints()
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
		} catch (error: unknown) {
			this.logger.data(error).error('Error during initialization:')

			this.teardown()
		}
	}

	private teardown(): void {
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
		} catch (error) {
			// Handle the edge case where destroy() throws synchronously:
			this.logger.data(error).error('An error occurred during teardown.')
		}

		this.logger.info('Shutting down in 10 seconds!')
		setTimeout(() => {
			// eslint-disable-next-line no-process-exit
			process.exit(0)
		}, 10 * 1000)
	}

	/* eslint-disable @typescript-eslint/no-inferrable-types */
	/* eslint-disable @typescript-eslint/no-empty-function */
	private setupKoaEndpoints(): void {
		const koaRouter: KoaRouter = new KoaRouter()
		this.setupDevicesMakeReadyEndpoint(koaRouter)
		this.setupDevicesStandDownEndpoint(koaRouter)

		const port: number = 3009
		const koaApp: Koa = new Koa()

		koaApp.use(koaRouter.routes()).use(koaRouter.allowedMethods())
		koaApp.listen(port, () => {})
	}

	/* eslint-disable @typescript-eslint/prefer-as-const */
	private setupDevicesMakeReadyEndpoint(router: KoaRouter): KoaRouter {
		const okToDestroyStuffQueryParameterName: 'okToDestroyStuff' = 'okToDestroyStuff'
		const activeRundownIdParameterName: 'activeRundownId' = 'activeRundownId'

		router.post(`/devicesMakeReady`, async (context: KoaContext): Promise<void> => {
			const okToDestroyStuff: boolean = context.query[okToDestroyStuffQueryParameterName] === 'true'
			const activeRundownId: string | string[] | undefined = context.query[activeRundownIdParameterName]
			await this.coreHandler?.devicesMakeReady(
				okToDestroyStuff,
				Array.isArray(activeRundownId) ? activeRundownId[0] : activeRundownId
			)

			context.body = 'DevicesMakeReady called!'
		})
		return router
	}

	private setupDevicesStandDownEndpoint(router: KoaRouter): KoaRouter {
		router.post('/devicesStandDown', async (context: KoaContext): Promise<void> => {
			const okToDestroyStuff: boolean = true // We are cleaning up, so it's always okay to destroy stuff.
			await this.coreHandler?.devicesStandDown(okToDestroyStuff)

			context.body = 'DevicesStandDown Called!'
		})
		return router
	}
}
