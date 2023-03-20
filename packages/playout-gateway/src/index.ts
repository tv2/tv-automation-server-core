import { Connector } from './connector'
import { config, disableWatchdog } from './config'
import { logger } from './logger'

console.log('process started') // This is a message all Sofie processes log upon startup
const indexLogger = logger.tag('index')

// Because the default NodeJS-handler sucks and won't display error properly
process.on('warning', (error: unknown) => indexLogger.data(error).error('Unhandled warning:'))

logger.info(
	'\n------------------------------------------------------------------\n' +
		'Starting Playout Gateway.\n' +
		`Core:          ${config.core.host}:${config.core.port}\n` +
		`Watchdog:      ${disableWatchdog ? 'disabled' : 'enabled'}\n` +
		'------------------------------------------------------------------'
)
const connector = new Connector(logger)
connector.init(config).catch((error) => indexLogger.data(error).error('Failed initializing the Connector:'))
