import * as React from 'react'
import * as AdaptiveCards from 'adaptivecards'
import * as ClassNames from 'classnames'
import { HostConfig } from './AdaptiveCardHostConfig'

export interface IProps {
	payload: any
	classNames?: string
	onActionSubmit?: (action: AdaptiveCards.SubmitAction) => void
}

export class AdaptiveCard extends React.Component<IProps> {
	private _card: AdaptiveCards.AdaptiveCard
	private _container: HTMLDivElement

	constructor (props) {
		super(props)

		this._card = new AdaptiveCards.AdaptiveCard()
	}

	componentDidMount () {
		this.renderCard() // changing the payload prop after first render not supported
	}

	componentWillUnmount () {
		delete this._card
	}

	onExecuteAction (action: AdaptiveCards.Action) {
		const type = action.getJsonTypeName()
		switch (type) {
			case 'Action.OpenUrl':
				window.open((action as AdaptiveCards.OpenUrlAction).url, action.title || '_blank')
				break
			case 'Action.ShowCard':
				break
			case 'Action.Submit':
				if (typeof this.props.onActionSubmit === 'function') {
					this.props.onActionSubmit(action as AdaptiveCards.SubmitAction)
				}
				break
		}
	}

	renderCard () {
		this._card.hostConfig = HostConfig
		this._card.parse(this.props.payload)
		const renderedCard = this._card.render()
		this._card.onExecuteAction = (action) => { this.onExecuteAction(action) }
		this._container.appendChild(renderedCard)
	}

	setRef (ref: HTMLDivElement) {
		this._container = ref
	}

	render () {
		return (
			<div className={ClassNames('adaptive-card', this.props.classNames)} ref={this.setRef.bind(this)} />
		)
	}
}
