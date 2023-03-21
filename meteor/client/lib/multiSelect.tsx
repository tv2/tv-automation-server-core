import * as React from 'react'
import ClassNames from 'classnames'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheckSquare, faChevronUp, faSquare } from '@fortawesome/free-solid-svg-icons'
import { Manager, Popper, Reference } from 'react-popper'

export interface MultiSelectOption {
	value: string
	label: string
	className?: string
}

interface IProps {
	options: MultiSelectOption[]
	placeholder?: string
	className?: string
	value: MultiSelectOption[]
	onChange?: (selectedOptions: MultiSelectOption[]) => void
}

interface IState {
	checkedIds: string[]
	expanded: boolean
}

export class MultiSelect extends React.Component<IProps, IState> {
	private _titleRef: HTMLElement
	private _popperRef: HTMLElement
	private _popperUpdate: () => Promise<any>

	constructor(props: IProps) {
		super(props)

		this.state = {
			checkedIds: [],
			expanded: false,
		}
	}

	componentDidMount() {
		this.refreshChecked()
	}

	async componentDidUpdate(prevProps: IProps) {
		if (this.props.value !== prevProps.value) {
			this.refreshChecked()
		}

		if (this.state.expanded && typeof this._popperUpdate === 'function') {
			await this._popperUpdate()
		}
	}

	refreshChecked() {
		this.setState({
			checkedIds: this.props.value.map((option) => option.value),
		})
	}

	handleChange = (clickedOption: MultiSelectOption) => {
		const checkedIds = this.state.checkedIds

		const index: number = checkedIds.findIndex((id) => id === clickedOption.value)
		if (index === -1) {
			checkedIds.push(clickedOption.value)
		} else {
			checkedIds.splice(index, 1)
		}

		this.setState({
			checkedIds: checkedIds,
		})

		if (!this.props.onChange || typeof this.props.onChange !== 'function') {
			return
		}
		this.props.onChange(this.getOptionsFromCheckedIds())
	}

	getOptionsFromCheckedIds(): MultiSelectOption[] {
		return this.state.checkedIds
			.map((id) => this.props.options.find((option) => option.value === id))
			.filter((option) => !!option) as MultiSelectOption[]
	}

	isChecked = (idToCheck: string): boolean => {
		return this.state.checkedIds.some((id) => id === idToCheck)
	}

	generateSimpleSummary = () => {
		return this.getOptionsFromCheckedIds()
			.map((option) => option.label)
			.join(', ')
	}

	generateRichSummary = () => {
		return this.getOptionsFromCheckedIds().map((option) => {
			return (
				<span key={option.value} className={option.className}>
					{option.label}
				</span>
			)
		})
	}

	onBlur = (event: React.FocusEvent<HTMLDivElement>) => {
		if (
			!(
				event.relatedTarget &&
				event.relatedTarget instanceof HTMLElement &&
				(this._popperRef === event.relatedTarget ||
					this._popperRef.contains(event.relatedTarget) ||
					this._titleRef === event.relatedTarget)
			)
		) {
			this.setState({
				expanded: false,
			})
		}
	}

	toggleExpco = async () => {
		await this._popperUpdate()
		this.setState({
			expanded: !this.state.expanded,
		})
	}

	setTitleRef = (ref, popperRef) => {
		this._titleRef = ref
		if (typeof popperRef === 'function') {
			popperRef(ref)
		}
	}

	setPopperRef = (ref, popperRef) => {
		this._popperRef = ref
		if (typeof popperRef === 'function') {
			popperRef(ref)
		}
	}

	setUpdate = (update) => {
		this._popperUpdate = update
	}

	renderOption = (option: MultiSelectOption) => {
		return (
			<p className="expco-item" key={option.value}>
				<label className={ClassNames('action-btn', option.className)}>
					<span className="checkbox">
						<input
							type="checkbox"
							className="form-control"
							checked={this.isChecked(option.value)}
							onChange={() => this.handleChange(option)}
						/>
						<span className="checkbox-checked">
							<FontAwesomeIcon icon={faCheckSquare} />
						</span>
						<span className="checkbox-unchecked">
							<FontAwesomeIcon icon={faSquare} />
						</span>
					</span>
					{option.label}
				</label>
			</p>
		)
	}

	render() {
		const simpleSummary = this.generateSimpleSummary()
		return (
			<Manager>
				<Reference>
					{({ ref }) => (
						<div
							ref={(r) => this.setTitleRef(r, ref)}
							className={ClassNames(
								'expco subtle',
								{
									'expco-expanded': this.state.expanded,
								},
								this.props.className
							)}
							tabIndex={-1}
							onBlur={this.onBlur}
						>
							<div
								className={ClassNames('expco-title', {
									placeholder: !simpleSummary,
								})}
								onClick={this.toggleExpco}
								title={simpleSummary || this.props.placeholder || ''}
							>
								{this.generateRichSummary() || this.props.placeholder || ''}
							</div>
							<a className="action-btn right expco-expand subtle" onClick={this.toggleExpco}>
								<FontAwesomeIcon icon={faChevronUp} />
							</a>
						</div>
					)}
				</Reference>
				<Popper
					placement="bottom-start"
					modifiers={[
						{ name: 'flip', enabled: false },
						{ name: 'offset', enabled: true, options: { offset: [0, -1] } },
						{
							name: 'eventListeners',
							enabled: true,
							options: {
								scroll: this.state.expanded,
								resize: this.state.expanded,
							},
						},
					]}
				>
					{({ ref, style, placement, update }) => {
						this.setUpdate(update)
						return (
							<div
								ref={(r) => this.setPopperRef(r, ref)}
								style={style}
								data-placement={placement}
								className={ClassNames(
									'expco subtle expco-popper dropdown',
									{
										'expco-expanded': this.state.expanded,
									},
									this.props.className
								)}
								tabIndex={-1}
								onBlur={this.onBlur}
							>
								{this.state.expanded && (
									<div className="expco-body bd">{this.props.options.map((option) => this.renderOption(option))}</div>
								)}
							</div>
						)
					}}
				</Popper>
			</Manager>
		)
	}
}
