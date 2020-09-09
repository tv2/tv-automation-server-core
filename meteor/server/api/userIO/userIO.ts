import * as _ from 'underscore'
import { MeteorCall } from '../../../lib/api/methods'
import { protectString } from '../../../lib/lib'
import { RundownPlaylists } from '../../../lib/collections/RundownPlaylists'
import { DBPartInstance } from '../../../lib/collections/PartInstances'
import { FindOptions } from '../../../lib/typings/meteor'
import { AdLibActions } from '../../../lib/collections/AdLibActions'

export namespace UserIOActions {
	export async function userIOTake(): Promise<void> {
		MeteorCall.userAction.take('take', protectString('RHGChPdlm2MiJbnszRrew6zCJdI_'))
		console.log(
			'Rundown Playlistst :',
			RundownPlaylists.find().map((item: any, index: number) => {
				console.log('Rundown Id ', index + 1, ' :', item.name)
			})
		)
	}

	export async function userIOAdLibActionStart(): Promise<any> {
		const modifier: FindOptions<DBPartInstance> = {
			fields: {},
		}

		let adlibActions = AdLibActions.find().fetch()
		// console.log('Part Instances :', adlibActions)

		MeteorCall.userAction.executeAction(
			'whatShouldThisBe?',
			protectString('RHGChPdlm2MiJbnszRrew6zCJdI_'),
			adlibActions[0].actionId,
			adlibActions[0].userData
		)
		/*
		console.log(
			'AdlibActions :',
			adlibActions
		)
		*/
		return adlibActions
	}
}
