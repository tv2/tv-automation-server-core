import { basename, dirname } from 'path'
// eslint-disable-next-line node/no-missing-import
import { ConsoleVault, FileVault } from '@tv2media/logger/node'
import { Vault, Level, PlainTextFormat } from '@tv2media/logger'

import { logPath } from '../config'
import { CustomJsonFormat } from './custom-json-format'
import { Logger } from './logger'
export { Logger, Level } from '@tv2media/logger'

const DEFAULT_LOG_LEVEL = Level.TRACE

export const logger = getLogger(logPath)

function getLogger(logPath: string | undefined): Logger {
	const vaults = getVaults(logPath)
	const logger = new Logger(vaults)
	hijackConsole(logger)
	return logger
}

function getVaults(logPath: string | undefined): Vault[] {
	return logPath ? getVaultsWithLogPath(logPath) : getVaultsWithoutLogPath()
}

function getVaultsWithLogPath(logPath: string): Vault[] {
	const consoleVault = new ConsoleVault({
		level: DEFAULT_LOG_LEVEL,
		format: new PlainTextFormat(),
		isFormatLocked: false,
	})

	const fileName = getFileName(logPath)
	const directory = dirname(logPath)
	const fileVault = new FileVault({
		level: DEFAULT_LOG_LEVEL,
		format: new CustomJsonFormat(),
		directory,
		fileName,
		useRotation: false,
		isFormatLocked: true,
	})

	return [consoleVault, fileVault]
}

function getFileName(logPath: string): string {
	return basename(logPath).replace(/\.log$/, '')
}

function getVaultsWithoutLogPath(): Vault[] {
	const consoleVault = new ConsoleVault({
		level: DEFAULT_LOG_LEVEL,
		format: new PlainTextFormat(),
		isFormatLocked: false,
	})

	return [consoleVault]
}

function hijackConsole(logger: Logger): void {
	console.log = getConsoleLogFunction(logger)
	console.warn = getConsoleLogFunction(logger)
	console.error = getConsoleLogFunction(logger)
}

function getConsoleLogFunction(logger: Logger): (...args: unknown[]) => void {
	return (...args: unknown[]): void => {
		if (args.length < 1) {
			return
		}
		logger.debug(args)
	}
}
