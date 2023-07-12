import * as React from 'react'
import * as _ from 'underscore'
import { faCheckSquare, faSquare } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import ClassNames from 'classnames'
import { assertNever } from '../../lib/lib'
import { EditAttributeBase, IEditAttributeBaseProps, withEditAttributeTracker } from './editAttribute/EditAttributeBase'
import { getRandomString } from '@sofie-automation/corelib/dist/lib'
import { ColorPicker, ColorPickerEvent } from './colorPicker'
import { IconPicker, IconPickerEvent } from './iconPicker'
import { MultiSelect, MultiSelectOption } from './multiSelect'

interface IEditAttribute extends IEditAttributeBaseProps {
	type: EditAttributeType
}
export type EditAttributeType =
	| 'text'
	| 'multiline'
	| 'int'
	| 'float'
	| 'checkbox'
	| 'toggle'
	| 'dropdown'
	| 'dropdowntext'
	| 'switch'
	| 'multiselect'
	| 'json'
	| 'colorpicker'
	| 'iconpicker'
	| 'array'
export class EditAttribute extends React.Component<IEditAttribute> {
	render() {
		if (this.props.type === 'text') {
			return <EditAttributeText {...this.props} />
		} else if (this.props.type === 'multiline') {
			return <EditAttributeMultilineText {...this.props} />
		} else if (this.props.type === 'int') {
			return <EditAttributeInt {...this.props} />
		} else if (this.props.type === 'float') {
			return <EditAttributeFloat {...this.props} />
		} else if (this.props.type === 'checkbox') {
			return <EditAttributeCheckbox {...this.props} />
		} else if (this.props.type === 'switch') {
			return <EditAttributeSwitch {...this.props} />
		} else if (this.props.type === 'toggle') {
			return <EditAttributeToggle {...this.props} />
		} else if (this.props.type === 'dropdown') {
			return <DeprecatedEditAttributeDropdown {...this.props} />
		} else if (this.props.type === 'dropdowntext') {
			return <DeprecatedEditAttributeDropdownText {...this.props} />
		} else if (this.props.type === 'multiselect') {
			return <DeprecatedEditAttributeMultiSelect {...this.props} />
		} else if (this.props.type === 'json') {
			return <EditAttributeJson {...this.props} />
		} else if (this.props.type === 'colorpicker') {
			return <EditAttributeColorPicker {...this.props} />
		} else if (this.props.type === 'iconpicker') {
			return <EditAttributeIconPicker {...this.props} />
		} else if (this.props.type === 'array') {
			return <EditAttributeArray {...this.props} />
		} else {
			assertNever(this.props.type)
		}

		return <div>Unknown edit type {this.props.type}</div>
	}
}

