import { DropdownOption, EditAttributeDropdown } from './edit-attribute-dropdown'
import { IEditAttributeBaseProps } from './edit-attribute-base'
import * as React from 'react'
import { useMemo } from 'react'
import { EnumLike } from '@sofie-automation/corelib/dist/deviceConfig'

interface EditAttributeEnumDropdownProps extends IEditAttributeBaseProps {
	options: EnumLike
}

export function EditAttributeEnumDropdown(props: EditAttributeEnumDropdownProps) {
	const options: DropdownOption[] = useMemo(() => mapToDropdownOptions(props.options), [props.options])
	return <EditAttributeDropdown {...props} options={options} />
}

function mapToDropdownOptions(options: EnumLike): DropdownOption[] {
	return Object.entries(options)
		.filter(([enumName]) => Number.isNaN(Number(enumName)))
		.map(([enumName, value]) => ({ label: enumName, value }))
}
