import { addMigrationSteps } from './databaseMigration'
import { CURRENT_SYSTEM_VERSION } from './currentSystemVersion'
import { PieceInstances } from '../../lib/collections/PieceInstances'

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
		id: 'Change PieceInstances.dynamicallyInserted type',
		canBeRunAutomatically: true,
		validate: () => {
			return (
				PieceInstances.find({
					dynamicallyInserted: { $type: 'number' },
				}).count() > 0
			)
		},
		migrate: () => {
			PieceInstances.find({
				dynamicallyInserted: { $type: 'number' },
			}).forEach((pieceInstance) => {
				if (typeof pieceInstance.dynamicallyInserted !== 'number') {
					return
				}
				PieceInstances.update(pieceInstance._id, { $set: { dynamicallyInserted: { time: pieceInstance.dynamicallyInserted } } })
			})
		},
	},
])
