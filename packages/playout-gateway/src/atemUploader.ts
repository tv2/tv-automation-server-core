/* eslint-disable no-process-exit */
// eslint-disable-next-line node/no-extraneous-import
import { Atem } from 'atem-connection'
import * as fs from 'fs'
import { AtemMediaPoolAsset, AtemMediaPoolType } from 'timeline-state-resolver'
import * as _ from 'underscore'
import * as path from 'path'
import { logger } from './logger'

const atemUploaderLogger = logger.tag('atemUploader')

/**
 * This script is a temporary implementation to upload media to the atem.
 * @todo: proper atem media management
 */

const ATEM_MAX_FILENAME_LENGTH = 63
const ATEM_MAX_CLIPNAME_LENGTH = 43

export class AtemUploadScript {
	private readonly connection: Atem

	constructor() {
		this.connection = new Atem()

		this.connection.on('error', (error) => atemUploaderLogger.data(error).error('A connection error occurred:'))
	}

	public async connect(ip: string): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			this.connection.once('connected', () => {
				resolve()
			})
			this.connection.connect(ip).catch((err) => {
				reject(err)
			})
		})
	}

	public async loadFile(fileUrl: string): Promise<Buffer> {
		return new Promise<Buffer>((resolve, reject) => {
			fs.readFile(fileUrl, (error, data) => {
				atemUploaderLogger.debug('got file')
				error ? reject(error) : resolve(data)
			})
		})
	}
	public async loadFiles(folder: string): Promise<Buffer[]> {
		const files = await fs.promises.readdir(folder)
		atemUploaderLogger.data(files).debug('Listed files')
		const loadBuffers = files.map(async (file) => fs.promises.readFile(path.join(folder, file)))
		const buffers = Promise.all(loadBuffers)

		atemUploaderLogger.data(buffers).debug('got files')
		return buffers
	}

	public checkIfFileOrClipExistsOnAtem(fileName: string, stillOrClipIndex: number, type: AtemMediaPoolType): boolean {
		atemUploaderLogger.data({ fileName, stillOrClipIndex, type }).debug('Checking if file or clip exists on atem')

		const still = this.connection.state?.media.stillPool[stillOrClipIndex]
		const clip = this.connection.state?.media.clipPool[stillOrClipIndex]
		let pool: typeof still | typeof clip
		if (type === AtemMediaPoolType.Still) pool = still
		else if (type === AtemMediaPoolType.Clip) pool = clip

		if (!pool) {
			throw new Error(`Atem appears to be missing the type '${type}'`)
		}

		if (!pool.isUsed) {
			return false
		}

		atemUploaderLogger.debug(`'${type}' is used.`)
		const comparisonName = fileName.substring(
			type === AtemMediaPoolType.Still ? -ATEM_MAX_FILENAME_LENGTH : -ATEM_MAX_CLIPNAME_LENGTH
		)
		const poolName = 'fileName' in pool ? pool.fileName : pool.name

		return poolName === comparisonName
	}

	public async uploadStillToAtem(fileName: string, fileData: Buffer, stillIndex: number): Promise<void> {
		fileName = fileName.substring(-ATEM_MAX_FILENAME_LENGTH) // cannot be longer than 63 chars
		if (this.checkIfFileOrClipExistsOnAtem(fileName, stillIndex, AtemMediaPoolType.Still)) {
			atemUploaderLogger.debug(`Still '${fileName} already exists on ATEM.`)
			return
		}

		atemUploaderLogger.debug(`'${fileName}' does not exist on ATEM.`)
		await this.connection.clearMediaPoolStill(stillIndex)
		await this.connection.uploadStill(stillIndex, fileData, fileName, '')
	}
	public async uploadClipToAtem(name: string, fileData: Buffer[], clipIndex: number): Promise<void> {
		name = name.substring(-ATEM_MAX_CLIPNAME_LENGTH) // cannot be longer than 43 chars
		if (this.checkIfFileOrClipExistsOnAtem(name, clipIndex, AtemMediaPoolType.Clip)) {
			atemUploaderLogger.debug(`'${name} already exists on ATEM.`)
			return
		}
		atemUploaderLogger.debug(`Clip '${name}' does not exist on ATEM.`)
		await this.connection.clearMediaPoolClip(clipIndex)
		await this.connection.uploadClip(clipIndex, fileData, name)
	}
}

atemUploaderLogger.debug('Setup AtemUploader...')
const singleton = new AtemUploadScript()
const assets: AtemMediaPoolAsset[] = JSON.parse(process.argv[3])
singleton.connect(process.argv[2]).then(
	async () => {
		atemUploaderLogger.debug('ATEM upload connected')

		for (const asset of assets) {
			// upload 1 by 1

			if (asset.position === undefined || isNaN(asset.position) || !_.isNumber(asset.position)) {
				atemUploaderLogger.error(`Skipping due to invalid media pool '${asset.path}'.`)
				continue
			}

			try {
				if (asset.type === AtemMediaPoolType.Still) {
					const fileData = await singleton.loadFile(asset.path)

					await singleton.uploadStillToAtem(asset.path, fileData, asset.position)
					atemUploaderLogger.debug(`Uploaded ATEM media to stillpool ${asset.position}.`)
				} else if (asset.type === AtemMediaPoolType.Clip) {
					const fileData = await singleton.loadFiles(asset.path)

					await singleton.uploadClipToAtem(asset.path, fileData, asset.position)
					atemUploaderLogger.debug(`Uploaded ATEM media to clippool ${asset.position}.`)
				}
			} catch (error) {
				atemUploaderLogger.data(error).error(`Failed to upload '${asset.path}'.`)
			}
		}

		atemUploaderLogger.debug('All media checked/uploaded, exiting...')
		process.exit(0)
	},
	() => process.exit(-1)
)
