import {
	ComparisonMapping,
	ConfigManifestEntrySelectFromColumn,
	ConfigManifestEntrySelectFromTableEntryWithComparisonMappings,
	TableConfigItemValue,
} from '@sofie-automation/blueprints-integration'
import { ProtectedString } from '@sofie-automation/shared-lib/dist/lib/protectedString'
import { objectPathGet } from '@sofie-automation/corelib/dist/lib'
import { SelectOption } from '../ConfigManifestSettings'

export const DEFAULT_VALUE_FOR_NO_VIABLE_SELECTION = 'N/A'

class ConfigManifestTableEntrySelector {
	public getFilteredTableValuesFromComparison<DBInterface extends { _id: ProtectedString<any> }>(
		targetFullAttribute: string,
		item: ConfigManifestEntrySelectFromTableEntryWithComparisonMappings<boolean>,
		configPath: string,
		dbObject: DBInterface,
		alternateDbObject?: DBInterface
	): SelectOption[] {
		const sourceAttribute = `${configPath}.${item.sourceTableId}`
		const targetAttribute = `${targetFullAttribute}.${0}`

		const sourceTable: TableConfigItemValue[] =
			objectPathGet(dbObject, sourceAttribute) ?? objectPathGet(alternateDbObject, sourceAttribute)
		const targetRow: TableConfigItemValue =
			objectPathGet(dbObject, targetAttribute) ?? objectPathGet(alternateDbObject, targetAttribute)

		if (!Array.isArray(sourceTable) || !targetRow) {
			return []
		}

		const result = sourceTable.flatMap((sourceRow) => {
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
		})
		result.push({ value: DEFAULT_VALUE_FOR_NO_VIABLE_SELECTION, label: DEFAULT_VALUE_FOR_NO_VIABLE_SELECTION })
		return result
	}

	public getComparisonMapping(
		comparisonMappings: ComparisonMapping[],
		sourceRow: TableConfigItemValue
	): ComparisonMapping | undefined {
		return comparisonMappings.find((mapping) => this.isRowEntryAvailable(sourceRow, mapping.sourceColumnId))
	}

	public isRowEntryAvailable(tableRow: TableConfigItemValue, columnId: string): boolean {
		return tableRow[columnId] && tableRow[columnId].length > 0
	}

	public hasRowEntryWithValue(row: TableConfigItemValue, columnId: string): boolean {
		return typeof row === 'object' && row[columnId] !== undefined
	}

	public getSourceValuesFromComparisonMapping(
		sourceRow: TableConfigItemValue,
		targetRow: TableConfigItemValue,
		sourceValueColumnId: string,
		comparisonMapping: ComparisonMapping
	): SelectOption[] {
		const targetValue = targetRow[comparisonMapping.targetColumnId]

		const isMatched = sourceRow[comparisonMapping.sourceColumnId].some((sourceValue) => {
			if (!sourceValue || !targetValue) {
				return false
			}
			return sourceValue.label === targetValue.label
		})

		return isMatched ? sourceRow[sourceValueColumnId] : []
	}

	public getTableColumnValues<DBInterface extends { _id: ProtectedString<any> }>(
		item: ConfigManifestEntrySelectFromColumn<boolean>,
		configPath: string,
		dbObject: DBInterface,
		alternateDbObject?: DBInterface
	): SelectOption[] {
		const attribute = `${configPath}.${item.tableId}`
		const table: TableConfigItemValue[] =
			objectPathGet(dbObject, attribute) ?? objectPathGet(alternateDbObject, attribute)
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