const EditAttributeText = withEditAttributeTracker(
	class EditAttributeText extends EditAttributeBase {
		constructor(props) {
			super(props)

			this.handleChange = this.handleChange.bind(this)
			this.handleBlur = this.handleBlur.bind(this)
			this.handleEscape = this.handleEscape.bind(this)
		}
		handleChange(event) {
			this.handleEdit(event.target.value)
		}
		handleBlur(event) {
			let value: string = event.target.value
			if (value) {
				value = value.trim()
			}
			this.handleUpdate(value)
		}
		handleEscape(event) {
			const e = event as KeyboardEvent
			if (e.key === 'Escape') {
				this.handleDiscard()
			}
		}
		render() {
			return (
				<input
					type="text"
					className={
						'form-control' +
						' ' +
						(this.state.valueError ? 'error ' : '') +
						(this.props.className || '') +
						' ' +
						(this.state.editing ? this.props.modifiedClassName || '' : '')
					}
					placeholder={this.props.label}
					value={this.getEditAttribute() || ''}
					onChange={this.handleChange}
					onBlur={this.handleBlur}
					onKeyUp={this.handleEscape}
					disabled={this.props.disabled}
				/>
			)
		}
	}
)
const EditAttributeMultilineText = withEditAttributeTracker(
	class EditAttributeMultilineText extends EditAttributeBase {
		constructor(props) {
			super(props)

			this.handleChange = this.handleChange.bind(this)
			this.handleBlur = this.handleBlur.bind(this)
			this.handleEscape = this.handleEscape.bind(this)
		}
		handleChange(event) {
			this.handleEdit(event.target.value)
		}
		handleBlur(event) {
			this.handleUpdate(event.target.value)
		}
		handleEscape(event) {
			const e = event as KeyboardEvent
			if (e.key === 'Escape') {
				this.handleDiscard()
			}
		}
		handleEnterKey(event) {
			const e = event as KeyboardEvent
			if (e.key === 'Enter') {
				e.stopPropagation()
			}
		}
		render() {
			return (
				<textarea
					className={
						'form-control' +
						' ' +
						(this.state.valueError ? 'error ' : '') +
						(this.props.className || '') +
						' ' +
						(this.state.editing ? this.props.modifiedClassName || '' : '')
					}
					placeholder={this.props.label}
					value={this.getEditAttribute() || ''}
					onChange={this.handleChange}
					onBlur={this.handleBlur}
					onKeyUp={this.handleEscape}
					onKeyPress={this.handleEnterKey}
					disabled={this.props.disabled}
				/>
			)
		}
	}
)
const EditAttributeInt = withEditAttributeTracker(
	class EditAttributeInt extends EditAttributeBase {
		constructor(props) {
			super(props)

			this.handleChange = this.handleChange.bind(this)
			this.handleBlur = this.handleBlur.bind(this)
		}
		getValue(event) {
			return parseInt(event.target.value, 10)
		}
		handleChange(event) {
			// this.handleEdit(this.getValue(event))
			const v = this.getValue(event)
			_.isNaN(v) ? this.handleUpdateButDontSave(v, true) : this.handleUpdateEditing(v)
		}
		handleBlur(event) {
			const v = this.getValue(event)
			_.isNaN(v) ? this.handleDiscard() : this.handleUpdate(v)
		}
		getEditAttributeNumber() {
			let val = this.getEditAttribute()
			if (_.isNaN(val)) val = ''
			return val
		}
		render() {
			return (
				<input
					type="number"
					step="1"
					className={
						'form-control' +
						' ' +
						(this.props.className || '') +
						' ' +
						(this.state.editing ? this.props.modifiedClassName || '' : '')
					}
					placeholder={this.props.label}
					value={this.getEditAttributeNumber()}
					onChange={this.handleChange}
					onBlur={this.handleBlur}
					disabled={this.props.disabled}
				/>
			)
		}
	}
)
const EditAttributeFloat = withEditAttributeTracker(
	class EditAttributeFloat extends EditAttributeBase {
		constructor(props) {
			super(props)

			this.handleChange = this.handleChange.bind(this)
			this.handleBlur = this.handleBlur.bind(this)
		}
		getValue(event) {
			return parseFloat(event.target.value.replace(',', '.'))
		}
		handleChange(event) {
			// this.handleEdit(this.getValue(event))
			const v = this.getValue(event)
			_.isNaN(v) ? this.handleUpdateButDontSave(v, true) : this.handleUpdateEditing(v)
		}
		handleBlur(event) {
			const v = this.getValue(event)
			_.isNaN(v) ? this.handleDiscard() : this.handleUpdate(v)
		}
		getEditAttributeNumber() {
			let val = this.getEditAttribute()
			if (_.isNaN(val)) val = ''
			return val
		}
		render() {
			return (
				<input
					type="number"
					step="0.1"
					className={
						'form-control' +
						' ' +
						(this.props.className || '') +
						' ' +
						(this.state.editing ? this.props.modifiedClassName || '' : '')
					}
					placeholder={this.props.label}
					value={this.getEditAttributeNumber()}
					onChange={this.handleChange}
					onBlur={this.handleBlur}
					disabled={this.props.disabled}
				/>
			)
		}
	}
)
const EditAttributeCheckbox = withEditAttributeTracker(
	class EditAttributeCheckbox extends EditAttributeBase {
		constructor(props) {
			super(props)

			this.handleChange = this.handleChange.bind(this)
		}
		isChecked() {
			return !!this.getEditAttribute()
		}
		handleChange() {
			this.handleUpdate(!this.state.value)
		}
		render() {
			return (
				<label>
					<span
						className={
							'checkbox' +
							' ' +
							(this.props.className || '') +
							' ' +
							(this.state.editing ? this.props.modifiedClassName || '' : '')
						}
					>
						<input
							type="checkbox"
							className="form-control"
							checked={this.isChecked()}
							onChange={this.handleChange}
							disabled={this.props.disabled}
						/>
						<span className="checkbox-checked">
							<FontAwesomeIcon icon={faCheckSquare} />
						</span>
						<span className="checkbox-unchecked">
							<FontAwesomeIcon icon={faSquare} />
						</span>
					</span>
				</label>
			)
		}
	}
)
const EditAttributeToggle = withEditAttributeTracker(
	class EditAttributeToggle extends EditAttributeBase {
		constructor(props) {
			super(props)
		}
		isChecked() {
			return !!this.getEditAttribute()
		}
		handleChange = () => {
			this.handleUpdate(!this.state.value)
		}
		handleClick = () => {
			this.handleChange()
		}
		render() {
			return (
				<div className="mvs">
					<a
						className={ClassNames(
							'switch-button',
							'mrs',
							this.props.className,
							this.state.editing ? this.props.modifiedClassName : undefined,
							this.props.disabled ? 'disabled' : '',
							{
								'sb-on': this.isChecked(),
							}
						)}
						role="button"
						onClick={this.handleClick}
						tabIndex={0}
					>
						<div className="sb-content">
							<div className="sb-label">
								<span className="mls">&nbsp;</span>
								<span className="mrs right">&nbsp;</span>
							</div>
							<div className="sb-switch"></div>
						</div>
					</a>
					<span>{this.props.label}</span>
				</div>
			)
		}
	}
)
const EditAttributeSwitch = withEditAttributeTracker(
	class EditAttributeSwitch extends EditAttributeBase {
		constructor(props) {
			super(props)
		}
		isChecked() {
			return !!this.getEditAttribute()
		}
		handleChange = () => {
			this.handleUpdate(!this.state.value)
		}
		handleClick = () => {
			this.handleChange()
		}
		render() {
			return (
				<div
					className={
						'switch ' +
						' ' +
						(this.props.className || '') +
						' ' +
						(this.state.editing ? this.props.modifiedClassName || '' : '') +
						' ' +
						(this.isChecked() ? 'switch-active' : '') +
						' ' +
						(this.props.disabled ? 'disabled' : '')
					}
					onClick={this.handleClick}
				>
					{this.props.label}
				</div>
			)
		}
	}
)

