import { Segment, SegmentInterface } from '../segment'
import { Rundown } from '../rundown'
import { Part, PartInterface } from '../part'
import { Piece, PieceInterface } from '../piece'
import { PieceType } from '../../enums/piece-type'
import { PieceLifespan } from '../../enums/piece-lifespan'

describe('Rundown', () => {
	describe('takeNext', () => {
		it('sets the nextPart as the activePart', () => {
			const segment: Segment = createSegment({} as SegmentInterface)
			const partOne: Part = createPart({ rank: 1, segmentId: segment.id } as PartInterface)
			const partTwo: Part = createPart({ rank: 2, segmentId: segment.id } as PartInterface)
			segment.setParts([partOne, partTwo])

			const testee: Rundown = createTestee([segment])

			const activeBefore: Part = testee.getActivePart()

			testee.takeNext()

			const activeAfter: Part = testee.getActivePart()

			expect(activeBefore.id).not.toBe(activeAfter.id)
		})

		it('has no infinite pieces for active Part, dont add any infinite pieces', () => {
			const segment: Segment = createSegment({} as SegmentInterface)
			const partWithoutPieces: Part = createPart({ rank: 1, segmentId: segment.id } as PartInterface)
			segment.setParts([partWithoutPieces])

			const testee: Rundown = createTestee([segment])

			testee.takeNext()

			const result: Piece[] = testee.getInfinitePieces()
			expect(result).toHaveLength(0)
		})

		it('has infinite pieces for active Part, infinite pieces are added', () => {
			const segment: Segment = createSegment({} as SegmentInterface)
			const pieceOne: Piece = createPiece({
				id: 'p1',
				layer: 'someLayer',
				pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
			} as PieceInterface)
			const pieceTwo: Piece = createPiece({
				id: 'p2',
				layer: 'someOtherLayer',
				pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
			} as PieceInterface)
			const part: Part = createPart({
				rank: 1,
				segmentId: segment.id,
				pieces: [pieceOne, pieceTwo],
			} as PartInterface)
			segment.setParts([part])

			const testee: Rundown = createTestee([segment])

			testee.takeNext()

			const result: Piece[] = testee.getInfinitePieces()
			expect(result).toHaveLength(2)
			expect(result).toContain(pieceOne)
			expect(result).toContain(pieceTwo)
		})

		it('has two Parts with infinite Pieces on different layers, Pieces from both Parts are added', () => {
			const segment: Segment = createSegment({} as SegmentInterface)
			const pieceOne: Piece = createPiece({
				id: 'p1',
				layer: 'someLayer',
				pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
			} as PieceInterface)
			const pieceTwo: Piece = createPiece({
				id: 'p2',
				layer: 'someOtherLayer',
				pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
			} as PieceInterface)
			const partOne: Part = createPart({ rank: 1, segmentId: segment.id, pieces: [pieceOne] } as PartInterface)
			const partTwo: Part = createPart({ rank: 2, segmentId: segment.id, pieces: [pieceTwo] } as PartInterface)
			segment.setParts([partOne, partTwo])

			const testee: Rundown = createTestee([segment])

			testee.takeNext()

			const result: Piece[] = testee.getInfinitePieces()
			expect(result).toHaveLength(2)
			expect(result).toContain(pieceOne)
			expect(result).toContain(pieceTwo)
		})

		it('has two Parts with infinite Pieces on same layer, only last Piece is added', () => {
			const layer: string = 'someLayer'
			const segment: Segment = createSegment({} as SegmentInterface)

			const pieceOne: Piece = createPiece({
				id: 'p1',
				layer,
				pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
			} as PieceInterface)
			const partOne: Part = createPart({ rank: 1, segmentId: segment.id, pieces: [pieceOne] } as PartInterface)

			const pieceTwo: Piece = createPiece({
				id: 'p2',
				layer,
				pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
			} as PieceInterface)
			const partTwo: Part = createPart({ rank: 2, segmentId: segment.id, pieces: [pieceTwo] } as PartInterface)

			segment.setParts([partOne, partTwo])

			const testee: Rundown = createTestee([segment])

			testee.takeNext()

			const result: Piece[] = testee.getInfinitePieces()
			expect(result).toHaveLength(1)
			expect(result).toContain(pieceTwo)
		})

		it('has two Segments with infinite Pieces on different layers, Pieces from both Segments are added', () => {
			const segmentOne: Segment = createSegment({ rank: 1 } as SegmentInterface)
			const pieceOne: Piece = createPiece({
				id: 'p1',
				layer: 'someLayer',
				pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
			} as PieceInterface)
			const partOne: Part = createPart({ rank: 1, segmentId: segmentOne.id, pieces: [pieceOne] } as PartInterface)
			segmentOne.setParts([partOne])

			const segmentTwo: Segment = createSegment({ rank: 2 } as SegmentInterface)
			const pieceTwo: Piece = createPiece({
				id: 'p2',
				layer: 'someOtherLayer',
				pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
			} as PieceInterface)
			const partTwo: Part = createPart({ rank: 2, segmentId: segmentTwo.id, pieces: [pieceTwo] } as PartInterface)
			segmentTwo.setParts([partTwo])

			const testee: Rundown = createTestee([segmentOne, segmentTwo])

			testee.takeNext()

			const result: Piece[] = testee.getInfinitePieces()
			expect(result).toHaveLength(2)
			expect(result).toContain(pieceOne)
			expect(result).toContain(pieceTwo)
		})

		it('has two Segments with infinite Pieces on same layer, only las Piece is added', () => {
			const layer: string = 'someLayer'

			const segmentOne: Segment = createSegment({ rank: 1 } as SegmentInterface)
			const pieceOne: Piece = createPiece({
				id: 'p1',
				layer,
				pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
			} as PieceInterface)
			const partOne: Part = createPart({ rank: 1, segmentId: segmentOne.id, pieces: [pieceOne] } as PartInterface)
			segmentOne.setParts([partOne])

			const segmentTwo: Segment = createSegment({ rank: 2 } as SegmentInterface)
			const pieceTwo: Piece = createPiece({
				id: 'p2',
				layer,
				pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
			} as PieceInterface)
			const partTwo: Part = createPart({ rank: 2, segmentId: segmentTwo.id, pieces: [pieceTwo] } as PartInterface)
			segmentTwo.setParts([partTwo])

			const testee: Rundown = createTestee([segmentOne, segmentTwo])

			testee.takeNext()

			const result: Piece[] = testee.getInfinitePieces()
			expect(result).toHaveLength(1)
			expect(result).toContain(pieceTwo)
		})

		it('has a sticky Rundown Piece, "skips" a Segment with sticky Rundown Piece, doesnt change sticky Piece', () => {
			const firstSegment: Segment = createSegment({ rank: 1 } as SegmentInterface)
			const layer: string = 'someLayer'
			const firstPiece: Piece = createPiece({
				id: 'p1',
				layer,
				pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
			} as PieceInterface)
			const firstPart: Part = createPart({
				rank: 1,
				segmentId: firstSegment.id,
				pieces: [firstPiece],
			} as PartInterface)
			firstSegment.setParts([firstPart])

			const middleSegment: Segment = createSegment({ rank: 2 } as SegmentInterface)
			const middlePiece: Piece = createPiece({
				id: 'p2',
				layer,
				pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
			} as PieceInterface)
			const middlePart: Part = createPart({
				rank: 2,
				segmentId: middleSegment.id,
				pieces: [middlePiece],
			} as PartInterface)
			middleSegment.setParts([middlePart])

			const lastSegment: Segment = createSegment({ rank: 3 } as SegmentInterface)
			const lastPart: Part = createPart({ rank: 3, segmentId: lastSegment.id } as PartInterface)
			lastSegment.setParts([lastPart])

			const testee: Rundown = createTestee([firstSegment, middleSegment, lastSegment])

			testee.setNext(lastSegment.id, lastPart.id)
			testee.takeNext()

			const result: Piece[] = testee.getInfinitePieces()
			expect(result).toHaveLength(1)
			expect(result).toContain(firstPiece)
		})

		it('has a sticky Rundown Piece, jumps "back" up the Rundown and "skip" a Segment with a sticky Rundown Piece, doesnt change sticky Piece', () => {
			const firstSegment: Segment = createSegment({ rank: 1 } as SegmentInterface)
			const layer: string = 'someLayer'

			const firstPart: Part = createPart({ rank: 1, segmentId: firstSegment.id } as PartInterface)
			firstSegment.setParts([firstPart])

			const middleSegment: Segment = createSegment({ rank: 2 } as SegmentInterface)
			const middlePiece: Piece = createPiece({
				id: 'p1',
				layer,
				pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
			} as PieceInterface)
			const middlePart: Part = createPart({
				rank: 2,
				segmentId: middleSegment.id,
				pieces: [middlePiece],
			} as PartInterface)
			middleSegment.setParts([middlePart])

			const lastSegment: Segment = createSegment({ rank: 3 } as SegmentInterface)
			const lastPiece: Piece = createPiece({
				id: 'p2',
				layer,
				pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
			} as PieceInterface)
			const lastPart: Part = createPart({
				rank: 3,
				segmentId: lastSegment.id,
				pieces: [lastPiece],
			} as PartInterface)
			lastSegment.setParts([lastPart])

			const testee: Rundown = createTestee([firstSegment, middleSegment, lastSegment])

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

		it('has a sticky Rundown Piece, it takes a Segment with a sticky Rundown Piece for same layer, change sticky Piece', () => {
			const layer: string = 'someLayer'

			const firstSegment: Segment = createSegment({ rank: 1 } as SegmentInterface)
			const firstPiece: Piece = createPiece({
				id: 'p1',
				layer,
				pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
			} as PieceInterface)
			const firstPart: Part = createPart({
				rank: 1,
				segmentId: firstSegment.id,
				pieces: [firstPiece],
			} as PartInterface)
			firstSegment.setParts([firstPart])

			const lastSegment: Segment = createSegment({ rank: 2 } as SegmentInterface)
			const lastPiece: Piece = createPiece({
				id: 'p2',
				layer,
				pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
			} as PieceInterface)
			const lastPart: Part = createPart({
				rank: 2,
				segmentId: lastSegment.id,
				pieces: [lastPiece],
			} as PartInterface)
			lastSegment.setParts([lastPart])

			const testee: Rundown = createTestee([firstSegment, lastSegment])

			testee.takeNext()

			const result: Piece[] = testee.getInfinitePieces()
			expect(result).toHaveLength(1)
			expect(result).toContain(lastPiece)
		})

		it('has a sticky Rundown Piece, takes a Segment with a spanning Piece, change to spanning Rundown Piece', () => {
			const layer: string = 'someLayer'

			const firstSegment: Segment = createSegment({ rank: 1 } as SegmentInterface)
			const firstPiece: Piece = createPiece({
				id: 'p1',
				layer,
				pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
			} as PieceInterface)
			const firstPart: Part = createPart({
				rank: 1,
				segmentId: firstSegment.id,
				pieces: [firstPiece],
			} as PartInterface)
			firstSegment.setParts([firstPart])

			const lastSegment: Segment = createSegment({ rank: 2 } as SegmentInterface)
			const lastPiece: Piece = createPiece({
				id: 'p2',
				layer,
				pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
			} as PieceInterface)
			const lastPart: Part = createPart({
				rank: 2,
				segmentId: lastSegment.id,
				pieces: [lastPiece],
			} as PartInterface)
			lastSegment.setParts([lastPart])

			const testee: Rundown = createTestee([firstSegment, lastSegment])

			testee.takeNext()

			const result: Piece[] = testee.getInfinitePieces()
			expect(result).toHaveLength(1)
			expect(result).toContain(lastPiece)
		})

		it('has infinite Rundown Piece, "skips" a Segment with spanning Rundown Piece, change to new spanning Piece', () => {
			const firstSegment: Segment = createSegment({ rank: 1 } as SegmentInterface)
			const layer: string = 'someLayer'
			const firstPiece: Piece = createPiece({
				id: 'p1',
				layer,
				pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
			} as PieceInterface)
			const firstPart: Part = createPart({
				rank: 1,
				segmentId: firstSegment.id,
				pieces: [firstPiece],
			} as PartInterface)
			firstSegment.setParts([firstPart])

			const middleSegment: Segment = createSegment({ rank: 2 } as SegmentInterface)
			const middlePiece: Piece = createPiece({
				id: 'p2',
				layer,
				pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
			} as PieceInterface)
			const middlePart: Part = createPart({
				rank: 2,
				segmentId: middleSegment.id,
				pieces: [middlePiece],
			} as PartInterface)
			middleSegment.setParts([middlePart])

			const lastSegment: Segment = createSegment({ rank: 3 } as SegmentInterface)
			const lastPart: Part = createPart({ rank: 3, segmentId: lastSegment.id } as PartInterface)
			lastSegment.setParts([lastPart])

			const testee: Rundown = createTestee([firstSegment, middleSegment, lastSegment])

			testee.setNext(lastSegment.id, lastPart.id)
			testee.takeNext()

			const result: Piece[] = testee.getInfinitePieces()
			expect(result).toHaveLength(1)
			expect(result).toContain(middlePiece)
		})

		it('has a spanning Rundown Piece, jumps "back" up the Rundown before the Segment with spanning Rundown Piece, selects the previous spanning Piece', () => {
			const layer: string = 'someLayer'

			const firstSegment: Segment = createSegment({ rank: 1 } as SegmentInterface)
			const firstPiece: Piece = createPiece({
				id: 'p1',
				layer,
				pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
			} as PieceInterface)
			const firstPart: Part = createPart({
				rank: 1,
				segmentId: firstSegment.id,
				pieces: [firstPiece],
			} as PartInterface)
			firstSegment.setParts([firstPart])

			const middleSegment: Segment = createSegment({ rank: 2 } as SegmentInterface)
			const middlePart: Part = createPart({ rank: 2, segmentId: middleSegment.id } as PartInterface)
			middleSegment.setParts([middlePart])

			const lastSegment: Segment = createSegment({ rank: 3 } as SegmentInterface)
			const lastPiece: Piece = createPiece({
				id: 'p2',
				layer,
				pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
			} as PieceInterface)
			const lastPart: Part = createPart({
				rank: 3,
				segmentId: lastSegment.id,
				pieces: [lastPiece],
			} as PartInterface)
			lastSegment.setParts([lastPart])

			const testee: Rundown = createTestee([firstSegment, middleSegment, lastSegment])

			testee.setNext(lastSegment.id, lastPart.id)
			testee.takeNext()

			let result: Piece[] = testee.getInfinitePieces()
			expect(result).toHaveLength(1)
			expect(result).toContain(lastPiece)

			testee.setNext(middleSegment.id, middlePart.id)
			testee.takeNext()

			result = testee.getInfinitePieces()
			expect(result).toHaveLength(1)
			expect(result).toContain(firstPiece)
		})

		it('has a spanning Rundown Piece, jumps "back" up the Rundown before the Segment with the spanning Piece, no other spanning Piece, has no infinite Pieces', () => {
			const layer: string = 'someLayer'

			const firstSegment: Segment = createSegment({ rank: 1 } as SegmentInterface)
			const firstPart: Part = createPart({ rank: 1, segmentId: firstSegment.id } as PartInterface)
			firstSegment.setParts([firstPart])

			const middleSegment: Segment = createSegment({ rank: 2 } as SegmentInterface)
			const middlePiece: Piece = createPiece({
				id: 'p1',
				layer,
				pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
			} as PieceInterface)
			const middlePart: Part = createPart({
				rank: 2,
				segmentId: middleSegment.id,
				pieces: [middlePiece],
			} as PartInterface)
			middleSegment.setParts([middlePart])

			const lastSegment: Segment = createSegment({ rank: 3 } as SegmentInterface)
			const lastPiece: Piece = createPiece({
				id: 'p2',
				layer,
				pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
			} as PieceInterface)
			const lastPart: Part = createPart({
				rank: 3,
				segmentId: lastSegment.id,
				pieces: [lastPiece],
			} as PartInterface)
			lastSegment.setParts([lastPart])

			const testee: Rundown = createTestee([firstSegment, middleSegment, lastSegment])

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

		it('has an infinite Rundown Piece, takes Segment with non-infinite Piece for same layer, has no infinite Pieces', () => {
			const layer: string = 'someLayer'

			const segmentOne: Segment = createSegment({ rank: 1 } as SegmentInterface)
			const pieceOne: Piece = createPiece({
				id: 'p1',
				layer,
				pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
			} as PieceInterface)
			const partOne: Part = createPart({ rank: 1, segmentId: segmentOne.id, pieces: [pieceOne] } as PartInterface)
			segmentOne.setParts([partOne])

			const segmentTwo: Segment = createSegment({ rank: 2 } as SegmentInterface)
			const nonInfinitePiece: Piece = createPiece({
				id: 'p2',
				layer,
				pieceLifespan: PieceLifespan.WITHIN_PART,
			} as PieceInterface)
			const partTwo: Part = createPart({
				rank: 2,
				segmentId: segmentTwo.id,
				pieces: [nonInfinitePiece],
			} as PartInterface)
			segmentTwo.setParts([partTwo])

			const testee: Rundown = createTestee([segmentOne, segmentTwo])

			testee.takeNext()

			const result: Piece[] = testee.getInfinitePieces()
			expect(result).toHaveLength(0)
		})

		it('has a sticky Segment Piece, takes another sticky Segment Piece within Segment, change sticky Piece', () => {
			const layer: string = 'someLayer'
			const segment: Segment = createSegment({} as SegmentInterface)

			const firstPiece: Piece = createPiece({
				id: 'p1',
				layer,
				pieceLifespan: PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE,
			} as PieceInterface)
			const firstPart: Part = createPart({
				rank: 1,
				segmentId: segment.id,
				pieces: [firstPiece],
			} as PartInterface)

			const secondPiece: Piece = createPiece({
				id: 'p2',
				layer,
				pieceLifespan: PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE,
			} as PieceInterface)
			const secondPart: Part = createPart({
				rank: 2,
				segmentId: segment.id,
				pieces: [secondPiece],
			} as PartInterface)

			segment.setParts([firstPart, secondPart])

			const testee: Rundown = createTestee([segment])

			testee.takeNext()

			const result: Piece[] = testee.getInfinitePieces()
			expect(result).toHaveLength(1)
			expect(result).toContain(secondPiece)
		})

		it('has a sticky Segment Piece, "skips" a Part within Segment that has a sticky Segment Piece, dont change sticky Piece', () => {
			const layer: string = 'someLayer'
			const segment: Segment = createSegment({} as SegmentInterface)

			const firstPartId: string = 'firstPart'
			const firstPiece: Piece = createPiece({
				id: 'p1',
				partId: firstPartId,
				layer,
				pieceLifespan: PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE,
			} as PieceInterface)
			const firstPart: Part = createPart({
				id: firstPartId,
				rank: 1,
				segmentId: segment.id,
				pieces: [firstPiece],
			} as PartInterface)

			const middlePartId: string = 'middlePart'
			const middlePiece: Piece = createPiece({
				id: 'p2',
				partId: middlePartId,
				layer,
				pieceLifespan: PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE,
			} as PieceInterface)
			const middlePart: Part = createPart({
				id: middlePartId,
				rank: 2,
				segmentId: segment.id,
				pieces: [middlePiece],
			} as PartInterface)

			const lastPart: Part = createPart({ rank: 3, segmentId: segment.id } as PartInterface)

			segment.setParts([firstPart, middlePart, lastPart])

			const testee: Rundown = createTestee([segment])

			testee.setNext(segment.id, lastPart.id)
			testee.takeNext()

			const result: Piece[] = testee.getInfinitePieces()
			expect(result).toHaveLength(1)
			expect(result).toContain(firstPiece)
		})

		it('has a sticky Segment Piece, jumps "back" up the Segment before another sticky Segment Piece, dont change sticky Piece', () => {
			const layer: string = 'someLayer'
			const segment: Segment = createSegment({} as SegmentInterface)

			const firstPart: Part = createPart({ rank: 1, segmentId: segment.id } as PartInterface)

			const middlePartId: string = 'middlePart'
			const middlePiece: Piece = createPiece({
				id: 'p2',
				partId: middlePartId,
				layer,
				pieceLifespan: PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE,
			} as PieceInterface)
			const middlePart: Part = createPart({
				id: middlePartId,
				rank: 2,
				segmentId: segment.id,
				pieces: [middlePiece],
			} as PartInterface)

			const lastPartId: string = 'lastPart'
			const lastPiece: Piece = createPiece({
				id: 'p3',
				partId: lastPartId,
				layer,
				pieceLifespan: PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE,
			} as PieceInterface)
			const lastPart: Part = createPart({
				id: lastPartId,
				rank: 3,
				segmentId: segment.id,
				pieces: [lastPiece],
			} as PartInterface)

			segment.setParts([firstPart, middlePart, lastPart])

			const testee: Rundown = createTestee([segment])
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

		it('has a sticky Segment Piece, takes a Part within Segment with spanning Segment Piece, change infinite Piece', () => {
			const layer: string = 'someLayer'
			const segment: Segment = createSegment({} as SegmentInterface)

			const firstPartId: string = 'firstPartId'
			const firstPiece: Piece = createPiece({
				id: 'p1',
				partId: firstPartId,
				layer,
				pieceLifespan: PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE,
			} as PieceInterface)
			const firstPart: Part = createPart({
				id: firstPartId,
				rank: 1,
				segmentId: segment.id,
				pieces: [firstPiece],
			} as PartInterface)

			const lastPartId: string = 'lastPart'
			const lastPiece: Piece = createPiece({
				id: 'p2',
				partId: lastPartId,
				layer,
				pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
			} as PieceInterface)
			const lastPart: Part = createPart({
				id: lastPartId,
				rank: 2,
				segmentId: segment.id,
				pieces: [lastPiece],
			} as PartInterface)

			segment.setParts([firstPart, lastPart])

			const testee: Rundown = createTestee([segment])
			testee.takeNext()

			const result: Piece[] = testee.getInfinitePieces()
			expect(result).toHaveLength(1)
			expect(result).toContain(lastPiece)
		})

		it('has a spanning Segment Piece, "skips" a Part within Segment that has a spanning Segment Piece, change spanning Piece', () => {
			const layer: string = 'someLayer'
			const segment: Segment = createSegment({} as SegmentInterface)

			const firstPartId: string = 'firstPartId'
			const firstPiece: Piece = createPiece({
				id: 'p1',
				partId: firstPartId,
				layer,
				pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
			} as PieceInterface)
			const firstPart: Part = createPart({
				id: firstPartId,
				rank: 1,
				segmentId: segment.id,
				pieces: [firstPiece],
			} as PartInterface)

			const middlePartId: string = 'middlePart'
			const middlePiece: Piece = createPiece({
				id: 'p2',
				partId: middlePartId,
				layer,
				pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
			} as PieceInterface)
			const middlePart: Part = createPart({
				id: middlePartId,
				rank: 2,
				segmentId: segment.id,
				pieces: [middlePiece],
			} as PartInterface)

			const lastPart: Part = createPart({ rank: 3, segmentId: segment.id } as PartInterface)

			segment.setParts([firstPart, middlePart, lastPart])

			const testee: Rundown = createTestee([segment])
			testee.setNext(segment.id, lastPart.id)
			testee.takeNext()

			const result: Piece[] = testee.getInfinitePieces()
			expect(result).toHaveLength(1)
			expect(result).toContain(middlePiece)
		})

		it('has a spanning Segment Piece, jumps "back" up the Segment before the Part with the spanning Segment Piece, change to previous spanning Piece', () => {
			const layer: string = 'someLayer'
			const segment: Segment = createSegment({} as SegmentInterface)

			const firstPartId: string = 'firstPartId'
			const firstPiece: Piece = createPiece({
				id: 'p1',
				partId: firstPartId,
				layer,
				pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
			} as PieceInterface)
			const firstPart: Part = createPart({
				id: firstPartId,
				rank: 1,
				segmentId: segment.id,
				pieces: [firstPiece],
			} as PartInterface)

			const middlePart: Part = createPart({ rank: 2, segmentId: segment.id } as PartInterface)

			const lastPartId: string = 'lastPart'
			const lastPiece: Piece = createPiece({
				id: 'p3',
				partId: lastPartId,
				layer,
				pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
			} as PieceInterface)
			const lastPart: Part = createPart({
				id: lastPartId,
				rank: 3,
				segmentId: segment.id,
				pieces: [lastPiece],
			} as PartInterface)

			segment.setParts([firstPart, middlePart, lastPart])

			const testee: Rundown = createTestee([segment])
			testee.setNext(segment.id, lastPart.id)
			testee.takeNext()

			const piecesBefore: Piece[] = testee.getInfinitePieces()
			expect(piecesBefore).toHaveLength(1)
			expect(piecesBefore).toContain(lastPiece)

			testee.setNext(segment.id, middlePart.id)
			testee.takeNext()

			const result: Piece[] = testee.getInfinitePieces()
			expect(result).toHaveLength(1)
			expect(result).toContain(firstPiece)
		})

		it('has a spanning Segment Piece, jumps "back" up the Segment before the Part with the spanning Segment Piece, no infinite Piece', () => {
			const layer: string = 'someLayer'
			const segment: Segment = createSegment({} as SegmentInterface)

			const firstPart: Part = createPart({ rank: 1, segmentId: segment.id } as PartInterface)

			const middlePart: Part = createPart({ rank: 2, segmentId: segment.id } as PartInterface)

			const lastPartId: string = 'lastPart'
			const lastPiece: Piece = createPiece({
				id: 'p3',
				partId: lastPartId,
				layer,
				pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
			} as PieceInterface)
			const lastPart: Part = createPart({
				id: lastPartId,
				rank: 3,
				segmentId: segment.id,
				pieces: [lastPiece],
			} as PartInterface)

			segment.setParts([firstPart, middlePart, lastPart])

			const testee: Rundown = createTestee([segment])
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

		it('has a Segment sticky Piece, change Segment, no longer any infinite Piece', () => {
			const segmentOne: Segment = createSegment({ rank: 1 } as SegmentInterface)
			const partId: string = 'somePartId'
			const piece: Piece = createPiece({
				id: 'p1',
				partId,
				pieceLifespan: PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE,
			} as PieceInterface)
			const partOne: Part = createPart({ id: partId, segmentId: segmentOne.id, pieces: [piece] } as PartInterface)
			segmentOne.setParts([partOne])

			const segmentTwo: Segment = createSegment({ rank: 2 } as SegmentInterface)
			const partTwo: Part = createPart({ segmentId: segmentTwo.id } as PartInterface)
			segmentTwo.setParts([partTwo])

			const testee: Rundown = createTestee([segmentOne, segmentTwo])

			testee.takeNext()

			const result: Piece[] = testee.getInfinitePieces()
			expect(result).toHaveLength(0)
		})

		it('has a Segment spanning Piece, change Segment, no longer any infinite Pieces', () => {
			const segmentOne: Segment = createSegment({ rank: 1 } as SegmentInterface)
			const piece: Piece = createPiece({
				id: 'p1',
				pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
			} as PieceInterface)
			const partOne: Part = createPart({ segmentId: segmentOne.id, pieces: [piece] } as PartInterface)
			segmentOne.setParts([partOne])

			const segmentTwo: Segment = createSegment({ rank: 2 } as SegmentInterface)
			const partTwo: Part = createPart({} as PartInterface)
			segmentTwo.setParts([partTwo])

			const testee: Rundown = createTestee([segmentOne, segmentTwo])

			testee.takeNext()

			const result: Piece[] = testee.getInfinitePieces()
			expect(result).toHaveLength(0)
		})
	})
})

function createTestee(segments: Segment[]): Rundown {
	const rundown: Rundown = new Rundown({
		id: 'someId',
		name: 'someName',
		isActive: false,
		segments,
	})
	rundown.activate()
	return rundown
}

function createSegment(segmentInterface: SegmentInterface): Segment {
	return new Segment({
		id: segmentInterface.rank ? `segment${segmentInterface.rank}` : 'segmentId',
		name: segmentInterface.name ?? 'segmentName',
		isNext: segmentInterface.isNext,
		isOnAir: segmentInterface.isOnAir,
		rank: segmentInterface.rank ?? 1,
		rundownId: segmentInterface.rundownId ?? 'rundownId',
		parts: segmentInterface.parts ?? [],
	})
}

function createPart(partInterface: PartInterface): Part {
	const partInterfaceWithDefaultValues: PartInterface = {
		id: partInterface.id ?? (partInterface.rank ? `part${partInterface.rank}` : 'partId'),
		segmentId: partInterface.segmentId ?? 'segmentId',
		rank: partInterface.rank ?? 1,
		name: partInterface.name ?? 'partName',
		isNext: partInterface.isNext,
		isOnAir: partInterface.isOnAir,
		expectedDuration: partInterface.expectedDuration ?? 0,
		pieces: partInterface.pieces ?? [],
	}
	return new Part(partInterfaceWithDefaultValues)
}

function createPiece(pieceInterface: PieceInterface): Piece {
	return new Piece({
		id: pieceInterface.id ?? 'id',
		name: pieceInterface.name ?? 'pieceName',
		partId: pieceInterface.partId ?? 'partId',
		type: pieceInterface.type ?? PieceType.UNKNOWN,
		layer: pieceInterface.layer ?? 'layer',
		start: pieceInterface.start ?? 0,
		duration: pieceInterface.duration ?? 0,
		pieceLifespan: pieceInterface.pieceLifespan ?? PieceLifespan.WITHIN_PART,
		timelineObjects: pieceInterface.timelineObjects ?? [],
	})
}
