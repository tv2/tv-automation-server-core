import { RundownService } from '../interfaces/rundown-service'
import { ServerClientAPI } from '../../../../server/api/client'
import { Meteor } from 'meteor/meteor'
import { MethodContextAPI } from '../../../../lib/api/methods'
import { StudioJobs } from '@sofie-automation/corelib/dist/worker/studio'
import { RundownPlaylistId } from '@sofie-automation/shared-lib/dist/core/model/Ids'

export class SofieCoreMeteorRundownService implements RundownService {

	public async activateRundown(_rundownId: string): Promise<void> {
		throw new Error('Not implemented exception')
	}

	public async takeNext(rundownId: string): Promise<void> {
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

	public async setNext(_rundownId: string, _partId: string): Promise<void> {
		throw new Error('Not implemented exception')
	}

	public async resetRundown(rundownId: string): Promise<void> {
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

	public async deactivateRundown(_rundownId: string): Promise<void> {
		throw new Error('Not implemented exception')
	}

	public executeAdLibPiece(_rundownId: string, _adLibId: string): Promise<void> {
		throw new Error('Not implemented exception')
	}
}
