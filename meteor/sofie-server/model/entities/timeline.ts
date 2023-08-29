import { TimelineObject } from './timeline-object'

export interface Timeline {
	timelineGroups: TimelineObjectGroup[]
	autoNext?: {
		epochTimeToTakeNext: number
	}
}

export interface TimelineObjectGroup extends TimelineObject {
	isGroup: true
	children: TimelineObject[]
	content: {
		// TODO: Are these needed?
		type: TimelineObjectType.GROUP
		deviceType: DeviceType.ABSTRACT
	}
}

export interface ActivePartTimelineObjectGroup extends TimelineObjectGroup {
	autoNextEpochTime: number
}

// TODO: Do we need separate interface for this?
export interface TimelineObjectControl extends TimelineObject {
	content: {
		type: TimelineObjectType.CONTROL
		deviceType: DeviceType.ABSTRACT
	}
}

export enum TimelineObjectType {
	CONTROL = 'control',
	GROUP = 'group',
}

// TODO: This is currently copied from BlueprintIntegrations TSR in node_module. Get the info some other way.
export enum DeviceType {
	ABSTRACT = 0,
	CASPARCG = 1,
	ATEM = 2,
	LAWO = 3,
	HTTPSEND = 4,
	PANASONIC_PTZ = 5,
	TCPSEND = 6,
	HYPERDECK = 7,
	PHAROS = 8,
	OSC = 9,
	HTTPWATCHER = 10,
	SISYFOS = 11,
	QUANTEL = 12,
	VIZMSE = 13,
	SINGULAR_LIVE = 14,
	SHOTOKU = 15,
	VMIX = 20,
	OBS = 21,
	TELEMETRICS = 22,
	TRICASTER = 24,
}