interface EditAttributeDropdownOption {
	value: any
	name: string
	i?: number
}

interface EditAttributeDropdownOptionsResult {
	options: EditAttributeDropdownOption[]
	currentOptionMissing: boolean
}

// Deprecated in favour of EditAttributeDropdown
const DeprecatedEditAttributeDropdown = withEditAttributeTracker(
	class EditAttributeDropdown extends EditAttributeBase {
		constructor(props) {
			super(props)

			this.handleChange = this.handleChange.bind(this)
		}
		handleChange(event) {
			// because event.target.value is always a string, use the original value instead
			const option = _.find(this.getOptions().options, (o) => {
				return o.value + '' === event.target.value + ''
			})

			const value = option ? option.value : event.target.value

			this.handleUpdate(this.props.optionsAreNumbers ? parseInt(value, 10) : value)
		}
		getOptions(addOptionForCurrentValue?: boolean): EditAttributeDropdownOptionsResult {
			const options: EditAttributeDropdownOption[] = []

			if (Array.isArray(this.props.options)) {
				// is it an enum?
				for (const val of this.props.options) {
					if (typeof val === 'object') {
						options.push({
							name: val.name,
							value: val.value,
						})
					} else {
						options.push({
							name: val,
							value: val,
						})
					}
				}
			} else if (typeof this.props.options === 'object') {
				// Is options an enum?
				const keys = Object.keys(this.props.options)
				const first = this.props.options[keys[0]]
				if (this.props.options[first] + '' === keys[0] + '') {
					// is an enum, only pick
					for (const key in this.props.options) {
						if (!_.isNaN(parseInt(key, 10))) {
							// key is a number (the key)
							const enumValue = this.props.options[key]
							const enumKey = this.props.options[enumValue]
							options.push({
								name: enumValue,
								value: enumKey,
							})
						}
					}
				} else {
					for (const key in this.props.options) {
						const val = this.props.options[key]
						if (Array.isArray(val)) {
							options.push({
								name: key,
								value: val,
							})
						} else {
							options.push({
								name: key + ': ' + val,
								value: val,
							})
						}
					}
				}
			}

			const currentValue = this.getAttribute()
			const currentOption = options.find((o) =>
				Array.isArray(o.value) ? o.value.includes(currentValue) : o.value === currentValue
			)

			if (addOptionForCurrentValue) {
				if (!currentOption) {
					// if currentOption not found, then add it to the list:
					options.push({
						name: 'N/A: ' + currentValue,
						value: currentValue,
					})
				}
			}

			for (let i = 0; i < options.length; i++) {
				options[i].i = i
			}

			return { options, currentOptionMissing: !currentOption }
		}
		render() {
			const options = this.getOptions(true)
			return (
				<select
					className={ClassNames(
						'form-control',
						this.props.className,
						this.state.editing && this.props.modifiedClassName,
						options.currentOptionMissing && 'option-missing'
					)}
					value={this.getAttributeText()}
					onChange={this.handleChange}
					disabled={this.props.disabled}
				>
					{options.options.map((o, j) =>
						Array.isArray(o.value) ? (
							<optgroup key={j} label={o.name}>
								{o.value.map((v, i) => (
									<option key={i} value={v + ''}>
										{v}
									</option>
								))}
							</optgroup>
						) : (
							<option key={o.i} value={o.value + ''}>
								{o.name}
							</option>
						)
					)}
				</select>
			)
		}
	}
)

