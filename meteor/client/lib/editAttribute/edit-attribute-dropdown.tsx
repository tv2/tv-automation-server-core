import { EditAttributeBase, IEditAttributeBaseProps, wrapEditAttribute } from './edit-attribute-base'
import ClassNames from 'classnames'
import * as React from 'react'

export interface DropdownOption {
	value: string | number
	label?: string
}

interface EditAttributeDropdownProps extends IEditAttributeBaseProps {
	options: DropdownOption[]
	shouldSaveLabel?: boolean
	allowNoSelection?: boolean
}

export function EditAttributeDropdown(props: EditAttributeDropdownProps) {
	return <WrappedEditAttributeDropdown {...props} />
}

const WrappedEditAttributeDropdown = wrapEditAttribute(
	class EditAttributeDropdown extends EditAttributeBase<EditAttributeDropdownProps> {
		constructor(props: EditAttributeDropdownProps) {
			super(props)

			this.handleChange = this.handleChange.bind(this)
		}

		componentDidMount() {
			this.updateSelectedOptionIfLabelIsChanged()
		}

		componentDidUpdate(prevProps: Readonly<IEditAttributeBaseProps>) {
			if (prevProps === this.props) {
				return
			}
			this.updateSelectedOptionIfLabelIsChanged()
		}

		private updateSelectedOptionIfLabelIsChanged(): void {
			const props = this.props as EditAttributeDropdownProps
			if (!props.shouldSaveLabel) {
				return
			}

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
			return this.props.options.find((option) => option.value === optionToCheck.value)
		}

		private handleChange(event) {
			const selectedOptionValue: string = event.target.value
			const selectedOption: DropdownOption | undefined = this.props.options.find(
				(option) => option.value.toString() === selectedOptionValue
			)
			if (!selectedOption) {
				return
			}
			const props = this.props as EditAttributeDropdownProps
			this.handleUpdate(props.shouldSaveLabel ? selectedOption : selectedOption.value)
		}

		private getCurrentlySelectedOption(): DropdownOption {
			let attribute = this.getAttribute()
			if (attribute !== undefined && attribute.value === undefined) {
				attribute = { value: attribute }
			}
			return attribute
		}

		private getMissingOptions(): DropdownOption[] {
			const selectedOption: DropdownOption = this.getCurrentlySelectedOption()
			if (!selectedOption) {
				return []
			}
			const selectedIsAnAvailableOption = this.props.options.some((option) => option.value === selectedOption.value)
			return !selectedIsAnAvailableOption
				? [{ value: selectedOption.value, label: `N/A: ${selectedOption.label ?? selectedOption.value}` }]
				: []
		}

		render() {
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
					{this.props.options.concat(missingOptions).map((option) => (
						<option key={option.value} value={option.value}>
							{option.label ?? option.value}
						</option>
					))}
				</select>
			)
		}
	}
)
