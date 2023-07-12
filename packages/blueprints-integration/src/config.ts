import { DeviceType } from 'timeline-state-resolver-types'
import { ConfigItemValue, TableConfigItemValue } from './common'
import { SourceLayerType } from './content'

export enum ConfigManifestEntryType {
	STRING = 'string',
	MULTILINE_STRING = 'multiline_string',
	INT = 'int',
	FLOAT = 'float',
	BOOLEAN = 'boolean',
	ENUM = 'enum',
	TABLE = 'table',
	SELECT = 'select',
	SOURCE_LAYERS = 'source_layers',
	LAYER_MAPPINGS = 'layer_mappings',
	SELECT_FROM_COLUMN = 'select_from_column',
	SELECT_FROM_TABLE_ENTRY_WITH_COMPARISON_MAPPINGS = 'select_from_table_entry_with_comparison_mappings',
	JSON = 'json',
}

export type BasicConfigManifestEntry =
	| ConfigManifestEntryString
	| ConfigManifestEntryMultilineString
	| ConfigManifestEntryInt
	| ConfigManifestEntryFloat
	| ConfigManifestEntryBoolean
	| ConfigManifestEntryEnum
	| ConfigManifestEntrySelectFromOptions<true>
	| ConfigManifestEntrySelectFromOptions<false>
	| ConfigManifestEntrySelectFromColumn<true>
	| ConfigManifestEntrySelectFromColumn<false>
	| ConfigManifestEntrySelectFromTableEntryWithComparisonMappings<true>
	| ConfigManifestEntrySelectFromTableEntryWithComparisonMappings<false>
	| ConfigManifestEntrySourceLayers<true>
	| ConfigManifestEntrySourceLayers<false>
	| ConfigManifestEntryLayerMappings<true>
	| ConfigManifestEntryLayerMappings<false>
	| ConfigManifestEntryJson

export type ConfigManifestEntry = BasicConfigManifestEntry | ConfigManifestEntryTable

export interface ConfigManifestEntryBase {
	id: string
	name: string
	description: string
	type: ConfigManifestEntryType
	required: boolean
	defaultVal: ConfigItemValue
	hint?: string
}
export interface ConfigManifestEntryString extends ConfigManifestEntryBase {
	type: ConfigManifestEntryType.STRING
	defaultVal: string
}

/** Text area, each line entered is a string in an array */
export interface ConfigManifestEntryMultilineString extends ConfigManifestEntryBase {
	type: ConfigManifestEntryType.MULTILINE_STRING
	defaultVal: string[]
}
export interface ConfigManifestEntryInt extends ConfigManifestEntryBase {
	type: ConfigManifestEntryType.INT
	defaultVal: number
	/** Zero-based values will be stored in the database (and reported to blueprints) as values starting from 0, however,
	 * 	when rendered in settings pages they will appear as value + 1
	 */
	zeroBased?: boolean
}
export interface ConfigManifestEntryFloat extends ConfigManifestEntryBase {
	type: ConfigManifestEntryType.FLOAT
	defaultVal: number
}
export interface ConfigManifestEntryBoolean extends ConfigManifestEntryBase {
	type: ConfigManifestEntryType.BOOLEAN
	defaultVal: boolean
}
export interface ConfigManifestEntryEnum extends ConfigManifestEntryBase {
	type: ConfigManifestEntryType.ENUM
	options: string[]
	defaultVal: string
}
export interface ConfigManifestEntryJson extends ConfigManifestEntryBase {
	type: ConfigManifestEntryType.JSON
	defaultVal: string
}
export interface ConfigManifestEntryTable extends ConfigManifestEntryBase {
	type: ConfigManifestEntryType.TABLE
	columns: (BasicConfigManifestEntry & {
		/** Column rank (left to right, lowest to highest) */
		rank: number
	})[]
	defaultVal: TableConfigItemValue
	disableRowManipulation?: boolean
}

interface ConfigManifestEntrySelectBase<Multiple extends boolean> extends ConfigManifestEntryBase {
	defaultVal: Multiple extends true ? string[] : string
	multiple: Multiple
}

export interface ConfigManifestEntrySelectFromOptions<Multiple extends boolean>
	extends ConfigManifestEntrySelectBase<Multiple> {
	type: ConfigManifestEntryType.SELECT
	options: string[]
}

export interface ConfigManifestEntrySelectFromColumn<Multiple extends boolean>
	extends ConfigManifestEntrySelectBase<Multiple> {
	type: ConfigManifestEntryType.SELECT_FROM_COLUMN
	/** The id of a ConfigManifestEntryTable in the same config manifest */
	tableId: string
	/** The id of a BasicConfigManifestEntry in the table */
	columnId: string
}

export type ComparisonMapping = { targetColumnId: string; sourceColumnId: string }

export interface ConfigManifestEntrySelectFromTableEntryWithComparisonMappings<Multiple extends boolean>
	extends ConfigManifestEntrySelectBase<Multiple> {
	type: ConfigManifestEntryType.SELECT_FROM_TABLE_ENTRY_WITH_COMPARISON_MAPPINGS

	sourceTableId: string

	comparisonMappings: ComparisonMapping[]

	sourceColumnIdWithValue: string
}

export interface ConfigManifestEntrySourceLayers<Multiple extends boolean>
	extends ConfigManifestEntrySelectBase<Multiple> {
	type: ConfigManifestEntryType.SOURCE_LAYERS
	filters?: {
		sourceLayerTypes?: SourceLayerType[]
	}
}
export interface ConfigManifestEntryLayerMappings<Multiple extends boolean>
	extends ConfigManifestEntrySelectBase<Multiple> {
	type: ConfigManifestEntryType.LAYER_MAPPINGS
	filters?: {
		deviceTypes?: DeviceType[]
	}
}
