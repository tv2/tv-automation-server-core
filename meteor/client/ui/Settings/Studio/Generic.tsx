import * as React from 'react'
import { Studio, Studios } from '../../../../lib/collections/Studios'
import { Translated } from '../../../lib/ReactMeteorData/react-meteor-data'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons'
import { withTranslation } from 'react-i18next'
import { protectString, unprotectString } from '../../../../lib/lib'
import { EditAttribute } from '../../../lib/EditAttribute'
import { SettingsNavigation } from '../../../lib/SettingsNavigation'
import { BlueprintId, Blueprints } from '../../../../lib/collections/Blueprints'
import { BlueprintManifestType } from '@sofie-automation/blueprints-integration'
import { StudioBaselineStatus } from './Baseline'
import { ShowStyleBaseId } from '@sofie-automation/corelib/dist/dataModel/Ids'
import { ShowStyleBase } from '../../../../lib/collections/ShowStyleBases'
import { EditAttributeMultiSelect } from '../../../lib/editAttribute/EditAttributeMultiSelect'

interface IStudioGenericPropertiesProps {
	studio: Studio
	availableShowStyleBases: Array<{
		name: string
		value: ShowStyleBaseId
		showStyleBase: ShowStyleBase
	}>
}
interface IStudioGenericPropertiesState {}
export const StudioGenericProperties = withTranslation()(
	class StudioGenericProperties extends React.Component<
		Translated<IStudioGenericPropertiesProps>,
		IStudioGenericPropertiesState
	> {
		constructor(props: Translated<IStudioGenericPropertiesProps>) {
			super(props)
		}

		getBlueprintOptions() {
			const { t } = this.props

			const options: { name: string; value: BlueprintId | null }[] = [
				{
					name: t('None'),
					value: protectString(''),
				},
			]

			options.push(
				...Blueprints.find({ blueprintType: BlueprintManifestType.STUDIO })
					.fetch()
					.map((blueprint) => {
						return {
							name: blueprint.name ? blueprint.name + ` (${blueprint._id})` : unprotectString(blueprint._id),
							value: blueprint._id,
						}
					})
			)

			return options
		}

		renderShowStyleEditButtons() {
			const buttons: JSX.Element[] = []
			if (this.props.studio) {
				for (const showStyleBaseId of this.props.studio.supportedShowStyleBase) {
					const showStyleBase = this.props.availableShowStyleBases.find(
						(base) => base.showStyleBase._id === showStyleBaseId
					)
					if (showStyleBase) {
						buttons.push(
							<SettingsNavigation
								key={'settings-nevigation-' + showStyleBase.showStyleBase.name}
								attribute="name"
								obj={showStyleBase.showStyleBase}
								type="showstyle"
							/>
						)
					}
				}
			}
			return buttons
		}

		render() {
			const { t } = this.props
			return (
				<div>
					<h2 className="mhn mtn">{t('Generic Properties')}</h2>
					<label className="field">
						{t('Studio Name')}
						{!this.props.studio.name ? (
							<div className="error-notice inline">
								{t('No name set')} <FontAwesomeIcon icon={faExclamationTriangle} />
							</div>
						) : null}
						<div className="mdi">
							<EditAttribute
								modifiedClassName="bghl"
								attribute="name"
								obj={this.props.studio}
								type="text"
								collection={Studios}
								className="mdinput"
							/>
							<span className="mdfx"></span>
						</div>
					</label>
					<label className="field">
						{t('Blueprint')}
						{!this.props.studio.blueprintId ? (
							<div className="error-notice inline">
								{t('Blueprint not set')} <FontAwesomeIcon icon={faExclamationTriangle} />
							</div>
						) : null}
						<div className="mdi">
							<EditAttribute
								modifiedClassName="bghl"
								attribute="blueprintId"
								obj={this.props.studio}
								type="dropdown"
								options={this.getBlueprintOptions()}
								mutateDisplayValue={(v) => v || ''}
								mutateUpdateValue={(v) => (v === '' ? undefined : v)}
								collection={Studios}
								className="mdinput"
							/>
							<SettingsNavigation attribute="blueprintId" obj={this.props.studio} type="blueprint"></SettingsNavigation>
							<span className="mdfx"></span>
						</div>
					</label>
					<div className="field">
						{t('Select Compatible Show Styles')}
						{!this.props.studio.supportedShowStyleBase.length ? (
							<div className="error-notice inline">
								{t('Show style not set')} <FontAwesomeIcon icon={faExclamationTriangle} />
							</div>
						) : null}
						<div className="mdi">
							<EditAttributeMultiSelect
								attribute="supportedShowStyleBase"
								obj={this.props.studio}
								options={this.props.availableShowStyleBases.map((base) => ({
									label: base.name,
									value: base.value + '',
								}))}
								label={t('Click to show available Show Styles')}
								collection={Studios}
							/>
							{this.renderShowStyleEditButtons()}
							<SettingsNavigation type="newshowstyle" />
						</div>
					</div>
					<label className="field">
						{t('Frame Rate')}
						<div className="mdi">
							<EditAttribute
								modifiedClassName="bghl"
								attribute="settings.frameRate"
								obj={this.props.studio}
								type="int"
								collection={Studios}
								className="mdinput"
							/>
							<span className="mdfx"></span>
						</div>
					</label>
					<div className="mod mtn mbm mhn">
						<label className="field">
							<EditAttribute
								modifiedClassName="bghl"
								attribute="settings.enablePlayFromAnywhere"
								obj={this.props.studio}
								type="checkbox"
								collection={Studios}
							/>
							{t('Enable "Play from Anywhere"')}
						</label>
					</div>
					<label className="field">
						{t('Media Preview URL')}
						<div className="mdi">
							<EditAttribute
								modifiedClassName="bghl"
								attribute="settings.mediaPreviewsUrl"
								obj={this.props.studio}
								type="text"
								collection={Studios}
								className="mdinput"
							/>
							<span className="mdfx"></span>
						</div>
					</label>
					<label className="field">
						{t('Sofie Host URL')}
						<div className="mdi">
							<EditAttribute
								modifiedClassName="bghl"
								attribute="settings.sofieUrl"
								obj={this.props.studio}
								type="text"
								collection={Studios}
								className="mdinput"
							/>
							<span className="mdfx"></span>
						</div>
					</label>
					<label className="field">
						{t('Slack Webhook URLs')}
						<div className="mdi">
							<EditAttribute
								modifiedClassName="bghl"
								attribute="settings.slackEvaluationUrls"
								obj={this.props.studio}
								type="text"
								collection={Studios}
								className="mdinput"
							/>
							<span className="mdfx"></span>
						</div>
					</label>
					<label className="field">
						{t('Supported Media Formats')}
						<div className="mdi">
							<EditAttribute
								modifiedClassName="bghl"
								attribute="settings.supportedMediaFormats"
								obj={this.props.studio}
								type="text"
								collection={Studios}
								className="mdinput"
							/>
							<span className="mdfx"></span>
						</div>
					</label>
					<label className="field">
						{t('Supported Audio Formats')}
						<div className="mdi">
							<EditAttribute
								modifiedClassName="bghl"
								attribute="settings.supportedAudioStreams"
								obj={this.props.studio}
								type="text"
								collection={Studios}
								className="mdinput"
							/>
							<span className="mdfx"></span>
						</div>
					</label>
					<div className="mod mtn mbm mhn">
						<label className="field">
							<EditAttribute
								modifiedClassName="bghl"
								attribute="settings.forceSettingNowTime"
								obj={this.props.studio}
								type="checkbox"
								collection={Studios}
							/>
							{t('Force the Multi-gateway-mode')}
						</label>
					</div>
					<div className="mod mtn mbm mhn">
						{t('Multi-gateway-mode delay time')}
						<label className="field">
							<EditAttribute
								modifiedClassName="bghl"
								attribute="settings.nowSafeLatency"
								obj={this.props.studio}
								type="int"
								collection={Studios}
								className="mdinput"
							/>
						</label>
					</div>
					<div className="mod mtn mbm mhn">
						<label className="field">
							<EditAttribute
								modifiedClassName="bghl"
								attribute="settings.preserveUnsyncedPlayingSegmentContents"
								obj={this.props.studio}
								type="checkbox"
								collection={Studios}
							/>
							{t('Preserve contents of playing segment when unsynced')}
						</label>
					</div>
					<div className="mod mtn mbm mhn">
						<label className="field">
							<EditAttribute
								modifiedClassName="bghl"
								attribute="settings.allowRundownResetOnAir"
								obj={this.props.studio}
								type="checkbox"
								collection={Studios}
							/>
							{t('Allow Rundowns to be reset while on-air')}
						</label>
					</div>
					<div className="mod mtn mbm mhn">
						<label className="field">
							<EditAttribute
								modifiedClassName="bghl"
								attribute="settings.preserveOrphanedSegmentPositionInRundown"
								obj={this.props.studio}
								type="checkbox"
								collection={Studios}
							/>
							{t(
								'Preserve position of segments when unsynced relative to other segments. Note: this has only been tested for the iNews gateway'
							)}
						</label>
					</div>

					<div className="col c12 r1-c12">
						<StudioBaselineStatus studio={this.props.studio} t={t} i18n={this.props.i18n} tReady={this.props.tReady} />
					</div>
				</div>
			)
		}
	}
)
