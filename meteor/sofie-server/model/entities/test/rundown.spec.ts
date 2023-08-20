import { Segment, SegmentInterface } from '../segment'
import { Rundown, RundownInterface } from '../rundown'
import { Part, PartInterface } from '../part'
import { Piece, PieceInterface } from '../piece'
import { PieceLifespan } from '../../enums/piece-lifespan'
import { EntityMockFactory } from './entity-mock-factory'
import { capture, instance, verify, when } from 'ts-mockito'

describe('Rundown', () => {
	describe('instantiate already active Rundown', () => {
		describe('"alreadyActiveProperties" is provided', () => {
			describe('active status is provided as false', () => {
				it('throws error', () => {
					const rundownInterface: RundownInterface = {
						isRundownActive: false,
						alreadyActiveProperties: {
							activePart: EntityMockFactory.createPart(),
							nextPart: EntityMockFactory.createPart(),
							activeSegment: EntityMockFactory.createSegment(),
							nextSegment: EntityMockFactory.createSegment(),
							infinitePieces: new Map(),
						},
					} as RundownInterface

					try {
						new Rundown(rundownInterface)
					} catch (error) {
						// Instantiation threw error, so all is well
						return
					}
					throw new Error(
						"Rundown didn't fail when instantiated with false active status and alreadyActiveProperties"
					)
				})
			})

			describe('active status is provided as true', () => {
				describe('it has no active Part', () => {
					it('throws error', () => {
						const rundownInterface: RundownInterface = {
							isRundownActive: true,
							alreadyActiveProperties: {
								nextPart: EntityMockFactory.createPart(),
								activeSegment: EntityMockFactory.createSegment(),
								nextSegment: EntityMockFactory.createSegment(),
								infinitePieces: new Map(),
							},
						} as RundownInterface

						try {
							new Rundown(rundownInterface)
						} catch (error) {
							// Instantiation threw error, so all is well
							return
						}
						throw new Error(
							"Rundown didn't fail when instantiated with true active status, but missing active Part"
						)
					})
				})

				describe('it has no next Part', () => {
					it('throws error', () => {
						const rundownInterface: RundownInterface = {
							isRundownActive: true,
							alreadyActiveProperties: {
								activePart: EntityMockFactory.createPart(),
								activeSegment: EntityMockFactory.createSegment(),
								nextSegment: EntityMockFactory.createSegment(),
								infinitePieces: new Map(),
							},
						} as RundownInterface

						try {
							new Rundown(rundownInterface)
						} catch (error) {
							// Instantiation threw error, so all is well
							return
						}
						throw new Error(
							"Rundown didn't fail when instantiated with true active status, but missing next Part"
						)
					})
				})

				describe('it has no active Segment', () => {
					it('throws error', () => {
						const rundownInterface: RundownInterface = {
							isRundownActive: true,
							alreadyActiveProperties: {
								activePart: EntityMockFactory.createPart(),
								nextPart: EntityMockFactory.createPart(),
								nextSegment: EntityMockFactory.createSegment(),
								infinitePieces: new Map(),
							},
						} as RundownInterface

						try {
							new Rundown(rundownInterface)
						} catch (error) {
							// Instantiation threw error, so all is well
							return
						}
						throw new Error(
							"Rundown didn't fail when instantiated with true active status, but missing active Segment"
						)
					})
				})

				describe('it has no next Segment', () => {
					it('throws error', () => {
						const rundownInterface: RundownInterface = {
							isRundownActive: true,
							alreadyActiveProperties: {
								activePart: EntityMockFactory.createPart(),
								nextPart: EntityMockFactory.createPart(),
								activeSegment: EntityMockFactory.createSegment(),
								infinitePieces: new Map(),
							},
						} as RundownInterface

						try {
							new Rundown(rundownInterface)
						} catch (error) {
							// Instantiation threw error, so all is well
							return
						}
						throw new Error(
							"Rundown didn't fail when instantiated with true active status, but missing next Segment"
						)
					})
				})

				describe('no infinite Pieces are provided', () => {
					describe('sets infinite Pieces to an empty map', () => {
						const rundownInterface: RundownInterface = {
							isRundownActive: true,
							alreadyActiveProperties: {
								activePart: EntityMockFactory.createPart(),
								nextPart: EntityMockFactory.createPart(),
								activeSegment: EntityMockFactory.createSegment(),
								nextSegment: EntityMockFactory.createSegment(),
							},
						} as RundownInterface

						const rundown: Rundown = new Rundown(rundownInterface)

						expect(rundown.getInfinitePieces()).toHaveLength(0)
					})
				})

				describe('it provides all necessary values', () => {
					it('sets all values', () => {
						const activePart: Part = EntityMockFactory.createPart({ id: 'activePart' } as PartInterface)
						const nextPart: Part = EntityMockFactory.createPart({ id: 'nextPart' } as PartInterface)
						const activeSegment: Segment = EntityMockFactory.createSegment({
							id: 'activeSegment',
						} as SegmentInterface)
						const nextSegment: Segment = EntityMockFactory.createSegment({
							id: 'nextSegment',
						} as SegmentInterface)
						const piece: Piece = EntityMockFactory.createPiece({
							pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
						} as PieceInterface)

						const rundownInterface: RundownInterface = {
							isRundownActive: true,
							alreadyActiveProperties: {
								activePart,
								nextPart,
								activeSegment,
								nextSegment,
								infinitePieces: new Map([[piece.layer, piece]]),
							},
						} as RundownInterface

						const rundown: Rundown = new Rundown(rundownInterface)

						expect(rundown.getActivePart()).toBe(activePart)
						expect(rundown.getNextPart()).toBe(nextPart)
						expect(rundown.getActiveSegment()).toBe(activeSegment)
						expect(rundown.getNextSegment()).toBe(nextSegment)
						expect(rundown.getInfinitePieces()).toContain(piece)
					})
				})
			})
		})
	})

	describe('takeNext', () => {
		describe('it has a next Part', () => {
			it('sets the next Part as the active Part', () => {
				const firstPart: Part = EntityMockFactory.createPart({
					id: 'firstPartId',
				} as PartInterface)
				const nextPart: Part = EntityMockFactory.createPart({
					id: 'nextPartId',
				} as PartInterface)
				const segment: Segment = EntityMockFactory.createSegment({} as SegmentInterface, {
					firstPart,
					nextPart,
				})

				const testee: Rundown = new Rundown({
					segments: [segment],
					isRundownActive: true,
					alreadyActiveProperties: {
						activePart: firstPart,
						nextPart,
						activeSegment: segment,
						nextSegment: segment,
						infinitePieces: new Map(),
					},
				} as RundownInterface)

				const activeBefore: Part = testee.getActivePart()

				testee.takeNext()

				const activeAfter: Part = testee.getActivePart()

				expect(activeBefore.id).not.toBe(activeAfter.id)
			})

			it('calls "PutOnAir" on the next Part', () => {
				const firstPart: Part = EntityMockFactory.createPart({
					id: 'firstPartId',
				} as PartInterface)
				const mockNextPart: Part = EntityMockFactory.createPartMockInstance({
					id: 'nextPartId',
				} as PartInterface)
				const nextPart: Part = instance(mockNextPart)
				const segment: Segment = EntityMockFactory.createSegment({} as SegmentInterface, {
					firstPart,
					nextPart,
				})

				const testee: Rundown = new Rundown({
					segments: [segment],
					isRundownActive: true,
					alreadyActiveProperties: {
						activePart: firstPart,
						nextPart,
						activeSegment: segment,
						nextSegment: segment,
						infinitePieces: new Map(),
					},
				} as RundownInterface)

				testee.takeNext()

				verify(mockNextPart.putOnAir()).once()
			})
		})

		describe('it does not have a next Part', () => {
			// TODO: Write tests
		})

		describe('next Part has no infinite Pieces', () => {
			it('does not add any infinite Pieces', () => {
				const partWithoutPieces: Part = EntityMockFactory.createPart()
				const segment: Segment = EntityMockFactory.createSegment({} as SegmentInterface, {
					nextPart: partWithoutPieces,
				})

				const testee: Rundown = new Rundown({
					segments: [segment],
					isRundownActive: true,
					alreadyActiveProperties: {
						activePart: segment.findFirstPart(),
						nextPart: partWithoutPieces,
						activeSegment: segment,
						nextSegment: segment,
						infinitePieces: new Map(),
					},
				} as RundownInterface)

				testee.takeNext()

				const result: Piece[] = testee.getInfinitePieces()
				expect(result).toHaveLength(0)
			})
		})

		describe('Rundown has Part with infinite Pieces', () => {
			describe('it has two Pieces on different layers', () => {
				it('adds both infinite Pieces', () => {
					const pieceOne: Piece = EntityMockFactory.createPiece({
						layer: 'someLayer',
						pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
					} as PieceInterface)
					const pieceTwo: Piece = EntityMockFactory.createPiece({
						layer: 'someOtherLayer',
						pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
					} as PieceInterface)
					const nextPart: Part = EntityMockFactory.createPart({
						pieces: [pieceOne, pieceTwo],
					} as PartInterface)
					const segment: Segment = EntityMockFactory.createSegment({} as SegmentInterface, {
						nextPart: nextPart,
					})

					const testee: Rundown = new Rundown({
						segments: [segment],
						isRundownActive: true,
						alreadyActiveProperties: {
							activePart: segment.findFirstPart(),
							nextPart: nextPart,
							activeSegment: segment,
							nextSegment: segment,
							infinitePieces: new Map(),
						},
					} as RundownInterface)

					testee.takeNext()

					const result: Piece[] = testee.getInfinitePieces()
					expect(result).toHaveLength(2)
					expect(result).toContain(pieceOne)
					expect(result).toContain(pieceTwo)
				})
			})
		})

		describe('Rundown has two Parts with infinite Pieces', () => {
			describe('Each Part has an infinite Piece on a different layer', () => {
				it('adds both Pieces', () => {
					const firstPiece: Piece = EntityMockFactory.createPiece({
						layer: 'someLayer',
						pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
					} as PieceInterface)
					const nextPiece: Piece = EntityMockFactory.createPiece({
						layer: 'someOtherLayer',
						pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
					} as PieceInterface)
					const firstPart: Part = EntityMockFactory.createPart({
						id: 'first',
						pieces: [firstPiece],
					} as PartInterface)
					const nextPart: Part = EntityMockFactory.createPart({
						id: 'next',
						pieces: [nextPiece],
					} as PartInterface)
					const segment: Segment = EntityMockFactory.createSegment({} as SegmentInterface, {
						firstPart,
						nextPart,
						firstSpanningPieceForEachLayerBeforePart: [firstPiece],
					})

					const testee: Rundown = new Rundown({
						segments: [segment],
						isRundownActive: true,
						alreadyActiveProperties: {
							activePart: firstPart,
							nextPart,
							activeSegment: segment,
							nextSegment: segment,
							infinitePieces: new Map(),
						},
					} as RundownInterface)

					testee.takeNext()

					const result: Piece[] = testee.getInfinitePieces()
					expect(result).toHaveLength(2)
					expect(result).toContainEqual(firstPiece)
					expect(result).toContainEqual(nextPiece)
				})
			})

			describe('Each Part has an infinite Piece on the same layer', () => {
				it('only adds the last infinite Piece', () => {
					const layer: string = 'someLayer'

					const firstPiece: Piece = EntityMockFactory.createPiece({
						id: 'p1',
						layer,
						pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
					} as PieceInterface)
					const firstPart: Part = EntityMockFactory.createPart({
						pieces: [firstPiece],
					} as PartInterface)

					const nextPiece: Piece = EntityMockFactory.createPiece({
						id: 'p2',
						layer,
						pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
					} as PieceInterface)
					const nextPart: Part = EntityMockFactory.createPart({
						pieces: [nextPiece],
					} as PartInterface)

					const mockedSegment: Segment = EntityMockFactory.createSegmentMockInstance({} as SegmentInterface, {
						firstPart,
						nextPart,
					})
					const segment: Segment = instance(mockedSegment)

					const testee: Rundown = new Rundown({
						segments: [segment],
						isRundownActive: true,
						alreadyActiveProperties: {
							activePart: firstPart,
							nextPart,
							activeSegment: segment,
							nextSegment: segment,
							infinitePieces: new Map(),
						},
					} as RundownInterface)

					testee.takeNext()

					const result: Piece[] = testee.getInfinitePieces()
					expect(result).toHaveLength(1)
					expect(result).toContain(nextPiece)

					const [partToSearchBefore, layersToIgnore] = capture(
						mockedSegment.getFirstSpanningPieceForEachLayerBeforePart
					).last()
					expect(partToSearchBefore).toBe(nextPart)
					expect(layersToIgnore.has(layer)).toBeTruthy()
				})

				it('sets executedAt to zero for the Piece no longer being an infinite', () => {
					const layer: string = 'someLayer'

					const mockFirstPiece: Piece = EntityMockFactory.createPieceMockInstance({
						id: 'p1',
						layer,
						pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
					} as PieceInterface)
					const firstPiece: Piece = instance(mockFirstPiece)
					const firstPart: Part = EntityMockFactory.createPart({
						pieces: [firstPiece],
					} as PartInterface)

					const nextPiece: Piece = EntityMockFactory.createPiece({
						id: 'p2',
						layer,
						pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
					} as PieceInterface)
					const nextPart: Part = EntityMockFactory.createPart({
						pieces: [nextPiece],
					} as PartInterface)

					const segment: Segment = EntityMockFactory.createSegment({} as SegmentInterface, {
						firstPart,
						nextPart,
					})

					const testee: Rundown = new Rundown({
						segments: [segment],
						isRundownActive: true,
						alreadyActiveProperties: {
							activePart: firstPart,
							nextPart,
							activeSegment: segment,
							nextSegment: segment,
							infinitePieces: new Map([[layer, firstPiece]]),
						},
					} as RundownInterface)

					testee.takeNext()

					verify(mockFirstPiece.resetExecutedAt()).once()
				})
			})
		})

		describe('Rundown has two Segments', () => {
			describe('Each Segment has an infinite Piece on different layers', () => {
				it('adds both infinite Pieces', () => {
					const firstPiece: Piece = EntityMockFactory.createPiece({
						layer: 'someLayer',
						pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
					} as PieceInterface)
					const firstPart: Part = EntityMockFactory.createPart({ pieces: [firstPiece] } as PartInterface)
					const firstSegment: Segment = EntityMockFactory.createSegment(
						{ id: 'firstSegment', parts: [firstPart] } as SegmentInterface,
						{ firstSpanningRundownPieceForeachLayerForAllParts: [firstPiece] }
					)

					const nextPiece: Piece = EntityMockFactory.createPiece({
						layer: 'someOtherLayer',
						pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
					} as PieceInterface)
					const nextPart: Part = EntityMockFactory.createPart({ pieces: [nextPiece] } as PartInterface)
					const nextSegment: Segment = EntityMockFactory.createSegment({
						id: 'nextSegment',
						parts: [nextPart],
					} as SegmentInterface)

					const testee: Rundown = new Rundown({
						segments: [firstSegment, nextSegment],
						isRundownActive: true,
						alreadyActiveProperties: {
							activePart: firstPart,
							nextPart,
							activeSegment: firstSegment,
							nextSegment: nextSegment,
							infinitePieces: new Map([[firstPiece.layer, firstPiece]]),
						},
					} as RundownInterface)

					testee.takeNext()

					const result: Piece[] = testee.getInfinitePieces()
					expect(result).toHaveLength(2)
					expect(result).toContainEqual(firstPiece)
					expect(result).toContainEqual(nextPiece)
				})
			})

			describe('Each Segment has an infinite Piece on the same layer', () => {
				it('only adds the last infinite piece', () => {
					const layer: string = 'someLayer'

					const firstPiece: Piece = EntityMockFactory.createPiece({
						layer,
						pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
					} as PieceInterface)
					const firstPart: Part = EntityMockFactory.createPart({ pieces: [firstPiece] } as PartInterface)
					const firstSegment: Segment = EntityMockFactory.createSegment({
						id: 'firstSegment',
						parts: [firstPart],
					} as SegmentInterface)

					const nextPiece: Piece = EntityMockFactory.createPiece({
						layer,
						pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
					} as PieceInterface)
					const nextPart: Part = EntityMockFactory.createPart({ pieces: [nextPiece] } as PartInterface)
					const nextSegment: Segment = EntityMockFactory.createSegment({
						id: 'nextSegment',
						parts: [nextPart],
					} as SegmentInterface)

					const testee: Rundown = new Rundown({
						segments: [firstSegment, nextSegment],
						isRundownActive: true,
						alreadyActiveProperties: {
							activePart: firstPart,
							nextPart,
							activeSegment: firstSegment,
							nextSegment: nextSegment,
							infinitePieces: new Map([[firstPiece.layer, firstPiece]]),
						},
					} as RundownInterface)

					testee.takeNext()

					const result: Piece[] = testee.getInfinitePieces()
					expect(result).toHaveLength(1)
					expect(result).toContain(nextPiece)
				})
			})
		})

		describe('Rundown has a "sticky Rundown" infinite Piece', () => {
			describe('Rundown "skips" a Segment that also has a "sticky" infinite Piece', () => {
				it('does not change the "sticky" infinite Piece', () => {
					const layer: string = 'someLayer'
					const firstPiece: Piece = EntityMockFactory.createPiece({
						id: 'firstPiece',
						layer,
						pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
					} as PieceInterface)
					const firstPart: Part = EntityMockFactory.createPart({
						id: 'firstPart',
						pieces: [firstPiece],
					} as PartInterface)
					const firstSegment: Segment = EntityMockFactory.createSegment({
						id: 'firstSegment',
						parts: [firstPart],
					} as SegmentInterface)

					const middlePiece: Piece = EntityMockFactory.createPiece({
						id: 'middlePiece',
						layer,
						pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
					} as PieceInterface)
					const middlePart: Part = EntityMockFactory.createPart({
						id: 'middlePart',
						pieces: [middlePiece],
					} as PartInterface)
					const middleSegment: Segment = EntityMockFactory.createSegment({
						id: 'middleSegment',
						parts: [middlePart],
					} as SegmentInterface)

					const lastPart: Part = EntityMockFactory.createPart({ id: 'lastPart' } as PartInterface)
					const lastSegment: Segment = EntityMockFactory.createSegment({
						id: 'lastSegment',
						parts: [lastPart],
					} as SegmentInterface)

					const testee: Rundown = new Rundown({
						segments: [firstSegment, middleSegment, lastSegment],
						isRundownActive: true,
						alreadyActiveProperties: {
							activePart: firstPart,
							nextPart: lastPart,
							activeSegment: firstSegment,
							nextSegment: lastSegment,
							infinitePieces: new Map([[firstPiece.layer, firstPiece]]),
						},
					} as RundownInterface)

					testee.takeNext()

					const result: Piece[] = testee.getInfinitePieces()
					expect(result).toHaveLength(1)
					expect(result).toContain(firstPiece)
				})
			})

			describe('it jumps "back" up the Rundown and "skips" a Segment with a "sticky Rundown" infinite Piece', () => {
				it('does not change the "sticky" infinite Piece', () => {
					const layer: string = 'someLayer'
					const firstPart: Part = EntityMockFactory.createPart({ id: 'firstPart' } as PartInterface)
					const firstSegment: Segment = EntityMockFactory.createSegment({
						id: 'firstSegment',
						parts: [firstPart],
					} as SegmentInterface)

					const middlePiece: Piece = EntityMockFactory.createPiece({
						id: 'middlePiece',
						layer,
						pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
					} as PieceInterface)
					const middlePart: Part = EntityMockFactory.createPart({
						id: 'middlePart',
						pieces: [middlePiece],
					} as PartInterface)
					const middleSegment: Segment = EntityMockFactory.createSegment({
						id: 'middleSegment',
						parts: [middlePart],
					} as SegmentInterface)

					const lastPiece: Piece = EntityMockFactory.createPiece({
						id: 'lastPiece',
						layer,
						pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
					} as PieceInterface)
					const lastPart: Part = EntityMockFactory.createPart({
						id: 'lastPart',
						pieces: [lastPiece],
					} as PartInterface)
					const lastSegment: Segment = EntityMockFactory.createSegment({
						id: 'lastSegment',
						parts: [lastPart],
					} as SegmentInterface)

					const testee: Rundown = new Rundown({
						segments: [firstSegment, middleSegment, lastSegment],
						isRundownActive: true,
						alreadyActiveProperties: {
							activePart: lastPart,
							nextPart: firstPart,
							activeSegment: lastSegment,
							nextSegment: firstSegment,
							infinitePieces: new Map([[lastPiece.layer, lastPiece]]),
						},
					} as RundownInterface)

					testee.takeNext()

					const result: Piece[] = testee.getInfinitePieces()
					expect(result).toHaveLength(1)
					expect(result).toContain(lastPiece)
				})
			})

			describe('it takes a Segment with a "sticky Rundown" infinite Piece for the same layer', () => {
				it('changes the "sticky" infinite Piece', () => {
					const layer: string = 'someLayer'
					const firstPiece: Piece = EntityMockFactory.createPiece({
						id: 'firstPiece',
						layer,
						pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
					} as PieceInterface)
					const firstPart: Part = EntityMockFactory.createPart({
						id: 'firstPart',
						pieces: [firstPiece],
					} as PartInterface)
					const firstSegment: Segment = EntityMockFactory.createSegment({
						id: 'firstSegment',
						parts: [firstPart],
					} as SegmentInterface)

					const lastPiece: Piece = EntityMockFactory.createPiece({
						id: 'lastPiece',
						layer,
						pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
					} as PieceInterface)
					const lastPart: Part = EntityMockFactory.createPart({
						id: 'lastPart',
						pieces: [lastPiece],
					} as PartInterface)
					const lastSegment: Segment = EntityMockFactory.createSegment({
						id: 'lastSegment',
						parts: [lastPart],
					} as SegmentInterface)

					const testee: Rundown = new Rundown({
						segments: [firstSegment, lastSegment],
						isRundownActive: true,
						alreadyActiveProperties: {
							activePart: firstPart,
							nextPart: lastPart,
							activeSegment: firstSegment,
							nextSegment: lastSegment,
							infinitePieces: new Map([[firstPiece.layer, firstPiece]]),
						},
					} as RundownInterface)

					testee.takeNext()

					const result: Piece[] = testee.getInfinitePieces()
					expect(result).toHaveLength(1)
					expect(result).toContain(lastPiece)
				})
			})

			describe('it takes a Segment with a "spanning Rundown" infinite Piece', () => {
				it('changes to the "spanning" infinite Piece', () => {
					const layer: string = 'someLayer'
					const firstPiece: Piece = EntityMockFactory.createPiece({
						id: 'firstPiece',
						layer,
						pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
					} as PieceInterface)
					const firstPart: Part = EntityMockFactory.createPart({
						id: 'firstPart',
						pieces: [firstPiece],
					} as PartInterface)
					const firstSegment: Segment = EntityMockFactory.createSegment({
						id: 'firstSegment',
						parts: [firstPart],
					} as SegmentInterface)

					const lastPiece: Piece = EntityMockFactory.createPiece({
						id: 'lastPiece',
						layer,
						pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
					} as PieceInterface)
					const lastPart: Part = EntityMockFactory.createPart({
						id: 'lastPart',
						pieces: [lastPiece],
					} as PartInterface)
					const lastSegment: Segment = EntityMockFactory.createSegment({
						id: 'lastSegment',
						parts: [lastPart],
					} as SegmentInterface)

					const testee: Rundown = new Rundown({
						segments: [firstSegment, lastSegment],
						isRundownActive: true,
						alreadyActiveProperties: {
							activePart: firstPart,
							nextPart: lastPart,
							activeSegment: firstSegment,
							nextSegment: lastSegment,
							infinitePieces: new Map([[firstPiece.layer, firstPiece]]),
						},
					} as RundownInterface)

					testee.takeNext()

					const result: Piece[] = testee.getInfinitePieces()
					expect(result).toHaveLength(1)
					expect(result).toContain(lastPiece)
				})
			})

			describe('it "skips" a Segment with a "spanning Rundown" infinite Piece"', () => {
				// TODO: This isn't supported yet...
				// 	it('changes to the "spanning" infinite Piece', () => {
				// 		const layer: string = 'someLayer'
				// 		const firstPiece: Piece = EntityMockFactory.createPiece({ id: 'firstPiece', layer, pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE } as PieceInterface)
				// 		const firstPart: Part = EntityMockFactory.createPart({ id: 'firstPart', pieces: [firstPiece] } as PartInterface)
				// 		const firstSegment: Segment = EntityMockFactory.createSegment({ id: 'firstSegment', parts: [firstPart] } as SegmentInterface)
				//
				// 		const middlePiece: Piece = EntityMockFactory.createPiece({ id: 'middlePiece', layer, pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END } as PieceInterface)
				// 		const middlePart: Part = EntityMockFactory.createPart({ id: 'middlePart', pieces: [middlePiece] } as PartInterface)
				// 		const middleSegment: Segment = EntityMockFactory.createSegment({ id: 'middleSegment', parts: [middlePart] } as SegmentInterface, { firstSpanningRundownPieceForeachLayerForAllParts: [middlePiece] })
				//
				// 		const lastPart: Part = EntityMockFactory.createPart({ id: 'lastPart' } as PartInterface)
				// 		const lastSegment: Segment = EntityMockFactory.createSegment({ id: 'lastSegment', parts: [lastPart] } as SegmentInterface)
				//
				// 		const testee: Rundown = new Rundown({ segments: [firstSegment, middleSegment, lastSegment], isRundownActive: true, alreadyActiveProperties: {
				// 				activePart: firstPart,
				// 				nextPart: lastPart,
				// 				activeSegment: firstSegment,
				// 				nextSegment: lastSegment,
				// 				infinitePieces: new Map([[firstPiece.layer, firstPiece]])
				// 			} } as RundownInterface)
				//
				// 		testee.takeNext()
				//
				// 		const result: Piece[] = testee.getInfinitePieces()
				// 		expect(result).toHaveLength(1)
				// 		expect(result).toContainEqual(middlePiece)
				// 	})
			})
		})

		describe('Rundown has a "spanning Rundown" infinite Piece', () => {
			describe('it "skips" a Segment with a "spanning Rundown" infinite Piece"', () => {
				it('changes to the "spanning" infinite Piece', () => {
					const layer: string = 'someLayer'
					const firstPiece: Piece = EntityMockFactory.createPiece({
						id: 'firstPiece',
						layer,
						pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
					} as PieceInterface)
					const firstPart: Part = EntityMockFactory.createPart({
						id: 'firstPart',
						pieces: [firstPiece],
					} as PartInterface)
					const firstSegment: Segment = EntityMockFactory.createSegment({
						id: 'firstSegment',
						parts: [firstPart],
					} as SegmentInterface)

					const middlePiece: Piece = EntityMockFactory.createPiece({
						id: 'middlePiece',
						layer,
						pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
					} as PieceInterface)
					const middlePart: Part = EntityMockFactory.createPart({
						id: 'middlePart',
						pieces: [middlePiece],
					} as PartInterface)
					const middleSegment: Segment = EntityMockFactory.createSegment(
						{ id: 'middleSegment', parts: [middlePart] } as SegmentInterface,
						{ firstSpanningRundownPieceForeachLayerForAllParts: [middlePiece] }
					)

					const lastPart: Part = EntityMockFactory.createPart({ id: 'lastPart' } as PartInterface)
					const lastSegment: Segment = EntityMockFactory.createSegment({
						id: 'lastSegment',
						parts: [lastPart],
					} as SegmentInterface)

					const testee: Rundown = new Rundown({
						segments: [firstSegment, middleSegment, lastSegment],
						isRundownActive: true,
						alreadyActiveProperties: {
							activePart: firstPart,
							nextPart: lastPart,
							activeSegment: firstSegment,
							nextSegment: lastSegment,
							infinitePieces: new Map(),
						},
					} as RundownInterface)

					testee.takeNext()

					const result: Piece[] = testee.getInfinitePieces()
					expect(result).toHaveLength(1)
					expect(result).toContainEqual(middlePiece)
				})
			})

			describe('it jumps "back" up the Rundown before the "spanning" infinite Piece', () => {
				describe('there is a previous "spanning" infinite Piece', () => {
					it('selects the previous "spanning" Piece', () => {
						const layer: string = 'someLayer'
						const firstPiece: Piece = EntityMockFactory.createPiece({
							id: 'firstPiece',
							layer,
							pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
						} as PieceInterface)
						const firstPart: Part = EntityMockFactory.createPart({
							id: 'firstPart',
							pieces: [firstPiece],
						} as PartInterface)
						const firstSegment: Segment = EntityMockFactory.createSegment(
							{ id: 'firstSegment', parts: [firstPart] } as SegmentInterface,
							{ firstSpanningRundownPieceForeachLayerForAllParts: [firstPiece] }
						)

						const middlePart: Part = EntityMockFactory.createPart({ id: 'middlePart' } as PartInterface)
						const middleSegment: Segment = EntityMockFactory.createSegment({
							id: 'middleSegment',
							parts: [middlePart],
						} as SegmentInterface)

						const lastPiece: Piece = EntityMockFactory.createPiece({
							id: 'lastPiece',
							layer,
							pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
						} as PieceInterface)
						const lastPart: Part = EntityMockFactory.createPart({
							id: 'lastPart',
							pieces: [lastPiece],
						} as PartInterface)
						const lastSegment: Segment = EntityMockFactory.createSegment({
							id: 'lastSegment',
							parts: [lastPart],
						} as SegmentInterface)

						const testee: Rundown = new Rundown({
							segments: [firstSegment, middleSegment, lastSegment],
							isRundownActive: true,
							alreadyActiveProperties: {
								activePart: lastPart,
								nextPart: middlePart,
								activeSegment: lastSegment,
								nextSegment: middleSegment,
								infinitePieces: new Map(),
							},
						} as RundownInterface)

						testee.takeNext()

						const result: Piece[] = testee.getInfinitePieces()
						expect(result).toHaveLength(1)
						expect(result).toContainEqual(firstPiece)
					})
				})

				describe('there are no other "spanning" infinite Pieces', () => {
					it('has no longer any infinite Pieces', () => {
						const layer: string = 'someLayer'
						const firstPart: Part = EntityMockFactory.createPart({ id: 'firstPart' } as PartInterface)
						const firstSegment: Segment = EntityMockFactory.createSegment({
							id: 'firstSegment',
							parts: [firstPart],
						} as SegmentInterface)

						const middlePart: Part = EntityMockFactory.createPart({ id: 'middlePart' } as PartInterface)
						const middleSegment: Segment = EntityMockFactory.createSegment({
							id: 'middleSegment',
							parts: [middlePart],
						} as SegmentInterface)

						const lastPiece: Piece = EntityMockFactory.createPiece({
							id: 'lastPiece',
							layer,
							pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
						} as PieceInterface)
						const lastPart: Part = EntityMockFactory.createPart({
							id: 'lastPart',
							pieces: [lastPiece],
						} as PartInterface)
						const lastSegment: Segment = EntityMockFactory.createSegment({
							id: 'lastSegment',
							parts: [lastPart],
						} as SegmentInterface)

						const testee: Rundown = new Rundown({
							segments: [firstSegment, middleSegment, lastSegment],
							isRundownActive: true,
							alreadyActiveProperties: {
								activePart: lastPart,
								nextPart: middlePart,
								activeSegment: lastSegment,
								nextSegment: middleSegment,
								infinitePieces: new Map(),
							},
						} as RundownInterface)

						testee.takeNext()

						const result: Piece[] = testee.getInfinitePieces()
						expect(result).toHaveLength(0)
					})
				})
			})
		})

		describe('Rundown has an infinite "Rundown" Piece', () => {
			describe('it takes a Segment with a non-infinite Piece for same layer', () => {
				it('no longer has any infinite Pieces', () => {
					const layer: string = 'someLayer'
					const firstPiece: Piece = EntityMockFactory.createPiece({
						id: 'firstPiece',
						layer,
						pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
					} as PieceInterface)
					const firstPart: Part = EntityMockFactory.createPart({
						id: 'firstPart',
						pieces: [firstPiece],
					} as PartInterface)
					const firstSegment: Segment = EntityMockFactory.createSegment({
						id: 'firstSegment',
						parts: [firstPart],
					} as SegmentInterface)

					const nextPiece: Piece = EntityMockFactory.createPiece({
						id: 'nextPiece',
						layer,
						pieceLifespan: PieceLifespan.WITHIN_PART,
					} as PieceInterface)
					const nextPart: Part = EntityMockFactory.createPart({
						id: 'nextPart',
						pieces: [nextPiece],
					} as PartInterface)
					const nextSegment: Segment = EntityMockFactory.createSegment({
						id: 'nextSegment',
						parts: [nextPart],
					} as SegmentInterface)

					const testee: Rundown = new Rundown({
						segments: [firstSegment, nextSegment],
						isRundownActive: true,
						alreadyActiveProperties: {
							activePart: firstPart,
							nextPart: nextPart,
							activeSegment: firstSegment,
							nextSegment,
							infinitePieces: new Map([[firstPiece.layer, firstPiece]]),
						},
					} as RundownInterface)

					testee.takeNext()

					const result: Piece[] = testee.getInfinitePieces()
					expect(result).toHaveLength(0)
				})
			})
		})

		describe('Rundown has a "sticky segment" infinite Piece', () => {
			describe('it takes another "sticky segment" infinite Piece within the Segment', () => {
				it('changes the "sticky" infinite Piece', () => {
					const layer: string = 'someLayer'
					const firstPiece: Piece = EntityMockFactory.createPiece({
						id: 'firstPiece',
						layer,
						pieceLifespan: PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE,
					} as PieceInterface)
					const firstPart: Part = EntityMockFactory.createPart({
						id: 'firstPart',
						pieces: [firstPiece],
					} as PartInterface)

					const nextPiece: Piece = EntityMockFactory.createPiece({
						id: 'nextPiece',
						layer,
						pieceLifespan: PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE,
					} as PieceInterface)
					const nextPart: Part = EntityMockFactory.createPart({
						id: 'nextPart',
						pieces: [nextPiece],
					} as PartInterface)

					const mockedSegment: Segment = EntityMockFactory.createSegmentMockInstance({
						id: 'segment',
						parts: [firstPart, nextPart],
					} as SegmentInterface)
					when(mockedSegment.doesPieceBelongToSegment(firstPiece)).thenReturn(true)
					const segment: Segment = instance(mockedSegment)

					const testee: Rundown = new Rundown({
						segments: [segment],
						isRundownActive: true,
						alreadyActiveProperties: {
							activePart: firstPart,
							nextPart: nextPart,
							activeSegment: segment,
							nextSegment: segment,
							infinitePieces: new Map([[firstPiece.layer, firstPiece]]),
						},
					} as RundownInterface)

					testee.takeNext()

					const result: Piece[] = testee.getInfinitePieces()
					expect(result).toHaveLength(1)
					expect(result).toContain(nextPiece)
				})
			})

			describe('it "skips" a Part within the Segment that has a "sticky segment" infinite Piece', () => {
				it('does not change infinite Piece', () => {
					const layer: string = 'someLayer'
					const firstPiece: Piece = EntityMockFactory.createPiece({
						id: 'firstPiece',
						layer,
						pieceLifespan: PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE,
					} as PieceInterface)
					const firstPart: Part = EntityMockFactory.createPart({
						id: 'firstPart',
						pieces: [firstPiece],
					} as PartInterface)

					const middlePiece: Piece = EntityMockFactory.createPiece({
						id: 'middlePiece',
						layer,
						pieceLifespan: PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE,
					} as PieceInterface)
					const middlePart: Part = EntityMockFactory.createPart({
						id: 'middlePart',
						pieces: [middlePiece],
					} as PartInterface)

					const lastPart: Part = EntityMockFactory.createPart({ id: 'lastPart' } as PartInterface)

					const mockedSegment: Segment = EntityMockFactory.createSegmentMockInstance({
						id: 'segment',
						parts: [firstPart, middlePart, lastPart],
					} as SegmentInterface)
					when(mockedSegment.doesPieceBelongToSegment(firstPiece)).thenReturn(true)
					const segment: Segment = instance(mockedSegment)

					const testee: Rundown = new Rundown({
						segments: [segment],
						isRundownActive: true,
						alreadyActiveProperties: {
							activePart: firstPart,
							nextPart: lastPart,
							activeSegment: segment,
							nextSegment: segment,
							infinitePieces: new Map([[firstPiece.layer, firstPiece]]),
						},
					} as RundownInterface)

					testee.takeNext()

					const result: Piece[] = testee.getInfinitePieces()
					expect(result).toHaveLength(1)
					expect(result).toContain(firstPiece)
				})
			})

			describe('it jumps "back" up the Segment before another "sticky segment" infinite Piece', () => {
				it('does not change infinite Piece', () => {
					const layer: string = 'someLayer'
					const firstPart: Part = EntityMockFactory.createPart({ id: 'firstPart' } as PartInterface)

					const middlePiece: Piece = EntityMockFactory.createPiece({
						id: 'middlePiece',
						layer,
						pieceLifespan: PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE,
					} as PieceInterface)
					const middlePart: Part = EntityMockFactory.createPart({
						id: 'middlePart',
						pieces: [middlePiece],
					} as PartInterface)

					const lastPiece: Piece = EntityMockFactory.createPiece({
						id: 'lastPiece',
						layer,
						pieceLifespan: PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE,
					} as PieceInterface)
					const lastPart: Part = EntityMockFactory.createPart({
						id: 'lastPart',
						pieces: [lastPiece],
					} as PartInterface)

					const mockSegment: Segment = EntityMockFactory.createSegmentMockInstance({
						id: 'segment',
						parts: [firstPart, middlePart, lastPart],
					} as SegmentInterface)
					when(mockSegment.doesPieceBelongToSegment(lastPiece)).thenReturn(true)
					const segment: Segment = instance(mockSegment)

					const testee: Rundown = new Rundown({
						segments: [segment],
						isRundownActive: true,
						alreadyActiveProperties: {
							activePart: lastPart,
							nextPart: firstPart,
							activeSegment: segment,
							nextSegment: segment,
							infinitePieces: new Map([[lastPiece.layer, lastPiece]]),
						},
					} as RundownInterface)

					testee.takeNext()

					const result: Piece[] = testee.getInfinitePieces()
					expect(result).toHaveLength(1)
					expect(result).toContain(lastPiece)
				})
			})

			describe('it takes a Part within the Segment with a "spanning segment" infinite Piece', () => {
				it('changes the infinite Piece', () => {
					const layer: string = 'someLayer'
					const firstPiece: Piece = EntityMockFactory.createPiece({
						id: 'firstPiece',
						layer,
						pieceLifespan: PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE,
					} as PieceInterface)
					const firstPart: Part = EntityMockFactory.createPart({
						id: 'firstPart',
						pieces: [firstPiece],
					} as PartInterface)

					const nextPiece: Piece = EntityMockFactory.createPiece({
						id: 'nextPiece',
						layer,
						pieceLifespan: PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE,
					} as PieceInterface)
					const nextPart: Part = EntityMockFactory.createPart({
						id: 'nextPart',
						pieces: [nextPiece],
					} as PartInterface)

					const mockedSegment: Segment = EntityMockFactory.createSegmentMockInstance({
						id: 'segment',
						parts: [firstPart, nextPart],
					} as SegmentInterface)
					when(mockedSegment.doesPieceBelongToSegment(firstPiece)).thenReturn(true)
					const segment: Segment = instance(mockedSegment)

					const testee: Rundown = new Rundown({
						segments: [segment],
						isRundownActive: true,
						alreadyActiveProperties: {
							activePart: firstPart,
							nextPart: nextPart,
							activeSegment: segment,
							nextSegment: segment,
							infinitePieces: new Map([[firstPiece.layer, firstPiece]]),
						},
					} as RundownInterface)

					testee.takeNext()

					const result: Piece[] = testee.getInfinitePieces()
					expect(result).toHaveLength(1)
					expect(result).toContain(nextPiece)
				})
			})

			describe('it changes Segment', () => {
				it('no longer have any infinite Pieces', () => {
					const layer: string = 'someLayer'
					const firstPiece: Piece = EntityMockFactory.createPiece({
						id: 'firstPiece',
						layer,
						pieceLifespan: PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE,
					} as PieceInterface)
					const firstPart: Part = EntityMockFactory.createPart({
						id: 'firstPart',
						pieces: [firstPiece],
					} as PartInterface)
					const firstSegment: Segment = EntityMockFactory.createSegment({
						id: 'firstSegment',
						parts: [firstPart],
					} as SegmentInterface)

					const nextPart: Part = EntityMockFactory.createPart({ id: 'nextPart' } as PartInterface)
					const nextSegment: Segment = EntityMockFactory.createSegment({
						id: 'nextSegment',
						parts: [nextPart],
					} as SegmentInterface)

					const testee: Rundown = new Rundown({
						segments: [firstSegment, nextSegment],
						isRundownActive: true,
						alreadyActiveProperties: {
							activePart: firstPart,
							nextPart: nextPart,
							activeSegment: firstSegment,
							nextSegment: nextSegment,
							infinitePieces: new Map([[firstPiece.layer, firstPiece]]),
						},
					} as RundownInterface)

					testee.takeNext()

					const result: Piece[] = testee.getInfinitePieces()
					expect(result).toHaveLength(0)
				})
			})
		})

		describe('Rundown has a "spanning segment" infinite Piece', () => {
			describe('it "skips" a Part within the Segment that has a "spanning segment" infinite Piece', () => {
				it('changes the infinite Piece', () => {
					const layer: string = 'someLayer'
					const firstPiece: Piece = EntityMockFactory.createPiece({
						id: 'firstPiece',
						layer,
						pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
					} as PieceInterface)
					const firstPart: Part = EntityMockFactory.createPart({
						id: 'firstPart',
						pieces: [firstPiece],
					} as PartInterface)

					const middlePiece: Piece = EntityMockFactory.createPiece({
						id: 'middlePiece',
						layer,
						pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
					} as PieceInterface)
					const middlePart: Part = EntityMockFactory.createPart({
						id: 'middlePart',
						pieces: [middlePiece],
					} as PartInterface)

					const lastPart: Part = EntityMockFactory.createPart({ id: 'lastPart' } as PartInterface)

					const segment: Segment = EntityMockFactory.createSegment(
						{ id: 'segment', parts: [firstPart, middlePart, lastPart] } as SegmentInterface,
						{ firstSpanningPieceForEachLayerBeforePart: [middlePiece] }
					)

					const testee: Rundown = new Rundown({
						segments: [segment],
						isRundownActive: true,
						alreadyActiveProperties: {
							activePart: firstPart,
							nextPart: lastPart,
							activeSegment: segment,
							nextSegment: segment,
							infinitePieces: new Map([[firstPiece.layer, firstPiece]]),
						},
					} as RundownInterface)

					testee.takeNext()

					const result: Piece[] = testee.getInfinitePieces()
					expect(result).toHaveLength(1)
					expect(result).toContainEqual(middlePiece)
				})
			})

			describe('it jumps "back" up the Segment before the Part with the spanning Segment', () => {
				describe('there is a previous "spanning segment" infinite Piece', () => {
					it('changes to the previous "spanning" infinite Piece', () => {
						const layer: string = 'someLayer'
						const firstPiece: Piece = EntityMockFactory.createPiece({
							id: 'firstPiece',
							layer,
							pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
						} as PieceInterface)
						const firstPart: Part = EntityMockFactory.createPart({
							id: 'firstPart',
							pieces: [firstPiece],
						} as PartInterface)

						const middlePart: Part = EntityMockFactory.createPart({ id: 'middlePart' } as PartInterface)

						const lastPiece: Piece = EntityMockFactory.createPiece({
							id: 'lastPiece',
							layer,
							pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
						} as PieceInterface)
						const lastPart: Part = EntityMockFactory.createPart({
							id: 'lastPart',
							pieces: [lastPiece],
						} as PartInterface)

						const segment: Segment = EntityMockFactory.createSegment(
							{ id: 'segment', parts: [firstPart, middlePart, lastPart] } as SegmentInterface,
							{ firstSpanningPieceForEachLayerBeforePart: [firstPiece] }
						)

						const testee: Rundown = new Rundown({
							segments: [segment],
							isRundownActive: true,
							alreadyActiveProperties: {
								activePart: lastPart,
								nextPart: middlePart,
								activeSegment: segment,
								nextSegment: segment,
								infinitePieces: new Map([[lastPiece.layer, lastPiece]]),
							},
						} as RundownInterface)

						testee.takeNext()

						const result: Piece[] = testee.getInfinitePieces()
						expect(result).toHaveLength(1)
						expect(result).toContainEqual(firstPiece)
					})
				})

				describe('there are no previous "spanning" infinite Pieces', () => {
					it('no longer have any infinite Pieces', () => {
						const layer: string = 'someLayer'
						const firstPart: Part = EntityMockFactory.createPart({ id: 'firstPart' } as PartInterface)

						const middlePart: Part = EntityMockFactory.createPart({ id: 'middlePart' } as PartInterface)

						const lastPiece: Piece = EntityMockFactory.createPiece({
							id: 'lastPiece',
							layer,
							pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
						} as PieceInterface)
						const lastPart: Part = EntityMockFactory.createPart({
							id: 'lastPart',
							pieces: [lastPiece],
						} as PartInterface)

						const segment: Segment = EntityMockFactory.createSegment({
							id: 'segment',
							parts: [firstPart, middlePart, lastPart],
						} as SegmentInterface)

						const testee: Rundown = new Rundown({
							segments: [segment],
							isRundownActive: true,
							alreadyActiveProperties: {
								activePart: lastPart,
								nextPart: middlePart,
								activeSegment: segment,
								nextSegment: segment,
								infinitePieces: new Map([[lastPiece.layer, lastPiece]]),
							},
						} as RundownInterface)

						testee.takeNext()

						const result: Piece[] = testee.getInfinitePieces()
						expect(result).toHaveLength(0)
					})
				})
			})

			describe('it changes Segment', () => {
				it('no longer have any infinite Pieces', () => {
					const layer: string = 'someLayer'
					const firstPiece: Piece = EntityMockFactory.createPiece({
						id: 'firstPiece',
						layer,
						pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
					} as PieceInterface)
					const firstPart: Part = EntityMockFactory.createPart({
						id: 'firstPart',
						pieces: [firstPiece],
					} as PartInterface)
					const firstSegment: Segment = EntityMockFactory.createSegment({
						id: 'firstSegment',
						parts: [firstPart],
					} as SegmentInterface)

					const nextPart: Part = EntityMockFactory.createPart({ id: 'nextPart' } as PartInterface)
					const nextSegment: Segment = EntityMockFactory.createSegment({
						id: 'nextSegment',
						parts: [nextPart],
					} as SegmentInterface)

					const testee: Rundown = new Rundown({
						segments: [firstSegment, nextSegment],
						isRundownActive: true,
						alreadyActiveProperties: {
							activePart: firstPart,
							nextPart: nextPart,
							activeSegment: firstSegment,
							nextSegment: nextSegment,
							infinitePieces: new Map([[firstPiece.layer, firstPiece]]),
						},
					} as RundownInterface)

					testee.takeNext()

					const result: Piece[] = testee.getInfinitePieces()
					expect(result).toHaveLength(0)
				})
			})
		})
	})
})