// Deprecated in favour of EditAttributeDropdown
const DeprecatedEditAttributeDropdownText = withEditAttributeTracker(
	class EditAttributeDropdownText extends EditAttributeBase {
		private _id: string

		constructor(props) {
			super(props)

			this.handleChangeDropdown = this.handleChangeDropdown.bind(this)
			this.handleChangeText = this.handleChangeText.bind(this)
			this.handleBlurText = this.handleBlurText.bind(this)
			this.handleEscape = this.handleEscape.bind(this)

			this._id = getRandomString()
		}
		handleChangeDropdown(event) {
			// because event.target.value is always a string, use the original value instead
			const option = _.find(this.getOptions(), (o) => {
				return o.value + '' === event.target.value + ''
			})

			const value = option ? option.value : event.target.value

			this.handleUpdate(this.props.optionsAreNumbers ? parseInt(value, 10) : value)
		}
		handleChangeText(event) {
			this.handleChangeDropdown(event)
		}
		handleBlurText(event) {
			this.handleUpdate(event.target.value)
		}
		handleEscape(event) {
			const e = event as KeyboardEvent
			if (e.key === 'Escape') {
				this.handleDiscard()
			}
		}
		getOptions(addOptionForCurrentValue?: boolean) {
			const options: Array<{ value: any; name: string; i?: number }> = []

			if (Array.isArray(this.props.options)) {
				// is it an enum?
				for (const val of this.props.options) {
					if (typeof val === 'object') {
						options.push({
							name: val.name,
							value: val.value,
						})
					} else {
						options.push({
							name: val,
							value: val,
						})
					}
				}
			} else if (typeof this.props.options === 'object') {
				// Is options an enum?
				const keys = Object.keys(this.props.options)
				const first = this.props.options[keys[0]]
				if (this.props.options[first] + '' === keys[0] + '') {
					// is an enum, only pick
					for (const key in this.props.options) {
						if (!_.isNaN(parseInt(key, 10))) {
							// key is a number (the key)
							const enumValue = this.props.options[key]
							const enumKey = this.props.options[enumValue]
							options.push({
								name: enumValue,
								value: enumKey,
							})
						}
					}
				} else {
					for (const key in this.props.options) {
						const val = this.props.options[key]
						if (Array.isArray(val)) {
							options.push({
								name: key,
								value: val,
							})
						} else {
							options.push({
								name: key + ': ' + val,
								value: val,
							})
						}
					}
				}
			}

			if (addOptionForCurrentValue) {
				const currentValue = this.getAttribute()
				const currentOption = options.find((o) =>
					Array.isArray(o.value) ? o.value.includes(currentValue) : o.value === currentValue
				)
				if (!currentOption) {
					// if currentOption not found, then add it to the list:
					options.push({
						name: 'N/A: ' + currentValue,
						value: currentValue,
					})
				}
			}

			for (let i = 0; i < options.length; i++) {
				options[i].i = i
			}

			return options
		}
		render() {
			return (
				<div className="input-dropdowntext">
					<input
						type="text"
						className={
							'form-control' +
							' ' +
							(this.state.valueError ? 'error ' : '') +
							(this.props.className || '') +
							' ' +
							(this.state.editing ? this.props.modifiedClassName || '' : '')
						}
						placeholder={this.props.label}
						value={this.getEditAttribute() || ''}
						onChange={this.handleChangeText}
						onBlur={this.handleBlurText}
						onKeyUp={this.handleEscape}
						disabled={this.props.disabled}
						spellCheck={false}
						list={this._id}
					/>

					<datalist id={this._id}>
						{this.getOptions(false).map((o, j) =>
							Array.isArray(o.value) ? (
								<optgroup key={j} label={o.name}>
									{o.value.map((v, i) => (
										<option key={i} value={v + ''}></option>
									))}
								</optgroup>
							) : (
								<option key={o.i} value={o.value + ''}>
									{o.value !== o.name ? o.name : null}
								</option>
							)
						)}
					</datalist>
				</div>
			)
		}
	}
)

