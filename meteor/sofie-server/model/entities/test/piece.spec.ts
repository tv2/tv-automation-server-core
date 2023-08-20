import { PieceLifespan } from '../../enums/piece-lifespan'
import { Piece, PieceInterface } from '../piece'

describe('piece', () => {
	describe('setExecutedAt', () => {
		describe('piece is not an infinite Piece', () => {
			it('does not set executedAt', () => {
				const testee: Piece = new Piece({
					pieceLifespan: PieceLifespan.WITHIN_PART,
				} as PieceInterface)
				const executedAtBefore: number = testee.getExecutedAt()

				testee.setExecutedAt(Date.now())

				const executedAtAfter: number = testee.getExecutedAt()
				expect(executedAtAfter).toEqual(executedAtBefore)
			})
		})

		describe('piece is an infinite Piece', () => {
			it('updates executedAt', () => {
				const testee: Piece = new Piece({
					pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
				} as PieceInterface)

				const now: number = Date.now()
				testee.setExecutedAt(now)

				const result: number = testee.getExecutedAt()
				expect(result).toEqual(now)
			})
		})
	})

	describe('resetExecutedAt', () => {
		it('sets executedAt to zero', () => {
			const testee: Piece = new Piece({} as PieceInterface)

			testee.setExecutedAt(Date.now())
			testee.resetExecutedAt()

			const result: number = testee.getExecutedAt()
			expect(result).toEqual(0)
		})
	})
})
