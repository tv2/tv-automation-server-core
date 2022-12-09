import { ShowStyleVariant } from '../../lib/collections/ShowStyleVariants'
import { doModalDialog } from './ModalDialog'
import { MeteorCall } from '../../lib/api/methods'
import { logger } from '../../lib/logging'
import React from 'react'
import { t } from 'i18next'
import { NoticeLevel, Notification, NotificationCenter } from './notifications/notifications'

export namespace variantImporter {
	export function importShowStyleVariants(
		event: React.ChangeEvent<HTMLInputElement>,
		showStyleVariants: ShowStyleVariant[]
	): void {
		const file = event.target.files?.[0]
		if (!file) {
			return
		}

		const reader = new FileReader()

		reader.onload = () => {
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

			importShowStyleVariantsFromArray(newShowStyleVariants, showStyleVariants)
		}
		reader.readAsText(file)
	}

	function importShowStyleVariantsFromArray(
		showStyleVariants: ShowStyleVariant[],
		stateShowStyleVariants: ShowStyleVariant[]
	): void {
		showStyleVariants.forEach((showStyleVariant: ShowStyleVariant, index: number) => {
			const rank = stateShowStyleVariants.length
			showStyleVariant._rank = rank + index
			if (showStyleVariantAlreadyExists(showStyleVariant, stateShowStyleVariants)) {
				const resemblingNameCount = getDuplicatedVariantAmount(showStyleVariant, stateShowStyleVariants)
				showStyleVariant.name += ' (' + resemblingNameCount + ')'
				provideImportOptions(showStyleVariant, stateShowStyleVariants)
			} else {
				importShowStyleVariant(showStyleVariant)
			}
		})
	}

	function showStyleVariantAlreadyExists(
		importedShowStyleVariant: ShowStyleVariant,
		stateShowStyleVariants: ShowStyleVariant[]
	): boolean {
		const exists = stateShowStyleVariants.find(
			(variant: ShowStyleVariant) => variant.name === importedShowStyleVariant.name
		)
		return !!exists
	}

	function provideImportOptions(showStyleVariant: ShowStyleVariant, stateShowStyleVariants: ShowStyleVariant[]) {
		doModalDialog({
			title: t('Do you want to replace this variant?'),
			yes: t('Replace'),
			no: t('Keep both variants'),
			onAccept: () => {
				replaceShowStyleVariant(showStyleVariant, stateShowStyleVariants)
			},
			onSecondary: () => {
				importShowStyleVariant(showStyleVariant)
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

	function getDuplicatedVariantAmount(
		showStyleVariant: ShowStyleVariant,
		showStyleVariants: ShowStyleVariant[]
	): number {
		const importedName = showStyleVariant.name.split(' ')[0]
		return showStyleVariants.filter((variant: ShowStyleVariant) => {
			const existingName = variant.name.split(' ')[0]
			return existingName === importedName
		}).length
	}

	function importShowStyleVariant(showStyleVariant: ShowStyleVariant) {
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

	function replaceShowStyleVariant(newShowStyleVariant: ShowStyleVariant, showStyleVariants: ShowStyleVariant[]) {
		const existingShowStyleVariant = showStyleVariants.find((variant: ShowStyleVariant) => {
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
}
