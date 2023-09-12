// These values are taken from "TimelinePersistentStateExt" in Blueprints
export interface Tv2RundownPersistentState {
	activeMediaPlayers: Map<string, Tv2MediaPlayerClaim[] | undefined>
	isNewSegment?: boolean
}

export interface Tv2MediaPlayerClaim {
	sessionId: string
	playerId: number
	lookAhead: boolean
}
