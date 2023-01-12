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
import { DragDropListWrapper } from '../../DragDropListWrapper'
import { DragDropItemType } from '../../DragDropItemType'
import { Meteor } from 'meteor/meteor'

interface IShowStyleVariantsProps {
	showStyleBase: ShowStyleBase
	showStyleVariants: ShowStyleVariant[]
	blueprintConfigManifest: ConfigManifestEntry[]

	layerMappings?: { [key: string]: MappingsExt }
	sourceLayers?: Array<{ name: string; value: string; type: SourceLayerType }>
}

interface IShowStyleVariantsSettingsState {
	dragDropVariants: ShowStyleVariant[]
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
				dragDropVariants: this.props.showStyleVariants,
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
					dragDropVariants: this.props.showStyleVariants,
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
			return this.props.showStyleVariants.length > 0 && this.state.dragDropVariants.length === 0
		}

		private persistStateVariants = (showStyleVariants: ShowStyleVariant[]): void => {
			MeteorCall.showstyles
				.reorderAllShowStyleVariants(this.props.showStyleBase._id, showStyleVariants)
				.catch(logger.warn)
		}

		private provideShowStyleVariantItem = (variant: ShowStyleVariant, index: number): JSX.Element => {
			return (
				<VariantListItem
					key={unprotectString(variant._id)}
					index={index}
					showStyleVariant={variant}
					showStyleBase={this.props.showStyleBase}
					dragDropVariants={this.props.showStyleVariants}
					blueprintConfigManifest={this.props.blueprintConfigManifest}
					t={this.props.t}
					i18n={this.props.i18n}
					tReady={this.props.tReady}
				></VariantListItem>
			)
		}

		private onAddShowStyleVariant = (): void => {
			MeteorCall.showstyles.createDefaultShowStyleVariant(this.props.showStyleBase._id).catch(logger.warn)
		}

		private downloadAllShowStyleVariants = (): void => {
			const fileContent = JSON.stringify(this.state.dragDropVariants)
			const fileName = `All variants_${this.props.showStyleBase._id}.json`
			this.download(fileContent, fileName)
		}

		private download = (fileContent: string, fileName: string): void => {
			const element = document.createElement('a')
			element.href = URL.createObjectURL(new Blob([fileContent], { type: 'application/json' }))
			element.download = fileName

			element.click()
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
			this.state.dragDropVariants.forEach((variant: ShowStyleVariant) => {
				MeteorCall.showstyles.removeShowStyleVariant(variant._id).catch(logger.warn)
			})
		}

		render() {
			const { t } = this.props
			return (
				<div>
					<h2 className="mhn">{t('Show Style Variants')}</h2>
					<div>
						<DragDropListWrapper
							tableClassName="table expando settings-studio-showStyleVariants-table"
							onDrop={this.persistStateVariants}
							dragDropType={DragDropItemType.VARIANT}
							list={this.state.dragDropVariants}
							renderItem={this.provideShowStyleVariantItem}
						></DragDropListWrapper>
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
