import { ShowStyleVariant } from '../../../../lib/collections/ShowStyleVariants'
import { ShowStyleBase } from '../../../../lib/collections/ShowStyleBases'
import {
	ConfigItemValue,
	ConfigManifestEntry,
	ConfigManifestEntrySelectFromColumn,
	ConfigManifestEntryType,
} from '@sofie-automation/blueprints-integration'

class ShowStyleVariantConfigurationVerifier {
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
		return configuredVariantEntries.some(([configurationName, configuredValue]) =>
			this.hasInvalidValueFromShowStyleBase(
				configurationName,
				configuredValue,
				showStyleBase,
				blueprintConfigManifest
			)
		)
	}

	private hasInvalidValueFromShowStyleBase(
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

	private findSelectFromColumnManifestEntry(
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

	private isConfiguredValueInBaseConfiguration(
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
}

export default new ShowStyleVariantConfigurationVerifier()
