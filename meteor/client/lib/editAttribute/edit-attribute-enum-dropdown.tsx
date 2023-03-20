import { DropdownOption, EditAttributeDropdown } from './edit-attribute-dropdown'
import { IEditAttributeBaseProps } from './edit-attribute-base'
import * as React from 'react'
import { useMemo } from 'react'

interface EditAttributeEnumDropdownProps extends IEditAttributeBaseProps {
	options: object
}

export function EditAttributeEnumDropdown(props: EditAttributeEnumDropdownProps) {
	const options = useMemo(() => mapToDropdownOptions(props.options), props.options as any)
	return <EditAttributeDropdown {...props} options={options} useLabel={false} />
}

function mapToDropdownOptions(options: object): DropdownOption[] {
	return Object.entries(options)
		.filter(([enumName, _value]) => Number.isNaN(Number(enumName)))
		.map(([enumName, _value]) => ({ value: enumName }))
}
