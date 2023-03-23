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
import { BlueprintId, ShowStyleVariantId } from '@sofie-automation/corelib/dist/dataModel/Ids'
import { ShowStyleVariant, ShowStyleVariants } from '../../lib/collections/ShowStyleVariants'
import { Blueprint } from '@sofie-automation/corelib/dist/dataModel/Blueprint'

interface BlueprintWithShowStyleConfigManifest extends Blueprint {
	showStyleConfigManifest: ConfigManifestEntry[]
}

export function createMigrationsForAddingMissingIdsInSelectFromColumnEntries(): MigrationStepBase[] {
	const blueprints = Blueprints.find({
		showStyleConfigManifest: { $exists: true },
	}).map((blueprint) => ({ blueprintId: blueprint._id, showStyleConfigManifest: blueprint.showStyleConfigManifest }))

	const baseMigrations: MigrationStepBase[] = createMigrationsForShowStyleBase(
		blueprints as BlueprintWithShowStyleConfigManifest[]
	)
	const variantMigrations: MigrationStepBase[] = createMigrationsForShowStylVariants(
		blueprints as BlueprintWithShowStyleConfigManifest[]
	)
	return [...baseMigrations, ...variantMigrations]
}

function createMigrationsForShowStyleBase(blueprints: BlueprintWithShowStyleConfigManifest[]): MigrationStepBase[] {
	return blueprints
		.map((blueprint) =>
			blueprint.showStyleConfigManifest.map((showStyleManifest) =>
				createShowStyleBlueprintConfigurationSelectFromColumnMigration(blueprint.blueprintId, showStyleManifest)
			)
		)
		.flat()
}

function createShowStyleBlueprintConfigurationSelectFromColumnMigration(
	blueprintId: BlueprintId,
	configManifestEntry: ConfigManifestEntry
): MigrationStepBase {
	return {
		id: `${blueprintId}.add.missing.id.to.select.from.column.for.${configManifestEntry.name}.${configManifestEntry.id}`,
		canBeRunAutomatically: true,
		validate: () => {
			const entryToMapFrom = findEntryToMapFromForShowStyleBase(blueprintId, configManifestEntry)
			// If we find an entry to map that means we have an id to map and should run the migration
			return !!entryToMapFrom
		},
		migrate: () => {
			const entryToMapFrom = findEntryToMapFromForShowStyleBase(blueprintId, configManifestEntry)
			if (!entryToMapFrom) {
				return
			}
			ShowStyleBases.update(
				{
					blueprintId,
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

function findEntryToMapFromForShowStyleBase(blueprintId: BlueprintId, configManifestEntry: ConfigManifestEntry) {
	const showStyle: ShowStyleBase | undefined = fetchShowStyleBase(blueprintId)
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

function fetchShowStyleBase(blueprintId: BlueprintId): ShowStyleBase | undefined {
	const showStyles = ShowStyleBases.find({
		blueprintId,
	}).fetch()
	if (!showStyles || showStyles.length === 0) {
		return undefined
	}
	return showStyles[0]
}

function createMigrationsForShowStylVariants(blueprints: BlueprintWithShowStyleConfigManifest[]): MigrationStepBase[] {
	return blueprints
		.map((blueprint) => {
			const showStyleBases = ShowStyleBases.find({ blueprintId: blueprint.blueprintId }).fetch()
			return showStyleBases.map((base) => {
				const showStyleVariants = ShowStyleVariants.find({ showStyleBaseId: base._id }).fetch()
				return showStyleVariants.map((variant) => {
					return blueprint.showStyleConfigManifest.map((showStyleManifest) =>
						createShowStyleVariantBlueprintConfigurationSelectFromColumnMigration(
							blueprint.blueprintId,
							showStyleManifest,
							variant
						)
					)
				})
			})
		})
		.flat(3)
}

function createShowStyleVariantBlueprintConfigurationSelectFromColumnMigration(
	blueprintId: BlueprintId,
	configManifestEntry: ConfigManifestEntry,
	variant: ShowStyleVariant
): MigrationStepBase {
	return {
		id: `${blueprintId}.variant.${variant.name}.add.missing.id.to.select.from.column.for.${configManifestEntry.name}.${configManifestEntry.id}`,
		canBeRunAutomatically: true,
		validate: () => {
			const entryToMapFrom = findEntryToMapFromForShowStyleVariant(blueprintId, configManifestEntry, variant._id)
			// If we find an entry to map that means we have an id to map and should run the migration
			return !!entryToMapFrom
		},
		migrate: () => {
			const entryToMapFrom = findEntryToMapFromForShowStyleVariant(blueprintId, configManifestEntry, variant._id)
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
	blueprintId: BlueprintId,
	configManifestEntry: ConfigManifestEntry,
	showStyleVariantId: ShowStyleVariantId
) {
	const showStyle: ShowStyleBase | undefined = fetchShowStyleBase(blueprintId)
	if (!showStyle) {
		return undefined
	}
	// Fetching the ShowStyleVariant again to ensure we work on updated data. Needed for validation, among others.
	const variant = fetchShowStyleVariant(showStyleVariantId)
	if (!variant) {
		return undefined
	}
	return findEntryToMapFrom(configManifestEntry, variant.blueprintConfig, showStyle.blueprintConfig)
}

function fetchShowStyleVariant(showStyleVariantId: ShowStyleVariantId): ShowStyleVariant | undefined {
	const showStyles = ShowStyleVariants.find({
		_id: showStyleVariantId,
	}).fetch()
	if (!showStyles || showStyles.length === 0) {
		return undefined
	}
	return showStyles[0]
}
