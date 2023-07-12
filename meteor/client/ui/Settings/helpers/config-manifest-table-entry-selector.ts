import {
	ComparisonMapping,
	ConfigManifestEntrySelectFromColumn,
	ConfigManifestEntrySelectFromTableEntryWithComparisonMappings,
	TableConfigItemValue,
} from '@sofie-automation/blueprints-integration'
import { ProtectedString } from '@sofie-automation/shared-lib/dist/lib/protectedString'
import { objectPathGet } from '@sofie-automation/corelib/dist/lib'
import { SelectOption } from '../ConfigManifestSettings'

export const DEFAULT_VALUE_FOR_NO_AVAILABLE_OPTION = 'N/A'

class ConfigManifestTableEntrySelector {
	public getFilteredSelectOptionsFromComparison<DBInterface extends { _id: ProtectedString<any> }>(
		targetFullAttribute: string,
		item: ConfigManifestEntrySelectFromTableEntryWithComparisonMappings<boolean>,
		configPath: string,
		databaseObject: DBInterface,
		alternateDatabaseObject?: DBInterface
	): SelectOption[] {
		const sourceAttribute = `${configPath}.${item.sourceTableId}`
		const targetAttribute = `${targetFullAttribute}.${0}`

		const sourceTable: TableConfigItemValue[] =
			objectPathGet(databaseObject, sourceAttribute) ?? objectPathGet(alternateDatabaseObject, sourceAttribute)
		const targetRow: TableConfigItemValue =
			objectPathGet(databaseObject, targetAttribute) ?? objectPathGet(alternateDatabaseObject, targetAttribute)

		if (!Array.isArray(sourceTable) || !targetRow) {
			return []
		}

		const options = sourceTable.flatMap((sourceRow) => this.getOptionsFromSourceRow(sourceRow, targetRow, item))
		options.push({ value: DEFAULT_VALUE_FOR_NO_AVAILABLE_OPTION, label: DEFAULT_VALUE_FOR_NO_AVAILABLE_OPTION })
		return this.removeDuplicateOptions(options)
	}

	private removeDuplicateOptions(options: SelectOption[]): SelectOption[] {
		const map: Map<string, SelectOption> = new Map(options.map((option) => [option.value, option]))
		return [...map.values()]
	}

	public getOptionsFromSourceRow(
		sourceRow: TableConfigItemValue,
		targetRow: TableConfigItemValue,
		item: ConfigManifestEntrySelectFromTableEntryWithComparisonMappings<boolean>
	): SelectOption[] {
		if (!this.hasRowEntryWithValue(sourceRow, item.sourceColumnIdWithValue)) {
			return []
		}
		const comparisonMapping = this.getComparisonMapping(item.comparisonMappings, sourceRow)
		if (!comparisonMapping) {
			return []
		}

		return this.getSourceValuesFromComparisonMapping(
			sourceRow,
			targetRow,
			item.sourceColumnIdWithValue,
			comparisonMapping
		)
	}

	private getComparisonMapping(
		comparisonMappings: ComparisonMapping[],
		sourceRow: TableConfigItemValue
	): ComparisonMapping | undefined {
		return comparisonMappings.find((mapping) => this.isRowEntryAvailable(sourceRow, mapping.sourceColumnId))
	}

	private isRowEntryAvailable(tableRow: TableConfigItemValue, columnId: string): boolean {
		return tableRow[columnId] && tableRow[columnId].length > 0
	}

	private hasRowEntryWithValue(row: TableConfigItemValue, columnId: string): boolean {
		return typeof row === 'object' && row[columnId] !== undefined
	}

	private getSourceValuesFromComparisonMapping(
		sourceRow: TableConfigItemValue,
		targetRow: TableConfigItemValue,
		sourceValueColumnId: string,
		comparisonMapping: ComparisonMapping
	): SelectOption[] {
		const targetValue = targetRow[comparisonMapping.targetColumnId]

		const isMatch = sourceRow[comparisonMapping.sourceColumnId].some((sourceValue) => {
			if (!sourceValue || !targetValue) {
				return false
			}
			return sourceValue.label === targetValue.label
		})

		return isMatch ? sourceRow[sourceValueColumnId] : []
	}

	public getTableColumnValues<DBInterface extends { _id: ProtectedString<any> }>(
		item: ConfigManifestEntrySelectFromColumn<boolean>,
		configPath: string,
		databaseObject: DBInterface,
		alternateDatabaseObject?: DBInterface
	): SelectOption[] {
		const attribute = `${configPath}.${item.tableId}`
		const table: TableConfigItemValue[] =
			objectPathGet(databaseObject, attribute) ?? objectPathGet(alternateDatabaseObject, attribute)
		if (!Array.isArray(table)) {
			return []
		}
		return table
			.filter((row) => typeof row === 'object' && row[item.columnId] !== undefined)
			.map((row) => ({
				value: row['_id'],
				label: row[item.columnId],
			}))
	}
}

export default new ConfigManifestTableEntrySelector()
