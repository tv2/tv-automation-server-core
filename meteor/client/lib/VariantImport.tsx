import { ShowStyleVariant } from '../../lib/collections/ShowStyleVariants'
import { doModalDialog } from './ModalDialog'
import { MeteorCall } from '../../lib/api/methods'
import { logger } from '../../lib/logging'
import React from 'react'
import { t } from 'i18next'
import { NoticeLevel, Notification, NotificationCenter } from './notifications/notifications'
import { UploadButton } from './uploadButton'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUpload } from '@fortawesome/free-solid-svg-icons'
import { withTranslation } from 'react-i18next'

interface IVariantImportProps {
	showStyleVariants: ShowStyleVariant[]
}

interface IVariantImportState {
	timestampedFileKey: number
}
export const VariantImport = withTranslation()(
	class VariantImport extends React.Component<IVariantImportProps, IVariantImportState> {
		constructor(props: IVariantImportProps) {
			super(props)

			this.state = {
				timestampedFileKey: Date.now(),
			}
		}

		private getDuplicatedVariantAmount(showStyleVariant: ShowStyleVariant): number {
			const importedName = showStyleVariant.name.split(' ')[0]
			return this.props.showStyleVariants.filter((variant: ShowStyleVariant) => {
				const existingName = variant.name.split(' ')[0]
				return existingName === importedName
			}).length
		}

		private importShowStyleVariants(event: React.ChangeEvent<HTMLInputElement>): void {
			const file = event.target.files?.[0]
			if (!file) {
				return
			}

			const reader = new FileReader()

			reader.onload = () => {
				this.setState({
					timestampedFileKey: Date.now(),
				})
				const fileContents = reader.result as string

				const newShowStyleVariants: ShowStyleVariant[] = []
				try {
					JSON.parse(fileContents).map((showStyleVariant: ShowStyleVariant) =>
						newShowStyleVariants.push(showStyleVariant)
					)
					if (!Array.isArray(newShowStyleVariants)) {
						throw new Error('Imported file did not contain an array')
					}
				} catch (error) {
					NotificationCenter.push(
						new Notification(
							undefined,
							NoticeLevel.WARNING,
							t('Failed to import new showstyle variants: {{errorMessage}}', { errorMessage: error + '' }),
							'VariantSettings'
						)
					)
					return
				}

				this.importShowStyleVariantsFromArray(newShowStyleVariants)
			}
			reader.readAsText(file)
		}

		private importShowStyleVariantsFromArray(importedShowStyleVariants: ShowStyleVariant[]): void {
			importedShowStyleVariants.forEach((showStyleVariant: ShowStyleVariant, index: number) => {
				const rank = this.props.showStyleVariants.length
				showStyleVariant._rank = rank + index
				if (this.showStyleVariantAlreadyExists(showStyleVariant)) {
					this.provideImportOptions(showStyleVariant)
				} else {
					this.importShowStyleVariant(showStyleVariant)
				}
			})
		}

		private showStyleVariantAlreadyExists(importedShowStyleVariant: ShowStyleVariant): boolean {
			const exists = this.props.showStyleVariants.find(
				(variant: ShowStyleVariant) => variant.name === importedShowStyleVariant.name
			)
			return !!exists
		}

		private provideImportOptions(showStyleVariant: ShowStyleVariant) {
			doModalDialog({
				title: t('Do you want to replace this variant?'),
				yes: t('Replace'),
				no: t('Keep both variants'),
				onAccept: () => {
					this.replaceShowStyleVariant(showStyleVariant)
				},
				onSecondary: () => {
					const resemblingNameCount = this.getDuplicatedVariantAmount(showStyleVariant)
					showStyleVariant.name += ' (' + resemblingNameCount + ')'
					this.importShowStyleVariant(showStyleVariant)
				},
				message: (
					<React.Fragment>
						<p>
							{t('Do you want to replace "{{showStyleVariantName}}"?', {
								showStyleVariantName: showStyleVariant.name,
							})}
						</p>
					</React.Fragment>
				),
			})
		}

		private importShowStyleVariant(showStyleVariant: ShowStyleVariant) {
			MeteorCall.showstyles.importShowStyleVariantAsNew(showStyleVariant).catch(() => {
				NotificationCenter.push(
					new Notification(
						undefined,
						NoticeLevel.WARNING,
						t('Failed to import Variant {{name}}.', {
							name: showStyleVariant.name,
						}),
						'VariantSettings'
					)
				)
			})
		}

		private replaceShowStyleVariant(newShowStyleVariant: ShowStyleVariant) {
			const existingShowStyleVariant = this.props.showStyleVariants.find((variant: ShowStyleVariant) => {
				return variant.name === newShowStyleVariant.name
			})
			if (existingShowStyleVariant) {
				MeteorCall.showstyles
					.removeShowStyleVariant(existingShowStyleVariant._id)
					.then(() => {
						MeteorCall.showstyles.importShowStyleVariantAsNew(newShowStyleVariant).catch(logger.warn)
					})
					.catch(logger.warn)
			}
		}

		render() {
			return (
				<UploadButton
					className="btn btn-secondary mls"
					accept="application/json,.json"
					onChange={(event) => this.importShowStyleVariants(event)}
					key={this.state.timestampedFileKey}
				>
					<FontAwesomeIcon icon={faUpload} />
					&nbsp;{t('Import')}
				</UploadButton>
			)
		}
	}
)
