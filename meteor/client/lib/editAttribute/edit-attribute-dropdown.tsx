import { EditAttributeBase, IEditAttributeBaseProps, wrapEditAttribute } from './edit-attribute-base'
import ClassNames from 'classnames'
import * as React from 'react'

export interface DropdownOption {
	value: string
	alternativeValue?: string
	label?: string
}

interface EditAttributeDropdownProps extends IEditAttributeBaseProps {
	options: DropdownOption[]
}

export function EditAttributeDropdown(props: EditAttributeDropdownProps) {
	return <WrappedEditAttributeDropdown {...props} />
}

const WrappedEditAttributeDropdown = wrapEditAttribute(
	class EditAttributeDropdown extends EditAttributeBase {
		constructor(props) {
			super(props)

			this.handleChange = this.handleChange.bind(this)
		}

		componentDidMount() {
			this.populateFromFirstAvailableOptionIfNoValueIsSelected()
			this.updateSelectedOptionIfLabelIsChanged()
		}

		private populateFromFirstAvailableOptionIfNoValueIsSelected() {
			const currentlySelectedOption = this.getCurrentlySelectedOption()
			const availableOptions = this.getAvailableOptions()
			if (!!currentlySelectedOption || availableOptions.length === 0) {
				return
			}
			this.handleChange({ target: { value: availableOptions[0].value } })
		}

		componentDidUpdate(prevProps: Readonly<IEditAttributeBaseProps>) {
			if (prevProps === this.props) {
				return
			}
			this.updateSelectedOptionIfLabelIsChanged()
		}

		private updateSelectedOptionIfLabelIsChanged(): void {
			const selectedOptionFromDatabase = this.getCurrentlySelectedOption()
			if (!selectedOptionFromDatabase || !('label' in selectedOptionFromDatabase)) {
				return
			}
			const selectedOptionFromAvailableOptions = this.findOptionInAvailableOptions(selectedOptionFromDatabase)
			if (!selectedOptionFromAvailableOptions) {
				return
			}
			const selectedOptionHasChangedLabel =
				selectedOptionFromDatabase.label !== selectedOptionFromAvailableOptions.label
			if (!selectedOptionHasChangedLabel) {
				return
			}
			this.handleUpdate(selectedOptionFromAvailableOptions)
		}

		private findOptionInAvailableOptions(optionToCheck: DropdownOption): DropdownOption | undefined {
			return this.getAvailableOptions().find(
				(option) =>
					option.value.toLowerCase() === optionToCheck.value.toLowerCase() ||
					(option.alternativeValue && option.alternativeValue === optionToCheck.value.toLowerCase())
			)
		}

		private handleChange(event) {
			const selectedOptionValue: string = event.target.value
			const selectedOption: DropdownOption | undefined = this.getAvailableOptions().find(
				(option) => option.value === selectedOptionValue
			)
			if (!selectedOption) {
				return
			}
			this.handleUpdate(selectedOption.label ? selectedOption : selectedOption.value)
		}

		private getCurrentlySelectedOption(): DropdownOption {
			let attribute = this.getAttribute()
			if (!!attribute && !attribute.value) {
				attribute = { value: attribute + '' }
			}
			return attribute
		}

		private getAvailableOptions(): DropdownOption[] {
			return (this.props as EditAttributeDropdownProps).options
		}

		private getMissingOptions(): DropdownOption[] {
			const selectedOption: DropdownOption = this.getCurrentlySelectedOption()
			if (!selectedOption) {
				return []
			}
			const selectedIsAnAvailableOption = this.getAvailableOptions().some(
				(option) =>
					option.value.toLowerCase() === selectedOption.value.toLowerCase() ||
					(option.alternativeValue && option.alternativeValue === selectedOption.value.toLowerCase())
			)
			return !selectedIsAnAvailableOption ? [selectedOption] : []
		}

		render() {
			const availableOptions = this.getAvailableOptions()
			const missingOptions = this.getMissingOptions()
			const currentlySelectedOption = this.getCurrentlySelectedOption()
			return (
				<select
					className={ClassNames(
						'form-control',
						this.props.className,
						this.state.editing && this.props.modifiedClassName,
						missingOptions.length > 0 && 'option-missing'
					)}
					value={currentlySelectedOption?.value}
					onChange={this.handleChange}
					disabled={this.props.disabled}
				>
					{availableOptions.concat(missingOptions).map((option) => (
						<option key={option.value} value={option.value}>
							{option.label ?? option.value}
						</option>
					))}
				</select>
			)
		}
	}
)
