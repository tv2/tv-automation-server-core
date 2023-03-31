import { addMigrationSteps } from './databaseMigration'
import { CURRENT_SYSTEM_VERSION } from './currentSystemVersion'
import { ShowStyleVariant, ShowStyleVariants } from '../../lib/collections/ShowStyleVariants'
import { PieceInstances } from '../../lib/collections/PieceInstances'
import { TriggeredActions } from '../../lib/collections/TriggeredActions'
import { createMigrationsForAddingMissingIdsInSelectFromColumnEntries } from './addMissingIdsForSelectFromColumns'

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
		id: 'Add missing ranks to ShowStyleVariants',
		canBeRunAutomatically: true,
		validate: () => {
			return (
				ShowStyleVariants.find({
					_rank: { $exists: false },
				}).count() > 0
			)
		},
		migrate: () => {
			ShowStyleVariants.find({
				_rank: { $exists: false },
			}).forEach((variant: ShowStyleVariant, index: number) => {
				ShowStyleVariants.upsert(variant._id, {
					$set: {
						_rank: index,
					},
				})
			})
		},
	},
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
	...createMigrationsForAddingMissingIdsInSelectFromColumnEntries(),
])
