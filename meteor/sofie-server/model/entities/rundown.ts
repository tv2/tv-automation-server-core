import { Segment } from './segment'
import { Part } from './part'
import { TimelineObject } from './timeline-object'
import { Exception } from '../exceptions/exception'
import { ErrorCode } from '../enums/error-code'
import { LastPartInSegmentException } from '../exceptions/last-part-in-segment-exception'
import { NotFoundException } from '../exceptions/not-found-exception'
import { NotActivatedException } from '../exceptions/not-activated-exception'

export interface RundownInterface {
	id: string
	name: string
	segments: Segment[]
	isActive: boolean
}

export class Rundown {
	readonly id: string
	readonly name: string

	private segments: Segment[]
	private isRundownActive: boolean = false

	private activeSegment: Segment
	private activePart: Part

	private nextSegment: Segment
	private nextPart: Part

	constructor(rundown: RundownInterface) {
		this.id = rundown.id
		this.name = rundown.name
		this.segments = rundown.segments ?? []
		this.isRundownActive = rundown.isActive
	}

	activate(): TimelineObject[] {
		this.activateFirstSegment()
		this.activateFirstPart()
		this.setNextFromActive()

		this.isRundownActive = true
		return this.activePart.getTimelineObjects()
	}

	private activateFirstSegment(): void {
		this.activeSegment = this.findFirstSegment()
		this.activeSegment.putOnAir()
		this.nextSegment = this.segments[1] // TODO: Assert that the next Segment is there
	}

	private findFirstSegment(): Segment {
		return this.segments.reduce((previousSegment: Segment, currentSegment: Segment) => {
			return previousSegment.rank < currentSegment.rank ? previousSegment : currentSegment
		})
	}

	private activateFirstPart(): void {
		this.activePart = this.activeSegment.findFirstPart()
		this.activePart.putOnAir()
	}

	private setNextFromActive(): void {
		try {
			this.nextPart = this.activeSegment.findNextPart(this.activePart)
		} catch (exception) {
			if ((exception as Exception).errorCode !== ErrorCode.LAST_PART_IN_SEGMENT) {
				throw exception
			}
			this.nextSegment = this.findNextSegment()
			this.nextPart = this.nextSegment.findFirstPart()
		}
	}

	private findNextSegment(): Segment {
		const activeSegmentIndex: number = this.segments.findIndex(segment => segment.id === this.activeSegment.id)
		if (activeSegmentIndex === -1) {
			throw new NotFoundException(`Segment does not exist in Rundown`)
		}
		if (activeSegmentIndex === this.segments.length + 1) {
			throw new LastPartInSegmentException()
		}
		return this.segments[activeSegmentIndex + 1]
	}

	deactivate(): void {
		this.assertActive('deactivate')
		this.activeSegment.takeOffAir()
		this.activePart.takeOffAir()
		this.isRundownActive = false
	}

	private assertActive(operationName: string): void {
		if (!this.isRundownActive) {
			throw new NotActivatedException(`Rundown "${this.name}" is not active. Unable to ${operationName}`)
		}
	}

	getActiveSegment(): Segment {
		this.assertActive('getActiveSegment')
		return this.activeSegment
	}

	getActivePart(): Part {
		this.assertActive('getActivePart')
		return this.activePart
	}

	isActive(): boolean {
		return this.isRundownActive
	}

	takeNext(): TimelineObject[] {
		this.activePart = this.nextPart
		this.activeSegment = this.nextSegment
		this.setNextFromActive()
		return this.activePart.getTimelineObjects()
	}

	setSegments(segments: Segment[]): void {
		this.segments = segments.sort((segmentOne: Segment, segmentTwo: Segment) => segmentOne.rank - segmentTwo.rank)
	}
}
