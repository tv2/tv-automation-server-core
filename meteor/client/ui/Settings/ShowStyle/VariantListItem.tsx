import React, { useEffect, useState } from 'react'
import ClassNames from 'classnames'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck, faCopy, faDownload, faPencilAlt, faTrash } from '@fortawesome/free-solid-svg-icons'
import { EditAttribute } from '../../../lib/EditAttribute'
import { ShowStyleVariant, ShowStyleVariants } from '../../../../lib/collections/ShowStyleVariants'
import { ConfigManifestSettings } from '../ConfigManifestSettings'
import { ConfigManifestEntry, SourceLayerType } from '@sofie-automation/blueprints-integration'
import { MappingsExt } from '@sofie-automation/corelib/dist/dataModel/Studio'
import { ProtectedString, protectString, unprotectString } from '@sofie-automation/shared-lib/dist/lib/protectedString'
import { ShowStyleBase } from '../../../../lib/collections/ShowStyleBases'
import { MeteorCall } from '../../../../lib/api/methods'
import { logger } from '../../../../lib/logging'
import { doModalDialog, removeAllQueueItems } from '../../../lib/ModalDialog'
import { TFunction } from 'react-i18next'
import { i18n } from 'i18next'
import ShowStyleVariantConfigurationVerifier from '../helpers/show-style-variant-configuration-verifier'

interface IShowStyleVariantItemProps {
	index: number
	showStyleVariant: ShowStyleVariant
	showStyleBase: ShowStyleBase
	dragDropVariants: ShowStyleVariant[]
	blueprintConfigManifest: ConfigManifestEntry[]
	layerMappings?: { [key: string]: MappingsExt }
	sourceLayers?: Array<{ name: string; value: string; type: SourceLayerType }>

	t: TFunction<'translation', undefined>
	i18n: i18n
	tReady: boolean
}

