export enum PieceLifespan {
	WITHIN_PART = 'WITHIN_PART',
	STICKY_UNTIL_SEGMENT_CHANGE = 'STICKY_UNTIL_SEGMENT_CHANGE',
	SPANNING_UNTIL_SEGMENT_END = 'SPANNING_UNTIL_SEGMENT_END',
	STICKY_UNTIL_RUNDOWN_CHANGE = 'STICKY_UNTIL_RUNDOWN_CHANGE',
	SPANNING_UNTIL_RUNDOWN_END = 'SPANNING_UNTIL_RUNDOWN_END',
	START_SPANNING_SEGMENT_THEN_STICKY_RUNDOWN = 'START_SPANNING_SEGMENT_THEN_STICKY_RUNDOWN',
}
