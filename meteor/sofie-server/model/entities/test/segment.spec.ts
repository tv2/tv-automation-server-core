import { PieceLifespan } from '../../enums/piece-lifespan'
import { Piece } from '../piece'
import { Part } from '../part'
import { Segment, SegmentInterface } from '../segment'
import { EntityMockFactory } from './entity-mock-factory'
import { capture, instance } from 'ts-mockito'

describe('Segment', () => {
	describe('getFirstSpanningPieceForEachLayerBeforePart', () => {
		describe('Segment has two Parts', () => {
			describe('One Part is "after" the search point', () => {
				it('does not include the Piece from the last Part', () => {
					const pieceBefore: Piece = EntityMockFactory.createPiece({
						id: 'pieceBefore',
						layer: 'someLayer',
						pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
					})
					const partBefore: Part = EntityMockFactory.createPart(
						{ id: 'partBefore', pieces: [pieceBefore] },
						{ piecesWithLifespanFilters: [pieceBefore] }
					)

					const partToSearchBefore: Part = EntityMockFactory.createPart({ id: 'searchPart' })

					const pieceAfter: Piece = EntityMockFactory.createPiece({
						id: 'pieceAfter',
						layer: 'someOtherLayer',
						pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
					})
					const partAfter: Part = EntityMockFactory.createPart(
						{ id: 'partAfter', pieces: [pieceAfter] },
						{ piecesWithLifespanFilters: [pieceAfter] }
					)

					const testee: Segment = new Segment({
						parts: [partBefore, partToSearchBefore, partAfter],
					} as SegmentInterface)

					const result: Piece[] = testee.getFirstSpanningPieceForEachLayerBeforePart(
						partToSearchBefore,
						new Set()
					)
					expect(result).toContain(pieceBefore)
					expect(result).not.toContain(partAfter)
				})
			})

			describe('both Parts are before the search point', () => {
				describe('Each Part has two Pieces. One Piece on each is a "spanning" Piece', () => {
					describe('it has to find "after" both Parts', () => {
						it('returns the "spanning" Pieces of both Parts', () => {
							const pieceTwo: Piece = EntityMockFactory.createPiece({
								id: '2',
								pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
								layer: 'someLayer',
							})
							const partOne: Part = EntityMockFactory.createPart(
								{
									id: '1',
									rank: 1,
									pieces: [EntityMockFactory.createPiece({ id: '1' }), pieceTwo],
								},
								{
									piecesWithLifespanFilters: [pieceTwo],
								}
							)

							const pieceFour: Piece = EntityMockFactory.createPiece({
								id: '4',
								pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
								layer: 'someOtherLayer',
							})
							const partTwo: Part = EntityMockFactory.createPart(
								{
									id: '2',
									rank: 2,
									pieces: [EntityMockFactory.createPiece({ id: '3' }), pieceFour],
								},
								{
									piecesWithLifespanFilters: [pieceFour],
								}
							)

							const partToSearchBefore: Part = EntityMockFactory.createPart({
								id: '3',
								rank: 3,
							})

							const testee: Segment = new Segment({
								parts: [partOne, partTwo, partToSearchBefore],
							} as SegmentInterface)
							const result: Piece[] = testee.getFirstSpanningPieceForEachLayerBeforePart(
								partToSearchBefore,
								new Set()
							)

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
							})
							const partOne: Part = EntityMockFactory.createPart(
								{
									id: '1',
									rank: 1,
									pieces: [EntityMockFactory.createPiece({ id: '1' }), piece],
								},
								{
									piecesWithLifespanFilters: [piece],
								}
							)
							const pieceFour: Piece = EntityMockFactory.createPiece({
								id: '4',
								pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
							})
							const partTwo: Part = EntityMockFactory.createPart(
								{
									id: '2',
									rank: 2,
									pieces: [EntityMockFactory.createPiece({ id: '3' }), pieceFour],
								},
								{
									piecesWithLifespanFilters: [pieceFour],
								}
							)
							const testee: Segment = new Segment({
								parts: [partOne, partTwo],
							} as SegmentInterface)

							const result: Piece[] = testee.getFirstSpanningPieceForEachLayerBeforePart(
								partTwo,
								new Set()
							)

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
						})
						const pieceTwo: Piece = EntityMockFactory.createPiece({
							id: '2',
							pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
							layer: specificLayer,
						})

						const part: Part = EntityMockFactory.createPart(
							{
								id: '1',
								rank: 1,
								pieces: [pieceOne, pieceTwo],
							},
							{
								piecesWithLifespanFilters: [pieceOne, pieceTwo],
							}
						)
						const partToSearchBefore: Part = EntityMockFactory.createPart({ id: '3', rank: 3 })

						const testee: Segment = new Segment({
							parts: [part, partToSearchBefore],
						} as SegmentInterface)

						const result: Piece[] = testee.getFirstSpanningPieceForEachLayerBeforePart(
							partToSearchBefore,
							new Set()
						)

						expect(result).toHaveLength(1)
						expect(result).toContain(pieceTwo)
					})
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
						})
						const pieceTwo: Piece = EntityMockFactory.createPiece({
							id: '2',
							pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
							layer: layerToBeIgnored,
						})

						const part: Part = EntityMockFactory.createPart(
							{
								id: '1',
								rank: 1,
								pieces: [pieceOne, pieceTwo],
							},
							{
								piecesWithLifespanFilters: [pieceOne, pieceTwo],
							}
						)
						const partToSearchBefore: Part = EntityMockFactory.createPart({
							id: '3',
							rank: 3,
						})

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

			describe('it calls getPiecesWithLifespan on Part', () => {
				it('with PieceLifespan.SPANNING_UNTIL_RUNDOWN_END', () => {
					const mockPart: Part = EntityMockFactory.createPartMockInstance()
					const part: Part = instance(mockPart)

					const partToSearchBefore: Part = EntityMockFactory.createPart({ id: 'searchPart' })

					const testee: Segment = new Segment({ parts: [part, partToSearchBefore] } as SegmentInterface)

					testee.getFirstSpanningPieceForEachLayerBeforePart(partToSearchBefore, new Set())

					const [lifespanFilters] = capture(mockPart.getPiecesWithLifespan).last()
					expect(lifespanFilters).toContain(PieceLifespan.SPANNING_UNTIL_RUNDOWN_END)
				})

				it('with PieceLifespan.SPANNING_UNTIL_SEGMENT_END', () => {
					const mockPart: Part = EntityMockFactory.createPartMockInstance()
					const part: Part = instance(mockPart)

					const partToSearchBefore: Part = EntityMockFactory.createPart({ id: 'searchPart' })

					const testee: Segment = new Segment({ parts: [part, partToSearchBefore] } as SegmentInterface)

					testee.getFirstSpanningPieceForEachLayerBeforePart(partToSearchBefore, new Set())

					const [lifespanFilters] = capture(mockPart.getPiecesWithLifespan).last()
					expect(lifespanFilters).toContain(PieceLifespan.SPANNING_UNTIL_SEGMENT_END)
				})

				it('with PieceLifespan.START_SPANNING_THEN_STICKY', () => {
					const mockPart: Part = EntityMockFactory.createPartMockInstance()
					const part: Part = instance(mockPart)

					const partToSearchBefore: Part = EntityMockFactory.createPart({ id: 'searchPart' })

					const testee: Segment = new Segment({ parts: [part, partToSearchBefore] } as SegmentInterface)

					testee.getFirstSpanningPieceForEachLayerBeforePart(partToSearchBefore, new Set())

					const [lifespanFilters] = capture(mockPart.getPiecesWithLifespan).last()
					expect(lifespanFilters).toContain(PieceLifespan.START_SPANNING_SEGMENT_THEN_STICKY_RUNDOWN)
				})

				it('does not call with PieceLifespan.WITHIN_PART', () => {
					const mockPart: Part = EntityMockFactory.createPartMockInstance()
					const part: Part = instance(mockPart)

					const partToSearchBefore: Part = EntityMockFactory.createPart({ id: 'searchPart' })

					const testee: Segment = new Segment({ parts: [part, partToSearchBefore] } as SegmentInterface)

					testee.getFirstSpanningPieceForEachLayerBeforePart(partToSearchBefore, new Set())

					const [lifespanFilters] = capture(mockPart.getPiecesWithLifespan).last()
					expect(lifespanFilters).not.toContain(PieceLifespan.WITHIN_PART)
				})

				it('does not call with PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE', () => {
					const mockPart: Part = EntityMockFactory.createPartMockInstance()
					const part: Part = instance(mockPart)

					const partToSearchBefore: Part = EntityMockFactory.createPart({ id: 'searchPart' })

					const testee: Segment = new Segment({ parts: [part, partToSearchBefore] } as SegmentInterface)

					testee.getFirstSpanningPieceForEachLayerBeforePart(partToSearchBefore, new Set())

					const [lifespanFilters] = capture(mockPart.getPiecesWithLifespan).last()
					expect(lifespanFilters).not.toContain(PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE)
				})

				it('does not call with PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE', () => {
					const mockPart: Part = EntityMockFactory.createPartMockInstance()
					const part: Part = instance(mockPart)

					const partToSearchBefore: Part = EntityMockFactory.createPart({ id: 'searchPart' })

					const testee: Segment = new Segment({ parts: [part, partToSearchBefore] } as SegmentInterface)

					testee.getFirstSpanningPieceForEachLayerBeforePart(partToSearchBefore, new Set())

					const [lifespanFilters] = capture(mockPart.getPiecesWithLifespan).last()
					expect(lifespanFilters).not.toContain(PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE)
				})
			})
		})
	})

	describe('getFirstSpanningRundownPieceForEachLayerForAllParts', () => {
		describe('it has one Part', () => {
			describe('Part has two Pieces', () => {
				describe('Pieces are on different layers', () => {
					it('returns both Pieces', () => {
						const pieceOne: Piece = EntityMockFactory.createPiece({ id: 'pieceOne', layer: 'someLayer' })
						const pieceTwo: Piece = EntityMockFactory.createPiece({
							id: 'pieceTwo',
							layer: 'someOtherLayer',
						})

						const part: Part = EntityMockFactory.createPart(
							{ pieces: [pieceOne, pieceTwo] },
							{ piecesWithLifespanFilters: [pieceOne, pieceTwo] }
						)

						const testee: Segment = new Segment({ parts: [part] } as SegmentInterface)

						const result: Piece[] = testee.getFirstSpanningRundownPieceForEachLayerForAllParts(new Set())
						expect(result).toContain(pieceOne)
						expect(result).toContain(pieceTwo)
					})
				})

				describe('Pieces are on same layer', () => {
					it('returns the latest Piece', () => {
						const layer: string = 'someLayer'
						const pieceOne: Piece = EntityMockFactory.createPiece({ id: 'pieceOne', layer })
						const pieceTwo: Piece = EntityMockFactory.createPiece({ id: 'pieceTwo', layer })

						const part: Part = EntityMockFactory.createPart(
							{ pieces: [pieceOne, pieceTwo] },
							{ piecesWithLifespanFilters: [pieceOne, pieceTwo] }
						)

						const testee: Segment = new Segment({ parts: [part] } as SegmentInterface)

						const result: Piece[] = testee.getFirstSpanningRundownPieceForEachLayerForAllParts(new Set())
						expect(result).not.toContain(pieceOne)
						expect(result).toContain(pieceTwo)
					})
				})

				describe('it has one Piece on a layer that should be ignored', () => {
					it('does not return that Piece', () => {
						const layerToIgnore: string = 'layerToIgnore'
						const pieceOne: Piece = EntityMockFactory.createPiece({ id: 'pieceOne', layer: 'someLayer' })
						const pieceTwo: Piece = EntityMockFactory.createPiece({ id: 'pieceTwo', layer: layerToIgnore })

						const part: Part = EntityMockFactory.createPart(
							{ pieces: [pieceOne, pieceTwo] },
							{ piecesWithLifespanFilters: [pieceOne, pieceTwo] }
						)

						const testee: Segment = new Segment({ parts: [part] } as SegmentInterface)

						const result: Piece[] = testee.getFirstSpanningRundownPieceForEachLayerForAllParts(
							new Set([layerToIgnore])
						)
						expect(result).toContain(pieceOne)
						expect(result).not.toContain(pieceTwo)
					})
				})
			})

			describe('Part has one Piece', () => {
				describe('it calls getPiecesWithLifespan on Part', () => {
					it('with PieceLifespan.SPANNING_UNTIL_RUNDOWN_END', () => {
						const mockPart: Part = EntityMockFactory.createPartMockInstance()
						const part: Part = instance(mockPart)

						const testee: Segment = new Segment({ parts: [part] } as SegmentInterface)

						testee.getFirstSpanningRundownPieceForEachLayerForAllParts(new Set())

						const [lifespanFilters] = capture(mockPart.getPiecesWithLifespan).last()
						expect(lifespanFilters).toContain(PieceLifespan.SPANNING_UNTIL_RUNDOWN_END)
					})

					it('does not call with PieceLifespan.WITHIN_PART', () => {
						const mockPart: Part = EntityMockFactory.createPartMockInstance()
						const part: Part = instance(mockPart)

						const testee: Segment = new Segment({ parts: [part] } as SegmentInterface)

						testee.getFirstSpanningRundownPieceForEachLayerForAllParts(new Set())

						const [lifespanFilters] = capture(mockPart.getPiecesWithLifespan).last()
						expect(lifespanFilters).not.toContain(PieceLifespan.WITHIN_PART)
					})

					it('does not call with PieceLifespan.SPANNING_UNTIL_SEGMENT_END', () => {
						const mockPart: Part = EntityMockFactory.createPartMockInstance()
						const part: Part = instance(mockPart)

						const testee: Segment = new Segment({ parts: [part] } as SegmentInterface)

						testee.getFirstSpanningRundownPieceForEachLayerForAllParts(new Set())

						const [lifespanFilters] = capture(mockPart.getPiecesWithLifespan).last()
						expect(lifespanFilters).not.toContain(PieceLifespan.SPANNING_UNTIL_SEGMENT_END)
					})

					it('does not call with PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE', () => {
						const mockPart: Part = EntityMockFactory.createPartMockInstance()
						const part: Part = instance(mockPart)

						const testee: Segment = new Segment({ parts: [part] } as SegmentInterface)

						testee.getFirstSpanningRundownPieceForEachLayerForAllParts(new Set())

						const [lifespanFilters] = capture(mockPart.getPiecesWithLifespan).last()
						expect(lifespanFilters).not.toContain(PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE)
					})

					it('does not call with PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE', () => {
						const mockPart: Part = EntityMockFactory.createPartMockInstance()
						const part: Part = instance(mockPart)

						const testee: Segment = new Segment({ parts: [part] } as SegmentInterface)

						testee.getFirstSpanningRundownPieceForEachLayerForAllParts(new Set())

						const [lifespanFilters] = capture(mockPart.getPiecesWithLifespan).last()
						expect(lifespanFilters).not.toContain(PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE)
					})

					it('does not call with PieceLifespan.START_SPANNING_SEGMENT_THEN_STICKY_RUNDOWN', () => {
						const mockPart: Part = EntityMockFactory.createPartMockInstance()
						const part: Part = instance(mockPart)

						const testee: Segment = new Segment({ parts: [part] } as SegmentInterface)

						testee.getFirstSpanningRundownPieceForEachLayerForAllParts(new Set())

						const [lifespanFilters] = capture(mockPart.getPiecesWithLifespan).last()
						expect(lifespanFilters).not.toContain(PieceLifespan.START_SPANNING_SEGMENT_THEN_STICKY_RUNDOWN)
					})
				})
			})
		})

		describe('it has two Parts', () => {
			describe('each Part has a Piece on different layers', () => {
				it('returns both Pieces', () => {
					const pieceOne: Piece = EntityMockFactory.createPiece({ id: 'pieceOne', layer: 'someLayer' })
					const partOne: Part = EntityMockFactory.createPart(
						{ id: 'partOne', pieces: [pieceOne] },
						{ piecesWithLifespanFilters: [pieceOne] }
					)

					const pieceTwo: Piece = EntityMockFactory.createPiece({ id: 'pieceTwo', layer: 'someOtherLayer' })
					const partTwo: Part = EntityMockFactory.createPart(
						{ id: 'partTwo', pieces: [pieceTwo] },
						{ piecesWithLifespanFilters: [pieceTwo] }
					)

					const testee: Segment = new Segment({ parts: [partOne, partTwo] } as SegmentInterface)

					const result: Piece[] = testee.getFirstSpanningRundownPieceForEachLayerForAllParts(new Set())
					expect(result).toContain(pieceOne)
					expect(result).toContain(pieceTwo)
				})
			})
		})
	})
})
