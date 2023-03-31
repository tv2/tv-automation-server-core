import { DropdownOption, EditAttributeDropdown } from './edit-attribute-dropdown'
import { IEditAttributeBaseProps } from './edit-attribute-base'
import * as React from 'react'
import { useMemo } from 'react'

interface EditAttributeEnumDropdownProps extends IEditAttributeBaseProps {
	options: object
}

export function EditAttributeEnumDropdown(props: EditAttributeEnumDropdownProps) {
	const options: DropdownOption[] = useMemo(() => mapToDropdownOptions(props.options), [props.options])
	return <EditAttributeDropdown {...props} options={options} />
}

function mapToDropdownOptions(options: object): DropdownOption[] {
	return Object.entries(options)
		.filter(([enumName, _value]) => Number.isNaN(Number(enumName)))
		.map(([enumName, value]) => ({ value: enumName, alternativeValue: value + '' }))
}