export const VariantListItem: React.FunctionComponent<IShowStyleVariantItemProps> = (
	props: IShowStyleVariantItemProps
) => {
	const { t } = props
	const initialEditedMappings: ProtectedString<'ShowStyleVariantId'>[] = []
	const [editedMappings, setEditedMappings] = useState(initialEditedMappings)

	const showStyleVariantConfigurationVerifier = ShowStyleVariantConfigurationVerifier
	const isBlueprintConfigurationInvalid: boolean =
		showStyleVariantConfigurationVerifier.isBlueprintConfigurationSelectedFromBaseInvalid(
			props.showStyleVariant,
			props.showStyleBase,
			props.blueprintConfigManifest
		)

	function downloadShowStyleVariant(showStyleVariant: ShowStyleVariant): void {
		const showStyleVariants = [showStyleVariant]
		const fileContent = JSON.stringify(showStyleVariants)
		const fileName = `${showStyleVariant.name}_showstyleVariant_${showStyleVariant._id}.json`
		download(fileContent, fileName)
	}

	function download(fileContent: string, fileName: string): void {
		const element = document.createElement('a')
		element.href = URL.createObjectURL(new Blob([fileContent], { type: 'application/json' }))
		element.download = fileName

		element.click()
	}

	function copyShowStyleVariant(showStyleVariant: ShowStyleVariant): void {
		const variantFromCopy: ShowStyleVariant = {
			name: `Copy of ${showStyleVariant.name}`,
			_id: protectString(''),
			_rank: props.dragDropVariants.length,
			showStyleBaseId: showStyleVariant.showStyleBaseId,
			blueprintConfig: showStyleVariant.blueprintConfig,
			_rundownVersionHash: showStyleVariant._rundownVersionHash,
		}
		MeteorCall.showstyles.importShowStyleVariantAsNew(variantFromCopy).catch(logger.warn)
	}

	function isItemEdited(layerId: ProtectedString<'ShowStyleVariantId'>): boolean {
		return editedMappings.includes(layerId)
	}

	function editItem(layerId: ProtectedString<'ShowStyleVariantId'>): void {
		if (isItemEdited(layerId)) {
			finishEditItem(layerId)
			return
		}
		setEditedMappings([...editedMappings, layerId])
	}

	function finishEditItem(layerId: ProtectedString<'ShowStyleVariantId'>): void {
		const index = editedMappings.indexOf(layerId)
		if (index >= 0) {
			editedMappings.splice(index, 1)
			setEditedMappings([...editedMappings])
		}
	}

	function confirmRemove(showStyleVariant: ShowStyleVariant): void {
		doModalDialog({
			title: t('Remove this Variant?'),
			no: t('Cancel'),
			yes: t('Remove'),
			onAccept: () => MeteorCall.showstyles.removeShowStyleVariant(showStyleVariant._id).catch(logger.warn),
			message: (
				<React.Fragment>
					<p>
						{t('Are you sure you want to remove the variant "{{showStyleVariantId}}"?', {
							showStyleVariantId: showStyleVariant.name,
						})}
					</p>
				</React.Fragment>
			),
		})
	}

	function showStyleVariantNameAlreadyExists(showStyleVariant: ShowStyleVariant): boolean {
		return props.dragDropVariants.some(
			(variant: ShowStyleVariant) => variant.name === showStyleVariant.name && variant._id !== showStyleVariant._id
		)
	}

	function addDuplicationCountToName(showStyleVariant: ShowStyleVariant, duplicatorIncrement: number = 0): void {
		showStyleVariant.name = `${getNameWithRemovedDuplicateIndicator(showStyleVariant)} (${
			getDuplicatedShowStyleVariantCount(showStyleVariant) + duplicatorIncrement
		})`
		if (showStyleVariantNameAlreadyExists(showStyleVariant)) {
			addDuplicationCountToName(showStyleVariant, duplicatorIncrement + 1)
		} else {
			MeteorCall.showstyles.renameShowStyleVariant(props.showStyleBase._id, props.showStyleVariant).catch(logger.warn)
		}
	}

	function getDuplicatedShowStyleVariantCount(showStyleVariant: ShowStyleVariant): number {
		const variantsWithName = props.dragDropVariants.filter((variant: ShowStyleVariant) => {
			const variantNameWithoutDuplicator = getNameWithRemovedDuplicateIndicator(variant)
			return variantNameWithoutDuplicator === showStyleVariant.name && variant._id !== showStyleVariant._id
		})
		return variantsWithName.length
	}

	function getNameWithRemovedDuplicateIndicator(showStyleVariant: ShowStyleVariant): string {
		return showStyleVariant.name.replace(/ +\(\d+\)$/, '')
	}

	function replaceOtherShowStyleVariant(): void {
		const variantToReplace = props.dragDropVariants.find((variant: ShowStyleVariant) => {
			return props.showStyleVariant.name === variant.name && props.showStyleVariant._id !== variant._id
		})
		if (!variantToReplace) {
			return
		}
		MeteorCall.showstyles.removeShowStyleVariant(variantToReplace._id).catch(logger.warn)
	}

	function provideDuplicatedNameOptions() {
		doModalDialog({
			title: t('Two or more variants have the same name'),
			yes: t('Keep'),
			no: t('Replace'),
			onAccept: () => {
				addDuplicationCountToName(props.showStyleVariant)
				removeAllQueueItems()
			},
			onSecondary: () => {
				replaceOtherShowStyleVariant()
				removeAllQueueItems()
			},
			onDiscard: () => {
				addDuplicationCountToName(props.showStyleVariant)
				removeAllQueueItems()
			},
			message: (
				<React.Fragment>
					<p>
						{t(
							'Do you want to keep the newly created Variant: "{{showStyleVariantName}}" as a duplicate or use it to replace the existing one?',
							{
								showStyleVariantName: props.showStyleVariant.name,
							}
						)}
					</p>
				</React.Fragment>
			),
		})
	}

	useEffect(() => {
		if (showStyleVariantNameAlreadyExists(props.showStyleVariant)) {
			provideDuplicatedNameOptions()
		}
	}, [editedMappings, props.showStyleVariant.name])

	return (
		<React.Fragment key={unprotectString(props.showStyleVariant._id)}>
			<tbody>
				<tr
					className={ClassNames({
						hl: isItemEdited(props.showStyleVariant._id),
						'showStyleVariant-invalid-blueprint-configuration': isBlueprintConfigurationInvalid,
					})}
				>
					<th className="settings-studio-showStyleVariant__name c3">
						{props.showStyleVariant.name || t('Unnamed variant')}
					</th>
					<td className="settings-studio-showStyleVariant__actions table-item-actions c3">
						<button className="action-btn" onClick={() => downloadShowStyleVariant(props.showStyleVariant)}>
							<FontAwesomeIcon icon={faDownload} />
						</button>
						<button className="action-btn" onClick={() => copyShowStyleVariant(props.showStyleVariant)}>
							<FontAwesomeIcon icon={faCopy} />
						</button>
						<button className="action-btn" onClick={() => editItem(props.showStyleVariant._id)}>
							<FontAwesomeIcon icon={faPencilAlt} />
						</button>
						<button className="action-btn" onClick={() => confirmRemove(props.showStyleVariant)}>
							<FontAwesomeIcon icon={faTrash} />
						</button>
					</td>
				</tr>
			</tbody>
			<tbody>
				{isItemEdited(props.showStyleVariant._id) && (
					<tr className="expando-details hl">
						<td colSpan={5}>
							<div>
								<div className="mod mvs mhs">
									<label className="field">
										{t('Name')}
										<EditAttribute
											modifiedClassName="bghl"
											attribute={'name'}
											obj={props.showStyleVariant}
											type="text"
											collection={ShowStyleVariants}
											className="input text-input input-l"
										></EditAttribute>
									</label>
								</div>
							</div>
							<div className="row">
								<div className="col c12 r1-c12 phs">
									<ConfigManifestSettings
										t={props.t}
										i18n={props.i18n}
										tReady={props.tReady}
										manifest={props.blueprintConfigManifest}
										collection={ShowStyleVariants}
										configPath={'blueprintConfig'}
										alternateObject={props.showStyleBase}
										object={props.showStyleVariant}
										layerMappings={props.layerMappings}
										sourceLayers={props.sourceLayers}
										subPanel={true}
									/>
								</div>
							</div>
							<div className="mod alright">
								<button className="btn btn-primary" onClick={() => finishEditItem(props.showStyleVariant._id)}>
									<FontAwesomeIcon icon={faCheck} />
								</button>
							</div>
						</td>
					</tr>
				)}
			</tbody>
		</React.Fragment>
	)
}
