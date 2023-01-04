import React from 'react'
import { faDownload, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { ConfigManifestEntry, SourceLayerType } from '@sofie-automation/blueprints-integration'
import { MappingsExt } from '@sofie-automation/corelib/dist/dataModel/Studio'
import { unprotectString } from '@sofie-automation/corelib/dist/protectedString'
import { withTranslation } from 'react-i18next'
import { MeteorCall } from '../../../../lib/api/methods'
import { ShowStyleBase } from '../../../../lib/collections/ShowStyleBases'
import { ShowStyleVariant } from '../../../../lib/collections/ShowStyleVariants'
import { doModalDialog } from '../../../lib/ModalDialog'
import { Translated } from '../../../lib/ReactMeteorData/ReactMeteorData'
import { logger } from '../../../../lib/logging'
import { ShowStyleVariantImportButton } from '../../../lib/ShowStyleVariantImportButton'
import { VariantListItem } from './VariantListItem'
import { DndListWrapper } from '../../DndListWrapper'
import { DragDropItemTypes } from '../../DragDropItemTypes'
import { Meteor } from 'meteor/meteor'

interface IShowStyleVariantsProps {
	showStyleBase: ShowStyleBase
	showStyleVariants: ShowStyleVariant[]
	blueprintConfigManifest: ConfigManifestEntry[]

	layerMappings?: { [key: string]: MappingsExt }
	sourceLayers?: Array<{ name: string; value: string; type: SourceLayerType }>
}

interface IShowStyleVariantsSettingsState {
	dndVariants: ShowStyleVariant[]
}

const TIMEOUT_DELAY = 50

export const ShowStyleVariantsSettings = withTranslation()(
	class ShowStyleVariantsSettings extends React.Component<
		Translated<IShowStyleVariantsProps>,
		IShowStyleVariantsSettingsState
	> {
		private timeout?: number

		constructor(props: Translated<IShowStyleVariantsProps>) {
			super(props)

			this.state = {
				dndVariants: this.props.showStyleVariants,
			}
		}

		componentDidUpdate(prevProps: Readonly<Translated<IShowStyleVariantsProps>>) {
			this.updateShowStyleVariants(prevProps.showStyleVariants)
		}

		private updateShowStyleVariants(prevShowStyleVariants: ShowStyleVariant[]): void {
			if (!this.showStyleVariantsChanged(prevShowStyleVariants) && !this.noShowStyleVariantsPresentInState()) {
				return
			}

			if (this.timeout) {
				Meteor.clearTimeout(this.timeout)
			}
			this.timeout = Meteor.setTimeout(() => {
				this.setState({
					dndVariants: this.props.showStyleVariants,
				})
			}, TIMEOUT_DELAY)
		}

		componentWillUnmount() {
			if (this.timeout) {
				Meteor.clearTimeout(this.timeout)
			}
		}

		private showStyleVariantsChanged = (prevShowStyleVariants: ShowStyleVariant[]): boolean => {
			return prevShowStyleVariants !== this.props.showStyleVariants
		}

		private noShowStyleVariantsPresentInState = (): boolean => {
			return this.props.showStyleVariants.length > 0 && this.state.dndVariants.length === 0
		}

		private downloadAllShowStyleVariants = (): void => {
			const jsonStr = JSON.stringify(this.state.dndVariants)
			const fileName = `All variants_${this.props.showStyleBase._id}.json`
			this.download(jsonStr, fileName)
		}

		private download = (jsonStr: string, fileName: string): void => {
			const element = document.createElement('a')
			element.href = URL.createObjectURL(new Blob([jsonStr], { type: 'application/json' }))
			element.download = fileName

			element.click()
		}

		private onAddShowStyleVariant = (): void => {
			MeteorCall.showstyles.createDefaultShowStyleVariant(this.props.showStyleBase._id).catch(logger.warn)
		}

		private confirmRemoveAllShowStyleVariants = (): void => {
			const { t } = this.props
			doModalDialog({
				title: t('Remove all variants?'),
				no: t('Cancel'),
				yes: t('Remove'),
				onAccept: () => {
					this.removeAllShowStyleVariants()
				},
				message: (
					<React.Fragment>
						<p>{t('Are you sure you want to remove all variants in the table?')}</p>
					</React.Fragment>
				),
			})
		}

		private removeAllShowStyleVariants = (): void => {
			this.state.dndVariants.forEach((variant: ShowStyleVariant) => {
				MeteorCall.showstyles.removeShowStyleVariant(variant._id).catch(logger.warn)
			})
		}

		private persistStateVariants = (showStyleVariants: ShowStyleVariant[]): void => {
			MeteorCall.showstyles
				.reorderAllShowStyleVariants(this.props.showStyleBase._id, showStyleVariants)
				.catch(logger.warn)
		}

		private renderShowStyleVariant = (variant: ShowStyleVariant, index: number) => {
			return (
				<VariantListItem
					key={unprotectString(variant._id)}
					index={index}
					showStyleVariant={variant}
					showStyleBase={this.props.showStyleBase}
					dndVariants={this.props.showStyleVariants}
					blueprintConfigManifest={this.props.blueprintConfigManifest}
					t={this.props.t}
					i18n={this.props.i18n}
					tReady={this.props.tReady}
				></VariantListItem>
			)
		}

		render() {
			const { t } = this.props
			return (
				<div>
					<h2 className="mhn">{t('Show Style Variants')}</h2>
					<div>
						<DndListWrapper
							className="table expando settings-studio-showStyleVariants-table"
							onDrop={this.persistStateVariants}
							dndType={DragDropItemTypes.VARIANT}
							list={this.state.dndVariants}
							renderItem={this.renderShowStyleVariant}
						></DndListWrapper>
					</div>
					<div className="mod mhs">
						<button className="btn btn-primary" onClick={this.onAddShowStyleVariant}>
							<FontAwesomeIcon icon={faPlus} />
						</button>
						<button className="btn btn-secondary mls" onClick={this.downloadAllShowStyleVariants}>
							<FontAwesomeIcon icon={faDownload} />
							&nbsp;{t('Export')}
						</button>
						<ShowStyleVariantImportButton
							showStyleVariants={this.props.showStyleVariants}
						></ShowStyleVariantImportButton>
						<button className="btn btn-secondary right" onClick={this.confirmRemoveAllShowStyleVariants}>
							<FontAwesomeIcon icon={faTrash} />
						</button>
					</div>
				</div>
			)
		}
	}
)
