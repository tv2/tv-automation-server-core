import { Meteor } from 'meteor/meteor'
import { registerClassToMeteorMethods } from '../../methods'
import { NewPlayoutAPI, PlayoutAPIMethods } from '../../../lib/api/playout'
import { ServerPlayoutAPI } from './playout'
import { getCurrentTime } from '../../../lib/lib'
import { logger } from '../../logging'
import { StudioId } from '../../../lib/collections/Studios'
import { MethodContextAPI } from '../../../lib/api/methods'
import { Settings } from '../../../lib/Settings'
import { QueueStudioJob } from '../../worker/worker'
import { StudioJobs } from '@sofie-automation/corelib/dist/worker/studio'

class ServerPlayoutAPIClass extends MethodContextAPI implements NewPlayoutAPI {
	async updateStudioBaseline(studioId: StudioId): Promise<string | false> {
		const res = await QueueStudioJob(StudioJobs.UpdateStudioBaseline, studioId, {})
		return res.complete
	}
	async shouldUpdateStudioBaseline(studioId: StudioId) {
		return ServerPlayoutAPI.shouldUpdateStudioBaseline(this, studioId)
	}
}
registerClassToMeteorMethods(PlayoutAPIMethods, ServerPlayoutAPIClass, false)

if (!Settings.enableUserAccounts) {
	// Temporary methods
	Meteor.methods({
		debug__printTime: () => {
			const now = getCurrentTime()
			logger.debug(new Date(now))
			return now
		},
	})
}
