import { PieceLifespan } from '../../enums/piece-lifespan'
import { Piece, PieceInterface } from '../piece'
import { Part, PartInterface } from '../part'
import { Segment, SegmentInterface } from '../segment'
import { EntityDefaultFactory } from './entity-default-factory'

describe('Segment', () => {
	describe('getPiecesSpanningSegmentBeforePart', () => {
		it('has two Parts with each two Pieces, has to find "after" both Parts, returns spanning pieces of both Parts', () => {
			const pieceTwo: Piece = EntityDefaultFactory.createPiece({ id: '2', pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END, layer: 'someLayer' } as PieceInterface)
			const partOne: Part = EntityDefaultFactory.createPart({ id: '1', rank: 1, pieces: [EntityDefaultFactory.createPiece({ id: '1' } as PieceInterface), pieceTwo] } as PartInterface)

			const pieceFour: Piece = EntityDefaultFactory.createPiece({ id: '4', pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END, layer: 'someOtherLayer' } as PieceInterface)
			const partTwo: Part = EntityDefaultFactory.createPart({ id: '2', rank: 2, pieces: [EntityDefaultFactory.createPiece({ id: '3' } as PieceInterface), pieceFour] } as PartInterface)

			const partToSearchBefore: Part = EntityDefaultFactory.createPart({ id: '3', rank: 3 } as PartInterface)

			const testee: Segment = EntityDefaultFactory.createSegment({ parts: [partOne, partTwo, partToSearchBefore] } as SegmentInterface)
			const result: Piece[] = testee.getFirstSpanningPieceForEachLayerBeforePart(partToSearchBefore, new Set())

			expect(result).toHaveLength(2)
			expect(result).toContain(pieceTwo)
			expect(result).toContain(pieceFour)
		})

		it('has two Parts with each two Pieces, has to find before second Part, returns only spanning piece of first Part', () => {
			const piece: Piece = EntityDefaultFactory.createPiece({ id: '2', pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END } as PieceInterface)
			const partOne: Part = EntityDefaultFactory.createPart({ id: '1', rank: 1, pieces: [EntityDefaultFactory.createPiece({ id: '1' } as PieceInterface), piece] } as PartInterface)
			const partTwo: Part = EntityDefaultFactory.createPart({ id: '2', rank: 2,  pieces: [
				EntityDefaultFactory.createPiece({ id: '3'} as PieceInterface),
				EntityDefaultFactory.createPiece({ id: '4', pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END } as PieceInterface),
			] } as PartInterface)
			const testee: Segment = EntityDefaultFactory.createSegment({ parts: [partOne, partTwo] } as SegmentInterface)

			const result: Piece[] = testee.getFirstSpanningPieceForEachLayerBeforePart(partTwo, new Set())

			expect(result).toHaveLength(1)
			expect(result).toContain(piece)
		})

		it('has Part with two spanning Pieces, one Piece has same layer as ignored layers, return Piece not on ignored layers', () => {
			const layerToBeIgnored: string = 'layerToBeIgnored'
			const pieceOne: Piece = EntityDefaultFactory.createPiece({ id: '1', pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END } as PieceInterface)
			const pieceTwo: Piece = EntityDefaultFactory.createPiece({ id: '2', pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END, layer: layerToBeIgnored } as PieceInterface)

			const part: Part = EntityDefaultFactory.createPart({ id: '1', rank: 1, pieces: [pieceOne, pieceTwo] } as PartInterface)
			const partToSearchBefore: Part = EntityDefaultFactory.createPart({ id: '3', rank: 3 } as PartInterface)

			const testee: Segment = EntityDefaultFactory.createSegment({ parts: [part, partToSearchBefore] } as SegmentInterface)

			const result: Piece[] = testee.getFirstSpanningPieceForEachLayerBeforePart(
				partToSearchBefore,
				new Set([layerToBeIgnored])
			)

			expect(result).toHaveLength(1)
			expect(result).toContain(pieceOne)
		})

		it('has two Parts that both have a spanning Piece for the same layer, returns the Piece from the latest Part', () => {
			const specificLayer: string = 'specificLayer'
			const pieceOne: Piece = EntityDefaultFactory.createPiece({ id: '1', pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END, layer: specificLayer } as PieceInterface)
			const pieceTwo: Piece = EntityDefaultFactory.createPiece({ id: '2', pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END, layer: specificLayer } as PieceInterface)

			const part: Part = EntityDefaultFactory.createPart({ id: '1', rank: 1, pieces: [pieceOne, pieceTwo] } as PartInterface)
			const partToSearchBefore: Part = EntityDefaultFactory.createPart({ id: '3', rank: 3 } as PartInterface)

			const testee: Segment = EntityDefaultFactory.createSegment({ parts: [part, partToSearchBefore] } as SegmentInterface)

			const result: Piece[] = testee.getFirstSpanningPieceForEachLayerBeforePart(partToSearchBefore, new Set())

			expect(result).toHaveLength(1)
			expect(result).toContain(pieceTwo)
		})
	})
})
