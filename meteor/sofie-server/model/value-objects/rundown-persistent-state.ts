// This is the equivalent of "TimelinePersistentState" that is on RundownPlaylist in old Core.
// The attributes are entirely decided by Blueprints, and it's the Blueprint.onTimelineGenerate that creates the "persistent state".
// SofieServer just needs to know this attribute exist, so it can parse it along to Blueprints.
export type RundownPersistentState = unknown