interface EditAttributeMultiSelectOptionsResult {
	options: MultiSelectOption[]
	currentOptionMissing: boolean
}

// Deprecated in favour of EditAttributeMultiSelect
const DeprecatedEditAttributeMultiSelect = withEditAttributeTracker(
	class EditAttributeMultiSelect extends EditAttributeBase {
		constructor(props) {
			super(props)

			this.handleChange = this.handleChange.bind(this)
		}
		handleChange(selectedOptions: MultiSelectOption[]) {
			this.handleUpdate(selectedOptions)
		}
		getOptions(addOptionsForCurrentValue?: boolean): EditAttributeMultiSelectOptionsResult {
			const options: MultiSelectOption[] = []

			if (Array.isArray(this.props.options)) {
				// is it an enum?
				for (const val of this.props.options) {
					if (typeof val === 'object') {
						options.push({ value: val.name, label: val.name })
					} else {
						options.push({ value: val, label: val })
					}
				}
			} else if (typeof this.props.options === 'object') {
				// Is options an enum?
				const keys = Object.keys(this.props.options)
				const first = this.props.options[keys[0]]
				if (this.props.options[first] + '' === keys[0] + '') {
					// is an enum, only pick
					for (const key in this.props.options) {
						if (!_.isNaN(parseInt(key, 10))) {
							// key is a number (the key)
							const enumValue = this.props.options[key]
							options.push({ value: enumValue, label: enumValue })
						}
					}
				} else {
					for (const key in this.props.options) {
						const val = this.props.options[key]
						if (Array.isArray(val)) {
							options.push({ value: val.toString(), label: val.toString() })
						} else {
							const value = key + ': ' + val
							options.push({ value: value, label: value })
						}
					}
				}
			}

			const currentValue = this.getAttribute()
			const missingOptions = Array.isArray(currentValue) ? currentValue.filter((v) => !(v in options)) : []

			if (addOptionsForCurrentValue) {
				missingOptions.forEach((option) => {
					options.push({ value: `${option}`, className: 'option-missing', label: `${option}` })
				})
			}
			return { options, currentOptionMissing: !!missingOptions.length }
		}
		render() {
			const options = this.getOptions(true)
			return (
				<MultiSelect
					className={ClassNames(this.props.className, options.currentOptionMissing && 'option-missing')}
					options={options.options}
					value={this.getAttribute()}
					placeholder={this.props.label}
					onChange={this.handleChange}
				></MultiSelect>
			)
		}
	}
)

