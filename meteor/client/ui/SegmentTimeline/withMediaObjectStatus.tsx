import * as React from 'react'
import { Meteor } from 'meteor/meteor'
import { Tracker } from 'meteor/tracker'
import { PieceUi } from './SegmentTimelineContainer'
import { AdLibPieceUi } from '../Shelf/AdLibPanel'
import { MeteorReactComponent } from '../../lib/MeteorReactComponent'
import { SourceLayerType, VTContent, LiveSpeakContent, ISourceLayer } from '@sofie-automation/blueprints-integration'
import { PubSub } from '../../../lib/api/pubsub'
import { RundownUtils } from '../../lib/rundown'
import { checkPieceContentStatus } from '../../../lib/mediaObjects'
import { Studio } from '../../../lib/collections/Studios'
import { IAdLibListItem } from '../Shelf/AdLibListItem'
import { BucketAdLibUi, BucketAdLibActionUi } from '../Shelf/RundownViewBuckets'
import _ from 'underscore'

type AnyPiece = {
	piece: BucketAdLibUi | IAdLibListItem | AdLibPieceUi | PieceUi | BucketAdLibActionUi | undefined
	layer?: ISourceLayer | undefined
	isLiveLine?: boolean
	studio: Studio | undefined
}

type IWrappedComponent<IProps extends AnyPiece, IState> = new (props: IProps, state: IState) => React.Component<
	IProps,
	IState
>

export function withMediaObjectStatus<IProps extends AnyPiece, IState>(): (
	WrappedComponent: IWrappedComponent<IProps, IState> | React.FC<IProps>
) => new (props: IProps, context: any) => React.Component<IProps, IState> {
	return (WrappedComponent) => {
		return class WithMediaObjectStatusHOCComponent extends MeteorReactComponent<IProps, IState> {
			private statusComp: Tracker.Computation
			private objId: string
			private overrides: Partial<IProps>
			private destroyed: boolean
			private subscription: Meteor.SubscriptionHandle | undefined

			private updateMediaObjectSubscription() {
				if (this.destroyed) return

				const layer = this.props.piece?.sourceLayer || this.props.layer

				if (this.props.piece && layer) {
					const piece = WithMediaObjectStatusHOCComponent.unwrapPieceInstance(this.props.piece!)
					let objId: string | undefined = undefined

					switch (layer.type) {
						case SourceLayerType.VT:
							objId = piece.content ? (piece.content as VTContent).fileName?.toUpperCase() : undefined
							break
						case SourceLayerType.LIVE_SPEAK:
							objId = piece.content ? (piece.content as LiveSpeakContent).fileName?.toUpperCase() : undefined
							break
					}

					if (objId && objId !== this.objId && this.props.studio) {
						if (this.subscription) this.subscription.stop()
						this.objId = objId
						this.subscription = this.subscribe(PubSub.mediaObjects, this.props.studio._id, {
							mediaId: this.objId,
						})
					}
				}
			}

			private shouldDataTrackerUpdate(prevProps: IProps): boolean {
				if (this.props.piece !== prevProps.piece) return true
				if (this.props.studio !== prevProps.studio) return true
				if (this.props.isLiveLine !== prevProps.isLiveLine) return true
				return false
			}

			private static unwrapPieceInstance(
				piece: BucketAdLibUi | IAdLibListItem | AdLibPieceUi | PieceUi | BucketAdLibActionUi
			) {
				if (RundownUtils.isPieceInstance(piece)) {
					return piece.instance.piece
				} else {
					return piece
				}
			}


			componentDidMount() {
				window.requestIdleCallback(
					() => {
						this.updateMediaObjectSubscription()
					},
					{
						timeout: 500,
					}
				)
			}

			componentDidUpdate(prevProps: IProps) {
				Meteor.defer(() => {
					this.updateMediaObjectSubscription()
				})
				if (this.shouldDataTrackerUpdate(prevProps)) {
					if (this.statusComp) this.statusComp.invalidate()
				}
			}

			componentWillUnmount() {
				this.destroyed = true
				super.componentWillUnmount()
			}

			render() {
				return <WrappedComponent {...this.props} {...this.overrides} />
			}
		}
	}
}
