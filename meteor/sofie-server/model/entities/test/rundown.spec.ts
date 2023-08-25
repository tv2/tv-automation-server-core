import { Segment } from '../segment'
import { Rundown, RundownInterface } from '../rundown'
import { Part } from '../part'
import { Piece } from '../piece'
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
						const activePart: Part = EntityMockFactory.createPart({ id: 'activePart' })
						const nextPart: Part = EntityMockFactory.createPart({ id: 'nextPart' })
						const activeSegment: Segment = EntityMockFactory.createSegment({
							id: 'activeSegment',
						})
						const nextSegment: Segment = EntityMockFactory.createSegment({
							id: 'nextSegment',
						})
						const piece: Piece = EntityMockFactory.createPiece({
							pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
						})

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
				})
				const nextPart: Part = EntityMockFactory.createPart({
					id: 'nextPartId',
				})
				const segment: Segment = EntityMockFactory.createSegment(
					{},
					{
						firstPart,
						nextPart,
					}
				)

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
				})
				const mockNextPart: Part = EntityMockFactory.createPartMockInstance({
					id: 'nextPartId',
				})
				const nextPart: Part = instance(mockNextPart)
				const segment: Segment = EntityMockFactory.createSegment(
					{},
					{
						firstPart,
						nextPart,
					}
				)

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
				const segment: Segment = EntityMockFactory.createSegment(
					{},
					{
						nextPart: partWithoutPieces,
					}
				)

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
					})
					const pieceTwo: Piece = EntityMockFactory.createPiece({
						layer: 'someOtherLayer',
						pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
					})
					const nextPart: Part = EntityMockFactory.createPart({
						pieces: [pieceOne, pieceTwo],
					})
					const segment: Segment = EntityMockFactory.createSegment(
						{},
						{
							nextPart: nextPart,
						}
					)

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
					})
					const nextPiece: Piece = EntityMockFactory.createPiece({
						layer: 'someOtherLayer',
						pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
					})
					const firstPart: Part = EntityMockFactory.createPart({
						id: 'first',
						pieces: [firstPiece],
					})
					const nextPart: Part = EntityMockFactory.createPart({
						id: 'next',
						pieces: [nextPiece],
					})
					const segment: Segment = EntityMockFactory.createSegment(
						{},
						{
							firstPart,
							nextPart,
							firstSpanningPieceForEachLayerBeforePart: [firstPiece],
						}
					)

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
					})
					const firstPart: Part = EntityMockFactory.createPart({
						pieces: [firstPiece],
					})

					const nextPiece: Piece = EntityMockFactory.createPiece({
						id: 'p2',
						layer,
						pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
					})
					const nextPart: Part = EntityMockFactory.createPart({
						pieces: [nextPiece],
					})

					const mockedSegment: Segment = EntityMockFactory.createSegmentMockInstance(
						{},
						{
							firstPart,
							nextPart,
						}
					)
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
					})
					const firstPiece: Piece = instance(mockFirstPiece)
					const firstPart: Part = EntityMockFactory.createPart({
						pieces: [firstPiece],
					})

					const nextPiece: Piece = EntityMockFactory.createPiece({
						id: 'p2',
						layer,
						pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
					})
					const nextPart: Part = EntityMockFactory.createPart({
						pieces: [nextPiece],
					})

					const segment: Segment = EntityMockFactory.createSegment(
						{},
						{
							firstPart,
							nextPart,
						}
					)

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
					})
					const firstPart: Part = EntityMockFactory.createPart({ pieces: [firstPiece] })
					const firstSegment: Segment = EntityMockFactory.createSegment(
						{ id: 'firstSegment', parts: [firstPart] },
						{ firstSpanningRundownPieceForEachLayerForAllParts: [firstPiece] }
					)

					const nextPiece: Piece = EntityMockFactory.createPiece({
						layer: 'someOtherLayer',
						pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
					})
					const nextPart: Part = EntityMockFactory.createPart({ pieces: [nextPiece] })
					const nextSegment: Segment = EntityMockFactory.createSegment({
						id: 'nextSegment',
						parts: [nextPart],
					})

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
					})
					const firstPart: Part = EntityMockFactory.createPart({ pieces: [firstPiece] })
					const firstSegment: Segment = EntityMockFactory.createSegment({
						id: 'firstSegment',
						parts: [firstPart],
					})

					const nextPiece: Piece = EntityMockFactory.createPiece({
						layer,
						pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
					})
					const nextPart: Part = EntityMockFactory.createPart({ pieces: [nextPiece] })
					const nextSegment: Segment = EntityMockFactory.createSegment({
						id: 'nextSegment',
						parts: [nextPart],
					})

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
					})
					const firstPart: Part = EntityMockFactory.createPart({
						id: 'firstPart',
						pieces: [firstPiece],
					})
					const firstSegment: Segment = EntityMockFactory.createSegment({
						id: 'firstSegment',
						parts: [firstPart],
					})

					const middlePiece: Piece = EntityMockFactory.createPiece({
						id: 'middlePiece',
						layer,
						pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
					})
					const middlePart: Part = EntityMockFactory.createPart({
						id: 'middlePart',
						pieces: [middlePiece],
					})
					const middleSegment: Segment = EntityMockFactory.createSegment({
						id: 'middleSegment',
						parts: [middlePart],
					})

					const lastPart: Part = EntityMockFactory.createPart({ id: 'lastPart' })
					const lastSegment: Segment = EntityMockFactory.createSegment({
						id: 'lastSegment',
						parts: [lastPart],
					})

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
					const firstPart: Part = EntityMockFactory.createPart({ id: 'firstPart' })
					const firstSegment: Segment = EntityMockFactory.createSegment({
						id: 'firstSegment',
						parts: [firstPart],
					})

					const middlePiece: Piece = EntityMockFactory.createPiece({
						id: 'middlePiece',
						layer,
						pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
					})
					const middlePart: Part = EntityMockFactory.createPart({
						id: 'middlePart',
						pieces: [middlePiece],
					})
					const middleSegment: Segment = EntityMockFactory.createSegment({
						id: 'middleSegment',
						parts: [middlePart],
					})

					const lastPiece: Piece = EntityMockFactory.createPiece({
						id: 'lastPiece',
						layer,
						pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
					})
					const lastPart: Part = EntityMockFactory.createPart({
						id: 'lastPart',
						pieces: [lastPiece],
					})
					const lastSegment: Segment = EntityMockFactory.createSegment({
						id: 'lastSegment',
						parts: [lastPart],
					})

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
					})
					const firstPart: Part = EntityMockFactory.createPart({
						id: 'firstPart',
						pieces: [firstPiece],
					})
					const firstSegment: Segment = EntityMockFactory.createSegment({
						id: 'firstSegment',
						parts: [firstPart],
					})

					const lastPiece: Piece = EntityMockFactory.createPiece({
						id: 'lastPiece',
						layer,
						pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
					})
					const lastPart: Part = EntityMockFactory.createPart({
						id: 'lastPart',
						pieces: [lastPiece],
					})
					const lastSegment: Segment = EntityMockFactory.createSegment({
						id: 'lastSegment',
						parts: [lastPart],
					})

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
					})
					const firstPart: Part = EntityMockFactory.createPart({
						id: 'firstPart',
						pieces: [firstPiece],
					})
					const firstSegment: Segment = EntityMockFactory.createSegment({
						id: 'firstSegment',
						parts: [firstPart],
					})

					const lastPiece: Piece = EntityMockFactory.createPiece({
						id: 'lastPiece',
						layer,
						pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
					})
					const lastPart: Part = EntityMockFactory.createPart({
						id: 'lastPart',
						pieces: [lastPiece],
					})
					const lastSegment: Segment = EntityMockFactory.createSegment({
						id: 'lastSegment',
						parts: [lastPart],
					})

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
		})

		describe('Rundown has a "spanning Rundown" infinite Piece', () => {
			describe('it "skips" a Segment with a "spanning Rundown" infinite Piece"', () => {
				it('changes to the "spanning" infinite Piece', () => {
					const layer: string = 'someLayer'
					const firstPiece: Piece = EntityMockFactory.createPiece({
						id: 'firstPiece',
						layer,
						pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
					})
					const firstPart: Part = EntityMockFactory.createPart({
						id: 'firstPart',
						pieces: [firstPiece],
					})
					const firstSegment: Segment = EntityMockFactory.createSegment({
						id: 'firstSegment',
						parts: [firstPart],
					})

					const middlePiece: Piece = EntityMockFactory.createPiece({
						id: 'middlePiece',
						layer,
						pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
					})
					const middlePart: Part = EntityMockFactory.createPart({
						id: 'middlePart',
						pieces: [middlePiece],
					})
					const middleSegment: Segment = EntityMockFactory.createSegment(
						{ id: 'middleSegment', parts: [middlePart] },
						{ firstSpanningRundownPieceForEachLayerForAllParts: [middlePiece] }
					)

					const lastPart: Part = EntityMockFactory.createPart({ id: 'lastPart' })
					const lastSegment: Segment = EntityMockFactory.createSegment({
						id: 'lastSegment',
						parts: [lastPart],
					})

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

				it('sets executedAt on the taken infinite Piece', () => {
					const now: number = Date.now()
					jest.useFakeTimers('modern').setSystemTime(now)

					const layer: string = 'someLayer'
					const firstPiece: Piece = EntityMockFactory.createPiece({
						id: 'firstPiece',
						layer,
						pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
					})
					const firstPart: Part = EntityMockFactory.createPart({
						id: 'firstPart',
						pieces: [firstPiece],
					})
					const firstSegment: Segment = EntityMockFactory.createSegment({
						id: 'firstSegment',
						parts: [firstPart],
					})

					const mockMiddlePiece: Piece = EntityMockFactory.createPieceMockInstance({
						id: 'middlePiece',
						layer,
						pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
					})
					const middlePiece: Piece = instance(mockMiddlePiece)
					const middlePart: Part = EntityMockFactory.createPart({
						id: 'middlePart',
						pieces: [middlePiece],
					})
					const middleSegment: Segment = EntityMockFactory.createSegment(
						{ id: 'middleSegment', parts: [middlePart] },
						{ firstSpanningRundownPieceForEachLayerForAllParts: [middlePiece] }
					)

					const lastPart: Part = EntityMockFactory.createPart({ id: 'lastPart' })
					const lastSegment: Segment = EntityMockFactory.createSegment({
						id: 'lastSegment',
						parts: [lastPart],
					})

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

					verify(mockMiddlePiece.setExecutedAt(now)).once()
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
						})
						const firstPart: Part = EntityMockFactory.createPart({
							id: 'firstPart',
							pieces: [firstPiece],
						})
						const firstSegment: Segment = EntityMockFactory.createSegment(
							{ id: 'firstSegment', parts: [firstPart] },
							{ firstSpanningRundownPieceForEachLayerForAllParts: [firstPiece] }
						)

						const middlePart: Part = EntityMockFactory.createPart({ id: 'middlePart' })
						const middleSegment: Segment = EntityMockFactory.createSegment({
							id: 'middleSegment',
							parts: [middlePart],
						})

						const lastPiece: Piece = EntityMockFactory.createPiece({
							id: 'lastPiece',
							layer,
							pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
						})
						const lastPart: Part = EntityMockFactory.createPart({
							id: 'lastPart',
							pieces: [lastPiece],
						})
						const lastSegment: Segment = EntityMockFactory.createSegment({
							id: 'lastSegment',
							parts: [lastPart],
						})

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
						const firstPart: Part = EntityMockFactory.createPart({ id: 'firstPart' })
						const firstSegment: Segment = EntityMockFactory.createSegment({
							id: 'firstSegment',
							parts: [firstPart],
						})

						const middlePart: Part = EntityMockFactory.createPart({ id: 'middlePart' })
						const middleSegment: Segment = EntityMockFactory.createSegment({
							id: 'middleSegment',
							parts: [middlePart],
						})

						const lastPiece: Piece = EntityMockFactory.createPiece({
							id: 'lastPiece',
							layer,
							pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
						})
						const lastPart: Part = EntityMockFactory.createPart({
							id: 'lastPart',
							pieces: [lastPiece],
						})
						const lastSegment: Segment = EntityMockFactory.createSegment({
							id: 'lastSegment',
							parts: [lastPart],
						})

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

			describe('it takes a Segment with a "stickyThenSpanning" infinite Piece', () => {
				it('takes the "stickyThenSpanning" Piece', () => {
					const firstPiece: Piece = EntityMockFactory.createPiece({
						id: 'firstPiece',
						pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
					})
					const firstPart: Part = EntityMockFactory.createPart({ id: 'firstPart', pieces: [firstPiece] })
					const firstSegment: Segment = EntityMockFactory.createSegment({
						id: 'firstSegment',
						parts: [firstPart],
					})

					const lastPiece: Piece = EntityMockFactory.createPiece({
						id: 'lastPiece',
						pieceLifespan: PieceLifespan.START_SPANNING_SEGMENT_THEN_STICKY_RUNDOWN,
					})
					const lastPart: Part = EntityMockFactory.createPart({ id: 'lastPart', pieces: [lastPiece] })
					const lastSegment: Segment = EntityMockFactory.createSegment({
						id: 'lastSegment',
						parts: [lastPart],
					})

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

			describe('"skips" a Segment with a "stickyThenSpanning infinite Piece', () => {
				it('does not change infinite Piece', () => {
					const firstPiece: Piece = EntityMockFactory.createPiece({
						id: 'firstPiece',
						pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
					})
					const firstPart: Part = EntityMockFactory.createPart({ id: 'firstPart', pieces: [firstPiece] })
					const firstSegment: Segment = EntityMockFactory.createSegment(
						{ id: 'firstSegment', parts: [firstPart] },
						{ firstSpanningRundownPieceForEachLayerForAllParts: [firstPiece] }
					)

					const middlePiece: Piece = EntityMockFactory.createPiece({
						id: 'middlePiece',
						pieceLifespan: PieceLifespan.START_SPANNING_SEGMENT_THEN_STICKY_RUNDOWN,
					})
					const middlePart: Part = EntityMockFactory.createPart({ id: 'middlePart', pieces: [middlePiece] })
					const middleSegment: Segment = EntityMockFactory.createSegment({
						id: 'firstSegment',
						parts: [middlePart],
					})

					const lastPart: Part = EntityMockFactory.createPart({ id: 'lastPart' })
					const lastSegment: Segment = EntityMockFactory.createSegment({
						id: 'lastSegment',
						parts: [lastPart],
					})

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
		})

		describe('Rundown has an infinite "Rundown" Piece', () => {
			describe('it takes a Segment with a non-infinite Piece for same layer', () => {
				it('no longer has any infinite Pieces', () => {
					const layer: string = 'someLayer'
					const firstPiece: Piece = EntityMockFactory.createPiece({
						id: 'firstPiece',
						layer,
						pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
					})
					const firstPart: Part = EntityMockFactory.createPart({
						id: 'firstPart',
						pieces: [firstPiece],
					})
					const firstSegment: Segment = EntityMockFactory.createSegment({
						id: 'firstSegment',
						parts: [firstPart],
					})

					const nextPiece: Piece = EntityMockFactory.createPiece({
						id: 'nextPiece',
						layer,
						pieceLifespan: PieceLifespan.WITHIN_PART,
					})
					const nextPart: Part = EntityMockFactory.createPart({
						id: 'nextPart',
						pieces: [nextPiece],
					})
					const nextSegment: Segment = EntityMockFactory.createSegment({
						id: 'nextSegment',
						parts: [nextPart],
					})

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
					})
					const firstPart: Part = EntityMockFactory.createPart({
						id: 'firstPart',
						pieces: [firstPiece],
					})

					const nextPiece: Piece = EntityMockFactory.createPiece({
						id: 'nextPiece',
						layer,
						pieceLifespan: PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE,
					})
					const nextPart: Part = EntityMockFactory.createPart({
						id: 'nextPart',
						pieces: [nextPiece],
					})

					const mockedSegment: Segment = EntityMockFactory.createSegmentMockInstance({
						id: 'segment',
						parts: [firstPart, nextPart],
					})
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
					})
					const firstPart: Part = EntityMockFactory.createPart({
						id: 'firstPart',
						pieces: [firstPiece],
					})

					const middlePiece: Piece = EntityMockFactory.createPiece({
						id: 'middlePiece',
						layer,
						pieceLifespan: PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE,
					})
					const middlePart: Part = EntityMockFactory.createPart({
						id: 'middlePart',
						pieces: [middlePiece],
					})

					const lastPart: Part = EntityMockFactory.createPart({ id: 'lastPart' })

					const mockedSegment: Segment = EntityMockFactory.createSegmentMockInstance({
						id: 'segment',
						parts: [firstPart, middlePart, lastPart],
					})
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
					const firstPart: Part = EntityMockFactory.createPart({ id: 'firstPart' })

					const middlePiece: Piece = EntityMockFactory.createPiece({
						id: 'middlePiece',
						layer,
						pieceLifespan: PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE,
					})
					const middlePart: Part = EntityMockFactory.createPart({
						id: 'middlePart',
						pieces: [middlePiece],
					})

					const lastPiece: Piece = EntityMockFactory.createPiece({
						id: 'lastPiece',
						layer,
						pieceLifespan: PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE,
					})
					const lastPart: Part = EntityMockFactory.createPart({
						id: 'lastPart',
						pieces: [lastPiece],
					})

					const mockSegment: Segment = EntityMockFactory.createSegmentMockInstance({
						id: 'segment',
						parts: [firstPart, middlePart, lastPart],
					})
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
					})
					const firstPart: Part = EntityMockFactory.createPart({
						id: 'firstPart',
						pieces: [firstPiece],
					})

					const nextPiece: Piece = EntityMockFactory.createPiece({
						id: 'nextPiece',
						layer,
						pieceLifespan: PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE,
					})
					const nextPart: Part = EntityMockFactory.createPart({
						id: 'nextPart',
						pieces: [nextPiece],
					})

					const mockedSegment: Segment = EntityMockFactory.createSegmentMockInstance({
						id: 'segment',
						parts: [firstPart, nextPart],
					})
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

			describe('it takes a Part within segment with "stickyThenSpanning" infinite Piece', () => {
				it('changes the infinite Piece', () => {
					const layer: string = 'someLayer'
					const firstPiece: Piece = EntityMockFactory.createPiece({
						id: 'firstPiece',
						layer,
						pieceLifespan: PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE,
					})
					const firstPart: Part = EntityMockFactory.createPart({
						id: 'firstPart',
						pieces: [firstPiece],
					})

					const nextPiece: Piece = EntityMockFactory.createPiece({
						id: 'nextPiece',
						layer,
						pieceLifespan: PieceLifespan.START_SPANNING_SEGMENT_THEN_STICKY_RUNDOWN,
					})
					const nextPart: Part = EntityMockFactory.createPart({
						id: 'nextPart',
						pieces: [nextPiece],
					})

					const mockedSegment: Segment = EntityMockFactory.createSegmentMockInstance({
						id: 'segment',
						parts: [firstPart, nextPart],
					})
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

			describe('it "skips" a Part within the Segment with "stickyThenSpanning" infinite Piece', () => {
				it('does not change the infinite Piece', () => {
					const layer: string = 'someLayer'
					const firstPiece: Piece = EntityMockFactory.createPiece({
						id: 'firstPiece',
						layer,
						pieceLifespan: PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE,
					})
					const firstPart: Part = EntityMockFactory.createPart({
						id: 'firstPart',
						pieces: [firstPiece],
					})

					const middlePiece: Piece = EntityMockFactory.createPiece({
						id: 'middlePiece',
						layer,
						pieceLifespan: PieceLifespan.START_SPANNING_SEGMENT_THEN_STICKY_RUNDOWN,
					})
					const middlePart: Part = EntityMockFactory.createPart({
						id: 'middlePart',
						pieces: [middlePiece],
					})

					const lastPart: Part = EntityMockFactory.createPart({
						id: 'lastPart',
					})

					const mockedSegment: Segment = EntityMockFactory.createSegmentMockInstance({
						id: 'segment',
						parts: [firstPart, middlePart, lastPart],
					})
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

			describe('it changes Segment', () => {
				it('no longer have any infinite Pieces', () => {
					const layer: string = 'someLayer'
					const firstPiece: Piece = EntityMockFactory.createPiece({
						id: 'firstPiece',
						layer,
						pieceLifespan: PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE,
					})
					const firstPart: Part = EntityMockFactory.createPart({
						id: 'firstPart',
						pieces: [firstPiece],
					})
					const firstSegment: Segment = EntityMockFactory.createSegment({
						id: 'firstSegment',
						parts: [firstPart],
					})

					const nextPart: Part = EntityMockFactory.createPart({ id: 'nextPart' })
					const nextSegment: Segment = EntityMockFactory.createSegment({
						id: 'nextSegment',
						parts: [nextPart],
					})

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
					})
					const firstPart: Part = EntityMockFactory.createPart({
						id: 'firstPart',
						pieces: [firstPiece],
					})

					const middlePiece: Piece = EntityMockFactory.createPiece({
						id: 'middlePiece',
						layer,
						pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
					})
					const middlePart: Part = EntityMockFactory.createPart({
						id: 'middlePart',
						pieces: [middlePiece],
					})

					const lastPart: Part = EntityMockFactory.createPart({ id: 'lastPart' })

					const segment: Segment = EntityMockFactory.createSegment(
						{ id: 'segment', parts: [firstPart, middlePart, lastPart] },
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

				it('sets executedAt on taken infinite Piece', () => {
					const now: number = Date.now()
					jest.useFakeTimers('modern').setSystemTime(now)

					const layer: string = 'someLayer'
					const firstPiece: Piece = EntityMockFactory.createPiece({
						id: 'firstPiece',
						layer,
						pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
					})
					const firstPart: Part = EntityMockFactory.createPart({
						id: 'firstPart',
						pieces: [firstPiece],
					})

					const mockMiddlePiece: Piece = EntityMockFactory.createPieceMockInstance({
						id: 'middlePiece',
						layer,
						pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
					})
					const middlePiece: Piece = instance(mockMiddlePiece)
					const middlePart: Part = EntityMockFactory.createPart({
						id: 'middlePart',
						pieces: [middlePiece],
					})

					const lastPart: Part = EntityMockFactory.createPart({ id: 'lastPart' })

					const segment: Segment = EntityMockFactory.createSegment(
						{ id: 'segment', parts: [firstPart, middlePart, lastPart] },
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

					verify(mockMiddlePiece.setExecutedAt(now)).once()
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
						})
						const firstPart: Part = EntityMockFactory.createPart({
							id: 'firstPart',
							pieces: [firstPiece],
						})

						const middlePart: Part = EntityMockFactory.createPart({ id: 'middlePart' })

						const lastPiece: Piece = EntityMockFactory.createPiece({
							id: 'lastPiece',
							layer,
							pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
						})
						const lastPart: Part = EntityMockFactory.createPart({
							id: 'lastPart',
							pieces: [lastPiece],
						})

						const segment: Segment = EntityMockFactory.createSegment(
							{ id: 'segment', parts: [firstPart, middlePart, lastPart] },
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
						const firstPart: Part = EntityMockFactory.createPart({ id: 'firstPart' })

						const middlePart: Part = EntityMockFactory.createPart({ id: 'middlePart' })

						const lastPiece: Piece = EntityMockFactory.createPiece({
							id: 'lastPiece',
							layer,
							pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
						})
						const lastPart: Part = EntityMockFactory.createPart({
							id: 'lastPart',
							pieces: [lastPiece],
						})

						const segment: Segment = EntityMockFactory.createSegment({
							id: 'segment',
							parts: [firstPart, middlePart, lastPart],
						})

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

			describe('it takes a Part within the Segment with a "stickyThenSpanning" infinite Piece', () => {
				it('changes the infinite Piece', () => {
					const layer: string = 'someLayer'
					const firstPiece: Piece = EntityMockFactory.createPiece({
						id: 'firstPiece',
						layer,
						pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
					})
					const firstPart: Part = EntityMockFactory.createPart({
						id: 'firstPart',
						pieces: [firstPiece],
					})

					const lastPiece: Piece = EntityMockFactory.createPiece({
						id: 'lastPiece',
						layer,
						pieceLifespan: PieceLifespan.START_SPANNING_SEGMENT_THEN_STICKY_RUNDOWN,
					})
					const lastPart: Part = EntityMockFactory.createPart({
						id: 'lastPart',
						pieces: [lastPiece],
					})

					const segment: Segment = EntityMockFactory.createSegment({
						id: 'segment',
						parts: [firstPart, lastPart],
					})

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
					expect(result).toContainEqual(lastPiece)
				})
			})

			describe('it "skips" a Part within the Segment with a "stickyThenSpanning" infinite Piece', () => {
				it('changes the infinite Piece', () => {
					const layer: string = 'someLayer'
					const firstPiece: Piece = EntityMockFactory.createPiece({
						id: 'firstPiece',
						layer,
						pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
					})
					const firstPart: Part = EntityMockFactory.createPart({
						id: 'firstPart',
						pieces: [firstPiece],
					})

					const middlePiece: Piece = EntityMockFactory.createPiece({
						id: 'middlePiece',
						layer,
						pieceLifespan: PieceLifespan.START_SPANNING_SEGMENT_THEN_STICKY_RUNDOWN,
					})
					const middlePart: Part = EntityMockFactory.createPart({ id: 'middlePart', pieces: [middlePiece] })

					const lastPart: Part = EntityMockFactory.createPart({
						id: 'lastPart',
					})

					const segment: Segment = EntityMockFactory.createSegment(
						{ id: 'segment', parts: [firstPart, middlePart, lastPart] },
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

			describe('it changes Segment', () => {
				it('no longer have any infinite Pieces', () => {
					const layer: string = 'someLayer'
					const firstPiece: Piece = EntityMockFactory.createPiece({
						id: 'firstPiece',
						layer,
						pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
					})
					const firstPart: Part = EntityMockFactory.createPart({
						id: 'firstPart',
						pieces: [firstPiece],
					})
					const firstSegment: Segment = EntityMockFactory.createSegment({
						id: 'firstSegment',
						parts: [firstPart],
					})

					const nextPart: Part = EntityMockFactory.createPart({ id: 'nextPart' })
					const nextSegment: Segment = EntityMockFactory.createSegment({
						id: 'nextSegment',
						parts: [nextPart],
					})

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

		describe('Rundown has a "stickyThenSpanning" infinite Piece', () => {
			describe('it takes another Segment with a "spanningThenSticky" infinite Piece', () => {
				it('changes infinite Piece', () => {
					const firstPiece: Piece = EntityMockFactory.createPiece({
						id: 'firstPiece',
						pieceLifespan: PieceLifespan.START_SPANNING_SEGMENT_THEN_STICKY_RUNDOWN,
					})
					const firstPart: Part = EntityMockFactory.createPart({ id: 'firstPart', pieces: [firstPiece] })
					const firstSegment: Segment = EntityMockFactory.createSegment({
						id: 'firstSegment',
						parts: [firstPart],
					})

					const nextPiece: Piece = EntityMockFactory.createPiece({
						id: 'nextPiece',
						pieceLifespan: PieceLifespan.START_SPANNING_SEGMENT_THEN_STICKY_RUNDOWN,
					})
					const nextPart: Part = EntityMockFactory.createPart({ id: 'nextPart', pieces: [nextPiece] })
					const nextSegment: Segment = EntityMockFactory.createSegment({
						id: 'firstSegment',
						parts: [nextPart],
					})

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
					expect(result).toContainEqual(nextPiece)
				})
			})

			describe('it "skips" a Segment with a "spanningThenSticky" infinite Piece', () => {
				it('does not change the infinite Piece', () => {
					const firstPiece: Piece = EntityMockFactory.createPiece({
						id: 'firstPiece',
						pieceLifespan: PieceLifespan.START_SPANNING_SEGMENT_THEN_STICKY_RUNDOWN,
					})
					const firstPart: Part = EntityMockFactory.createPart({ id: 'firstPart', pieces: [firstPiece] })
					const firstSegment: Segment = EntityMockFactory.createSegment({
						id: 'firstSegment',
						parts: [firstPart],
					})

					const middlePiece: Piece = EntityMockFactory.createPiece({
						id: 'middlePiece',
						pieceLifespan: PieceLifespan.START_SPANNING_SEGMENT_THEN_STICKY_RUNDOWN,
					})
					const middlePart: Part = EntityMockFactory.createPart({ id: 'middlePart', pieces: [middlePiece] })
					const middleSegment: Segment = EntityMockFactory.createSegment({
						id: 'firstSegment',
						parts: [middlePart],
					})

					const lastPart: Part = EntityMockFactory.createPart({ id: 'lastPart' })
					const lastSegment: Segment = EntityMockFactory.createSegment({
						id: 'firstSegment',
						parts: [lastPart],
					})

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
					expect(result).toContainEqual(firstPiece)
				})
			})

			describe('it "jumps back up" the Rundown before its "spanningThenSticky" infinite Piece', () => {
				describe('there is a previous "spanningThenSticky" infinite Piece', () => {
					it('keeps the first "spanningThenSticky" Piece', () => {
						const firstPiece: Piece = EntityMockFactory.createPiece({
							id: 'firstPiece',
							pieceLifespan: PieceLifespan.START_SPANNING_SEGMENT_THEN_STICKY_RUNDOWN,
						})
						const firstPart: Part = EntityMockFactory.createPart({ id: 'firstPart', pieces: [firstPiece] })
						const firstSegment: Segment = EntityMockFactory.createSegment({
							id: 'firstSegment',
							parts: [firstPart],
						})

						const middlePart: Part = EntityMockFactory.createPart({ id: 'middlePart' })
						const middleSegment: Segment = EntityMockFactory.createSegment({
							id: 'firstSegment',
							parts: [middlePart],
						})

						const lastPiece: Piece = EntityMockFactory.createPiece({
							id: 'lastPiece',
							pieceLifespan: PieceLifespan.START_SPANNING_SEGMENT_THEN_STICKY_RUNDOWN,
						})
						const lastPart: Part = EntityMockFactory.createPart({ id: 'lastPart', pieces: [lastPiece] })
						const lastSegment: Segment = EntityMockFactory.createSegment(
							{ id: 'firstSegment', parts: [lastPart] },
							{ firstSpanningPieceForEachLayerBeforePart: [lastPiece] }
						)

						const testee: Rundown = new Rundown({
							segments: [firstSegment, middleSegment, lastSegment],
							isRundownActive: true,
							alreadyActiveProperties: {
								activePart: lastPart,
								nextPart: middlePart,
								activeSegment: lastSegment,
								nextSegment: middleSegment,
								infinitePieces: new Map([[lastPiece.layer, lastPiece]]),
							},
						} as RundownInterface)

						testee.takeNext()

						const result: Piece[] = testee.getInfinitePieces()
						expect(result).toContainEqual(lastPiece)
					})
				})

				describe('there is no other "spanningThenSticky" infinite Piece', () => {
					it('keeps the first "spanningThenSticky" Piece', () => {
						const firstPart: Part = EntityMockFactory.createPart({ id: 'firstPart' })
						const firstSegment: Segment = EntityMockFactory.createSegment({
							id: 'firstSegment',
							parts: [firstPart],
						})

						const middlePart: Part = EntityMockFactory.createPart({ id: 'middlePart' })
						const middleSegment: Segment = EntityMockFactory.createSegment({
							id: 'firstSegment',
							parts: [middlePart],
						})

						const lastPiece: Piece = EntityMockFactory.createPiece({
							id: 'lastPiece',
							pieceLifespan: PieceLifespan.START_SPANNING_SEGMENT_THEN_STICKY_RUNDOWN,
						})
						const lastPart: Part = EntityMockFactory.createPart({ id: 'lastPart', pieces: [lastPiece] })
						const lastSegment: Segment = EntityMockFactory.createSegment({
							id: 'firstSegment',
							parts: [lastPart],
						})

						const testee: Rundown = new Rundown({
							segments: [firstSegment, middleSegment, lastSegment],
							isRundownActive: true,
							alreadyActiveProperties: {
								activePart: lastPart,
								nextPart: middlePart,
								activeSegment: lastSegment,
								nextSegment: middleSegment,
								infinitePieces: new Map([[lastPiece.layer, lastPiece]]),
							},
						} as RundownInterface)

						testee.takeNext()

						const result: Piece[] = testee.getInfinitePieces()
						expect(result).toContainEqual(lastPiece)
					})
				})
			})
		})
	})
})
