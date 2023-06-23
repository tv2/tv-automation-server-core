import { RundownService } from './interfaces/rundown-service'
import { ServerClientAPI } from '../../../server/api/client'
import { Meteor } from 'meteor/meteor'
import { MethodContextAPI } from '../../../lib/api/methods'
import { StudioJobs } from '@sofie-automation/corelib/dist/worker/studio'
import { RundownPlaylistId } from '@sofie-automation/shared-lib/dist/core/model/Ids'

export class SofieCoreMeteorRundownService implements RundownService {
	takeNext(rundownId: string): void {
		const rundownPlaylistId: RundownPlaylistId = rundownId as unknown as RundownPlaylistId
		ServerClientAPI.runUserActionInLogForPlaylistOnWorker(
			this.getMeteorMethodContext(),
			'TakeEvent',
			new Date().getTime(),
			rundownPlaylistId,
			() => {
				// Do nothing
			},
			StudioJobs.TakeNextPart,
			{
				playlistId: rundownPlaylistId,
				fromPartInstanceId: null
			}
		)
	}

	private getMeteorMethodContext(): MethodContextAPI {
		return {
			userId: null,
			connection: this.createMeteorConnection(),
			isSimulation: false,
			setUserId: () => {
				// Do nothing
			},
			unblock: () => {
				// Do nothing
			}
		}
	}

	private createMeteorConnection(): Meteor.Connection {
		return {
			id: 'randomId',
			close: () => {
				// Do nothing
			},
			onClose: () => {
				// Do nothing
			},
			clientAddress: '',
			httpHeaders: {}
		}
	}

	setNext(_rundownId: string, _partId: string): void {
		throw new Error(`NotImplementedException: Method not yet implemented in: ${SofieCoreMeteorRundownService.name}`)
	}

	resetRundown(rundownId: string): void {
		const rundownPlaylistId: RundownPlaylistId = rundownId as unknown as RundownPlaylistId
		ServerClientAPI.runUserActionInLogForPlaylistOnWorker(
			this.getMeteorMethodContext(),
			'ResetEvent',
			new Date().getTime(),
			rundownPlaylistId,
			() => {
				// Do nothing
			},
			StudioJobs.ResetRundownPlaylist,
			{
				playlistId: rundownPlaylistId,
			}
		)
	}
}
