import { PieceLifespan } from '../../enums/piece-lifespan'
import { Piece, PieceInterface } from '../piece'
import { Part, PartInterface } from '../part'
import { Segment, SegmentInterface } from '../segment'
import { EntityMockFactory } from './entity-mock-factory'

describe('Segment', () => {
	describe('getPiecesSpanningSegmentBeforePart', () => {
		describe('Segment has two Parts', () => {
			describe('Each Part has two Pieces. One Piece on each is a "spanning" Piece', () => {
				describe('it has to find "after" both Parts', () => {
					it('returns the "spanning" Pieces of both Parts', () => {
						const pieceTwo: Piece = EntityMockFactory.createPiece({
							id: '2',
							pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
							layer: 'someLayer',
						} as PieceInterface)
						const partOne: Part = EntityMockFactory.createPart({
							id: '1',
							rank: 1,
							pieces: [EntityMockFactory.createPiece({ id: '1' } as PieceInterface), pieceTwo],
						} as PartInterface, { pieceLifespanFilters: [
								PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
								PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
							] }
						)

						const pieceFour: Piece = EntityMockFactory.createPiece({
							id: '4',
							pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
							layer: 'someOtherLayer',
						} as PieceInterface)
						const partTwo: Part = EntityMockFactory.createPart({
							id: '2',
							rank: 2,
							pieces: [EntityMockFactory.createPiece({ id: '3' } as PieceInterface), pieceFour],
						} as PartInterface, { pieceLifespanFilters: [
								PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
								PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
							] }
						)

						const partToSearchBefore: Part = EntityMockFactory.createPart({ id: '3', rank: 3 } as PartInterface)

						const testee: Segment = new Segment({
							parts: [partOne, partTwo, partToSearchBefore],
						} as SegmentInterface)
						const result: Piece[] = testee.getFirstSpanningPieceForEachLayerBeforePart(partToSearchBefore, new Set())

						expect(result).toHaveLength(2)
						expect(result).toContain(pieceTwo)
						expect(result).toContain(pieceFour)
					})
				})

				describe('it has to find before the second Part', () => {
					it('returns the "spanning" Piece of the first Part', () => {
						const piece: Piece = EntityMockFactory.createPiece({
							id: '2',
							pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
						} as PieceInterface)
						const partOne: Part = EntityMockFactory.createPart({
							id: '1',
							rank: 1,
							pieces: [EntityMockFactory.createPiece({ id: '1' } as PieceInterface), piece],
						} as PartInterface, { pieceLifespanFilters: [
								PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
								PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
							] }
						)
						const partTwo: Part = EntityMockFactory.createPart({
							id: '2',
							rank: 2,
							pieces: [
								EntityMockFactory.createPiece({ id: '3' } as PieceInterface),
								EntityMockFactory.createPiece({
									id: '4',
									pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
								} as PieceInterface),
							],
						} as PartInterface, { pieceLifespanFilters: [
								PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
								PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
							] }
						)
						const testee: Segment = new Segment({
							parts: [partOne, partTwo],
						} as SegmentInterface)

						const result: Piece[] = testee.getFirstSpanningPieceForEachLayerBeforePart(partTwo, new Set())

						expect(result).toHaveLength(1)
						expect(result).toContain(piece)
					})
				})
			})

			describe('both Parts has a "spanning" Piece on the same layer', () => {
				it('returns the "spanning" Piece of the latest layer', () => {
					const specificLayer: string = 'specificLayer'
					const pieceOne: Piece = EntityMockFactory.createPiece({
						id: '1',
						pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
						layer: specificLayer,
					} as PieceInterface)
					const pieceTwo: Piece = EntityMockFactory.createPiece({
						id: '2',
						pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
						layer: specificLayer,
					} as PieceInterface)

					const part: Part = EntityMockFactory.createPart({
						id: '1',
						rank: 1,
						pieces: [pieceOne, pieceTwo],
					} as PartInterface, { pieceLifespanFilters: [
							PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
							PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
						] }
					)
					const partToSearchBefore: Part = EntityMockFactory.createPart({ id: '3', rank: 3 } as PartInterface)

					const testee: Segment = new Segment({
						parts: [part, partToSearchBefore],
					} as SegmentInterface)

					const result: Piece[] = testee.getFirstSpanningPieceForEachLayerBeforePart(partToSearchBefore, new Set())

					expect(result).toHaveLength(1)
					expect(result).toContain(pieceTwo)
				})
			})
		})

		describe('Segment has one Part', () => {
			describe('the Part has two "spanning" Pieces', () => {
				describe('one Piece is on the ignored layers', () => {
					it('returns the Piece not on the ignored layers', () => {
						const layerToBeIgnored: string = 'layerToBeIgnored'
						const pieceOne: Piece = EntityMockFactory.createPiece({
							id: '1',
							pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
						} as PieceInterface)
						const pieceTwo: Piece = EntityMockFactory.createPiece({
							id: '2',
							pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
							layer: layerToBeIgnored,
						} as PieceInterface)

						const part: Part = EntityMockFactory.createPart({
							id: '1',
							rank: 1,
							pieces: [pieceOne, pieceTwo],
						} as PartInterface, { pieceLifespanFilters: [
								PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
								PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
							] }
						)
						const partToSearchBefore: Part = EntityMockFactory.createPart({ id: '3', rank: 3 } as PartInterface)

						const testee: Segment = new Segment({
							parts: [part, partToSearchBefore],
						} as SegmentInterface)

						const result: Piece[] = testee.getFirstSpanningPieceForEachLayerBeforePart(
							partToSearchBefore,
							new Set([layerToBeIgnored])
						)

						expect(result).toHaveLength(1)
						expect(result).toContain(pieceOne)
					})
				})
			})
		})
	})
})
