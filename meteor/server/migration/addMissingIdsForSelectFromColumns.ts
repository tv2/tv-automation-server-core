import { Blueprints } from '../../lib/collections/Blueprints'
import {
	ConfigItemValue,
	ConfigManifestEntry,
	ConfigManifestEntrySelectFromColumn,
	ConfigManifestEntryType,
	IBlueprintConfig,
	MigrationStepBase,
	TableConfigItemValue,
} from '@sofie-automation/blueprints-integration'
import { ShowStyleBase, ShowStyleBases } from '../../lib/collections/ShowStyleBases'
import { ShowStyleBaseId, ShowStyleVariantId } from '@sofie-automation/corelib/dist/dataModel/Ids'
import { ShowStyleVariant, ShowStyleVariants } from '../../lib/collections/ShowStyleVariants'

export function createMigrationsForAddingMissingIdsInSelectFromColumnEntries(): MigrationStepBase[] {
	const blueprints = Blueprints.find({
		showStyleConfigManifest: { $exists: true },
	}).map((blueprint) => ({ blueprintId: blueprint._id, showStyleConfigManifest: blueprint.showStyleConfigManifest }))

	return blueprints
		.map((blueprint) => {
			if (!blueprint.showStyleConfigManifest) {
				return []
			}
			const showStyleBases = ShowStyleBases.find({ blueprintId: blueprint.blueprintId }).fetch()
			return showStyleBases.map((showStyleBase) => [
				...createMigrationsForShowStyleBase(showStyleBase._id, blueprint.showStyleConfigManifest!),
				...createMigrationsForShowStylVariants(showStyleBase._id, blueprint.showStyleConfigManifest!),
			])
		})
		.flat(2)
}

function createMigrationsForShowStyleBase(
	showStyleBaseId: ShowStyleBaseId,
	showStyleConfigManifest: ConfigManifestEntry[]
): MigrationStepBase[] {
	return showStyleConfigManifest.map((showStyleManifest) =>
		createShowStyleBlueprintConfigurationSelectFromColumnMigration(showStyleBaseId, showStyleManifest)
	)
}

function createShowStyleBlueprintConfigurationSelectFromColumnMigration(
	showStyleBaseId: ShowStyleBaseId,
	configManifestEntry: ConfigManifestEntry
): MigrationStepBase {
	return {
		id: `${showStyleBaseId}.add.missing.id.to.select.from.column.for.${configManifestEntry.name}.${configManifestEntry.id}`,
		canBeRunAutomatically: true,
		validate: () => {
			const entryToMapFrom = findEntryToMapFromForShowStyleBase(showStyleBaseId, configManifestEntry)
			// If we find an entry to map that means we have an id to map and should run the migration
			return !!entryToMapFrom
		},
		migrate: () => {
			const entryToMapFrom = findEntryToMapFromForShowStyleBase(showStyleBaseId, configManifestEntry)
			if (!entryToMapFrom) {
				return
			}
			ShowStyleBases.update(
				{
					_id: showStyleBaseId,
				},
				{
					$set: {
						[`blueprintConfig.${configManifestEntry.id}`]: {
							value: entryToMapFrom._id,
							label: entryToMapFrom[
								(configManifestEntry as ConfigManifestEntrySelectFromColumn<false>).columnId
							],
						},
					},
				}
			)
		},
	}
}

function findEntryToMapFromForShowStyleBase(
	showStyleBaseId: ShowStyleBaseId,
	configManifestEntry: ConfigManifestEntry
) {
	const showStyle: ShowStyleBase | undefined = ShowStyleBases.findOne(showStyleBaseId)
	if (!showStyle) {
		return undefined
	}
	return findEntryToMapFrom(configManifestEntry, showStyle.blueprintConfig, showStyle.blueprintConfig)
}

function findEntryToMapFrom(
	configManifestEntry: ConfigManifestEntry,
	configToVerify: IBlueprintConfig,
	configToFetchFrom: IBlueprintConfig
) {
	if (configManifestEntry.type !== ConfigManifestEntryType.SELECT_FROM_COLUMN) {
		return undefined
	}

	const configToVerifyUsesId: ConfigItemValue = configToVerify[configManifestEntry.id]
	if (!configToVerifyUsesId || typeof configToVerifyUsesId === 'object') {
		return undefined
	}

	const tableToSelectFrom: TableConfigItemValue = configToFetchFrom[
		configManifestEntry.tableId
	] as TableConfigItemValue
	if (!tableToSelectFrom) {
		return undefined
	}
	return tableToSelectFrom.find((row) => row[configManifestEntry.columnId] === configToVerifyUsesId)
}

function createMigrationsForShowStylVariants(
	showStyleBaseId: ShowStyleBaseId,
	showStyleConfigManifest: ConfigManifestEntry[]
): MigrationStepBase[] {
	const showStyleVariants = ShowStyleVariants.find({ showStyleBaseId: showStyleBaseId }).fetch()
	return showStyleVariants
		.map((variant) => {
			return showStyleConfigManifest.map((showStyleManifest) =>
				createShowStyleVariantBlueprintConfigurationSelectFromColumnMigration(
					showStyleBaseId,
					showStyleManifest,
					variant
				)
			)
		})
		.flat(1)
}

function createShowStyleVariantBlueprintConfigurationSelectFromColumnMigration(
	showStyleBaseId: ShowStyleBaseId,
	configManifestEntry: ConfigManifestEntry,
	variant: ShowStyleVariant
): MigrationStepBase {
	return {
		id: `${variant._id}.variant.${variant.name}.add.missing.id.to.select.from.column.for.${configManifestEntry.name}.${configManifestEntry.id}`,
		canBeRunAutomatically: true,
		validate: () => {
			const entryToMapFrom = findEntryToMapFromForShowStyleVariant(
				showStyleBaseId,
				configManifestEntry,
				variant._id
			)
			// If we find an entry to map that means we have an id to map and should run the migration
			return !!entryToMapFrom
		},
		migrate: () => {
			const entryToMapFrom = findEntryToMapFromForShowStyleVariant(
				showStyleBaseId,
				configManifestEntry,
				variant._id
			)
			if (!entryToMapFrom) {
				return
			}
			ShowStyleVariants.update(
				{
					_id: variant._id,
				},
				{
					$set: {
						[`blueprintConfig.${configManifestEntry.id}`]: {
							value: entryToMapFrom._id,
							label: entryToMapFrom[
								(configManifestEntry as ConfigManifestEntrySelectFromColumn<false>).columnId
							],
						},
					},
				}
			)
		},
	}
}

function findEntryToMapFromForShowStyleVariant(
	showStyleBaseId: ShowStyleBaseId,
	configManifestEntry: ConfigManifestEntry,
	showStyleVariantId: ShowStyleVariantId
) {
	const showStyle: ShowStyleBase | undefined = ShowStyleBases.findOne(showStyleBaseId)
	if (!showStyle) {
		return undefined
	}
	// Fetching the ShowStyleVariant again to ensure we work on updated data. Needed for validation, among others.
	const variant = ShowStyleVariants.findOne(showStyleVariantId)
	if (!variant) {
		return undefined
	}
	return findEntryToMapFrom(configManifestEntry, variant.blueprintConfig, showStyle.blueprintConfig)
}
