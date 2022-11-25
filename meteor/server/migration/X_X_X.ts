import { addMigrationSteps } from './databaseMigration'
import { CURRENT_SYSTEM_VERSION } from './currentSystemVersion'
import { TriggeredActions } from '../../lib/collections/TriggeredActions'

/*
 * **************************************************************************************
 *
 *  These migrations are destined for the next release
 *
 * (This file is to be renamed to the correct version number when doing the release)
 *
 * **************************************************************************************
 */

export const addSteps = addMigrationSteps(CURRENT_SYSTEM_VERSION, [
	// Add some migrations!
	{
		id: 'Add "useLabelAsName" attribute to TriggeredActions',
		canBeRunAutomatically: true,
		validate: () => {
			return (
				TriggeredActions.find({
					useLabelAsName: { $exists: false },
				}).count() > 0
			)
		},
		migrate: () => {
			TriggeredActions.find({}).forEach((action) => {
				TriggeredActions.update(action._id, { $set: { useLabelAsName: false } })
			})
		},
	},
])
