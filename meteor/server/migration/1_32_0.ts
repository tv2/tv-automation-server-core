import { addMigrationSteps } from './databaseMigration'
import { ensureCollectionProperty } from './lib'
import { getCoreSystem } from '../../lib/collections/CoreSystem'
import { dropDeprecatedDatabases, getDeprecatedDatabases } from './deprecatedDatabases/1_32_0'
import semver from 'semver'
import * as _ from 'underscore'
import { CollectionName } from '@sofie-automation/corelib/dist/dataModel/Collections'

// Release 32 (2021-05-05)
export const addSteps = addMigrationSteps('1.32.0', [
	ensureCollectionProperty(CollectionName.Studios, {}, 'packageContainers', {}),
	ensureCollectionProperty(CollectionName.Studios, {}, 'previewContainerIds', {}),
	ensureCollectionProperty(CollectionName.Studios, {}, 'thumbnailContainerIds', {}),

	{
		id: 'Drop removed collections r32',
		canBeRunAutomatically: true,
		validate: () => {
			const databaseSystem = getCoreSystem()

			// Only run this if version is under 1.13.0, in order to not create the deprecated databases
			if (databaseSystem && semver.satisfies(databaseSystem.version, '<1.32.0')) {
				const dbs = getDeprecatedDatabases()

				if (dbs) {
					let foundAnything: string | null = null
					_.find(_.keys(dbs), (collectionName) => {
						const collection = dbs[collectionName]
						if (collection.findOne()) {
							foundAnything = collectionName
							return true
						}
						return false
					})
					if (foundAnything) return `Deprecated collection "${foundAnything}" is not empty`
				}
			}
			return false
		},
		migrate: () => {
			const dbs = getDeprecatedDatabases()

			if (dbs) {
				dropDeprecatedDatabases()
			}
		},
	},
])
