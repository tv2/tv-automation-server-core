import React, { useState } from 'react'
import ClassNames from 'classnames'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck, faCopy, faDownload, faPencilAlt, faTrash } from '@fortawesome/free-solid-svg-icons'
import { EditAttribute } from '../../../lib/EditAttribute'
import { ShowStyleVariant, ShowStyleVariants } from '../../../../lib/collections/ShowStyleVariants'
import { ConfigManifestSettings } from '../ConfigManifestSettings'
import { ConfigManifestEntry, SourceLayerType } from '@sofie-automation/blueprints-integration'
import { MappingsExt } from '@sofie-automation/corelib/dist/dataModel/Studio'
import { ProtectedString, unprotectString } from '@sofie-automation/shared-lib/dist/lib/protectedString'
import { ShowStyleBase } from '../../../../lib/collections/ShowStyleBases'
import { MeteorCall } from '../../../../lib/api/methods'
import { logger } from '../../../../lib/logging'
import { doModalDialog } from '../../../lib/ModalDialog'
import { TFunction } from 'react-i18next'
import { i18n } from 'i18next'

interface IShowStyleVariantItemProps {
	index: number
	showStyleVariant: ShowStyleVariant
	showStyleBase: ShowStyleBase
	dndVariants: ShowStyleVariant[]
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
	const initialEditedMappings: ProtectedString<any>[] = []
	const [editedMappings, setEditedMappings] = useState(initialEditedMappings)

	function copyShowStyleVariant(showStyleVariant: ShowStyleVariant): void {
		showStyleVariant.name = `Copy of ${showStyleVariant.name}`
		showStyleVariant._rank = props.dndVariants.length
		MeteorCall.showstyles.importShowStyleVariantAsNew(showStyleVariant).catch(logger.warn)
	}

	function downloadShowStyleVariant(showStyleVariant: ShowStyleVariant): void {
		const showStyleVariants = [showStyleVariant]
		const jsonStr = JSON.stringify(showStyleVariants)
		const fileName = `${showStyleVariant.name}_showstyleVariant_${showStyleVariant._id}.json`
		download(jsonStr, fileName)
	}

	function download(jsonStr: string, fileName: string): void {
		const element = document.createElement('a')
		element.href = URL.createObjectURL(new Blob([jsonStr], { type: 'application/json' }))
		element.download = fileName

		element.click()
	}

	function isItemEdited(layerId: ProtectedString<any>): boolean {
		return editedMappings.indexOf(layerId) >= 0
	}

	function finishEditItem(layerId: ProtectedString<any>): void {
		const index = editedMappings.indexOf(layerId)
		if (index >= 0) {
			editedMappings.splice(index, 1)
			setEditedMappings([...editedMappings])
		}
	}

	function editItem(layerId: ProtectedString<any>): void {
		if (editedMappings.indexOf(layerId) < 0) {
			editedMappings.push(layerId)
			setEditedMappings([...editedMappings])
		} else {
			finishEditItem(layerId)
		}
	}

	function confirmRemove(showStyleVariant: ShowStyleVariant): void {
		doModalDialog({
			title: t('Remove this Variant?'),
			no: t('Cancel'),
			yes: t('Remove'),
			onAccept: () => {
				MeteorCall.showstyles.removeShowStyleVariant(showStyleVariant._id).catch(logger.warn)
			},
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

	return (
		<React.Fragment key={unprotectString(props.showStyleVariant._id)}>
			<tbody>
				<tr
					className={ClassNames({
						hl: isItemEdited(props.showStyleVariant._id),
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
