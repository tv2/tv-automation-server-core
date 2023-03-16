import { ShowStyleVariant } from '../../../../lib/collections/ShowStyleVariants'
import { ShowStyleBase } from '../../../../lib/collections/ShowStyleBases'
import {
	ConfigItemValue,
	ConfigManifestEntry,
	ConfigManifestEntrySelectFromColumn,
	ConfigManifestEntryType,
} from '@sofie-automation/blueprints-integration'

export class VariantConfigurationVerifier {
	public isBlueprintConfigurationSelectedFromBaseInvalid(
		showStyleVariant: ShowStyleVariant,
		showStyleBase: ShowStyleBase,
		blueprintConfigManifest: ConfigManifestEntry[]
	): boolean {
		const configuredVariantEntries: [string, any][] = Object.entries(showStyleVariant.blueprintConfig)
		return configuredVariantEntries.some(([configurationName, configuredValue]) =>
			this.hasConfigurationSelectedInvalidValueFromShowStyleBase(
				configurationName,
				configuredValue,
				showStyleBase,
				blueprintConfigManifest
			)
		)
	}

	hasConfigurationSelectedInvalidValueFromShowStyleBase(
		configurationName: string,
		configuredValue: any,
		showStyleBase: ShowStyleBase,
		blueprintConfigManifest: ConfigManifestEntry[]
	): boolean {
		const configuredBlueprintConfig = this.findSelectFromColumnManifestEntry(
			configurationName,
			blueprintConfigManifest
		)
		if (!configuredBlueprintConfig) {
			return false
		}
		return !this.isConfiguredValueInBaseConfiguration(configuredValue, showStyleBase, configuredBlueprintConfig)
	}

	findSelectFromColumnManifestEntry(
		configurationName: string,
		blueprintConfigManifest: ConfigManifestEntry[]
	): ConfigManifestEntry | undefined {
		return blueprintConfigManifest.find((configEntry) => {
			if (configEntry.id !== configurationName) {
				return false
			}
			return configEntry.type === ConfigManifestEntryType.SELECT_FROM_COLUMN
		})
	}

	isConfiguredValueInBaseConfiguration(
		configuredValue: any,
		showStyleBase: ShowStyleBase,
		configManifestEntry: ConfigManifestEntry
	): boolean {
		const selectFromColumnManifestEntry = configManifestEntry as ConfigManifestEntrySelectFromColumn<boolean>
		const validConfigurationOptions: ConfigItemValue =
			showStyleBase.blueprintConfig[selectFromColumnManifestEntry.tableId]
		if (!Array.isArray(validConfigurationOptions)) {
			throw new Error('ValidConfigurationOptions are not an array')
		}
		return validConfigurationOptions.some((option) => option['_id'] === configuredValue['value'] ?? configuredValue)
	}
}
