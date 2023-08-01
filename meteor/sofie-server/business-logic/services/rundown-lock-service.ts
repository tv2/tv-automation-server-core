import { RundownService } from './interfaces/rundown-service'
import { MisconfigurationException } from '../../model/exceptions/misconfiguration-exception'
import { RundownIsLockedException } from '../../model/exceptions/rundown-is-locked-exception'

const MINIMUM_TIME_BETWEEN_ACTIONS_IN_MS: number = 1000

export class RundownLockService implements RundownService {
	private static instance: RundownService

	public static getInstance(rundownService?: RundownService): RundownService {
		if (!this.instance) {
			if (!rundownService) {
				throw new MisconfigurationException('No RundownService provided')
			}
			this.instance = new RundownLockService(rundownService)
		}
		return this.instance
	}

	private rundownService: RundownService

	private lastActionExecutedAt: number

	private constructor(rundownService: RundownService) {
		this.rundownService = rundownService
	}

	private assertNotLocked(action: string): void {
		const currentTime: number = new Date().getTime()
		if (currentTime <= this.lastActionExecutedAt + MINIMUM_TIME_BETWEEN_ACTIONS_IN_MS) {
			throw new RundownIsLockedException(
				`Unable to do action: "${action}" - it has yet to be ${MINIMUM_TIME_BETWEEN_ACTIONS_IN_MS} ms since last action`
			)
		}
		this.lastActionExecutedAt = currentTime
	}

	public async activateRundown(rundownId: string): Promise<void> {
		this.assertNotLocked('activateRundown')
		return this.rundownService.activateRundown(rundownId)
	}

	public async deactivateRundown(rundownId: string): Promise<void> {
		this.assertNotLocked('deactivateRundown')
		return this.rundownService.deactivateRundown(rundownId)
	}

	public async executeAdLibPiece(rundownId: string, adLibPieceId: string): Promise<void> {
		this.assertNotLocked('executeAdLib')
		return this.rundownService.executeAdLibPiece(rundownId, adLibPieceId)
	}

	public async resetRundown(rundownId: string): Promise<void> {
		this.assertNotLocked('resetRundown')
		return this.rundownService.resetRundown(rundownId)
	}

	/**
	 * Not locking on SetNext since we need to be able to quickly select multiple nexts
	 */
	public async setNext(rundownId: string, segmentId: string, partId: string): Promise<void> {
		return this.rundownService.setNext(rundownId, segmentId, partId)
	}

	public async takeNext(rundownId: string): Promise<void> {
		this.assertNotLocked('takeNext')
		return this.rundownService.takeNext(rundownId)
	}
}
