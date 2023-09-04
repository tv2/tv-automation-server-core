export interface PartTimings {
	inTransitionStart: number | undefined // The start time within the toPartGroup of the inTransition
	delayStartOfPiecesDuration: number // How long after the start of toPartGroup should piece time 0 be
	postRollDuration: number
	previousPartContinueIntoPartDuration: number // How long after the start of toPartGroup should fromPartGroup continue?
}
