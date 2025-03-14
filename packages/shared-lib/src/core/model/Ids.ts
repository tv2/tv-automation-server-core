import { ProtectedString } from '../../lib/protectedString'

/** A string, identifying a Studio */
export type StudioId = ProtectedString<'StudioId'>

/** A string, identifying a PeripheralDevice */
export type PeripheralDeviceId = ProtectedString<'PeripheralDeviceId'>

/** A string, identifying a PeripheralDeviceCommand */
export type PeripheralDeviceCommandId = ProtectedString<'PeripheralDeviceCommandId'>

export type TimelineHash = ProtectedString<'TimelineHash'>

/** A string, identifying a PieceInstance */
export type PieceInstanceId = ProtectedString<'PieceInstanceId'>

/** A string, identifying a PartInstance */
export type PartInstanceId = ProtectedString<'PartInstanceId'>

/** A string, identifying a RundownPlaylist */
export type RundownPlaylistId = ProtectedString<'RundownPlaylistId'>

/** A string, identifying a MediaObj */
export type MediaObjId = ProtectedString<'MediaObjId'>

/** A string, identifying a MediaWorkFlow */
export type MediaWorkFlowId = ProtectedString<'MediaWorkFlowId'>

/** A string, identifying a MediaWorkFlowStep */
export type MediaWorkFlowStepId = ProtectedString<'MediaWorkFlowStepId'>

export type ExpectedPackageId = ProtectedString<'ExpectedPackageId'>

export type ExpectedPackageWorkStatusId = ProtectedString<'ExpectedPackageStatusId'>
