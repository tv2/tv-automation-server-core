import { MultiSelect, MultiSelectOption } from '../multiSelect'
import ClassNames from 'classnames'
import * as React from 'react'
import { EditAttributeBase, IEditAttributeBaseProps, wrapEditAttribute } from './EditAttributeBase'

interface EditAttributeMultiSelectProps extends IEditAttributeBaseProps {
	options: MultiSelectOption[]
	shouldSaveLabel?: boolean
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
			const props = this.props as EditAttributeMultiSelectProps
			if (props.shouldSaveLabel) {
				this.handleUpdate(changedOptions)
				return
			}
			this.handleUpdate(changedOptions.map((option) => option.value))
		}

		componentDidMount() {
			this.updateSelectedOptionsIfLabelsHasChanged()
		}

		componentDidUpdate(prevProps: Readonly<IEditAttributeBaseProps>) {
			if (prevProps === this.props) {
				return
			}
			this.updateSelectedOptionsIfLabelsHasChanged()
		}

		private updateSelectedOptionsIfLabelsHasChanged(): void {
			const props = this.props as EditAttributeMultiSelectProps
			if (!props.shouldSaveLabel) {
				return
			}

			const selectedOptionsFromDatabase = this.getCurrentlySelectedOptions()
			if (!selectedOptionsFromDatabase || selectedOptionsFromDatabase.length === 0) {
				return
			}
			const availableOptions = this.getAvailableOptions()
			if (!availableOptions || availableOptions.length === 0) {
				return
			}
			// This introduces a side effect in the .map() below, but it's a quick way of ensuring we only update when a label has changed
			let selectedOptionsNeedsToBeUpdated: boolean = false
			const optionsToUpdate = selectedOptionsFromDatabase.map((option) => {
				const availableOption = availableOptions.find(
					(availableOption) => availableOption.value.toLowerCase() === option.value.toLowerCase()
				)
				if (!availableOption) {
					// SelectedOption is not in the current available options, so we shouldn't update anything on it
					return option
				}
				if (availableOption.label === option.label) {
					// SelectedOption has the same label as its corresponding available option so no need to update it
					return option
				}
				selectedOptionsNeedsToBeUpdated = true
				// We can just return the available option instead of setting the label on the selected option because they have the same 'value'
				return availableOption
			})
			if (selectedOptionsNeedsToBeUpdated) {
				this.handleChange(optionsToUpdate)
			}
		}

		private getCurrentlySelectedOptions(): MultiSelectOption[] {
			const attribute = this.getAttribute()
			if (!attribute || !Array.isArray(attribute)) {
				return []
			}
			return this.mapToMultiSelectOptionIfNeeded(attribute)
		}

		private mapToMultiSelectOptionIfNeeded(values: any[]): MultiSelectOption[] {
			return values.map((a) => {
				if (typeof a === 'string') {
					return { value: a, label: a }
				}
				return a
			})
		}

		private getAvailableOptions(): MultiSelectOption[] {
			return (this.props as EditAttributeMultiSelectProps).options
		}

		private getMissingOptions(availableOptions: MultiSelectOption[]): MultiSelectOption[] {
			return this.getCurrentlySelectedOptions()
				.filter((selectedOption) => availableOptions.every((option) => option.value !== selectedOption.value))
				.map((option) => ({
					value: option.value,
					label: option.label,
					className: 'option-missing',
				}))
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
