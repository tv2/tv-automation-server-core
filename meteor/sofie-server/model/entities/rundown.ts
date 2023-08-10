import { Segment } from './segment'
import { Part } from './part'
import { Exception } from '../exceptions/exception'
import { ErrorCode } from '../enums/error-code'
import { LastPartInSegmentException } from '../exceptions/last-part-in-segment-exception'
import { NotFoundException } from '../exceptions/not-found-exception'
import { NotActivatedException } from '../exceptions/not-activated-exception'
import { AlreadyActivatedException } from '../exceptions/already-activated-exception'
import { AdLibPiece } from './ad-lib-piece'
import { Piece } from './piece'
import { BasicRundown } from './basic-rundown'

export interface RundownInterface {
	id: string
	name: string
	segments: Segment[]
	isRundownActive: boolean
	lastTimeModified: number
}

export class Rundown extends BasicRundown {
	private segments: Segment[]

	private activeSegment: Segment
	private activePart: Part

	private nextSegment: Segment
	private nextPart: Part

	private infinitePieces: Map<string, Piece> = new Map()

	constructor(rundown: RundownInterface) {
		super(rundown.id, rundown.name, rundown.isRundownActive, rundown.lastTimeModified)
		this.segments = rundown.segments ?? []
	}

	public activate(): void {
		if (this.isActive()) {
			throw new AlreadyActivatedException("Can't activate Rundown since it is already activated")
		}
		this.isRundownActive = true

		this.nextSegment = this.findFirstSegment()
		this.nextPart = this.nextSegment.findFirstPart()

		this.takeNext()
	}

	private findFirstSegment(): Segment {
		return this.segments.reduce((previousSegment: Segment, currentSegment: Segment) => {
			return previousSegment.rank < currentSegment.rank ? previousSegment : currentSegment
		})
	}

	private setNextFromActive(): void {
		this.unmarkNextSegmentAndPart()

		try {
			this.nextPart = this.activeSegment.findNextPart(this.activePart)
		} catch (exception) {
			if ((exception as Exception).errorCode !== ErrorCode.LAST_PART_IN_SEGMENT) {
				throw exception
			}
			this.nextSegment = this.findNextSegment()
			this.nextPart = this.nextSegment.findFirstPart()
		}

		this.markNextSegmentAndPart()
	}

	private unmarkNextSegmentAndPart(): void {
		if (this.nextSegment) {
			this.nextSegment.removeAsNext()
		}
		if (this.nextPart) {
			this.nextPart.removeAsNext()
		}
	}

	private markNextSegmentAndPart(): void {
		if (this.nextSegment) {
			this.nextSegment.setAsNext()
		}
		if (this.nextPart) {
			this.nextPart.setAsNext()
		}
	}

	private findNextSegment(): Segment {
		const activeSegmentIndex: number = this.segments.findIndex((segment) => segment.id === this.activeSegment.id)
		if (activeSegmentIndex === -1) {
			throw new NotFoundException(`Segment does not exist in Rundown`)
		}
		if (activeSegmentIndex === this.segments.length + 1) {
			throw new LastPartInSegmentException()
		}
		return this.segments[activeSegmentIndex + 1]
	}

	public deactivate(): void {
		this.assertActive('deactivate')
		this.activeSegment.takeOffAir()
		this.activePart.takeOffAir()
		this.unmarkNextSegmentAndPart()
		this.infinitePieces = new Map()
		this.isRundownActive = false
	}

	private assertActive(operationName: string): void {
		if (!this.isRundownActive) {
			throw new NotActivatedException(`Rundown "${this.name}" is not active. Unable to ${operationName}`)
		}
	}

	public getActiveSegment(): Segment {
		this.assertActive('getActiveSegment')
		return this.activeSegment
	}

	public getNextSegment(): Segment {
		this.assertActive('getNextSegment')
		return this.nextSegment
	}

	public getActivePart(): Part {
		this.assertActive('getActivePart')
		return this.activePart
	}

	public getNextPart(): Part {
		this.assertActive('getNextPart')
		return this.nextPart
	}

	public takeNext(): void {
		this.assertActive('takeNext')
		this.takeNextPart()
		this.takeNextSegment()
		this.setNextFromActive()
	}

	private takeNextPart(): void {
		if (this.activePart) {
			this.activePart.takeOffAir()
		}
		this.activePart = this.nextPart
		this.activePart.putOnAir()
		this.activePart
			.getInfiniteRundownPieces()
			.forEach((piece: Piece) => this.infinitePieces.set(piece.layer, piece))
	}

	/**
	 * This needs information from the current active Part, so this must be called after the active Part has been updated.
	 */
	private takeNextSegment(): void {
		if (this.activeSegment) {
			this.activeSegment.takeOffAir()
		}
		this.activeSegment = this.nextSegment
		this.activeSegment.putOnAir()
		this.activeSegment.addInfinitePieces(this.activePart.getSegmentRundownPieces())
	}

	public setNext(segmentId: string, partId: string): void {
		this.assertActive('setNext')

		this.unmarkNextSegmentAndPart()

		this.nextSegment = this.findSegment(segmentId)
		this.nextPart = this.nextSegment.findPart(partId)

		this.markNextSegmentAndPart()
	}

	private findSegment(segmentId: string): Segment {
		const segment: Segment | undefined = this.segments.find((segment) => segment.id === segmentId)
		if (!segment) {
			throw new NotFoundException(`Segment "${segmentId}" does not exist in Rundown "${this.id}"`)
		}
		return segment
	}

	public setSegments(segments: Segment[]): void {
		this.segments = segments.sort((segmentOne: Segment, segmentTwo: Segment) => segmentOne.rank - segmentTwo.rank)
	}

	public getSegments(): Segment[] {
		return this.segments
	}

	public adAdLibPiece(adLibPiece: AdLibPiece): void {
		this.assertActive('adAdLiPiece')
		this.activePart.addAdLibPiece(adLibPiece)
	}

	public getInfinitePieces(): Piece[] {
		return Array.from(this.infinitePieces.values())
	}

	public reset(): void {
		this.deactivate()
		this.activate()
	}
}
