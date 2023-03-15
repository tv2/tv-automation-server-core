import { IEditAttributeBaseProps } from './edit-attribute-base'
import { DropdownOption, EditAttributeDropdown } from './edit-attribute-dropdown'
import * as React from 'react'

interface EditAttributeTextDropdownProps extends IEditAttributeBaseProps {
	options: string[]
	defaultNoneSelectedValue?: string
}

export function EditAttributeTextDropdown(props: EditAttributeTextDropdownProps) {
	return (
		<EditAttributeDropdown
			{...props}
			options={mapToDropdownOptions(props.options)}
			mutateDisplayValue={mapDefaultNotSelectedValue(props.defaultNoneSelectedValue)}
			useLabel={false}
		/>
	)
}

function mapToDropdownOptions(options: string[]): DropdownOption[] {
	console.log(options)
	return options.map((option) => ({ value: option }))
}

function mapDefaultNotSelectedValue(defaultValue?: string): (v: any) => any {
	return (value) => (value === undefined ? { id: defaultValue, displayValue: defaultValue } : value)
}
