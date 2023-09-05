import { LookAheadMode } from '../enums/look-ahead-mode'

export interface StudioLayer {
	name: string
	lookAheadMode: LookAheadMode
	amountOfLookAheadObjectsToFind: number
	maximumLookAheadSearchDistance: number
}
