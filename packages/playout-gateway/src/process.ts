import { Logger } from './logger'
import _ = require('underscore')
import * as fs from 'fs'
import { ProcessConfig } from './connector'

export class Process {
	private readonly logger: Logger

	public certificates: Buffer[] = []

	constructor(logger: Logger) {
		this.logger = logger.tag(this.constructor.name)
	}
	init(processConfig: ProcessConfig): void {
		if (processConfig.unsafeSSL) {
			this.logger.info('Disabling NODE_TLS_REJECT_UNAUTHORIZED, be sure to ONLY DO THIS ON A LOCAL NETWORK!')
			process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0'
		} else {
			// var rootCas = SSLRootCAs.create()
		}
		if (processConfig.certificates.length) {
			this.logger.info(`Loading certificates...`)
			_.each(processConfig.certificates, (certificate) => {
				try {
					this.certificates.push(fs.readFileSync(certificate))
					this.logger.info(`Using certificate '${certificate}'`)
				} catch (error) {
					this.logger.data(error).error(`Error loading certificate '${certificate}'`)
				}
			})
		}
	}
}