const EditAttributeJson = withEditAttributeTracker(
	class EditAttributeJson extends EditAttributeBase {
		constructor(props) {
			super(props)

			this.handleChange = this.handleChange.bind(this)
			this.handleBlur = this.handleBlur.bind(this)
			this.handleEscape = this.handleEscape.bind(this)
		}
		isJson(str: string) {
			try {
				const parsed = JSON.parse(str)
				if (typeof parsed === 'object') return { parsed: parsed }
			} catch (err) {
				// ignore
			}
			return false
		}
		handleChange(event) {
			const v = event.target.value

			const jsonObj = this.isJson(v)
			if (jsonObj) {
				const storeValue = this.props.storeJsonAsObject ? jsonObj.parsed : v
				this.handleEdit(v, storeValue)
				this.setState({
					valueError: false,
				})
			} else {
				this.handleUpdateButDontSave(v, true)
			}
		}
		handleBlur(event) {
			let v = event.target.value
			if (v === '') {
				v = '{}'
			}
			const jsonObj = this.isJson(v)
			if (jsonObj) {
				const storeValue = this.props.storeJsonAsObject ? jsonObj.parsed : v
				this.handleUpdate(v, storeValue)
				this.setState({
					valueError: false,
				})
			} else {
				this.handleUpdateButDontSave(v, true)
				this.setState({
					valueError: true,
				})
			}
		}
		handleEscape(event) {
			const e = event as KeyboardEvent
			if (e.key === 'Escape') {
				this.handleDiscard()
			}
		}
		getAttribute() {
			const value = super.getAttribute()
			if (this.props.storeJsonAsObject) {
				return value ? JSON.stringify(value, null, 2) : value
			} else return value
		}
		render() {
			return (
				<input
					type="text"
					className={ClassNames(
						'form-control',
						this.props.className,
						this.state.valueError && this.props.invalidClassName
							? this.props.invalidClassName
							: this.state.editing
							? this.props.modifiedClassName || ''
							: ''
					)}
					placeholder={this.props.label}
					value={this.getEditAttribute() || ''}
					onChange={this.handleChange}
					onBlur={this.handleBlur}
					onKeyUp={this.handleEscape}
					disabled={this.props.disabled}
				/>
			)
		}
	}
)
const EditAttributeArray = withEditAttributeTracker(
	class EditAttributeArray extends EditAttributeBase {
		constructor(props) {
			super(props)

			this.handleChange = this.handleChange.bind(this)
			this.handleBlur = this.handleBlur.bind(this)
			this.handleEscape = this.handleEscape.bind(this)
		}
		isArray(strOrg: string): { parsed: any[] } | false {
			if (!(strOrg + '').trim().length) return { parsed: [] }

			const values: any[] = []
			const strs = (strOrg + '').split(',')

			for (const str of strs) {
				// Check that the values in the array are of the right type:

				if (this.props.arrayType === 'boolean') {
					const parsed = JSON.parse(str)
					if (typeof parsed !== 'boolean') return false // type check failed
					values.push(parsed)
				} else if (this.props.arrayType === 'int') {
					const parsed = parseInt(str, 10)

					if (Number.isNaN(parsed)) return false // type check failed
					values.push(parsed)
				} else if (this.props.arrayType === 'float') {
					const parsed = parseFloat(str)
					if (Number.isNaN(parsed)) return false // type check failed
					values.push(parsed)
				} else {
					// else this.props.arrayType is 'string'
					const parsed = str + ''
					if (typeof parsed !== 'string') return false // type check failed
					values.push(parsed.trim())
				}
			}
			return { parsed: values }
		}
		handleChange(event) {
			const v = event.target.value

			const arrayObj = this.isArray(v)
			if (arrayObj) {
				this.handleEdit(v, arrayObj.parsed)
				this.setState({
					valueError: false,
				})
			} else {
				this.handleUpdateButDontSave(v, true)
			}
		}
		handleBlur(event) {
			const v = event.target.value

			const arrayObj = this.isArray(v)
			if (arrayObj) {
				this.handleUpdate(v, arrayObj.parsed)
				this.setState({
					valueError: false,
				})
			} else {
				this.handleUpdateButDontSave(v, true)
				this.setState({
					valueError: true,
				})
			}
		}
		handleEscape(event) {
			const e = event as KeyboardEvent
			if (e.key === 'Escape') {
				this.handleDiscard()
			}
		}
		getAttribute() {
			const value = super.getAttribute()
			if (Array.isArray(value)) {
				return value.join(', ')
			} else {
				return ''
			}
		}
		render() {
			return (
				<input
					type="text"
					className={ClassNames(
						'form-control',
						this.props.className,
						this.state.valueError && this.props.invalidClassName
							? this.props.invalidClassName
							: this.state.editing
							? this.props.modifiedClassName || ''
							: ''
					)}
					placeholder={this.props.label}
					value={this.getEditAttribute() || ''}
					onChange={this.handleChange}
					onBlur={this.handleBlur}
					onKeyUp={this.handleEscape}
					disabled={this.props.disabled}
				/>
			)
		}
	}
)

const EditAttributeColorPicker = withEditAttributeTracker(
	class EditAttributeColorPicker extends EditAttributeBase {
		constructor(props) {
			super(props)

			this.handleChange = this.handleChange.bind(this)
		}
		handleChange(event: ColorPickerEvent) {
			this.handleUpdate(event.selectedValue)
		}
		render() {
			return (
				<ColorPicker
					className={this.props.className}
					availableOptions={this.props.options}
					value={this.getAttribute()}
					placeholder={this.props.label}
					onChange={this.handleChange}
				></ColorPicker>
			)
		}
	}
)
const EditAttributeIconPicker = withEditAttributeTracker(
	class extends EditAttributeBase {
		constructor(props) {
			super(props)

			this.handleChange = this.handleChange.bind(this)
		}
		handleChange(event: IconPickerEvent) {
			this.handleUpdate(event.selectedValue)
		}
		render() {
			return (
				<IconPicker
					className={this.props.className}
					availableOptions={this.props.options}
					value={this.getAttribute()}
					placeholder={this.props.label}
					onChange={this.handleChange}
				></IconPicker>
			)
		}
	}
)
