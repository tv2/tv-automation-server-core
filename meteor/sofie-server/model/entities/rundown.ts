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
import { PieceLifespan } from '../enums/piece-lifespan'
import { UnsupportedOperation } from '../exceptions/unsupported-operation'

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

	private previousPart?: Part

	private infinitePieces: Map<string, Piece> = new Map()

	constructor(rundown: RundownInterface) {
		this.id = rundown.id
		this.name = rundown.name
		this.segments = rundown.segments ?? []
		this.isRundownActive = rundown.isActive
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
			const segment: Segment = this.findNextSegment()
			// TODO: Handle that we might be on the last Segment
			if (segment) {
				this.nextSegment = segment
				this.nextPart = this.nextSegment.findFirstPart()
			}
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
		this.assertActive(this.deactivate.name)
		this.activeSegment.takeOffAir()
		this.activePart.takeOffAir()
		this.unmarkNextSegmentAndPart()
		this.infinitePieces = new Map()
		this.isRundownActive = false
		this.previousPart = undefined
	}

	private assertActive(operationName: string): void {
		if (!this.isRundownActive) {
			throw new NotActivatedException(`Rundown "${this.name}" is not active. Unable to ${operationName}`)
		}
	}

	public getActiveSegment(): Segment {
		this.assertActive(this.getActiveSegment.name)
		return this.activeSegment
	}

	public getNextSegment(): Segment {
		this.assertActive(this.getNextSegment.name)
		return this.nextSegment
	}

	public getActivePart(): Part {
		this.assertActive(this.getActivePart.name)
		return this.activePart
	}

	public getNextPart(): Part {
		this.assertActive(this.getNextPart.name)
		return this.nextPart
	}

	public getPreviousPart(): Part | undefined {
		this.assertActive(this.getPreviousPart.name)
		return this.previousPart
	}

	public isActive(): boolean {
		return this.isRundownActive
	}

	public takeNext(): void {
		this.assertActive(this.takeNext.name)
		this.setPreviousPart()
		this.takeNextPart()
		this.takeNextSegment()
		this.setNextFromActive()
		this.updateInfinitePieces()
	}

	private setPreviousPart(): void {
		if (!this.activePart?.isOnAir()) {
			// Simple guard to prevent setting PreviousPart on Rundown.activate().
			// Strongly consider refactor into something less implicit.
			return
		}
		this.previousPart = this.activePart
	}

	private takeNextPart(): void {
		if (this.activePart) {
			this.activePart.takeOffAir()
		}
		this.activePart = this.nextPart
		this.activePart.putOnAir()
		this.activePart.calculateTimings(this.previousPart)
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
	}

	private updateInfinitePieces(): void {
		let layersWithPieces: Map<string, Piece> = new Map(
			this.getActivePart().getPieces().map((piece) => [piece.layer, piece])
		)

		const piecesToCheckIfTheyHaveBeenOutlived: Piece[] = this.findOldInfinitePiecesNotOnLayers(
			new Set(layersWithPieces.keys())
		)
		const piecesThatAreNotOutlived: Piece[] = piecesToCheckIfTheyHaveBeenOutlived.filter(
			(piece) => !this.isPieceOutlived(piece)
		)
		layersWithPieces = this.addPiecesToLayers(piecesThatAreNotOutlived, layersWithPieces)

		layersWithPieces = this.addSpanningPiecesNotOnLayersFromActiveSegment(layersWithPieces)
		layersWithPieces = this.addSpanningPiecesNotOnLayersFromPreviousSegments(layersWithPieces)

		this.resetOutlivedInfinitePieces(Array.from(layersWithPieces.values()))
		this.setInfinitePieces(layersWithPieces)
	}

	private findOldInfinitePiecesNotOnLayers(layers: Set<string>): Piece[] {
		return Array.from(this.infinitePieces.values()).filter((oldPiece) => {
			return !layers.has(oldPiece.layer)
		})
	}

	private isPieceOutlived(piece: Piece): boolean {
		switch (piece.pieceLifespan) {
			case PieceLifespan.WITHIN_PART: {
				// Not an infinite, so we don't care about it and just mark it as outlived.
				return true
			}
			case PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE: {
				// Since we are in the context of a Rundown then the Piece will never be able to leave the Rundown, so the Piece is NOT outlived.
				return false
			}
			case PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE: {
				// If the Piece belongs to the active Segment, then the Piece is NOT outlived.
				return !this.activeSegment.doesPieceBelongToSegment(piece)
			}
			case PieceLifespan.SPANNING_UNTIL_RUNDOWN_END:
			case PieceLifespan.SPANNING_UNTIL_SEGMENT_END: {
				// We always mark SPANNING as outlived because even it if isn't we need to check if there is another SPANNING Piece between this Piece and the active Part.
				return true
			}
			default: {
				throw new UnsupportedOperation(
					`{${piece.pieceLifespan}} is not supported. Are you missing an implementation?`
				)
			}
		}
	}

	private resetOutlivedInfinitePieces(piecesThatHasNotBeenOutlived: Piece[]): void {
		const pieceIdsThatHasNotBeenOutlived: string[] = piecesThatHasNotBeenOutlived.map(piece => piece.id)
		Array.from(this.infinitePieces.values())
			.filter(piece => !pieceIdsThatHasNotBeenOutlived.includes(piece.id))
			.forEach(piece => piece.resetExecutedAt())
	}

	private addPiecesToLayers(pieces: Piece[], layersWithPieces: Map<string, Piece>): Map<string, Piece> {
		pieces.forEach((piece) => {
			if (layersWithPieces.has(piece.layer)) {
				throw new Error(
					`${piece.pieceLifespan}: Trying to add an infinite Piece to a layer that already have an infinite Piece`
				)
			}
			layersWithPieces.set(piece.layer, piece)
		})
		return layersWithPieces
	}

	private addSpanningPiecesNotOnLayersFromActiveSegment(layersWithPieces: Map<string, Piece>): Map<string, Piece> {
		const piecesToAdd: Piece[] = this.activeSegment.getFirstSpanningPieceForEachLayerBeforePart(
			this.activePart,
			new Set(layersWithPieces.keys())
		)
		return this.addPiecesToLayers(piecesToAdd, layersWithPieces)
	}

	private addSpanningPiecesNotOnLayersFromPreviousSegments(layersWithPieces: Map<string, Piece>): Map<string, Piece> {
		const indexOfActiveSegment = this.segments.findIndex((segment) => segment.id === this.activeSegment.id)
		for (let i = indexOfActiveSegment - 1; i >= 0; i--) {
			const piecesSpanningSegment: Piece[] = this.segments[i].getFirstSpanningRundownPieceForEachLayerForAllParts(
				new Set(layersWithPieces.keys())
			)
			layersWithPieces = this.addPiecesToLayers(piecesSpanningSegment, layersWithPieces)
		}
		return layersWithPieces
	}

	private setInfinitePieces(layersWithPieces: Map<string, Piece>): void {
		this.infinitePieces = new Map()
		layersWithPieces.forEach((piece: Piece, layer: string) => {
			if (piece.pieceLifespan === PieceLifespan.WITHIN_PART) {
				return
			}
			this.infinitePieces.set(layer, piece)
		})
	}

	public setNext(segmentId: string, partId: string): void {
		this.assertActive(this.setNext.name)

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
		this.assertActive(this.adAdLibPiece.name)
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
