import { MultiSelect, MultiSelectOption } from '../multiSelect'
import ClassNames from 'classnames'
import * as React from 'react'
import { EditAttributeBase, IEditAttributeBaseProps, wrapEditAttribute } from './edit-attribute-base'

interface EditAttributeMultiSelectProps extends IEditAttributeBaseProps {
	options: MultiSelectOption[]
}

export function EditAttributeMultiSelect(props: EditAttributeMultiSelectProps) {
	return <WrappedEditAttributeMultiSelect {...props} />
}

const WrappedEditAttributeMultiSelect = wrapEditAttribute(
	class EditAttributeMultiSelect extends EditAttributeBase {
		constructor(props) {
			super(props)

			this.handleChange = this.handleChange.bind(this)
		}

		private handleChange(changedOptions: MultiSelectOption[]): void {
			this.handleUpdate(changedOptions)
		}

		private getCurrentlySelectedOptions(): MultiSelectOption[] {
			const attribute = this.getAttribute()
			if (!attribute || !Array.isArray(attribute)) {
				return []
			}
			return attribute
		}

		private getAvailableOptions(): MultiSelectOption[] {
			return (this.props as EditAttributeMultiSelectProps).options
		}

		private getMissingOptions(availableOptions: MultiSelectOption[]): MultiSelectOption[] {
			return this.getCurrentlySelectedOptions()
				.filter((selectedOption) => availableOptions.every((option) => option.value !== selectedOption.value))
				.map((option) => {
					return {
						value: option.value,
						label: option.label,
						className: 'option-missing',
					}
				})
		}

		render() {
			const availableOptions = this.getAvailableOptions()
			const missingOptions = this.getMissingOptions(availableOptions)
			const currentlySelectedOptions = this.getCurrentlySelectedOptions()
			return (
				<MultiSelect
					className={ClassNames(this.props.className, missingOptions.length > 0 && 'option-missing')}
					options={availableOptions.concat(missingOptions)}
					value={currentlySelectedOptions}
					placeholder={this.props.label}
					onChange={this.handleChange}
				></MultiSelect>
			)
		}
	}
)
