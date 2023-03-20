import { IEditAttributeBaseProps } from './edit-attribute-base'
import { DropdownOption, EditAttributeDropdown } from './edit-attribute-dropdown'
import * as React from 'react'
import { useMemo } from 'react'

interface EditAttributeTextDropdownProps extends IEditAttributeBaseProps {
	options: string[]
	defaultNoneSelectedValue?: string
}

export function EditAttributeTextDropdown(props: EditAttributeTextDropdownProps) {
	const dropdownOptions: DropdownOption[] = useMemo(() => mapToDropdownOptions(props.options), props.options)

	return (
		<EditAttributeDropdown
			{...props}
			options={dropdownOptions}
			mutateDisplayValue={mapDefaultNoneSelectedValue(props.defaultNoneSelectedValue)}
		/>
	)
}

function mapToDropdownOptions(options: string[]): DropdownOption[] {
	return options.map((option) => ({ value: option }))
}

function mapDefaultNoneSelectedValue(defaultValue?: string): (v: any) => any {
	return (value) => (value === undefined ? { id: defaultValue, displayValue: defaultValue } : value)
}
