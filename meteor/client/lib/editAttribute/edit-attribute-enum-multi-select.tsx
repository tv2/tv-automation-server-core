import * as React from 'react'
import { IEditAttributeBaseProps } from './edit-attribute-base'
import { EditAttributeMultiSelect } from './edit-attribute-multi-select'
import { MultiSelectOption } from '../multiSelect'
import { useMemo } from 'react'

interface EditAttributeEnumMultiSelectProps extends IEditAttributeBaseProps {
	options: object
}

export function EditAttributeEnumMultiSelect(props: EditAttributeEnumMultiSelectProps) {
	const options: MultiSelectOption[] = useMemo(() => convertEnumToMultiSelectOptions(props.options), [props.options])
	return <EditAttributeMultiSelect {...props} options={options} />
}

function convertEnumToMultiSelectOptions(options: object): MultiSelectOption[] {
	return Object.entries(options)
		.filter(([enumName, _value]) => Number.isNaN(Number(enumName)))
		.map(([enumName, value]) => ({ value: value, label: enumName }))
}
