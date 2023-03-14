import { ShowStyleVariant } from '../../lib/collections/ShowStyleVariants'
import { doModalDialog, removeAllQueueItems } from './ModalDialog'
import { MeteorCall } from '../../lib/api/methods'
import { logger } from '../../lib/logging'
import React from 'react'
import { t } from 'i18next'
import { NoticeLevel, Notification, NotificationCenter } from './notifications/notifications'
import { UploadButton } from './uploadButton'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUpload } from '@fortawesome/free-solid-svg-icons'
import { withTranslation } from 'react-i18next'

interface ShowStyleVariantImportProps {
	showStyleVariants: ShowStyleVariant[]
}

interface ShowStyleVariantImportState {
	timestampedFileKey: number
}

export const ShowStyleVariantImportButton = withTranslation()(
	class ShowStyleVariantImportButton extends React.Component<ShowStyleVariantImportProps, ShowStyleVariantImportState> {
		constructor(props: ShowStyleVariantImportProps) {
			super(props)

			this.state = {
				timestampedFileKey: Date.now(),
			}
		}

		private importShowStyleVariants(event: React.ChangeEvent<HTMLInputElement>): void {
			const file = event.target.files?.[0]

			if (!file) {
				return
			}
			this.importShowStyleVariantsFile(file)
		}

		private importShowStyleVariantsFile(file: File): void {
			const fileReader = new FileReader()
			fileReader.onload = () => {
				try {
					this.importShowStyleVariantsFileContent(fileReader.result as string)
				} catch (error: unknown) {
					this.notifyAboutFailedImport(error)
				}
			}
			fileReader.readAsText(file)
		}

		private importShowStyleVariantsFileContent(text: string): void {
			this.setState({ timestampedFileKey: Date.now() })
			const showStyleVariants = this.parseShowStyleVariants(text)
			this.importShowStyleVariantsFromArray(showStyleVariants)
		}

		private parseShowStyleVariants(text: string): ShowStyleVariant[] {
			const showStyleVariants: unknown = JSON.parse(text)

			if (!Array.isArray(showStyleVariants)) {
				throw new Error('Imported file did not contain an array')
			}

			return showStyleVariants
		}

		private importShowStyleVariantsFromArray(showStyleVariants: ShowStyleVariant[]): void {
			showStyleVariants.forEach((showStyleVariant: ShowStyleVariant, index: number) => {
				const rank = this.props.showStyleVariants.length
				showStyleVariant._rank = rank + index
				if (this.doesShowStyleVariantExist(showStyleVariant.name)) {
					this.provideImportOptions(showStyleVariant)
					return
				}
				this.importShowStyleVariant(showStyleVariant)
			})
		}

		private notifyAboutFailedImport(error: unknown): void {
			NotificationCenter.push(
				new Notification(
					undefined,
					NoticeLevel.WARNING,
					t('Failed to import new show style variants: {{errorMessage}}', { errorMessage: `${error}` }),
					'VariantSettings'
				)
			)
		}

		private doesShowStyleVariantExist(showStyleVariantName: string): boolean {
			return this.props.showStyleVariants.some((variant: ShowStyleVariant) => variant.name === showStyleVariantName)
		}

		private provideImportOptions(showStyleVariant: ShowStyleVariant) {
			doModalDialog({
				title: t('Do you want to replace this variant?'),
				yes: t('Replace'),
				no: t('Keep both variants'),
				onDiscard: () => removeAllQueueItems(),
				onAccept: () => this.replaceShowStyleVariant(showStyleVariant),
				onSecondary: () => this.importDuplicatedShowStyleVariant(showStyleVariant),
				actions: [
					{
						label: t('Skip'),
						classNames: 'btn mlm',
						on: () =>
							NotificationCenter.push(
								new Notification(
									undefined,
									NoticeLevel.TIP,
									t('Skipped Variant {{name}}.', {
										name: showStyleVariant.name,
									}),
									'VariantSettings'
								)
							),
					},
				],
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

		private replaceShowStyleVariant(showStyleVariant: ShowStyleVariant): void {
			const existingShowStyleVariant = this.props.showStyleVariants.find(
				(variant: ShowStyleVariant) => variant.name === showStyleVariant.name
			)
			if (existingShowStyleVariant) {
				MeteorCall.showstyles
					.removeShowStyleVariant(existingShowStyleVariant._id)
					.then(() => this.importShowStyleVariant(showStyleVariant))
					.catch(logger.warn)
			}
		}

		private importDuplicatedShowStyleVariant(showStyleVariant: ShowStyleVariant) {
			const resemblingNameCount = this.getDuplicatedShowStyleVariantCount(showStyleVariant)
			showStyleVariant.name += ' (' + resemblingNameCount + ')'
			this.importShowStyleVariant(showStyleVariant)
		}

		private getDuplicatedShowStyleVariantCount(showStyleVariant: ShowStyleVariant): number {
			const showStyleVariantName = this.removeDuplicationIndicatorFromName(showStyleVariant.name)
			return this.props.showStyleVariants.filter((variant: ShowStyleVariant) => {
				const existingName = this.removeDuplicationIndicatorFromName(variant.name)
				return existingName === showStyleVariantName
			}).length
		}

		private removeDuplicationIndicatorFromName(name: String): string {
			return name.replace(/ +\(\d+\)$/, '')
		}

		private importShowStyleVariant(showStyleVariant: ShowStyleVariant): void {
			MeteorCall.showstyles.importShowStyleVariantAsNew(showStyleVariant).catch(() =>
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
			)
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
