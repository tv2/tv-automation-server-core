import { Tv2SisyfosPersistenceMetaData } from './tv2-meta-data'

// These values are taken from "PartEndStateExt" in Blueprints
export interface Tv2PartEndState {
	sisyfosPersistenceMetaData: Tv2SisyfosPersistenceMetaData
	mediaPlayerSessions: Map<string, string[]> // { [layer: string]: string[] }
	isJingle?: boolean
	fullFileName?: string
	serverPosition?: Tv2ServerPosition
	segmentId: string // TODO: Is this needed?
	partId: string // TODO: Is this needed?
}

export interface Tv2ServerPosition {
	fileName: string
	lastEnd: number
	isPlaying: boolean
	endedWithPartInstance?: string
}
