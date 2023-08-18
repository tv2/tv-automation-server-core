import { Segment, SegmentInterface } from '../segment'
import { Rundown } from '../rundown'
import { Part, PartInterface } from '../part'
import { Piece, PieceInterface } from '../piece'
import { PieceLifespan } from '../../enums/piece-lifespan'
import { EntityDefaultFactory } from './entity-default-factory'

describe('Rundown', () => {
	describe('takeNext', () => {
		describe('it has a next Part', () => {
			it('sets the next Part as the active Part', () => {
				const segment: Segment = EntityDefaultFactory.createSegment({} as SegmentInterface)
				const partOne: Part = EntityDefaultFactory.createPart({ rank: 1, segmentId: segment.id } as PartInterface)
				const partTwo: Part = EntityDefaultFactory.createPart({ rank: 2, segmentId: segment.id } as PartInterface)
				segment.setParts([partOne, partTwo])

				const testee: Rundown = EntityDefaultFactory.createActiveRundown([segment])

				const activeBefore: Part = testee.getActivePart()

				testee.takeNext()

				const activeAfter: Part = testee.getActivePart()

				expect(activeBefore.id).not.toBe(activeAfter.id)
			})
		})

		describe('it does not have a next Part', () => {
			// TODO: Write tests
		})

		describe('active Part has no infinite Pieces', () => {
			it('does not add any infinite Pieces', () => {
				const segment: Segment = EntityDefaultFactory.createSegment({} as SegmentInterface)
				const partWithoutPieces: Part = EntityDefaultFactory.createPart({ rank: 1, segmentId: segment.id } as PartInterface)
				segment.setParts([partWithoutPieces])

				const testee: Rundown = EntityDefaultFactory.createActiveRundown([segment])

				testee.takeNext()

				const result: Piece[] = testee.getInfinitePieces()
				expect(result).toHaveLength(0)
			})
		})

		describe('Rundown has Part with infinite Pieces', () => {
			describe('it has two Pieces on different layers', () => {
				it('adds both infinite Pieces', () => {
					const segment: Segment = EntityDefaultFactory.createSegment({} as SegmentInterface)
					const pieceOne: Piece = EntityDefaultFactory.createPiece({
						id: 'p1',
						layer: 'someLayer',
						pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
					} as PieceInterface)
					const pieceTwo: Piece = EntityDefaultFactory.createPiece({
						id: 'p2',
						layer: 'someOtherLayer',
						pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
					} as PieceInterface)
					const part: Part = EntityDefaultFactory.createPart({
						rank: 1,
						segmentId: segment.id,
						pieces: [pieceOne, pieceTwo],
					} as PartInterface)
					segment.setParts([part])

					const testee: Rundown = EntityDefaultFactory.createActiveRundown([segment])

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
					const segment: Segment = EntityDefaultFactory.createSegment({} as SegmentInterface)
					const pieceOne: Piece = EntityDefaultFactory.createPiece({
						id: 'p1',
						layer: 'someLayer',
						pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
					} as PieceInterface)
					const pieceTwo: Piece = EntityDefaultFactory.createPiece({
						id: 'p2',
						layer: 'someOtherLayer',
						pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
					} as PieceInterface)
					const partOne: Part = EntityDefaultFactory.createPart({ rank: 1, segmentId: segment.id, pieces: [pieceOne] } as PartInterface)
					const partTwo: Part = EntityDefaultFactory.createPart({ rank: 2, segmentId: segment.id, pieces: [pieceTwo] } as PartInterface)
					segment.setParts([partOne, partTwo])

					const testee: Rundown = EntityDefaultFactory.createActiveRundown([segment])

					testee.takeNext()
					testee.takeNext()

					const result: Piece[] = testee.getInfinitePieces()
					expect(result).toHaveLength(2)
					expect(result).toContainEqual(pieceOne)
					expect(result).toContainEqual(pieceTwo)
				})
			})

			describe('Each Part has an infinite Piece on the same layer', () => {
				it('only adds the last infinite Piece', () => {
					const layer: string = 'someLayer'
					const segment: Segment = EntityDefaultFactory.createSegment({} as SegmentInterface)

					const pieceOne: Piece = EntityDefaultFactory.createPiece({
						id: 'p1',
						layer,
						pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
					} as PieceInterface)
					const partOne: Part = EntityDefaultFactory.createPart({ rank: 1, segmentId: segment.id, pieces: [pieceOne] } as PartInterface)

					const pieceTwo: Piece = EntityDefaultFactory.createPiece({
						id: 'p2',
						layer,
						pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
					} as PieceInterface)
					const partTwo: Part = EntityDefaultFactory.createPart({ rank: 2, segmentId: segment.id, pieces: [pieceTwo] } as PartInterface)

					segment.setParts([partOne, partTwo])

					const testee: Rundown = EntityDefaultFactory.createActiveRundown([segment])

					testee.takeNext()

					const result: Piece[] = testee.getInfinitePieces()
					expect(result).toHaveLength(1)
					expect(result).toContain(pieceTwo)
				})

				it('sets executedAt to zero for the Piece no longer being an infinite', () => {
					const layer: string = 'someLayer'
					const segment: Segment = EntityDefaultFactory.createSegment({} as SegmentInterface)

					const pieceOne: Piece = EntityDefaultFactory.createPiece({
						id: 'p1',
						layer,
						pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
					} as PieceInterface)
					const partOne: Part = EntityDefaultFactory.createPart({ rank: 1, segmentId: segment.id, pieces: [pieceOne] } as PartInterface)

					const pieceTwo: Piece = EntityDefaultFactory.createPiece({
						id: 'p2',
						layer,
						pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
					} as PieceInterface)
					const partTwo: Part = EntityDefaultFactory.createPart({ rank: 2, segmentId: segment.id, pieces: [pieceTwo] } as PartInterface)

					segment.setParts([partOne, partTwo])

					const testee: Rundown = EntityDefaultFactory.createActiveRundown([segment])

					testee.takeNext()

					expect(pieceOne.getExecutedAt()).toBe(0)
				})

				it('sets executedAt to now for the active infinite Piece', () => {
					const now: number = Date.now()
					jest.useFakeTimers('modern').setSystemTime(now)

					const layer: string = 'someLayer'
					const segment: Segment = EntityDefaultFactory.createSegment({} as SegmentInterface)

					const pieceOne: Piece = EntityDefaultFactory.createPiece({
						id: 'p1',
						layer,
						pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
					} as PieceInterface)
					const partOne: Part = EntityDefaultFactory.createPart({ rank: 1, segmentId: segment.id, pieces: [pieceOne] } as PartInterface)

					const pieceTwo: Piece = EntityDefaultFactory.createPiece({
						id: 'p2',
						layer,
						pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
					} as PieceInterface)
					const partTwo: Part = EntityDefaultFactory.createPart({ rank: 2, segmentId: segment.id, pieces: [pieceTwo] } as PartInterface)

					segment.setParts([partOne, partTwo])

					const testee: Rundown = EntityDefaultFactory.createActiveRundown([segment])

					testee.takeNext()

					expect(pieceTwo.getExecutedAt()).toBe(now)
				})
			})
		})

		describe('Rundown has two Segments', () => {
			describe('Each Segment has an infinite Piece on different layers', () => {
				it('adds both infinite Pieces', () => {
					const segmentOne: Segment = EntityDefaultFactory.createSegment({ rank: 1 } as SegmentInterface)
					const pieceOne: Piece = EntityDefaultFactory.createPiece({
						id: 'p1',
						layer: 'someLayer',
						pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
					} as PieceInterface)
					const partOne: Part = EntityDefaultFactory.createPart({ rank: 1, segmentId: segmentOne.id, pieces: [pieceOne] } as PartInterface)
					segmentOne.setParts([partOne])

					const segmentTwo: Segment = EntityDefaultFactory.createSegment({ rank: 2 } as SegmentInterface)
					const pieceTwo: Piece = EntityDefaultFactory.createPiece({
						id: 'p2',
						layer: 'someOtherLayer',
						pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
					} as PieceInterface)
					const partTwo: Part = EntityDefaultFactory.createPart({ rank: 2, segmentId: segmentTwo.id, pieces: [pieceTwo] } as PartInterface)
					segmentTwo.setParts([partTwo])

					const testee: Rundown = EntityDefaultFactory.createActiveRundown([segmentOne, segmentTwo])

					testee.takeNext()

					const result: Piece[] = testee.getInfinitePieces()
					expect(result).toHaveLength(2)
					expect(result).toContainEqual(pieceOne)
					expect(result).toContainEqual(pieceTwo)
				})
			})

			describe('Each Segment has an infinit Piece on the same layer', () => {
				it('only adds the last infinite piece', () => {
					const layer: string = 'someLayer'

					const segmentOne: Segment = EntityDefaultFactory.createSegment({ rank: 1 } as SegmentInterface)
					const pieceOne: Piece = EntityDefaultFactory.createPiece({
						id: 'p1',
						layer,
						pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
					} as PieceInterface)
					const partOne: Part = EntityDefaultFactory.createPart({ rank: 1, segmentId: segmentOne.id, pieces: [pieceOne] } as PartInterface)
					segmentOne.setParts([partOne])

					const segmentTwo: Segment = EntityDefaultFactory.createSegment({ rank: 2 } as SegmentInterface)
					const pieceTwo: Piece = EntityDefaultFactory.createPiece({
						id: 'p2',
						layer,
						pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
					} as PieceInterface)
					const partTwo: Part = EntityDefaultFactory.createPart({ rank: 2, segmentId: segmentTwo.id, pieces: [pieceTwo] } as PartInterface)
					segmentTwo.setParts([partTwo])

					const testee: Rundown = EntityDefaultFactory.createActiveRundown([segmentOne, segmentTwo])

					testee.takeNext()

					const result: Piece[] = testee.getInfinitePieces()
					expect(result).toHaveLength(1)
					expect(result).toContain(pieceTwo)
				})
			})
		})

		describe('Rundown has a "sticky Rundown" infinite Piece', () => {
			describe('Rundown "skips" a Segment that also has a "sticky" infinite Piece', () => {
				it('does not change the "sticky" infinite Piece', () => {
					const firstSegment: Segment = EntityDefaultFactory.createSegment({ rank: 1 } as SegmentInterface)
					const layer: string = 'someLayer'
					const firstPiece: Piece = EntityDefaultFactory.createPiece({
						id: 'p1',
						layer,
						pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
					} as PieceInterface)
					const firstPart: Part = EntityDefaultFactory.createPart({
						rank: 1,
						segmentId: firstSegment.id,
						pieces: [firstPiece],
					} as PartInterface)
					firstSegment.setParts([firstPart])

					const middleSegment: Segment = EntityDefaultFactory.createSegment({ rank: 2 } as SegmentInterface)
					const middlePiece: Piece = EntityDefaultFactory.createPiece({
						id: 'p2',
						layer,
						pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
					} as PieceInterface)
					const middlePart: Part = EntityDefaultFactory.createPart({
						rank: 2,
						segmentId: middleSegment.id,
						pieces: [middlePiece],
					} as PartInterface)
					middleSegment.setParts([middlePart])

					const lastSegment: Segment = EntityDefaultFactory.createSegment({ rank: 3 } as SegmentInterface)
					const lastPart: Part = EntityDefaultFactory.createPart({ rank: 3, segmentId: lastSegment.id } as PartInterface)
					lastSegment.setParts([lastPart])

					const testee: Rundown = EntityDefaultFactory.createActiveRundown([firstSegment, middleSegment, lastSegment])

					testee.setNext(lastSegment.id, lastPart.id)
					testee.takeNext()

					const result: Piece[] = testee.getInfinitePieces()
					expect(result).toHaveLength(1)
					expect(result).toContain(firstPiece)
				})
			})

			describe('it jumps "back" up the Rundown and "skips" a Segment with a "sticky Rundown" infinite Piece', () => {
				it('does not change the "sticky" infinite Piece', () => {
					const firstSegment: Segment = EntityDefaultFactory.createSegment({ rank: 1 } as SegmentInterface)
					const layer: string = 'someLayer'

					const firstPart: Part = EntityDefaultFactory.createPart({ rank: 1, segmentId: firstSegment.id } as PartInterface)
					firstSegment.setParts([firstPart])

					const middleSegment: Segment = EntityDefaultFactory.createSegment({ rank: 2 } as SegmentInterface)
					const middlePiece: Piece = EntityDefaultFactory.createPiece({
						id: 'p1',
						layer,
						pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
					} as PieceInterface)
					const middlePart: Part = EntityDefaultFactory.createPart({
						rank: 2,
						segmentId: middleSegment.id,
						pieces: [middlePiece],
					} as PartInterface)
					middleSegment.setParts([middlePart])

					const lastSegment: Segment = EntityDefaultFactory.createSegment({ rank: 3 } as SegmentInterface)
					const lastPiece: Piece = EntityDefaultFactory.createPiece({
						id: 'p2',
						layer,
						pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
					} as PieceInterface)
					const lastPart: Part = EntityDefaultFactory.createPart({
						rank: 3,
						segmentId: lastSegment.id,
						pieces: [lastPiece],
					} as PartInterface)
					lastSegment.setParts([lastPart])

					const testee: Rundown = EntityDefaultFactory.createActiveRundown([firstSegment, middleSegment, lastSegment])

					testee.setNext(lastSegment.id, lastPart.id)
					testee.takeNext()

					let result: Piece[] = testee.getInfinitePieces()
					expect(result).toHaveLength(1)
					expect(result).toContain(lastPiece)

					testee.setNext(firstSegment.id, firstPart.id)
					testee.takeNext()

					result = testee.getInfinitePieces()
					expect(result).toHaveLength(1)
					expect(result).toContain(lastPiece)
				})
			})

			describe('it takes a Segment with a "sticky Rundown" infinite Piece for the same layer', () => {
				it('changes the "sticky" infinite Piece', () => {
					const layer: string = 'someLayer'

					const firstSegment: Segment = EntityDefaultFactory.createSegment({ rank: 1 } as SegmentInterface)
					const firstPiece: Piece = EntityDefaultFactory.createPiece({
						id: 'p1',
						layer,
						pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
					} as PieceInterface)
					const firstPart: Part = EntityDefaultFactory.createPart({
						rank: 1,
						segmentId: firstSegment.id,
						pieces: [firstPiece],
					} as PartInterface)
					firstSegment.setParts([firstPart])

					const lastSegment: Segment = EntityDefaultFactory.createSegment({ rank: 2 } as SegmentInterface)
					const lastPiece: Piece = EntityDefaultFactory.createPiece({
						id: 'p2',
						layer,
						pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
					} as PieceInterface)
					const lastPart: Part = EntityDefaultFactory.createPart({
						rank: 2,
						segmentId: lastSegment.id,
						pieces: [lastPiece],
					} as PartInterface)
					lastSegment.setParts([lastPart])

					const testee: Rundown = EntityDefaultFactory.createActiveRundown([firstSegment, lastSegment])

					testee.takeNext()

					const result: Piece[] = testee.getInfinitePieces()
					expect(result).toHaveLength(1)
					expect(result).toContain(lastPiece)
				})
			})

			describe('it takes a Segment with a "spanning Rundown" infinite Piece', () => {
				it('changes to the "spanning" infinite Piece', () => {
					const layer: string = 'someLayer'

					const firstSegment: Segment = EntityDefaultFactory.createSegment({ rank: 1 } as SegmentInterface)
					const firstPiece: Piece = EntityDefaultFactory.createPiece({
						id: 'p1',
						layer,
						pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
					} as PieceInterface)
					const firstPart: Part = EntityDefaultFactory.createPart({
						rank: 1,
						segmentId: firstSegment.id,
						pieces: [firstPiece],
					} as PartInterface)
					firstSegment.setParts([firstPart])

					const lastSegment: Segment = EntityDefaultFactory.createSegment({ rank: 2 } as SegmentInterface)
					const lastPiece: Piece = EntityDefaultFactory.createPiece({
						id: 'p2',
						layer,
						pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
					} as PieceInterface)
					const lastPart: Part = EntityDefaultFactory.createPart({
						rank: 2,
						segmentId: lastSegment.id,
						pieces: [lastPiece],
					} as PartInterface)
					lastSegment.setParts([lastPart])

					const testee: Rundown = EntityDefaultFactory.createActiveRundown([firstSegment, lastSegment])

					testee.takeNext()

					const result: Piece[] = testee.getInfinitePieces()
					expect(result).toHaveLength(1)
					expect(result).toContain(lastPiece)
				})
			})

			describe('it "skips" a Segment with a "spanning Rundown" infinite Piece"', () => {
				it('changes to the "spanning" infinite Piece', () => {
					const firstSegment: Segment = EntityDefaultFactory.createSegment({ rank: 1 } as SegmentInterface)
					const layer: string = 'someLayer'
					const firstPiece: Piece = EntityDefaultFactory.createPiece({
						id: 'p1',
						layer,
						pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
					} as PieceInterface)
					const firstPart: Part = EntityDefaultFactory.createPart({
						rank: 1,
						segmentId: firstSegment.id,
						pieces: [firstPiece],
					} as PartInterface)
					firstSegment.setParts([firstPart])

					const middleSegment: Segment = EntityDefaultFactory.createSegment({ rank: 2 } as SegmentInterface)
					const middlePiece: Piece = EntityDefaultFactory.createPiece({
						id: 'p2',
						layer,
						pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
					} as PieceInterface)
					const middlePart: Part = EntityDefaultFactory.createPart({
						rank: 2,
						segmentId: middleSegment.id,
						pieces: [middlePiece],
					} as PartInterface)
					middleSegment.setParts([middlePart])

					const lastSegment: Segment = EntityDefaultFactory.createSegment({ rank: 3 } as SegmentInterface)
					const lastPart: Part = EntityDefaultFactory.createPart({ rank: 3, segmentId: lastSegment.id } as PartInterface)
					lastSegment.setParts([lastPart])

					const testee: Rundown = EntityDefaultFactory.createActiveRundown([firstSegment, middleSegment, lastSegment])

					testee.setNext(lastSegment.id, lastPart.id)
					testee.takeNext()

					const result: Piece[] = testee.getInfinitePieces()
					expect(result).toHaveLength(1)
					expect(result).toContainEqual(middlePiece)
				})
			})
		})

		describe('Rundown has a "spanning Rundown" infinite Piece', () => {
			describe('it jumps "back" up the Rundown before the "spanning" infinite Piece', () => {
				describe('there is a previous "spanning" infinite Piece', () => {
					it('selects the previous "spanning" Piece', () => {
						const layer: string = 'someLayer'

						const firstSegment: Segment = EntityDefaultFactory.createSegment({ rank: 1 } as SegmentInterface)
						const firstPiece: Piece = EntityDefaultFactory.createPiece({
							id: 'p1',
							layer,
							pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
						} as PieceInterface)
						const firstPart: Part = EntityDefaultFactory.createPart({
							rank: 1,
							segmentId: firstSegment.id,
							pieces: [firstPiece],
						} as PartInterface)
						firstSegment.setParts([firstPart])

						const middleSegment: Segment = EntityDefaultFactory.createSegment({ rank: 2 } as SegmentInterface)
						const middlePart: Part = EntityDefaultFactory.createPart({ rank: 2, segmentId: middleSegment.id } as PartInterface)
						middleSegment.setParts([middlePart])

						const lastSegment: Segment = EntityDefaultFactory.createSegment({ rank: 3 } as SegmentInterface)
						const lastPiece: Piece = EntityDefaultFactory.createPiece({
							id: 'p2',
							layer,
							pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
						} as PieceInterface)
						const lastPart: Part = EntityDefaultFactory.createPart({
							rank: 3,
							segmentId: lastSegment.id,
							pieces: [lastPiece],
						} as PartInterface)
						lastSegment.setParts([lastPart])

						const testee: Rundown = EntityDefaultFactory.createActiveRundown([firstSegment, middleSegment, lastSegment])

						testee.setNext(lastSegment.id, lastPart.id)
						testee.takeNext()

						let result: Piece[] = testee.getInfinitePieces()
						expect(result).toHaveLength(1)
						expect(result).toContain(lastPiece)

						testee.setNext(middleSegment.id, middlePart.id)
						testee.takeNext()

						result = testee.getInfinitePieces()
						expect(result).toHaveLength(1)
						expect(result).toContainEqual(firstPiece)
					})
				})

				describe('there are no other "spanning" infinite Pieces', () => {
					it('has no longer any infinite Pieces', () => {
						const layer: string = 'someLayer'

						const firstSegment: Segment = EntityDefaultFactory.createSegment({ rank: 1 } as SegmentInterface)
						const firstPart: Part = EntityDefaultFactory.createPart({ rank: 1, segmentId: firstSegment.id } as PartInterface)
						firstSegment.setParts([firstPart])

						const middleSegment: Segment = EntityDefaultFactory.createSegment({ rank: 2 } as SegmentInterface)
						const middlePiece: Piece = EntityDefaultFactory.createPiece({
							id: 'p1',
							layer,
							pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
						} as PieceInterface)
						const middlePart: Part = EntityDefaultFactory.createPart({
							rank: 2,
							segmentId: middleSegment.id,
							pieces: [middlePiece],
						} as PartInterface)
						middleSegment.setParts([middlePart])

						const lastSegment: Segment = EntityDefaultFactory.createSegment({ rank: 3 } as SegmentInterface)
						const lastPiece: Piece = EntityDefaultFactory.createPiece({
							id: 'p2',
							layer,
							pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
						} as PieceInterface)
						const lastPart: Part = EntityDefaultFactory.createPart({
							rank: 3,
							segmentId: lastSegment.id,
							pieces: [lastPiece],
						} as PartInterface)
						lastSegment.setParts([lastPart])

						const testee: Rundown = EntityDefaultFactory.createActiveRundown([firstSegment, middleSegment, lastSegment])

						testee.setNext(lastSegment.id, lastPart.id)
						testee.takeNext()

						let result: Piece[] = testee.getInfinitePieces()
						expect(result).toHaveLength(1)
						expect(result).toContain(lastPiece)

						testee.setNext(firstSegment.id, firstPart.id)
						testee.takeNext()

						result = testee.getInfinitePieces()
						expect(result).toHaveLength(0)
					})
				})
			})
		})

		describe('Rundown has an infinite "Rundown" Piece', () => {
			describe('it takes a Segment with a non-infinite Piece for same layer', () => {
				it('no longer has any infinite Pieces', () => {
					const layer: string = 'someLayer'

					const segmentOne: Segment = EntityDefaultFactory.createSegment({ rank: 1 } as SegmentInterface)
					const pieceOne: Piece = EntityDefaultFactory.createPiece({
						id: 'p1',
						layer,
						pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
					} as PieceInterface)
					const partOne: Part = EntityDefaultFactory.createPart({ rank: 1, segmentId: segmentOne.id, pieces: [pieceOne] } as PartInterface)
					segmentOne.setParts([partOne])

					const segmentTwo: Segment = EntityDefaultFactory.createSegment({ rank: 2 } as SegmentInterface)
					const nonInfinitePiece: Piece = EntityDefaultFactory.createPiece({
						id: 'p2',
						layer,
						pieceLifespan: PieceLifespan.WITHIN_PART,
					} as PieceInterface)
					const partTwo: Part = EntityDefaultFactory.createPart({
						rank: 2,
						segmentId: segmentTwo.id,
						pieces: [nonInfinitePiece],
					} as PartInterface)
					segmentTwo.setParts([partTwo])

					const testee: Rundown = EntityDefaultFactory.createActiveRundown([segmentOne, segmentTwo])

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
					const segment: Segment = EntityDefaultFactory.createSegment({} as SegmentInterface)

					const firstPiece: Piece = EntityDefaultFactory.createPiece({
						id: 'p1',
						layer,
						pieceLifespan: PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE,
					} as PieceInterface)
					const firstPart: Part = EntityDefaultFactory.createPart({
						rank: 1,
						segmentId: segment.id,
						pieces: [firstPiece],
					} as PartInterface)

					const secondPiece: Piece = EntityDefaultFactory.createPiece({
						id: 'p2',
						layer,
						pieceLifespan: PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE,
					} as PieceInterface)
					const secondPart: Part = EntityDefaultFactory.createPart({
						rank: 2,
						segmentId: segment.id,
						pieces: [secondPiece],
					} as PartInterface)

					segment.setParts([firstPart, secondPart])

					const testee: Rundown = EntityDefaultFactory.createActiveRundown([segment])

					testee.takeNext()

					const result: Piece[] = testee.getInfinitePieces()
					expect(result).toHaveLength(1)
					expect(result).toContain(secondPiece)
				})
			})

			describe('it "skips" a Part within the Segment that has a "sticky segment" infinite Piece', () => {
				it('does not change infinite Piece', () => {
					const layer: string = 'someLayer'
					const segment: Segment = EntityDefaultFactory.createSegment({} as SegmentInterface)

					const firstPartId: string = 'firstPart'
					const firstPiece: Piece = EntityDefaultFactory.createPiece({
						id: 'p1',
						partId: firstPartId,
						layer,
						pieceLifespan: PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE,
					} as PieceInterface)
					const firstPart: Part = EntityDefaultFactory.createPart({
						id: firstPartId,
						rank: 1,
						segmentId: segment.id,
						pieces: [firstPiece],
					} as PartInterface)

					const middlePartId: string = 'middlePart'
					const middlePiece: Piece = EntityDefaultFactory.createPiece({
						id: 'p2',
						partId: middlePartId,
						layer,
						pieceLifespan: PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE,
					} as PieceInterface)
					const middlePart: Part = EntityDefaultFactory.createPart({
						id: middlePartId,
						rank: 2,
						segmentId: segment.id,
						pieces: [middlePiece],
					} as PartInterface)

					const lastPart: Part = EntityDefaultFactory.createPart({ rank: 3, segmentId: segment.id } as PartInterface)

					segment.setParts([firstPart, middlePart, lastPart])

					const testee: Rundown = EntityDefaultFactory.createActiveRundown([segment])

					testee.setNext(segment.id, lastPart.id)
					testee.takeNext()

					const result: Piece[] = testee.getInfinitePieces()
					expect(result).toHaveLength(1)
					expect(result).toContain(firstPiece)
				})
			})

			describe('it jumps "back" up the Segment before another "sticky segment" infinite Piece', () => {
				it('does not change infinite Piece', () => {
					const layer: string = 'someLayer'
					const segment: Segment = EntityDefaultFactory.createSegment({} as SegmentInterface)

					const firstPart: Part = EntityDefaultFactory.createPart({ rank: 1, segmentId: segment.id } as PartInterface)

					const middlePartId: string = 'middlePart'
					const middlePiece: Piece = EntityDefaultFactory.createPiece({
						id: 'p2',
						partId: middlePartId,
						layer,
						pieceLifespan: PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE,
					} as PieceInterface)
					const middlePart: Part = EntityDefaultFactory.createPart({
						id: middlePartId,
						rank: 2,
						segmentId: segment.id,
						pieces: [middlePiece],
					} as PartInterface)

					const lastPartId: string = 'lastPart'
					const lastPiece: Piece = EntityDefaultFactory.createPiece({
						id: 'p3',
						partId: lastPartId,
						layer,
						pieceLifespan: PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE,
					} as PieceInterface)
					const lastPart: Part = EntityDefaultFactory.createPart({
						id: lastPartId,
						rank: 3,
						segmentId: segment.id,
						pieces: [lastPiece],
					} as PartInterface)

					segment.setParts([firstPart, middlePart, lastPart])

					const testee: Rundown = EntityDefaultFactory.createActiveRundown([segment])
					testee.setNext(segment.id, lastPart.id)
					testee.takeNext()

					const piecesBefore: Piece[] = testee.getInfinitePieces()
					expect(piecesBefore).toHaveLength(1)
					expect(piecesBefore).toContain(lastPiece)

					testee.setNext(segment.id, firstPart.id)
					testee.takeNext()

					const result: Piece[] = testee.getInfinitePieces()
					expect(result).toHaveLength(1)
					expect(result).toContain(lastPiece)
				})
			})

			describe('it takes a Part within the Segment with a "spanning segment" infinite Piece', () => {
				it('changes the infinite Piece', () => {
					const layer: string = 'someLayer'
					const segment: Segment = EntityDefaultFactory.createSegment({} as SegmentInterface)

					const firstPartId: string = 'firstPartId'
					const firstPiece: Piece = EntityDefaultFactory.createPiece({
						id: 'p1',
						partId: firstPartId,
						layer,
						pieceLifespan: PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE,
					} as PieceInterface)
					const firstPart: Part = EntityDefaultFactory.createPart({
						id: firstPartId,
						rank: 1,
						segmentId: segment.id,
						pieces: [firstPiece],
					} as PartInterface)

					const lastPartId: string = 'lastPart'
					const lastPiece: Piece = EntityDefaultFactory.createPiece({
						id: 'p2',
						partId: lastPartId,
						layer,
						pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
					} as PieceInterface)
					const lastPart: Part = EntityDefaultFactory.createPart({
						id: lastPartId,
						rank: 2,
						segmentId: segment.id,
						pieces: [lastPiece],
					} as PartInterface)

					segment.setParts([firstPart, lastPart])

					const testee: Rundown = EntityDefaultFactory.createActiveRundown([segment])
					testee.takeNext()

					const result: Piece[] = testee.getInfinitePieces()
					expect(result).toHaveLength(1)
					expect(result).toContain(lastPiece)
				})
			})

			describe('it changes Segment', () => {
				it('no longer have any infinite Pieces', () => {
					const segmentOne: Segment = EntityDefaultFactory.createSegment({ rank: 1 } as SegmentInterface)
					const partId: string = 'somePartId'
					const piece: Piece = EntityDefaultFactory.createPiece({
						id: 'p1',
						partId,
						pieceLifespan: PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE,
					} as PieceInterface)
					const partOne: Part = EntityDefaultFactory.createPart({ id: partId, segmentId: segmentOne.id, pieces: [piece] } as PartInterface)
					segmentOne.setParts([partOne])

					const segmentTwo: Segment = EntityDefaultFactory.createSegment({ rank: 2 } as SegmentInterface)
					const partTwo: Part = EntityDefaultFactory.createPart({ segmentId: segmentTwo.id } as PartInterface)
					segmentTwo.setParts([partTwo])

					const testee: Rundown = EntityDefaultFactory.createActiveRundown([segmentOne, segmentTwo])

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
					const segment: Segment = EntityDefaultFactory.createSegment({} as SegmentInterface)

					const firstPartId: string = 'firstPartId'
					const firstPiece: Piece = EntityDefaultFactory.createPiece({
						id: 'p1',
						partId: firstPartId,
						layer,
						pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
					} as PieceInterface)
					const firstPart: Part = EntityDefaultFactory.createPart({
						id: firstPartId,
						rank: 1,
						segmentId: segment.id,
						pieces: [firstPiece],
					} as PartInterface)

					const middlePartId: string = 'middlePart'
					const middlePiece: Piece = EntityDefaultFactory.createPiece({
						id: 'p2',
						partId: middlePartId,
						layer,
						pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
					} as PieceInterface)
					const middlePart: Part = EntityDefaultFactory.createPart({
						id: middlePartId,
						rank: 2,
						segmentId: segment.id,
						pieces: [middlePiece],
					} as PartInterface)

					const lastPart: Part = EntityDefaultFactory.createPart({ rank: 3, segmentId: segment.id } as PartInterface)

					segment.setParts([firstPart, middlePart, lastPart])

					const testee: Rundown = EntityDefaultFactory.createActiveRundown([segment])
					testee.setNext(segment.id, lastPart.id)
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
						const segment: Segment = EntityDefaultFactory.createSegment({} as SegmentInterface)

						const firstPartId: string = 'firstPartId'
						const firstPiece: Piece = EntityDefaultFactory.createPiece({
							id: 'p1',
							partId: firstPartId,
							layer,
							pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
						} as PieceInterface)
						const firstPart: Part = EntityDefaultFactory.createPart({
							id: firstPartId,
							rank: 1,
							segmentId: segment.id,
							pieces: [firstPiece],
						} as PartInterface)

						const middlePart: Part = EntityDefaultFactory.createPart({ rank: 2, segmentId: segment.id } as PartInterface)

						const lastPartId: string = 'lastPart'
						const lastPiece: Piece = EntityDefaultFactory.createPiece({
							id: 'p3',
							partId: lastPartId,
							layer,
							pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
						} as PieceInterface)
						const lastPart: Part = EntityDefaultFactory.createPart({
							id: lastPartId,
							rank: 3,
							segmentId: segment.id,
							pieces: [lastPiece],
						} as PartInterface)

						segment.setParts([firstPart, middlePart, lastPart])

						const testee: Rundown = EntityDefaultFactory.createActiveRundown([segment])
						testee.setNext(segment.id, lastPart.id)
						testee.takeNext()

						const piecesBefore: Piece[] = testee.getInfinitePieces()
						expect(piecesBefore).toHaveLength(1)
						expect(piecesBefore).toContain(lastPiece)

						testee.setNext(segment.id, middlePart.id)
						testee.takeNext()

						const result: Piece[] = testee.getInfinitePieces()
						expect(result).toHaveLength(1)
						expect(result).toContainEqual(firstPiece)
					})
				})

				describe('there are no previous "spanning" infinite Pieces', () => {
					it('no longer have any infinite Pieces', () => {
						const layer: string = 'someLayer'
						const segment: Segment = EntityDefaultFactory.createSegment({} as SegmentInterface)

						const firstPart: Part = EntityDefaultFactory.createPart({ rank: 1, segmentId: segment.id } as PartInterface)

						const middlePart: Part = EntityDefaultFactory.createPart({ rank: 2, segmentId: segment.id } as PartInterface)

						const lastPartId: string = 'lastPart'
						const lastPiece: Piece = EntityDefaultFactory.createPiece({
							id: 'p3',
							partId: lastPartId,
							layer,
							pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
						} as PieceInterface)
						const lastPart: Part = EntityDefaultFactory.createPart({
							id: lastPartId,
							rank: 3,
							segmentId: segment.id,
							pieces: [lastPiece],
						} as PartInterface)

						segment.setParts([firstPart, middlePart, lastPart])

						const testee: Rundown = EntityDefaultFactory.createActiveRundown([segment])
						testee.setNext(segment.id, lastPart.id)
						testee.takeNext()

						const piecesBefore: Piece[] = testee.getInfinitePieces()
						expect(piecesBefore).toHaveLength(1)
						expect(piecesBefore).toContain(lastPiece)

						testee.setNext(segment.id, middlePart.id)
						testee.takeNext()

						const result: Piece[] = testee.getInfinitePieces()
						expect(result).toHaveLength(0)
					})
				})
			})

			describe('it changes Segment', () => {
				it('no longer have any infinite Pieces', () => {
					const segmentOne: Segment = EntityDefaultFactory.createSegment({ rank: 1 } as SegmentInterface)
					const piece: Piece = EntityDefaultFactory.createPiece({
						id: 'p1',
						pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
					} as PieceInterface)
					const partOne: Part = EntityDefaultFactory.createPart({ segmentId: segmentOne.id, pieces: [piece] } as PartInterface)
					segmentOne.setParts([partOne])

					const segmentTwo: Segment = EntityDefaultFactory.createSegment({ rank: 2 } as SegmentInterface)
					const partTwo: Part = EntityDefaultFactory.createPart({} as PartInterface)
					segmentTwo.setParts([partTwo])

					const testee: Rundown = EntityDefaultFactory.createActiveRundown([segmentOne, segmentTwo])

					testee.takeNext()

					const result: Piece[] = testee.getInfinitePieces()
					expect(result).toHaveLength(0)
				})
			})
		})
	})
})
