import { Job } from './job'
import { Conductor, ExpectedPlayoutItem, ExpectedPlayoutItemContent } from 'timeline-state-resolver'
import _ = require('underscore')
import { CollectionObj } from '@sofie-automation/server-core-integration'

export class UpdateExpectedPlayoutItemsJob extends Job<void, void> {
	protected artifacts: undefined

	constructor(
		private deviceId: string,
		private conductor: Conductor,
		private expectedPlayoutItems: Record<string, CollectionObj[]>,
		private rundowns: Record<string, CollectionObj>
	) {
		super()
	}

	async run(): Promise<void> {
		const deviceContainer = this.conductor.getDevice(this.deviceId)
		if (!deviceContainer) {
			throw new Error(`Device '${this.deviceId}' does not exist or is not initialized`)
		}
		if (!(await deviceContainer.device.supportsExpectedPlayoutItems)) {
			return
		}
		const expectedPlayoutItemsForDeviceType = this.expectedPlayoutItems[deviceContainer.deviceType]
		if (!expectedPlayoutItemsForDeviceType) {
			return
		}
		await deviceContainer.device.handleExpectedPlayoutItems(
			_.map(expectedPlayoutItemsForDeviceType, (item): ExpectedPlayoutItem => {
				const itemContent: ExpectedPlayoutItemContent = item.content
				return {
					...itemContent,
					rundownId: item.rundownId,
					playlistId: item.rundownId && this.rundowns[item.rundownId]?.playlistId,
					baseline: item.baseline,
				}
			})
		)
	}
}
