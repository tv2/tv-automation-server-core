import { addMigrationSteps } from './databaseMigration'
import { PieceInstances } from '../../lib/collections/PieceInstances'
import { TriggeredActions } from '../../lib/collections/TriggeredActions'

// Release 46.1
export const addSteps = addMigrationSteps('1.46.1', [
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
				PieceInstances.update(pieceInstance._id, {
					$set: { dynamicallyInserted: { time: pieceInstance.dynamicallyInserted } },
				})
			})
		},
	},
	{
		id: 'Add "useNameForDisplay" attribute to TriggeredActions',
		canBeRunAutomatically: true,
		validate: () => {
			return (
				TriggeredActions.find({
					useNameForDisplay: { $exists: false },
				}).count() > 0
			)
		},
		migrate: () => {
			TriggeredActions.find({}).forEach((action) => {
				TriggeredActions.update(action._id, { $set: { useNameForDisplay: false } })
			})
		},
	},
])
