import * as React from 'react'
import { IEditAttributeBaseProps } from './edit-attribute-base'
import { EditAttributeMultiSelect } from './edit-attribute-multi-select'
import { MultiSelectOption } from '../multiSelect'

interface EditAttributeEnumMultiSelectProps extends IEditAttributeBaseProps {
	options: object
}

export function EditAttributeEnumMultiSelect(props: EditAttributeEnumMultiSelectProps) {
	return <EditAttributeMultiSelect {...props} options={convertEnumToMultiSelectOptions(props.options)} />
}

function convertEnumToMultiSelectOptions(options: object): MultiSelectOption[] {
	return Object.entries(options)
		.filter(([enumName, _value]) => Number.isNaN(Number(enumName)))
		.map(([enumName, value]) => ({ value: value, label: enumName }))
}
