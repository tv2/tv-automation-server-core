import { MongoCollection } from '../../../lib/collections/lib'
import * as React from 'react'
import { withTracker } from '../ReactMeteorData/ReactMeteorData'

export interface IEditAttributeBaseProps {
	updateOnKey?: boolean
	attribute?: string
	collection?: MongoCollection<any>
	myObject?: any
	obj?: any
	options?: any
	optionsAreNumbers?: boolean
	className?: string
	modifiedClassName?: string
	invalidClassName?: string
	updateFunction?: (edit: EditAttributeBase, newValue: any) => void
	overrideDisplayValue?: any
	label?: string
	mutateDisplayValue?: (v: any) => any
	mutateUpdateValue?: (v: any) => any
	disabled?: boolean
	storeJsonAsObject?: boolean
	/** Defaults to string */
	arrayType?: 'boolean' | 'int' | 'float' | 'string'
}

interface IEditAttributeBaseState {
	value: any
	valueError: boolean
	editing: boolean
}

export class EditAttributeBase extends React.Component<IEditAttributeBaseProps, IEditAttributeBaseState> {
	constructor(props) {
		super(props)

		this.state = {
			value: this.getAttribute(),
			valueError: false,
			editing: false,
		}

		this.handleEdit = this.handleEdit.bind(this)
		this.handleUpdate = this.handleUpdate.bind(this)
		this.handleDiscard = this.handleDiscard.bind(this)
	}
	handleEdit(inputValue: any, storeValue?: any) {
		this.setState({
			value: inputValue,
			editing: true,
		})
		if (this.props.updateOnKey) {
			this.updateValue(storeValue ?? inputValue)
		}
	}
	handleUpdate(inputValue: any, storeValue?: any) {
		this.handleUpdateButDontSave(inputValue)
		this.updateValue(storeValue ?? inputValue)
	}
	handleUpdateEditing(newValue) {
		this.handleUpdateButDontSave(newValue, true)
		this.updateValue(newValue)
	}
	handleUpdateButDontSave(newValue, editing = false) {
		this.setState({
			value: newValue,
			editing,
		})
	}
	handleDiscard() {
		this.setState({
			value: this.getAttribute(),
			editing: false,
		})
	}
	deepAttribute(obj0: any, attr0: string | undefined): any {
		// Returns a value deep inside an object
		// Example: deepAttribute(company,"ceo.address.street");

		const f = (obj: any, attr: string) => {
			if (obj) {
				const attributes = attr.split('.')

				if (attributes.length > 1) {
					const outerAttr = attributes.shift() as string
					const innerAttrs = attributes.join('.')

					return f(obj[outerAttr], innerAttrs)
				} else {
					return obj[attributes[0]]
				}
			} else {
				return obj
			}
		}
		return f(obj0, attr0 || '')
	}
	getAttribute() {
		let v = null
		if (this.props.overrideDisplayValue !== undefined) {
			v = this.props.overrideDisplayValue
		} else {
			v = this.deepAttribute(this.props.myObject, this.props.attribute)
		}
		return this.props.mutateDisplayValue ? this.props.mutateDisplayValue(v) : v
	}
	getAttributeText() {
		return this.getAttribute() + ''
	}
	getEditAttribute() {
		return this.state.editing ? this.state.value : this.getAttribute()
	}
	updateValue(newValue) {
		if (this.props.mutateUpdateValue) {
			try {
				newValue = this.props.mutateUpdateValue(newValue)
				this.setState({
					valueError: false,
				})
			} catch (e) {
				this.setState({
					valueError: true,
					editing: true,
				})
				return
			}
		}

		if (this.props.updateFunction && typeof this.props.updateFunction === 'function') {
			this.props.updateFunction(this, newValue)
		} else {
			if (this.props.collection && this.props.attribute) {
				if (newValue === undefined) {
					const m = {}
					m[this.props.attribute] = 1
					this.props.collection.update(this.props.obj._id, { $unset: m })
				} else {
					const m = {}
					m[this.props.attribute] = newValue
					this.props.collection.update(this.props.obj._id, { $set: m })
				}
			}
		}
	}
}

export function wrapEditAttribute(newClass) {
	return withTracker((props: IEditAttributeBaseProps) => {
		// These properties will be exposed under this.props
		// Note that these properties are reactively recalculated
		return {
			myObject: props.collection ? props.collection.findOne(props.obj._id) : props.obj || {},
		}
	})(newClass)
}
