import { addMigrationSteps } from './databaseMigration'
import { createMigrationsForAddingMissingIdsInSelectFromColumnEntries } from './addMissingIdsForSelectFromColumns'

export const addSteps = addMigrationSteps('46.2.1', [
	...createMigrationsForAddingMissingIdsInSelectFromColumnEntries()
])
