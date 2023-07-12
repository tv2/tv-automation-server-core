import React from 'react'
import { useTranslation } from 'react-i18next'
import { RundownLayoutsAPI } from '../../../../../lib/api/rundownLayouts'
import { RundownLayoutBase, RundownLayouts } from '../../../../../lib/collections/RundownLayouts'
import { ShowStyleBase } from '../../../../../lib/collections/ShowStyleBases'
import { unprotectString } from '../../../../../lib/lib'
import { EditAttribute } from '../../../../lib/EditAttribute'
import { EditAttributeMultiSelect } from '../../../../lib/editAttribute/EditAttributeMultiSelect'
import { EditAttributeDropdown } from '../../../../lib/editAttribute/EditAttributeDropdown'

function filterLayouts(
	rundownLayouts: RundownLayoutBase[],
	testFunc: (l: RundownLayoutBase) => boolean
): Array<{ label: string; value: string }> {
	return rundownLayouts.filter(testFunc).map((l) => ({ label: l.name, value: unprotectString(l._id) }))
}

interface IProps {
	showStyleBase: ShowStyleBase
	item: RundownLayoutBase
	layouts: RundownLayoutBase[]
}

export default function RundownViewLayoutSettings({ showStyleBase, item, layouts }: IProps) {
	const { t } = useTranslation()

	return (
		<>
			<div className="mod mvs mhs">
				<label className="field">
					{t('Expose as user selectable layout')}
					<EditAttribute
						modifiedClassName="bghl"
						attribute={'exposeAsSelectableLayout'}
						obj={item}
						type="checkbox"
						collection={RundownLayouts}
						className="mod mas"
					></EditAttribute>
				</label>
			</div>
			<div className="mod mvs mhs">
				<label className="field">
					{t('Shelf Layout')}
					<EditAttributeDropdown
						modifiedClassName="bghl"
						attribute={'shelfLayout'}
						obj={item}
						options={filterLayouts(layouts, RundownLayoutsAPI.isLayoutForShelf)}
						collection={RundownLayouts}
						className="input text-input input-l dropdown"
					></EditAttributeDropdown>
				</label>
			</div>
			<div className="mod mvs mhs">
				<label className="field">
					{t('Mini Shelf Layout')}
					<EditAttributeDropdown
						modifiedClassName="bghl"
						attribute={'miniShelfLayout'}
						obj={item}
						options={filterLayouts(layouts, RundownLayoutsAPI.isLayoutForMiniShelf)}
						collection={RundownLayouts}
						className="input text-input input-l dropdown"
					></EditAttributeDropdown>
				</label>
			</div>
			<div className="mod mvs mhs">
				<label className="field">
					{t('Rundown Header Layout')}
					<EditAttributeDropdown
						modifiedClassName="bghl"
						attribute={'rundownHeaderLayout'}
						obj={item}
						options={filterLayouts(layouts, RundownLayoutsAPI.isLayoutForRundownHeader)}
						collection={RundownLayouts}
						className="input text-input input-l dropdown"
					></EditAttributeDropdown>
				</label>
			</div>
			<div className="mod mvs mhs">
				<label className="field">{t('Live line countdown requires Source Layer')}</label>
				<EditAttribute
					modifiedClassName="bghl"
					attribute={`liveLineProps.requiredLayerIds`}
					obj={item}
					type="checkbox"
					collection={RundownLayouts}
					className="mod mas"
					mutateDisplayValue={(v) => (v === undefined || v.length === 0 ? false : true)}
					mutateUpdateValue={() => undefined}
				/>
				<EditAttributeMultiSelect
					modifiedClassName="bghl"
					attribute={`liveLineProps.requiredLayerIds`}
					obj={item}
					options={showStyleBase.sourceLayers.map((l) => {
						return { label: l.name, value: l._id }
					})}
					label={t('Disabled')}
					collection={RundownLayouts}
					className="input text-input input-l dropdown"
					mutateUpdateValue={(v) => (v && v.length > 0 ? v : undefined)}
				/>
				<span className="text-s dimmed">
					{t('One of these source layers must have an active piece for the live line countdown to be show')}
				</span>
			</div>
			<div className="mod mvs mhs">
				<label className="field">{t('Also Require Source Layers')}</label>
				<EditAttribute
					modifiedClassName="bghl"
					attribute={`liveLineProps.additionalLayers`}
					obj={item}
					type="checkbox"
					collection={RundownLayouts}
					className="mod mas"
					mutateDisplayValue={(v) => (v === undefined || v.length === 0 ? false : true)}
					mutateUpdateValue={() => undefined}
				/>
				<EditAttributeMultiSelect
					modifiedClassName="bghl"
					attribute={`liveLineProps.additionalLayers`}
					obj={item}
					options={showStyleBase.sourceLayers.map((l) => {
						return { label: l.name, value: l._id }
					})}
					label={t('Disabled')}
					collection={RundownLayouts}
					className="input text-input input-l dropdown"
					mutateUpdateValue={(v) => (v && v.length > 0 ? v : undefined)}
				/>
				<span className="text-s dimmed">
					{t('Specify additional layers where at least one layer must have an active piece')}
				</span>
			</div>
			<div className="mod mvs mhs">
				<label className="field">
					{t('Require All Additional Source Layers')}
					<EditAttribute
						modifiedClassName="bghl"
						attribute={`liveLineProps.requireAllAdditionalSourcelayers`}
						obj={item}
						type="checkbox"
						collection={RundownLayouts}
						className="mod mas"
					/>
					<span className="text-s dimmed">{t('All additional source layers must have active pieces')}</span>
				</label>
			</div>
			<div className="mod mvs mhs">
				<label className="field">
					{t('Hide Rundown Divider')}
					<EditAttribute
						modifiedClassName="bghl"
						attribute={'hideRundownDivider'}
						obj={item}
						type="checkbox"
						collection={RundownLayouts}
						className="mod mas"
					></EditAttribute>
					<span className="text-s dimmed">{t('Hide rundown divider between rundowns in a playlist')}</span>
				</label>
			</div>
			<div className="mod mvs mhs">
				<label className="field">
					{t('Show Breaks as Segments')}
					<EditAttribute
						modifiedClassName="bghl"
						attribute={'showBreaksAsSegments'}
						obj={item}
						type="checkbox"
						collection={RundownLayouts}
						className="mod mas"
					></EditAttribute>
				</label>
			</div>
			<div className="mod mvs mhs">
				<label className="field">{t('Segment countdown requires source layer')}</label>
				<EditAttribute
					modifiedClassName="bghl"
					attribute={`countdownToSegmentRequireLayers`}
					obj={item}
					type="checkbox"
					collection={RundownLayouts}
					className="mod mas"
					mutateDisplayValue={(v) => (v === undefined || v.length === 0 ? false : true)}
					mutateUpdateValue={() => undefined}
				/>
				<EditAttributeMultiSelect
					modifiedClassName="bghl"
					attribute={`countdownToSegmentRequireLayers`}
					obj={item}
					options={showStyleBase.sourceLayers.map((l) => {
						return { label: l.name, value: l._id }
					})}
					label={t('Disabled')}
					collection={RundownLayouts}
					className="input text-input input-l dropdown"
					mutateUpdateValue={(v) => (v && v.length > 0 ? v : undefined)}
				/>
				<span className="text-s dimmed">
					{t('One of these source layers must have a piece for the countdown to segment on-air to be show')}
				</span>
			</div>
			<div className="mod mvs mhs">
				<label className="field">
					{t('Fixed duration in Segment header')}
					<EditAttribute
						modifiedClassName="bghl"
						attribute={'fixedSegmentDuration'}
						obj={item}
						type="checkbox"
						collection={RundownLayouts}
						className="mod mas"
					></EditAttribute>
					<span className="text-s dimmed">
						{t(
							'The segment duration in the segment header always displays the planned duration instead of acting as a counter'
						)}
					</span>
				</label>
			</div>
			<div className="mod mvs mhs">
				<div className="field">
					{t('Select visible Source Layers')}
					<EditAttributeMultiSelect
						modifiedClassName="bghl"
						attribute={'visibleSourceLayers'}
						obj={item}
						options={showStyleBase.sourceLayers
							.sort((a, b) => a._rank - b._rank)
							.map((sourceLayer) => ({
								value: sourceLayer._id,
								label: sourceLayer.name,
							}))}
						mutateUpdateValue={undefinedOnEmptyArray}
						collection={RundownLayouts}
						className="input text-input input-l dropdown"
					></EditAttributeMultiSelect>
				</div>
			</div>
			<div className="mod mvs mhs">
				<div className="field">
					{t('Select visible Output Groups')}
					<EditAttributeMultiSelect
						modifiedClassName="bghl"
						attribute={'visibleOutputLayers'}
						obj={item}
						options={showStyleBase.outputLayers
							.sort((a, b) => a._rank - b._rank)
							.map((outputLayer) => ({
								value: outputLayer._id,
								label: outputLayer.name,
							}))}
						mutateUpdateValue={undefinedOnEmptyArray}
						collection={RundownLayouts}
						className="input text-input input-l dropdown"
					></EditAttributeMultiSelect>
				</div>
			</div>
			<div className="mod mvs mhs">
				<label className="field">{t('Display piece duration for source layers')}</label>
				<EditAttribute
					modifiedClassName="bghl"
					attribute={`showDurationSourceLayers`}
					obj={item}
					type="checkbox"
					collection={RundownLayouts}
					className="mod mas"
					mutateDisplayValue={(v) => (v === undefined || v.length === 0 ? false : true)}
					mutateUpdateValue={() => undefined}
				/>
				<EditAttributeMultiSelect
					modifiedClassName="bghl"
					attribute={`showDurationSourceLayers`}
					obj={item}
					options={showStyleBase.sourceLayers.map((l) => {
						return { label: l.name, value: l._id }
					})}
					label={t('Disabled')}
					collection={RundownLayouts}
					className="input text-input input-l dropdown"
					mutateUpdateValue={(v) => (v && v.length > 0 ? v : undefined)}
				/>
				<span className="text-s dimmed">{t('Piece on selected source layers will have a duration label shown')}</span>
			</div>
		</>
	)
}

function undefinedOnEmptyArray(v: string[]): string[] | undefined {
	if (Array.isArray(v)) {
		if (v.length === 0) {
			return undefined
		} else {
			return v
		}
	}
	return undefined
}
