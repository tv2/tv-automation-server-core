// eslint-disable-next-line node/no-missing-import
import { DefaultLogger } from '@tv2media/logger/node'
import { Environment, Format, PlainTextFormat } from '@tv2media/logger'
import { CustomJsonFormat } from './custom-json-format'

export class Logger extends DefaultLogger {
	getEnvironmentFormat(environment: Environment): Format {
		switch (environment) {
			case Environment.PRODUCTION:
			case Environment.STAGING:
				return new CustomJsonFormat()
			case Environment.DEVELOPMENT:
			case Environment.LOCAL:
				return new PlainTextFormat()
		}
	}
}
