import { PieceLifespan } from '../../enums/piece-lifespan'
import { Piece } from '../piece'
import { PieceType } from '../../enums/piece-type'
import { Part } from '../part'
import { Segment } from '../segment'

describe('Segment', () => {
	describe('getPiecesSpanningSegmentBeforePart', () => {
		it('has two Parts with each two Pieces, has to find "after" both Parts, returns spanning pieces of both Parts', () => {
			const pieceTwo = createPiece('2', PieceLifespan.SPANNING_UNTIL_SEGMENT_END, 'someLayer')
			const partOne = createPart('1', 1, [createPiece('1'), pieceTwo])

			const pieceFour = createPiece('4', PieceLifespan.SPANNING_UNTIL_SEGMENT_END, 'someOtherLayer')
			const partTwo = createPart('2', 2, [createPiece('3'), pieceFour])

			const partToSearchBefore = createPart('3', 3)

			const testee = createSegment([partOne, partTwo, partToSearchBefore])
			const result = testee.getFirstSpanningPieceForEachLayerBeforePart(partToSearchBefore, new Set())

			expect(result).toHaveLength(2)
			expect(result).toContain(pieceTwo)
			expect(result).toContain(pieceFour)
		})

		it('has two Parts with each two Pieces, has to find before second Part, returns only spanning piece of first Part', () => {
			const piece = createPiece('2', PieceLifespan.SPANNING_UNTIL_SEGMENT_END)
			const partOne = createPart('1', 1, [createPiece('1'), piece])
			const partTwo = createPart('2', 2, [
				createPiece('3'),
				createPiece('4', PieceLifespan.SPANNING_UNTIL_SEGMENT_END),
			])
			const testee = createSegment([partOne, partTwo])

			const result = testee.getFirstSpanningPieceForEachLayerBeforePart(partTwo, new Set())

			expect(result).toHaveLength(1)
			expect(result).toContain(piece)
		})

		it('has Part with two spanning Pieces, one Piece has same layer as ignored layers, return Piece not on ignored layers', () => {
			const layerToBeIgnored: string = 'layerToBeIgnored'
			const pieceOne = createPiece('1', PieceLifespan.SPANNING_UNTIL_SEGMENT_END)
			const pieceTwo = createPiece('2', PieceLifespan.SPANNING_UNTIL_SEGMENT_END, layerToBeIgnored)

			const part = createPart('1', 1, [pieceOne, pieceTwo])
			const partToSearchBefore = createPart('3', 3)

			const testee = createSegment([part, partToSearchBefore])

			const result = testee.getFirstSpanningPieceForEachLayerBeforePart(
				partToSearchBefore,
				new Set([layerToBeIgnored])
			)

			expect(result).toHaveLength(1)
			expect(result).toContain(pieceOne)
		})

		it('has two Parts that both have a spanning Piece for the same layer, returns the Piece from the latest Part', () => {
			const specificLayer: string = 'specificLayer'
			const pieceOne = createPiece('1', PieceLifespan.SPANNING_UNTIL_SEGMENT_END, specificLayer)
			const pieceTwo = createPiece('2', PieceLifespan.SPANNING_UNTIL_SEGMENT_END, specificLayer)

			const part = createPart('1', 1, [pieceOne, pieceTwo])
			const partToSearchBefore = createPart('3', 3)

			const testee = createSegment([part, partToSearchBefore])

			const result = testee.getFirstSpanningPieceForEachLayerBeforePart(partToSearchBefore, new Set())

			expect(result).toHaveLength(1)
			expect(result).toContain(pieceTwo)
		})
	})
})

function createPiece(
	id: string,
	pieceLifeSpan: PieceLifespan = PieceLifespan.WITHIN_PART,
	layer: string = 'someLayer'
): Piece {
	return new Piece({
		id,
		partId: 'partId',
		name: 'pieceName',
		layer,
		pieceLifespan: pieceLifeSpan,
		start: 0,
		duration: 10,
		type: PieceType.LIVE,
		timelineObjects: [],
	})
}

function createPart(id: string, rank: number, pieces: Piece[] = []): Part {
	return new Part({
		id,
		segmentId: 'segmentId',
		name: 'partName',
		rank,
		isNext: false,
		isOnAir: false,
		expectedDuration: 10,
		pieces,
	})
}

function createSegment(parts: Part[] = []): Segment {
	return new Segment({
		id: 'segmentId',
		name: 'segmentName',
		isNext: false,
		isOnAir: false,
		rank: 1,
		rundownId: 'rundownId',
		parts,
	})
}
