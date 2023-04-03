import { ShowStyleVariant } from '../../../../lib/collections/ShowStyleVariants'
import { ShowStyleBase } from '../../../../lib/collections/ShowStyleBases'
import {
	ConfigItemValue,
	ConfigManifestEntry,
	ConfigManifestEntrySelectFromColumn,
	ConfigManifestEntrySelectFromTableEntryWithComparisonMappings,
	ConfigManifestEntryType,
	TableConfigItemValue,
} from '@sofie-automation/blueprints-integration'
import ConfigManifestTableEntrySelector, {
	DEFAULT_VALUE_FOR_NO_AVAILABLE_OPTION,
} from './config-manifest-table-entry-selector'

class ShowStyleVariantConfigurationVerifier {
	private configManifestTableEntrySelector = ConfigManifestTableEntrySelector

	public isBlueprintConfigurationSelectedFromBaseInvalidForAllVariants(
		showStyleVariants: ShowStyleVariant[],
		showStyleBase: ShowStyleBase,
		blueprintConfigManifest: ConfigManifestEntry[]
	): boolean {
		return showStyleVariants.some((variant) =>
			this.isBlueprintConfigurationSelectedFromBaseInvalid(variant, showStyleBase, blueprintConfigManifest)
		)
	}

	public isBlueprintConfigurationSelectedFromBaseInvalid(
		showStyleVariant: ShowStyleVariant,
		showStyleBase: ShowStyleBase,
		blueprintConfigManifest: ConfigManifestEntry[]
	): boolean {
		const configuredVariantEntries: [string, any][] = Object.entries(showStyleVariant.blueprintConfig)
		return configuredVariantEntries.some(([configurationName, configuredValue]) => {
			return this.hasInvalidValueFromShowStyleBase(
				configurationName,
				configuredValue,
				showStyleBase,
				blueprintConfigManifest
			)
		})
	}

	private hasInvalidValueFromShowStyleBase(
		configurationName: string,
		configuredValue: any,
		showStyleBase: ShowStyleBase,
		blueprintConfigManifest: ConfigManifestEntry[],
		originalConfiguredValue?: any
	): boolean {
		return blueprintConfigManifest.some((configEntry) => {
			if (configEntry.id !== configurationName) {
				return false
			}
			switch (configEntry.type) {
				case ConfigManifestEntryType.TABLE: {
					if (!Array.isArray(configuredValue)) {
						return false
					}

					return configuredValue
						.flatMap((value) => Object.entries(value))
						.some(([configuredTableEntryName, configuredTableEntryValue]) => {
							return this.hasInvalidValueFromShowStyleBase(
								configuredTableEntryName,
								configuredTableEntryValue,
								showStyleBase,
								configEntry.columns,
								configuredValue
							)
						})
				}
				case ConfigManifestEntryType.SELECT_FROM_COLUMN: {
					return !this.isSelectFromColumnConfiguredValueInBaseConfiguration(
						configuredValue,
						showStyleBase,
						configEntry
					)
				}
				case ConfigManifestEntryType.SELECT_FROM_TABLE_ENTRY_WITH_COMPARISON_MAPPINGS: {
					return !this.isSelectFromTableEntryWithComparisonConfiguredValueInBaseConfiguration(
						configuredValue,
						showStyleBase,
						configEntry,
						originalConfiguredValue
					)
				}
				default: {
					return false
				}
			}
		})
	}

	private isSelectFromColumnConfiguredValueInBaseConfiguration(
		configuredValue: any,
		showStyleBase: ShowStyleBase,
		configManifestEntry: ConfigManifestEntry
	): boolean {
		const selectFromColumnManifestEntry = configManifestEntry as ConfigManifestEntrySelectFromColumn<boolean>
		const validConfigurationOptions: ConfigItemValue =
			showStyleBase.blueprintConfig[selectFromColumnManifestEntry.tableId]
		if (!validConfigurationOptions || !Array.isArray(validConfigurationOptions)) {
			return false
		}
		return validConfigurationOptions.some((option) => option['_id'] === configuredValue['value'] ?? configuredValue)
	}

	private isSelectFromTableEntryWithComparisonConfiguredValueInBaseConfiguration(
		configuredValue: any,
		showStyleBase: ShowStyleBase,
		configManifestEntry: ConfigManifestEntry,
		targetTable: any
	): boolean {
		if (
			configuredValue['value'] === DEFAULT_VALUE_FOR_NO_AVAILABLE_OPTION ||
			configuredValue === DEFAULT_VALUE_FOR_NO_AVAILABLE_OPTION
		) {
			return true
		}
		const manifestEntry =
			configManifestEntry as ConfigManifestEntrySelectFromTableEntryWithComparisonMappings<boolean>

		const sourceTable: TableConfigItemValue[] = showStyleBase.blueprintConfig[
			manifestEntry.sourceTableId
		] as any as TableConfigItemValue[]
		const validOptions = sourceTable.flatMap((row) =>
			this.configManifestTableEntrySelector.getOptionsFromSourceRow(row, targetTable[0], manifestEntry)
		)
		return validOptions.some((option) => option['value'] === configuredValue['value'] ?? configuredValue)
	}
}

export default new ShowStyleVariantConfigurationVerifier()
