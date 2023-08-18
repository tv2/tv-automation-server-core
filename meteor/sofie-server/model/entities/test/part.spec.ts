import { Part, PartInterface } from '../part'
import { EntityDefaultFactory } from './entity-default-factory'
import { PartTimings } from '../../value-objects/part-timings'
import { Piece, PieceInterface } from '../piece'

describe('Part', () => {
	describe('getTimings', () => {
		it('has not had its timings calculated yet - throws error', () => {
			const testee: Part = EntityDefaultFactory.createPart({} as PartInterface)
			expect(() => testee.getTimings()).toThrow()
		})

		it('has had its timings calculated - returns timings', () => {
			const testee: Part = EntityDefaultFactory.createPart({} as PartInterface)
			testee.calculateTimings()
			const result: PartTimings = testee.getTimings()
			expect(result).not.toBeUndefined()
		})
	})

	describe('calculateTimings', () => {
		describe('there is no previous Part', () => {
			it('has no inTransitionStart', () => {
				const testee: Part = EntityDefaultFactory.createPart({} as PartInterface)

				testee.calculateTimings()

				const result: PartTimings = testee.getTimings()
				expect(result.inTransitionStart).toBeNull()
			})

			describe('it have no Pieces', () => {
				it('returns zero for delayStartOfPiecesDuration', () => {
					const testee: Part = EntityDefaultFactory.createPart({} as PartInterface)

					testee.calculateTimings()

					const result: PartTimings = testee.getTimings()
					expect(result.delayStartOfPiecesDuration).toBe(0)
				})

				it('returns zero for postRollDuration', () => {
					const testee: Part = EntityDefaultFactory.createPart({} as PartInterface)

					testee.calculateTimings()

					const result: PartTimings = testee.getTimings()
					expect(result.postRollDuration).toBe(0)
				})
			})

			describe('it has Pieces', () => {
				describe('has only pieces with no PreRoll', () => {
					it('returns zero for delayStartOfPiecesDuration', () => {
						const piece: Piece = EntityDefaultFactory.createPiece({} as PieceInterface)
						const testee: Part = EntityDefaultFactory.createPart({ pieces: [piece] } as PartInterface)

						testee.calculateTimings()

						const result: PartTimings = testee.getTimings()
						expect(result.delayStartOfPiecesDuration).toBe(0)
					})

					it('returns zero for previousPartContinueIntoPartDuration', () => {
						const piece: Piece = EntityDefaultFactory.createPiece({} as PieceInterface)
						const testee: Part = EntityDefaultFactory.createPart({ pieces: [piece] } as PartInterface)

						testee.calculateTimings()

						const result: PartTimings = testee.getTimings()
						expect(result.previousPartContinueIntoPartDuration).toBe(0)
					})
				})

				describe('has piece with PreRoll', () => {
					it('returns piece.preRoll for delayStartOfPiecesDuration', () => {
						const piece: Piece = EntityDefaultFactory.createPiece({ preRollDuration: 15 } as PieceInterface)
						const testee: Part = EntityDefaultFactory.createPart({ pieces: [piece] } as PartInterface)

						testee.calculateTimings()

						const result: PartTimings = testee.getTimings()
						expect(result.delayStartOfPiecesDuration).toBe(piece.preRollDuration)
					})

					it('returns piece.preRoll for previousPartContinueIntoPartDuration', () => {
						const piece: Piece = EntityDefaultFactory.createPiece({ preRollDuration: 15 } as PieceInterface)
						const testee: Part = EntityDefaultFactory.createPart({ pieces: [piece] } as PartInterface)

						testee.calculateTimings()

						const result: PartTimings = testee.getTimings()
						expect(result.previousPartContinueIntoPartDuration).toBe(piece.preRollDuration)
					})
				})

				describe('has two pieces with PreRoll', () => {
					it('returns highest PreRoll for delayStartOfPiecesDuration', () => {
						const pieceWithLowestPreRoll: Piece = EntityDefaultFactory.createPiece({
							preRollDuration: 15,
						} as PieceInterface)
						const pieceWithHighestPreRoll: Piece = EntityDefaultFactory.createPiece({
							preRollDuration: 25,
						} as PieceInterface)
						const testee: Part = EntityDefaultFactory.createPart({
							pieces: [pieceWithLowestPreRoll, pieceWithHighestPreRoll],
						} as PartInterface)

						testee.calculateTimings()

						const result: PartTimings = testee.getTimings()
						expect(result.delayStartOfPiecesDuration).toBe(pieceWithHighestPreRoll.preRollDuration)
					})

					it('returns highest PreRoll for previousPartContinueIntoPartDuration', () => {
						const pieceWithLowestPreRoll: Piece = EntityDefaultFactory.createPiece({
							preRollDuration: 15,
						} as PieceInterface)
						const pieceWithHighestPreRoll: Piece = EntityDefaultFactory.createPiece({
							preRollDuration: 25,
						} as PieceInterface)
						const testee: Part = EntityDefaultFactory.createPart({
							pieces: [pieceWithLowestPreRoll, pieceWithHighestPreRoll],
						} as PartInterface)

						testee.calculateTimings()

						const result: PartTimings = testee.getTimings()
						expect(result.previousPartContinueIntoPartDuration).toBe(
							pieceWithHighestPreRoll.preRollDuration
						)
					})
				})

				it('has one Piece with PostRoll - return PostRoll of Piece', () => {
					const piece: Piece = EntityDefaultFactory.createPiece({ postRollDuration: 10 } as PieceInterface)
					const testee: Part = EntityDefaultFactory.createPart({ pieces: [piece] } as PartInterface)

					testee.calculateTimings()

					const result: PartTimings = testee.getTimings()
					expect(result.postRollDuration).toBe(piece.postRollDuration)
				})

				it('has one Piece with PostRoll and a duration - return zero for PostRoll', () => {
					const piece: Piece = EntityDefaultFactory.createPiece({
						postRollDuration: 10,
						duration: 20,
					} as PieceInterface)
					const testee: Part = EntityDefaultFactory.createPart({ pieces: [piece] } as PartInterface)

					testee.calculateTimings()

					const result: PartTimings = testee.getTimings()
					expect(result.postRollDuration).toBe(0)
				})

				it('has two Pieces Pieces with PostRoll - return highest PostRoll', () => {
					const lowestPostRollPiece: Piece = EntityDefaultFactory.createPiece({
						postRollDuration: 10,
					} as PieceInterface)
					const highestPostRollPiece: Piece = EntityDefaultFactory.createPiece({
						postRollDuration: 20,
					} as PieceInterface)
					const testee: Part = EntityDefaultFactory.createPart({
						pieces: [lowestPostRollPiece, highestPostRollPiece],
					} as PartInterface)

					testee.calculateTimings()

					const result: PartTimings = testee.getTimings()
					expect(result.postRollDuration).toBe(highestPostRollPiece.postRollDuration)
				})
			})
		})

		describe('there is a previous Part', () => {
			describe('the Part has no pieces', () => {
				it('returns zero for delayStartOfPiecesDuration', () => {
					const previousPart: Part = EntityDefaultFactory.createPart({} as PartInterface)
					previousPart.calculateTimings()

					const testee: Part = EntityDefaultFactory.createPart({} as PartInterface)

					testee.calculateTimings(previousPart)

					const result: PartTimings = testee.getTimings()
					expect(result.delayStartOfPiecesDuration).toBe(0)
				})

				it('returns zero for postRollDuration', () => {
					const previousPart: Part = EntityDefaultFactory.createPart({} as PartInterface)
					previousPart.calculateTimings()

					const testee: Part = EntityDefaultFactory.createPart({} as PartInterface)

					testee.calculateTimings(previousPart)

					const result: PartTimings = testee.getTimings()
					expect(result.postRollDuration).toBe(0)
				})
			})

			describe('it has pieces', () => {
				it('has one Piece with PostRoll - return PostRoll of Piece', () => {
					const previousPart: Part = EntityDefaultFactory.createPart({} as PartInterface)
					previousPart.calculateTimings()

					const piece: Piece = EntityDefaultFactory.createPiece({ postRollDuration: 10 } as PieceInterface)
					const testee: Part = EntityDefaultFactory.createPart({ pieces: [piece] } as PartInterface)

					testee.calculateTimings(previousPart)

					const result: PartTimings = testee.getTimings()
					expect(result.postRollDuration).toBe(piece.postRollDuration)
				})

				it('has one Piece with PostRoll and a duration - return zero for PostRoll', () => {
					const previousPart: Part = EntityDefaultFactory.createPart({} as PartInterface)
					previousPart.calculateTimings()

					const piece: Piece = EntityDefaultFactory.createPiece({
						postRollDuration: 10,
						duration: 20,
					} as PieceInterface)
					const testee: Part = EntityDefaultFactory.createPart({ pieces: [piece] } as PartInterface)

					testee.calculateTimings(previousPart)

					const result: PartTimings = testee.getTimings()
					expect(result.postRollDuration).toBe(0)
				})

				it('has two Pieces Pieces with PostRoll - return highest PostRoll', () => {
					const previousPart: Part = EntityDefaultFactory.createPart({} as PartInterface)
					previousPart.calculateTimings()

					const lowestPostRollPiece: Piece = EntityDefaultFactory.createPiece({
						postRollDuration: 10,
					} as PieceInterface)
					const highestPostRollPiece: Piece = EntityDefaultFactory.createPiece({
						postRollDuration: 20,
					} as PieceInterface)
					const testee: Part = EntityDefaultFactory.createPart({
						pieces: [lowestPostRollPiece, highestPostRollPiece],
					} as PartInterface)

					testee.calculateTimings(previousPart)

					const result: PartTimings = testee.getTimings()
					expect(result.postRollDuration).toBe(highestPostRollPiece.postRollDuration)
				})
			})

			describe('previous Part should autoNext and have autoNextOverlap', () => {
				it("don't have an inTransitionStart", () => {
					const previousPart: Part = EntityDefaultFactory.createPart({
						autoNext: true,
						autoNextOverlap: 1000,
					} as PartInterface)
					previousPart.calculateTimings()

					const testee: Part = EntityDefaultFactory.createPart({} as PartInterface)

					testee.calculateTimings(previousPart)

					const result: PartTimings = testee.getTimings()
					expect(result.inTransitionStart).toBeNull()
				})

				describe('"keepPreviousPartAliveDuration" is equal to the Part.autoNextOverlap and the Part has no "delayPiecesDuration"', () => {
					describe('previous Part have "keepAliveDuration"', () => {
						describe('the Part has no PreRoll', () => {
							it('returns previous Part.keepAliveDuration - the Part.autoOverlapNext for "delayStartOfPiecesDuration"', () => {
								const autoNextOverlap: number = 10
								const keepAliveDuration: number = 50
								const previousPart: Part = EntityDefaultFactory.createPart({
									autoNext: true,
									autoNextOverlap,
									outTransition: { keepAliveDuration },
								} as PartInterface)
								previousPart.calculateTimings()

								const testee: Part = EntityDefaultFactory.createPart({} as PartInterface)

								testee.calculateTimings(previousPart)

								const result: PartTimings = testee.getTimings()
								expect(result.delayStartOfPiecesDuration).toBe(keepAliveDuration - autoNextOverlap)
							})

							describe('the Part.autoOverlapNext is larger than previous Part.keepAlive', () => {
								it('returns zero for "delayStartOfPiecesDuration', () => {
									const previousPart: Part = EntityDefaultFactory.createPart({
										autoNext: true,
										autoNextOverlap: 50,
										outTransition: { keepAliveDuration: 30 },
									} as PartInterface)
									previousPart.calculateTimings()

									const testee: Part = EntityDefaultFactory.createPart({} as PartInterface)

									testee.calculateTimings(previousPart)

									const result: PartTimings = testee.getTimings()
									expect(result.delayStartOfPiecesDuration).toBe(0)
								})
							})

							describe('previous Part has PostRoll', () => {
								it('return "previousPartOutTransitionDuration" + the Part.autoNextOverlap + previous Part.postRoll for "previousPartContinueIntoPartDuration', () => {
									const autoNextOverlap: number = 10
									const keepAliveDuration: number = 50
									const postRollDuration: number = 100
									const postRollPiece: Piece = EntityDefaultFactory.createPiece({
										postRollDuration,
									} as PieceInterface)
									const previousPart: Part = EntityDefaultFactory.createPart({
										autoNext: true,
										autoNextOverlap,
										outTransition: { keepAliveDuration },
										pieces: [postRollPiece],
									} as PartInterface)
									previousPart.calculateTimings()

									const testee: Part = EntityDefaultFactory.createPart({} as PartInterface)

									testee.calculateTimings(previousPart)

									const result: PartTimings = testee.getTimings()
									expect(result.previousPartContinueIntoPartDuration).toBe(
										keepAliveDuration - autoNextOverlap + autoNextOverlap + postRollDuration
									)
								})
							})

							describe('previous Part does not have PostRoll', () => {
								it('return "previousPartOutTransitionDuration" + the Part.autoNextOverlap for "previousPartContinueIntoPartDuration', () => {
									const autoNextOverlap: number = 10
									const keepAliveDuration: number = 50
									const previousPart: Part = EntityDefaultFactory.createPart({
										autoNext: true,
										autoNextOverlap,
										outTransition: { keepAliveDuration },
									} as PartInterface)
									previousPart.calculateTimings()

									const testee: Part = EntityDefaultFactory.createPart({} as PartInterface)

									testee.calculateTimings(previousPart)

									const result: PartTimings = testee.getTimings()
									expect(result.previousPartContinueIntoPartDuration).toBe(
										keepAliveDuration - autoNextOverlap + autoNextOverlap
									)
								})
							})
						})

						describe('the Part has PreRoll', () => {
							describe('"previousPartOutTransitionDuration" is higher than the Part.preRoll', () => {
								it('returns keepAliveDuration - autoNextOverlap for "delayStartOfPiecesDuration"', () => {
									const autoNextOverlap: number = 10
									const keepAliveDuration: number = 50
									const previousPart: Part = EntityDefaultFactory.createPart({
										autoNext: true,
										autoNextOverlap,
										outTransition: { keepAliveDuration },
									} as PartInterface)
									previousPart.calculateTimings()

									const lowerPreRollDurationThanAutoNextOverlapPlusKeepAliveDuration: number = 20
									const preRollPiece: Piece = EntityDefaultFactory.createPiece({
										preRollDuration: lowerPreRollDurationThanAutoNextOverlapPlusKeepAliveDuration,
									} as PieceInterface)
									const testee: Part = EntityDefaultFactory.createPart({
										pieces: [preRollPiece],
									} as PartInterface)

									testee.calculateTimings(previousPart)

									const result: PartTimings = testee.getTimings()
									expect(result.delayStartOfPiecesDuration).toBe(keepAliveDuration - autoNextOverlap)
								})

								describe('previous Part has PostRoll', () => {
									it('return "previousPartOutTransitionDuration" + the Part.autoNextOverlap + previous Part.postRoll for "previousPartContinueIntoPartDuration', () => {
										const autoNextOverlap: number = 10
										const keepAliveDuration: number = 50
										const postRollDuration: number = 100
										const postRollPiece: Piece = EntityDefaultFactory.createPiece({
											postRollDuration,
										} as PieceInterface)
										const previousPart: Part = EntityDefaultFactory.createPart({
											autoNext: true,
											autoNextOverlap,
											outTransition: { keepAliveDuration },
											pieces: [postRollPiece],
										} as PartInterface)
										previousPart.calculateTimings()

										const lowerPreRollDurationThanAutoNextOverlapPlusKeepAliveDuration: number = 20
										const piece: Piece = EntityDefaultFactory.createPiece({
											preRollDuration:
												lowerPreRollDurationThanAutoNextOverlapPlusKeepAliveDuration,
										} as PieceInterface)
										const testee: Part = EntityDefaultFactory.createPart({
											pieces: [piece],
										} as PartInterface)

										testee.calculateTimings(previousPart)

										const result: PartTimings = testee.getTimings()
										expect(result.previousPartContinueIntoPartDuration).toBe(
											keepAliveDuration - autoNextOverlap + autoNextOverlap + postRollDuration
										)
									})
								})

								describe('previous Part does not have PostRoll', () => {
									it('return "previousPartOutTransitionDuration" + the Part.autoNextOverlap for "previousPartContinueIntoPartDuration', () => {
										const autoNextOverlap: number = 10
										const keepAliveDuration: number = 50
										const previousPart: Part = EntityDefaultFactory.createPart({
											autoNext: true,
											autoNextOverlap,
											outTransition: { keepAliveDuration },
										} as PartInterface)
										previousPart.calculateTimings()

										const lowerPreRollDurationThanAutoNextOverlapPlusKeepAliveDuration: number = 20
										const piece: Piece = EntityDefaultFactory.createPiece({
											preRollDuration:
												lowerPreRollDurationThanAutoNextOverlapPlusKeepAliveDuration,
										} as PieceInterface)
										const testee: Part = EntityDefaultFactory.createPart({
											pieces: [piece],
										} as PartInterface)

										testee.calculateTimings(previousPart)

										const result: PartTimings = testee.getTimings()
										expect(result.previousPartContinueIntoPartDuration).toBe(keepAliveDuration)
									})
								})
							})

							describe('"previousPartOutTransitionDuration" is lower than the Part.preRoll', () => {
								it('returns the Part.preRoll for "delayStartOfPiecesDuration', () => {
									const autoNextOverlap: number = 10
									const keepAliveDuration: number = 50
									const previousPart: Part = EntityDefaultFactory.createPart({
										autoNext: true,
										autoNextOverlap,
										outTransition: { keepAliveDuration },
									} as PartInterface)
									previousPart.calculateTimings()

									const higherPreRollDurationThanAutoNextOverlapPlusKeepAliveDuration: number = 200
									const preRollPiece: Piece = EntityDefaultFactory.createPiece({
										preRollDuration: higherPreRollDurationThanAutoNextOverlapPlusKeepAliveDuration,
									} as PieceInterface)
									const testee: Part = EntityDefaultFactory.createPart({
										pieces: [preRollPiece],
									} as PartInterface)

									testee.calculateTimings(previousPart)

									const result: PartTimings = testee.getTimings()
									expect(result.delayStartOfPiecesDuration).toBe(
										higherPreRollDurationThanAutoNextOverlapPlusKeepAliveDuration
									)
								})

								describe('previous Part has PostRoll', () => {
									it('return the Part.preRoll + the Part.autoNextOverlap + previous Part.postRoll for "previousPartContinueIntoPartDuration', () => {
										const autoNextOverlap: number = 10
										const keepAliveDuration: number = 50
										const postRollDuration: number = 100
										const postRollPiece: Piece = EntityDefaultFactory.createPiece({
											postRollDuration,
										} as PieceInterface)
										const previousPart: Part = EntityDefaultFactory.createPart({
											autoNext: true,
											autoNextOverlap,
											outTransition: { keepAliveDuration },
											pieces: [postRollPiece],
										} as PartInterface)
										previousPart.calculateTimings()

										const higherPreRollDurationThanAutoNextOverlapPlusKeepAliveDuration: number = 200
										const preRollPiece: Piece = EntityDefaultFactory.createPiece({
											preRollDuration:
												higherPreRollDurationThanAutoNextOverlapPlusKeepAliveDuration,
										} as PieceInterface)
										const testee: Part = EntityDefaultFactory.createPart({
											pieces: [preRollPiece],
										} as PartInterface)

										testee.calculateTimings(previousPart)

										const result: PartTimings = testee.getTimings()
										expect(result.previousPartContinueIntoPartDuration).toBe(
											higherPreRollDurationThanAutoNextOverlapPlusKeepAliveDuration +
												autoNextOverlap +
												postRollDuration
										)
									})
								})

								describe('previous Part does not have PostRoll', () => {
									it('return "previousPartOutTransitionDuration" + the Part.autoNextOverlap for "previousPartContinueIntoPartDuration', () => {
										const autoNextOverlap: number = 10
										const keepAliveDuration: number = 50
										const postRollDuration: number = 100
										const postRollPiece: Piece = EntityDefaultFactory.createPiece({
											postRollDuration,
										} as PieceInterface)
										const previousPart: Part = EntityDefaultFactory.createPart({
											autoNext: true,
											autoNextOverlap,
											outTransition: { keepAliveDuration },
											pieces: [postRollPiece],
										} as PartInterface)
										previousPart.calculateTimings()

										const higherPreRollDurationThanAutoNextOverlapPlusKeepAliveDuration: number = 200
										const preRollPiece: Piece = EntityDefaultFactory.createPiece({
											preRollDuration:
												higherPreRollDurationThanAutoNextOverlapPlusKeepAliveDuration,
										} as PieceInterface)
										const testee: Part = EntityDefaultFactory.createPart({
											pieces: [preRollPiece],
										} as PartInterface)

										testee.calculateTimings(previousPart)

										const result: PartTimings = testee.getTimings()
										expect(result.previousPartContinueIntoPartDuration).toBe(
											higherPreRollDurationThanAutoNextOverlapPlusKeepAliveDuration +
												autoNextOverlap +
												postRollDuration
										)
									})
								})
							})
						})
					})

					describe('previous Part does not have "keepAliveDuration"', () => {
						describe('the Part has PreRoll', () => {
							it('returns the Part.preRoll for "delayStartOfPiecesDuration', () => {
								const autoNextOverlap: number = 10
								const previousPart: Part = EntityDefaultFactory.createPart({
									autoNext: true,
									autoNextOverlap,
								} as PartInterface)
								previousPart.calculateTimings()

								const preRollDuration: number = 200
								const preRollPiece: Piece = EntityDefaultFactory.createPiece({
									preRollDuration: preRollDuration,
								} as PieceInterface)
								const testee: Part = EntityDefaultFactory.createPart({
									pieces: [preRollPiece],
								} as PartInterface)

								testee.calculateTimings(previousPart)

								const result: PartTimings = testee.getTimings()
								expect(result.delayStartOfPiecesDuration).toBe(preRollDuration)
							})

							describe('previous Part have PostRoll', () => {
								it('returns the Part.preRoll + the Part.autoNextOverlapDuration + previous Part.postRoll for "previousPartContinueIntoPartDuration"', () => {
									const autoNextOverlap: number = 10
									const postRollDuration: number = 100
									const postRollPiece: Piece = EntityDefaultFactory.createPiece({
										postRollDuration,
									} as PieceInterface)
									const previousPart: Part = EntityDefaultFactory.createPart({
										autoNext: true,
										autoNextOverlap,
										pieces: [postRollPiece],
									} as PartInterface)
									previousPart.calculateTimings()

									const preRollDuration: number = 200
									const preRollPiece: Piece = EntityDefaultFactory.createPiece({
										preRollDuration: preRollDuration,
									} as PieceInterface)
									const testee: Part = EntityDefaultFactory.createPart({
										pieces: [preRollPiece],
									} as PartInterface)

									testee.calculateTimings(previousPart)

									const result: PartTimings = testee.getTimings()
									expect(result.previousPartContinueIntoPartDuration).toBe(
										preRollDuration + autoNextOverlap + postRollDuration
									)
								})
							})

							describe('previous Part does not have PostRoll', () => {
								it('returns the Part.preRoll + the Part.autoNextOverlapDuration for "previousPartContinueIntoPartDuration"', () => {
									const autoNextOverlap: number = 10
									const previousPart: Part = EntityDefaultFactory.createPart({
										autoNext: true,
										autoNextOverlap,
									} as PartInterface)
									previousPart.calculateTimings()

									const preRollDuration: number = 200
									const preRollPiece: Piece = EntityDefaultFactory.createPiece({
										preRollDuration: preRollDuration,
									} as PieceInterface)
									const testee: Part = EntityDefaultFactory.createPart({
										pieces: [preRollPiece],
									} as PartInterface)

									testee.calculateTimings(previousPart)

									const result: PartTimings = testee.getTimings()
									expect(result.previousPartContinueIntoPartDuration).toBe(
										preRollDuration + autoNextOverlap
									)
								})
							})
						})

						describe('the Part does not have PreRoll', () => {
							it('returns zero for "delayStartOfPiecesDuration', () => {
								const autoNextOverlap: number = 10
								const previousPart: Part = EntityDefaultFactory.createPart({
									autoNext: true,
									autoNextOverlap,
								} as PartInterface)
								previousPart.calculateTimings()

								const testee: Part = EntityDefaultFactory.createPart({} as PartInterface)

								testee.calculateTimings(previousPart)

								const result: PartTimings = testee.getTimings()
								expect(result.delayStartOfPiecesDuration).toBe(0)
							})

							describe('previous Part have PostRoll', () => {
								it('returns the Part.autoNextOverlapDuration + previous Part.postRoll for "previousPartContinueIntoPartDuration"', () => {
									const autoNextOverlap: number = 10
									const postRollDuration: number = 100
									const postRollPiece: Piece = EntityDefaultFactory.createPiece({
										postRollDuration,
									} as PieceInterface)
									const previousPart: Part = EntityDefaultFactory.createPart({
										autoNext: true,
										autoNextOverlap,
										pieces: [postRollPiece],
									} as PartInterface)
									previousPart.calculateTimings()

									const testee: Part = EntityDefaultFactory.createPart({} as PartInterface)

									testee.calculateTimings(previousPart)

									const result: PartTimings = testee.getTimings()
									expect(result.previousPartContinueIntoPartDuration).toBe(
										autoNextOverlap + postRollDuration
									)
								})
							})

							describe('previous Part does not have PostRoll', () => {
								it('returns the Part.autoNextOverlapDuration for "previousPartContinueIntoPartDuration"', () => {
									const autoNextOverlap: number = 10
									const previousPart: Part = EntityDefaultFactory.createPart({
										autoNext: true,
										autoNextOverlap,
									} as PartInterface)
									previousPart.calculateTimings()

									const testee: Part = EntityDefaultFactory.createPart({} as PartInterface)

									testee.calculateTimings(previousPart)

									const result: PartTimings = testee.getTimings()
									expect(result.previousPartContinueIntoPartDuration).toBe(autoNextOverlap)
								})
							})
						})
					})
				})
			})

			describe('previous Part should not autoNext', () => {
				describe('previous Part should disableNextInTransition', () => {
					it("don't have an inTransitionStart", () => {
						const previousPart: Part = EntityDefaultFactory.createPart({
							disableNextInTransition: true,
						} as PartInterface)
						previousPart.calculateTimings()

						const testee: Part = EntityDefaultFactory.createPart({} as PartInterface)

						testee.calculateTimings(previousPart)

						const result: PartTimings = testee.getTimings()
						expect(result.inTransitionStart).toBeNull()
					})
				})

				describe('previous Part should not disableNextTransition', () => {
					// TODO: Write more testcases for the test case below. We have done it for the rest...
					it('should have same inTransitionStart as pieces should be delayed', () => {
						const previousPart: Part = EntityDefaultFactory.createPart({
							disableNextInTransition: false,
						} as PartInterface)
						previousPart.calculateTimings()

						const pieceWithPreRoll: Piece = EntityDefaultFactory.createPiece({
							preRollDuration: 10,
						} as PieceInterface)
						const testee: Part = EntityDefaultFactory.createPart({
							pieces: [pieceWithPreRoll],
						} as PartInterface)

						testee.calculateTimings(previousPart)

						const result: PartTimings = testee.getTimings()

						expect(result.inTransitionStart).toBe(pieceWithPreRoll.preRollDuration)
					})

					describe('this Part has a keepPreviousPartAliveDuration', () => {
						describe('previous Part has a keep alive duration', () => {
							describe("the previous Part.keepAliveDuration - this Part.keepPreviousPartAliveDuration is higher than the Part's PreRoll - the Part.delayPiecesDuration", () => {
								it('returns the previous Part.keepAliveDuration - this Part.keepPreviousPartAliveDuration as "inTransitionStart"', () => {
									const keepAliveDuration: number = 200
									const previousPart: Part = EntityDefaultFactory.createPart({
										outTransition: { keepAliveDuration },
									} as PartInterface)
									previousPart.calculateTimings()

									const keepPreviousPartAliveDuration: number = 100
									const preRollDurationLowerThanKeepAliveDurationMinusKeepPreviousPartAliveDuration: number = 50
									const pieceWithPreRoll: Piece = EntityDefaultFactory.createPiece({
										preRollDuration:
											preRollDurationLowerThanKeepAliveDurationMinusKeepPreviousPartAliveDuration,
									} as PieceInterface)
									const testee: Part = EntityDefaultFactory.createPart({
										inTransition: { keepPreviousPartAliveDuration },
										pieces: [pieceWithPreRoll],
									} as PartInterface)

									testee.calculateTimings(previousPart)

									const result: PartTimings = testee.getTimings()
									expect(result.inTransitionStart).toBe(
										keepAliveDuration - keepPreviousPartAliveDuration
									)
								})

								describe('this Part does not have a delayPiecesDuration', () => {
									it('returns the previous Part.keepAliveDuration - this Part.keepPreviousPartAliveDuration as "delayStartPiecesDuration"', () => {
										const keepAliveDuration: number = 200
										const previousPart: Part = EntityDefaultFactory.createPart({
											outTransition: { keepAliveDuration },
										} as PartInterface)
										previousPart.calculateTimings()

										const keepPreviousPartAliveDuration: number = 100
										const preRollDurationLowerThanKeepAliveDurationMinusKeepPreviousPartAliveDuration: number = 50
										const pieceWithPreRoll: Piece = EntityDefaultFactory.createPiece({
											preRollDuration:
												preRollDurationLowerThanKeepAliveDurationMinusKeepPreviousPartAliveDuration,
										} as PieceInterface)
										const testee: Part = EntityDefaultFactory.createPart({
											inTransition: { keepPreviousPartAliveDuration },
											pieces: [pieceWithPreRoll],
										} as PartInterface)

										testee.calculateTimings(previousPart)

										const result: PartTimings = testee.getTimings()
										expect(result.delayStartOfPiecesDuration).toBe(
											keepAliveDuration - keepPreviousPartAliveDuration
										)
									})

									describe('previous Part has a PostRollDuration', () => {
										it('returns previous Part.keepAliveDuration + previous Part.postRollDuration as "previousPartContinueIntoPartDuration', () => {
											const keepAliveDuration: number = 200
											const postRollDuration: number = 70
											const pieceWithPostRoll: Piece = EntityDefaultFactory.createPiece({
												postRollDuration,
											} as PieceInterface)
											const previousPart: Part = EntityDefaultFactory.createPart({
												outTransition: { keepAliveDuration },
												pieces: [pieceWithPostRoll],
											} as PartInterface)
											previousPart.calculateTimings()

											const keepPreviousPartAliveDuration: number = 100
											const preRollDurationLowerThanKeepAliveDurationMinusKeepPreviousPartAliveDuration: number = 50
											const pieceWithPreRoll: Piece = EntityDefaultFactory.createPiece({
												preRollDuration:
													preRollDurationLowerThanKeepAliveDurationMinusKeepPreviousPartAliveDuration,
											} as PieceInterface)
											const testee: Part = EntityDefaultFactory.createPart({
												inTransition: { keepPreviousPartAliveDuration },
												pieces: [pieceWithPreRoll],
											} as PartInterface)

											testee.calculateTimings(previousPart)

											const result: PartTimings = testee.getTimings()
											expect(result.previousPartContinueIntoPartDuration).toBe(
												keepAliveDuration + postRollDuration
											)
										})
									})

									describe('previous Part does not have a PostRollDuration', () => {
										it('returns previous Part.keepAliveDuration as "previousPartContinueIntoPartDuration', () => {
											const keepAliveDuration: number = 200
											const previousPart: Part = EntityDefaultFactory.createPart({
												outTransition: { keepAliveDuration },
											} as PartInterface)
											previousPart.calculateTimings()

											const keepPreviousPartAliveDuration: number = 100
											const preRollDurationLowerThanKeepAliveDurationMinusKeepPreviousPartAliveDuration: number = 50
											const pieceWithPreRoll: Piece = EntityDefaultFactory.createPiece({
												preRollDuration:
													preRollDurationLowerThanKeepAliveDurationMinusKeepPreviousPartAliveDuration,
											} as PieceInterface)
											const testee: Part = EntityDefaultFactory.createPart({
												inTransition: { keepPreviousPartAliveDuration },
												pieces: [pieceWithPreRoll],
											} as PartInterface)

											testee.calculateTimings(previousPart)

											const result: PartTimings = testee.getTimings()
											expect(result.previousPartContinueIntoPartDuration).toBe(keepAliveDuration)
										})
									})
								})

								describe('this Part do have a delayPiecesDuration', () => {
									it('returns the previous Part.keepAliveDuration - this Part.keepPreviousPartAliveDuration + this Part.delayPiecesDuration as "delayStartOfPiecesDuration"', () => {
										const keepAliveDuration: number = 200
										const previousPart: Part = EntityDefaultFactory.createPart({
											outTransition: { keepAliveDuration },
										} as PartInterface)
										previousPart.calculateTimings()

										const keepPreviousPartAliveDuration: number = 100
										const delayPiecesDuration: number = 20
										const preRollDurationLowerThanKeepAliveDurationMinusKeepPreviousPartAliveDuration: number = 50
										const pieceWithPreRoll: Piece = EntityDefaultFactory.createPiece({
											preRollDuration:
												preRollDurationLowerThanKeepAliveDurationMinusKeepPreviousPartAliveDuration,
										} as PieceInterface)
										const testee: Part = EntityDefaultFactory.createPart({
											inTransition: { keepPreviousPartAliveDuration, delayPiecesDuration },
											pieces: [pieceWithPreRoll],
										} as PartInterface)

										testee.calculateTimings(previousPart)

										const result: PartTimings = testee.getTimings()
										expect(result.delayStartOfPiecesDuration).toBe(
											keepAliveDuration - keepPreviousPartAliveDuration + delayPiecesDuration
										)
									})
								})
							})

							describe("the previous Part.keepAliveDuration - this Part.keepPreviousPartAliveDuration is lower than the Part's PreRoll - the Part.delayPiecesDuration", () => {
								it('returns this Part.preRoll as "inTransitionStart"', () => {
									const keepAliveDuration: number = 210
									const previousPart: Part = EntityDefaultFactory.createPart({
										outTransition: { keepAliveDuration },
									} as PartInterface)
									previousPart.calculateTimings()

									const keepPreviousPartAliveDuration: number = 100
									const preRollDurationHigherThanKeepAliveDurationMinusKeepPreviousPartAliveDuration: number = 200
									const pieceWithPreRoll: Piece = EntityDefaultFactory.createPiece({
										preRollDuration:
											preRollDurationHigherThanKeepAliveDurationMinusKeepPreviousPartAliveDuration,
									} as PieceInterface)
									const testee: Part = EntityDefaultFactory.createPart({
										inTransition: { keepPreviousPartAliveDuration },
										pieces: [pieceWithPreRoll],
									} as PartInterface)

									testee.calculateTimings(previousPart)

									const result: PartTimings = testee.getTimings()
									expect(result.inTransitionStart).toBe(
										preRollDurationHigherThanKeepAliveDurationMinusKeepPreviousPartAliveDuration
									)
								})

								describe('this Part does not have a delayPiecesDuration', () => {
									it('returns the Part\'s PreRoll as "delayStartPiecesDuration"', () => {
										const keepAliveDuration: number = 210
										const previousPart: Part = EntityDefaultFactory.createPart({
											outTransition: { keepAliveDuration },
										} as PartInterface)
										previousPart.calculateTimings()

										const keepPreviousPartAliveDuration: number = 50
										const preRollDurationHigherThanKeepAliveDurationMinusKeepPreviousPartAliveDuration: number = 200
										const pieceWithPreRoll: Piece = EntityDefaultFactory.createPiece({
											preRollDuration:
												preRollDurationHigherThanKeepAliveDurationMinusKeepPreviousPartAliveDuration,
										} as PieceInterface)
										const testee: Part = EntityDefaultFactory.createPart({
											inTransition: { keepPreviousPartAliveDuration },
											pieces: [pieceWithPreRoll],
										} as PartInterface)

										testee.calculateTimings(previousPart)

										const result: PartTimings = testee.getTimings()
										expect(result.delayStartOfPiecesDuration).toBe(
											preRollDurationHigherThanKeepAliveDurationMinusKeepPreviousPartAliveDuration
										)
									})

									describe('previous Part has a PostRollDuration', () => {
										it("returns this Part's PreRoll + this Part.keepPreviousPartAliveDuration + previous Part's PostRollDuration as \"previousPartContinueIntoPartDuration", () => {
											const keepAliveDuration: number = 210
											const postRollDuration: number = 70
											const pieceWithPostRoll: Piece = EntityDefaultFactory.createPiece({
												postRollDuration,
											} as PieceInterface)
											const previousPart: Part = EntityDefaultFactory.createPart({
												outTransition: { keepAliveDuration },
												pieces: [pieceWithPostRoll],
											} as PartInterface)
											previousPart.calculateTimings()

											const keepPreviousPartAliveDuration: number = 50
											const preRollDurationHigherThanKeepAliveDurationMinusKeepPreviousPartAliveDuration: number = 200
											const pieceWithPreRoll: Piece = EntityDefaultFactory.createPiece({
												preRollDuration:
													preRollDurationHigherThanKeepAliveDurationMinusKeepPreviousPartAliveDuration,
											} as PieceInterface)
											const testee: Part = EntityDefaultFactory.createPart({
												inTransition: { keepPreviousPartAliveDuration },
												pieces: [pieceWithPreRoll],
											} as PartInterface)

											testee.calculateTimings(previousPart)

											const result: PartTimings = testee.getTimings()
											expect(result.previousPartContinueIntoPartDuration).toBe(
												preRollDurationHigherThanKeepAliveDurationMinusKeepPreviousPartAliveDuration +
													keepPreviousPartAliveDuration +
													postRollDuration
											)
										})
									})

									describe('previous Part does not have a PostRollDuration', () => {
										it('returns "preRollDurationConsideringDelay" + this Part.keepPreviousPartAliveDuration as "previousPartContinueIntoPartDuration', () => {
											const keepAliveDuration: number = 210
											const previousPart: Part = EntityDefaultFactory.createPart({
												outTransition: { keepAliveDuration },
											} as PartInterface)
											previousPart.calculateTimings()

											const keepPreviousPartAliveDuration: number = 50
											const preRollDurationHigherThanKeepAliveDurationMinusKeepPreviousPartAliveDuration: number = 200
											const pieceWithPreRoll: Piece = EntityDefaultFactory.createPiece({
												preRollDuration:
													preRollDurationHigherThanKeepAliveDurationMinusKeepPreviousPartAliveDuration,
											} as PieceInterface)
											const testee: Part = EntityDefaultFactory.createPart({
												inTransition: { keepPreviousPartAliveDuration },
												pieces: [pieceWithPreRoll],
											} as PartInterface)

											testee.calculateTimings(previousPart)

											const result: PartTimings = testee.getTimings()
											expect(result.previousPartContinueIntoPartDuration).toBe(
												preRollDurationHigherThanKeepAliveDurationMinusKeepPreviousPartAliveDuration +
													keepPreviousPartAliveDuration
											)
										})
									})
								})

								describe('this Part do have a delayPiecesDuration', () => {
									it('returns the Part\'s PreRoll as "delayStartOfPiecesDuration"', () => {
										const keepAliveDuration: number = 210
										const previousPart: Part = EntityDefaultFactory.createPart({
											outTransition: { keepAliveDuration },
										} as PartInterface)
										previousPart.calculateTimings()

										const keepPreviousPartAliveDuration: number = 50
										const delayPiecesDuration: number = 30
										const preRollDurationMinusDelayPiecesDurationHigherThanKeepAliveDurationMinusKeepPreviousPartAliveDuration: number = 200
										const pieceWithPreRoll: Piece = EntityDefaultFactory.createPiece({
											preRollDuration:
												preRollDurationMinusDelayPiecesDurationHigherThanKeepAliveDurationMinusKeepPreviousPartAliveDuration,
										} as PieceInterface)
										const testee: Part = EntityDefaultFactory.createPart({
											inTransition: { keepPreviousPartAliveDuration, delayPiecesDuration },
											pieces: [pieceWithPreRoll],
										} as PartInterface)

										testee.calculateTimings(previousPart)

										const result: PartTimings = testee.getTimings()
										expect(result.delayStartOfPiecesDuration).toBe(
											preRollDurationMinusDelayPiecesDurationHigherThanKeepAliveDurationMinusKeepPreviousPartAliveDuration
										)
									})
								})
							})
						})

						describe('previous Part does not have a keep alive duration', () => {
							describe('this Part does not have PreRoll', () => {
								it('returns zero as "inTransitionStart"', () => {
									const previousPart: Part = EntityDefaultFactory.createPart({} as PartInterface)
									previousPart.calculateTimings()

									const keepPreviousPartAliveDuration: number = 100
									const testee: Part = EntityDefaultFactory.createPart({
										inTransition: { keepPreviousPartAliveDuration },
									} as PartInterface)

									testee.calculateTimings(previousPart)

									const result: PartTimings = testee.getTimings()
									expect(result.inTransitionStart).toBe(0)
								})

								describe('this Part has "delayPiecesDuration"', () => {
									it('returns this Part.delayPiecesDuration for "delayStartOfPiecesDuration', () => {
										const previousPart: Part = EntityDefaultFactory.createPart({} as PartInterface)
										previousPart.calculateTimings()

										const keepPreviousPartAliveDuration: number = 50
										const delayPiecesDuration: number = 100
										const testee: Part = EntityDefaultFactory.createPart({
											inTransition: { keepPreviousPartAliveDuration, delayPiecesDuration },
										} as PartInterface)

										testee.calculateTimings(previousPart)

										const result: PartTimings = testee.getTimings()
										expect(result.delayStartOfPiecesDuration).toBe(delayPiecesDuration)
									})

									describe('previous Part has PostRoll', () => {
										it('return this Part.keepPreviousPartAliveDuration + previous Part PostRoll for "previousPartContinueIntoPartDuration"', () => {
											const postRollDuration: number = 70
											const pieceWithPostRoll: Piece = EntityDefaultFactory.createPiece({
												postRollDuration,
											} as PieceInterface)
											const previousPart: Part = EntityDefaultFactory.createPart({
												pieces: [pieceWithPostRoll],
											} as PartInterface)
											previousPart.calculateTimings()

											const keepPreviousPartAliveDuration: number = 50
											const delayPiecesDuration: number = 100
											const testee: Part = EntityDefaultFactory.createPart({
												inTransition: { keepPreviousPartAliveDuration, delayPiecesDuration },
											} as PartInterface)

											testee.calculateTimings(previousPart)

											const result: PartTimings = testee.getTimings()
											expect(result.previousPartContinueIntoPartDuration).toBe(
												keepPreviousPartAliveDuration + postRollDuration
											)
										})
									})

									describe('previous Part does not have PostRoll', () => {
										it('returns this Part.keepPreviousPartAliveDuration for "previousPartContinueIntoPartDuration"', () => {
											const previousPart: Part = EntityDefaultFactory.createPart(
												{} as PartInterface
											)
											previousPart.calculateTimings()

											const keepPreviousPartAliveDuration: number = 50
											const delayPiecesDuration: number = 100
											const testee: Part = EntityDefaultFactory.createPart({
												inTransition: { keepPreviousPartAliveDuration, delayPiecesDuration },
											} as PartInterface)

											testee.calculateTimings(previousPart)

											const result: PartTimings = testee.getTimings()
											expect(result.previousPartContinueIntoPartDuration).toBe(
												keepPreviousPartAliveDuration
											)
										})
									})
								})

								describe('this Part does not have "delayPiecesDuration"', () => {
									it('returns zero for "delayStartOfPiecesDuration"', () => {
										const previousPart: Part = EntityDefaultFactory.createPart({} as PartInterface)
										previousPart.calculateTimings()

										const keepPreviousPartAliveDuration: number = 50
										const testee: Part = EntityDefaultFactory.createPart({
											inTransition: { keepPreviousPartAliveDuration },
										} as PartInterface)

										testee.calculateTimings(previousPart)

										const result: PartTimings = testee.getTimings()
										expect(result.delayStartOfPiecesDuration).toBe(0)
									})
								})
							})

							describe('this Part has PreRoll', () => {
								it('returns this Part.preRoll as "inTransitionStart"', () => {
									const previousPart: Part = EntityDefaultFactory.createPart({} as PartInterface)
									previousPart.calculateTimings()

									const keepPreviousPartAliveDuration: number = 50
									const preRollDuration: number = 90
									const pieceWithPreRoll: Piece = EntityDefaultFactory.createPiece({
										preRollDuration,
									} as PieceInterface)
									const testee: Part = EntityDefaultFactory.createPart({
										inTransition: { keepPreviousPartAliveDuration },
										pieces: [pieceWithPreRoll],
									} as PartInterface)

									testee.calculateTimings(previousPart)

									const result: PartTimings = testee.getTimings()
									expect(result.inTransitionStart).toBe(preRollDuration)
								})

								it('returns PreRoll duration as "delayStartOfPiecesDuration', () => {
									const previousPart: Part = EntityDefaultFactory.createPart({} as PartInterface)
									previousPart.calculateTimings()

									const keepPreviousPartAliveDuration: number = 50
									const preRollDuration: number = 90
									const pieceWithPreRoll: Piece = EntityDefaultFactory.createPiece({
										preRollDuration,
									} as PieceInterface)
									const testee: Part = EntityDefaultFactory.createPart({
										inTransition: { keepPreviousPartAliveDuration },
										pieces: [pieceWithPreRoll],
									} as PartInterface)

									testee.calculateTimings(previousPart)

									const result: PartTimings = testee.getTimings()
									expect(result.delayStartOfPiecesDuration).toBe(preRollDuration)
								})

								describe('this Part has "delayPiecesDuration', () => {
									describe('previous Part has PostRoll', () => {
										it('returns the Part\'s PreRoll - the Part.delayPiecesDuration + this Part.keepPreviousPartAliveDuration + previous Part.postRoll as "previousPartContinueIntoPartDuration"', () => {
											const postRollDuration: number = 70
											const pieceWithPostRoll: Piece = EntityDefaultFactory.createPiece({
												postRollDuration,
											} as PieceInterface)
											const previousPart: Part = EntityDefaultFactory.createPart({
												pieces: [pieceWithPostRoll],
											} as PartInterface)
											previousPart.calculateTimings()

											const keepPreviousPartAliveDuration: number = 50
											const delayPiecesDuration: number = 80
											const preRollDuration: number = 90
											const pieceWithPreRoll: Piece = EntityDefaultFactory.createPiece({
												preRollDuration,
											} as PieceInterface)
											const testee: Part = EntityDefaultFactory.createPart({
												inTransition: { keepPreviousPartAliveDuration, delayPiecesDuration },
												pieces: [pieceWithPreRoll],
											} as PartInterface)

											testee.calculateTimings(previousPart)

											const result: PartTimings = testee.getTimings()
											expect(result.previousPartContinueIntoPartDuration).toBe(
												preRollDuration -
													delayPiecesDuration +
													keepPreviousPartAliveDuration +
													postRollDuration
											)
										})
									})

									describe('previous Part does not have PostRoll', () => {
										it('returns the Part\'s PreRoll - the Part.delayPiecesDuration + this Part.keepPreviousPartAliveDuration as "previousPartContinueIntoPartDuration"', () => {
											const previousPart: Part = EntityDefaultFactory.createPart(
												{} as PartInterface
											)
											previousPart.calculateTimings()

											const keepPreviousPartAliveDuration: number = 50
											const delayPiecesDuration: number = 80
											const preRollDuration: number = 90
											const pieceWithPreRoll: Piece = EntityDefaultFactory.createPiece({
												preRollDuration,
											} as PieceInterface)
											const testee: Part = EntityDefaultFactory.createPart({
												inTransition: { keepPreviousPartAliveDuration, delayPiecesDuration },
												pieces: [pieceWithPreRoll],
											} as PartInterface)

											testee.calculateTimings(previousPart)

											const result: PartTimings = testee.getTimings()
											expect(result.previousPartContinueIntoPartDuration).toBe(
												preRollDuration - delayPiecesDuration + keepPreviousPartAliveDuration
											)
										})
									})
								})

								describe('this Part does not have "delayPiecesDuration"', () => {
									describe('previous Part has PostRoll', () => {
										it('returns the Part\'s PreRoll + the Part.keepPreviousPartAliveDuration + previous Part.postRoll as "previousPartContinueIntoPartDuration', () => {
											const postRollDuration: number = 70
											const pieceWithPostRoll: Piece = EntityDefaultFactory.createPiece({
												postRollDuration,
											} as PieceInterface)
											const previousPart: Part = EntityDefaultFactory.createPart({
												pieces: [pieceWithPostRoll],
											} as PartInterface)
											previousPart.calculateTimings()

											const keepPreviousPartAliveDuration: number = 50
											const preRollDuration: number = 90
											const pieceWithPreRoll: Piece = EntityDefaultFactory.createPiece({
												preRollDuration,
											} as PieceInterface)
											const testee: Part = EntityDefaultFactory.createPart({
												inTransition: { keepPreviousPartAliveDuration },
												pieces: [pieceWithPreRoll],
											} as PartInterface)

											testee.calculateTimings(previousPart)

											const result: PartTimings = testee.getTimings()
											expect(result.previousPartContinueIntoPartDuration).toBe(
												preRollDuration + keepPreviousPartAliveDuration + postRollDuration
											)
										})
									})

									describe('previous Part does not have PostRoll', () => {
										it('returns the Part\'s PreRoll + the Part.keepPreviousPartAliveDuration as "previousPartContinueIntoPartDuration"', () => {
											const previousPart: Part = EntityDefaultFactory.createPart(
												{} as PartInterface
											)
											previousPart.calculateTimings()

											const keepPreviousPartAliveDuration: number = 50
											const preRollDuration: number = 90
											const pieceWithPreRoll: Piece = EntityDefaultFactory.createPiece({
												preRollDuration,
											} as PieceInterface)
											const testee: Part = EntityDefaultFactory.createPart({
												inTransition: { keepPreviousPartAliveDuration },
												pieces: [pieceWithPreRoll],
											} as PartInterface)

											testee.calculateTimings(previousPart)

											const result: PartTimings = testee.getTimings()
											expect(result.previousPartContinueIntoPartDuration).toBe(
												preRollDuration + keepPreviousPartAliveDuration
											)
										})
									})
								})
							})
						})
					})

					describe('this Part does not have a keepPreviousPartAliveDuration', () => {
						describe('previous Part has "keepAliveDuration"', () => {
							describe('this Part does not have PreRoll', () => {
								it('returns previous Part.keepAlive as "inTransitionStart"', () => {
									const keepAliveDuration: number = 200
									const previousPart: Part = EntityDefaultFactory.createPart({
										outTransition: { keepAliveDuration },
									} as PartInterface)
									previousPart.calculateTimings()

									const testee: Part = EntityDefaultFactory.createPart({} as PartInterface)

									testee.calculateTimings(previousPart)

									const result: PartTimings = testee.getTimings()
									expect(result.inTransitionStart).toBe(keepAliveDuration)
								})

								describe('this Part has "delayPiecesDuration"', () => {
									it('returns previous Part.keepAliveDuration + this Part.delayPiecesDuration for "delayStartOfPiecesDuration"', () => {
										const keepAliveDuration: number = 200
										const previousPart: Part = EntityDefaultFactory.createPart({
											outTransition: { keepAliveDuration },
										} as PartInterface)
										previousPart.calculateTimings()

										const delayPiecesDuration: number = 40
										const testee: Part = EntityDefaultFactory.createPart({
											inTransition: { delayPiecesDuration },
										} as PartInterface)

										testee.calculateTimings(previousPart)

										const result: PartTimings = testee.getTimings()
										expect(result.delayStartOfPiecesDuration).toBe(
											keepAliveDuration + delayPiecesDuration
										)
									})

									describe('previous Part has PostRoll', () => {
										it('returns previous Part.keepAliveDuration + previous Part.postRoll for "previousPartContinueIntoPartDuration"', () => {
											const keepAliveDuration: number = 200
											const postRollDuration: number = 70
											const pieceWithPostRoll: Piece = EntityDefaultFactory.createPiece({
												postRollDuration,
											} as PieceInterface)
											const previousPart: Part = EntityDefaultFactory.createPart({
												outTransition: { keepAliveDuration },
												pieces: [pieceWithPostRoll],
											} as PartInterface)
											previousPart.calculateTimings()

											const delayPiecesDuration: number = 40
											const testee: Part = EntityDefaultFactory.createPart({
												inTransition: { delayPiecesDuration },
											} as PartInterface)

											testee.calculateTimings(previousPart)

											const result: PartTimings = testee.getTimings()
											expect(result.previousPartContinueIntoPartDuration).toBe(
												keepAliveDuration + postRollDuration
											)
										})
									})

									describe('previous Part does not have PostRoll', () => {
										it('returns previous Part.keepAliveDuration for "previousPartContinueIntoPartDuration"', () => {
											const keepAliveDuration: number = 200
											const previousPart: Part = EntityDefaultFactory.createPart({
												outTransition: { keepAliveDuration },
											} as PartInterface)
											previousPart.calculateTimings()

											const delayPiecesDuration: number = 40
											const testee: Part = EntityDefaultFactory.createPart({
												inTransition: { delayPiecesDuration },
											} as PartInterface)

											testee.calculateTimings(previousPart)

											const result: PartTimings = testee.getTimings()
											expect(result.previousPartContinueIntoPartDuration).toBe(keepAliveDuration)
										})
									})
								})

								describe('this Part does not have "delayPiecesDuration"', () => {
									it('returns previous Part.keepAliveDuration for "delayStartOfPiecesDuration"', () => {
										const keepAliveDuration: number = 200
										const previousPart: Part = EntityDefaultFactory.createPart({
											outTransition: { keepAliveDuration },
										} as PartInterface)
										previousPart.calculateTimings()

										const testee: Part = EntityDefaultFactory.createPart({} as PartInterface)

										testee.calculateTimings(previousPart)

										const result: PartTimings = testee.getTimings()
										expect(result.delayStartOfPiecesDuration).toBe(keepAliveDuration)
									})

									describe('previous Part has PostRoll', () => {
										it('returns previous Part.keepAliveDuration + previous Part.postRoll for "previousPartContinueIntoPartDuration"', () => {
											const keepAliveDuration: number = 200
											const postRollDuration: number = 70
											const pieceWithPostRoll: Piece = EntityDefaultFactory.createPiece({
												postRollDuration,
											} as PieceInterface)
											const previousPart: Part = EntityDefaultFactory.createPart({
												outTransition: { keepAliveDuration },
												pieces: [pieceWithPostRoll],
											} as PartInterface)
											previousPart.calculateTimings()

											const testee: Part = EntityDefaultFactory.createPart({} as PartInterface)

											testee.calculateTimings(previousPart)

											const result: PartTimings = testee.getTimings()
											expect(result.previousPartContinueIntoPartDuration).toBe(
												keepAliveDuration + postRollDuration
											)
										})
									})

									describe('previous Part does not have PostRoll', () => {
										it('returns previous Part.keepAliveDuration for "previousPartContinueIntoPartDuration"', () => {
											const keepAliveDuration: number = 200
											const previousPart: Part = EntityDefaultFactory.createPart({
												outTransition: { keepAliveDuration },
											} as PartInterface)
											previousPart.calculateTimings()

											const testee: Part = EntityDefaultFactory.createPart({} as PartInterface)

											testee.calculateTimings(previousPart)

											const result: PartTimings = testee.getTimings()
											expect(result.previousPartContinueIntoPartDuration).toBe(keepAliveDuration)
										})
									})
								})
							})

							describe('this Part has PreRoll', () => {
								describe('previous Part.keepAlive is higher than this Part.preRoll - the Part.delayPiecesDuration', () => {
									it('returns previous Part.keepAlive as "inTransitionStart"', () => {
										const keepAliveDurationHigherThanPreRollDuration: number = 200
										const previousPart: Part = EntityDefaultFactory.createPart({
											outTransition: {
												keepAliveDuration: keepAliveDurationHigherThanPreRollDuration,
											},
										} as PartInterface)
										previousPart.calculateTimings()

										const preRollDuration: number = 100
										const pieceWithPreRoll: Piece = EntityDefaultFactory.createPiece({
											preRollDuration,
										} as PieceInterface)
										const testee: Part = EntityDefaultFactory.createPart({
											pieces: [pieceWithPreRoll],
										} as PartInterface)

										testee.calculateTimings(previousPart)

										const result: PartTimings = testee.getTimings()
										expect(result.inTransitionStart).toBe(
											keepAliveDurationHigherThanPreRollDuration
										)
									})

									describe('this Part has "delayPiecesDuration"', () => {
										it('returns previous Part.keepAlive + this Part.delayPiecesDuration for "delayStartOfPiecesDuration"', () => {
											const keepAliveDurationHigherThanPreRollDurationMinusDelayPiecesDuration: number = 200
											const previousPart: Part = EntityDefaultFactory.createPart({
												outTransition: {
													keepAliveDuration:
														keepAliveDurationHigherThanPreRollDurationMinusDelayPiecesDuration,
												},
											} as PartInterface)
											previousPart.calculateTimings()

											const delayPiecesDuration: number = 40
											const preRollDuration: number = 210
											const pieceWithPreRoll: Piece = EntityDefaultFactory.createPiece({
												preRollDuration,
											} as PieceInterface)
											const testee: Part = EntityDefaultFactory.createPart({
												inTransition: { delayPiecesDuration },
												pieces: [pieceWithPreRoll],
											} as PartInterface)

											testee.calculateTimings(previousPart)

											const result: PartTimings = testee.getTimings()
											expect(result.delayStartOfPiecesDuration).toBe(
												keepAliveDurationHigherThanPreRollDurationMinusDelayPiecesDuration +
													delayPiecesDuration
											)
										})

										describe('previous Part has PostRoll', () => {
											it('returns previous Part.keepAlive + previous Part.postRoll for "previousPartContinueIntoPartDuration"', () => {
												const keepAliveDurationHigherThanPreRollDurationMinusDelayPiecesDuration: number = 200
												const postRollDuration: number = 70
												const pieceWithPostRoll: Piece = EntityDefaultFactory.createPiece({
													postRollDuration,
												} as PieceInterface)
												const previousPart: Part = EntityDefaultFactory.createPart({
													outTransition: {
														keepAliveDuration:
															keepAliveDurationHigherThanPreRollDurationMinusDelayPiecesDuration,
													},
													pieces: [pieceWithPostRoll],
												} as PartInterface)
												previousPart.calculateTimings()

												const delayPiecesDuration: number = 40
												const preRollDuration: number = 210
												const pieceWithPreRoll: Piece = EntityDefaultFactory.createPiece({
													preRollDuration,
												} as PieceInterface)
												const testee: Part = EntityDefaultFactory.createPart({
													inTransition: { delayPiecesDuration },
													pieces: [pieceWithPreRoll],
												} as PartInterface)

												testee.calculateTimings(previousPart)

												const result: PartTimings = testee.getTimings()
												expect(result.previousPartContinueIntoPartDuration).toBe(
													keepAliveDurationHigherThanPreRollDurationMinusDelayPiecesDuration +
														postRollDuration
												)
											})
										})

										describe('previous Part does not have PostRoll', () => {
											it('returns previous Part.keepAliveDuration for "previousPartContinueIntoPartDuration"', () => {
												const keepAliveDurationHigherThanPreRollDurationMinusDelayPiecesDuration: number = 200
												const previousPart: Part = EntityDefaultFactory.createPart({
													outTransition: {
														keepAliveDuration:
															keepAliveDurationHigherThanPreRollDurationMinusDelayPiecesDuration,
													},
												} as PartInterface)
												previousPart.calculateTimings()

												const delayPiecesDuration: number = 40
												const preRollDuration: number = 210
												const pieceWithPreRoll: Piece = EntityDefaultFactory.createPiece({
													preRollDuration: preRollDuration,
												} as PieceInterface)
												const testee: Part = EntityDefaultFactory.createPart({
													inTransition: { delayPiecesDuration },
													pieces: [pieceWithPreRoll],
												} as PartInterface)

												testee.calculateTimings(previousPart)

												const result: PartTimings = testee.getTimings()
												expect(result.previousPartContinueIntoPartDuration).toBe(
													keepAliveDurationHigherThanPreRollDurationMinusDelayPiecesDuration
												)
											})
										})
									})

									describe('this Part does not have "delayPiecesDuration"', () => {
										it('returns previous Part.keepAlive for "delayStartOfPiecesDuration"', () => {
											const keepAliveDurationHigherThanPreRollDuration: number = 200
											const previousPart: Part = EntityDefaultFactory.createPart({
												outTransition: {
													keepAliveDuration: keepAliveDurationHigherThanPreRollDuration,
												},
											} as PartInterface)
											previousPart.calculateTimings()

											const preRollDuration: number = 90
											const pieceWithPreRoll: Piece = EntityDefaultFactory.createPiece({
												preRollDuration,
											} as PieceInterface)
											const testee: Part = EntityDefaultFactory.createPart({
												pieces: [pieceWithPreRoll],
											} as PartInterface)

											testee.calculateTimings(previousPart)

											const result: PartTimings = testee.getTimings()
											expect(result.delayStartOfPiecesDuration).toBe(
												keepAliveDurationHigherThanPreRollDuration
											)
										})

										describe('previous Part has PostRoll', () => {
											it('returns previous Part.keepAlive + previous Part.postRoll for "previousPartContinueIntoPartDuration"', () => {
												const keepAliveDurationHigherThanPreRollDuration: number = 200
												const postRollDuration: number = 70
												const pieceWithPostRoll: Piece = EntityDefaultFactory.createPiece({
													postRollDuration,
												} as PieceInterface)
												const previousPart: Part = EntityDefaultFactory.createPart({
													outTransition: {
														keepAliveDuration: keepAliveDurationHigherThanPreRollDuration,
													},
													pieces: [pieceWithPostRoll],
												} as PartInterface)
												previousPart.calculateTimings()

												const preRollDuration: number = 90
												const pieceWithPreRoll: Piece = EntityDefaultFactory.createPiece({
													preRollDuration,
												} as PieceInterface)
												const testee: Part = EntityDefaultFactory.createPart({
													pieces: [pieceWithPreRoll],
												} as PartInterface)

												testee.calculateTimings(previousPart)

												const result: PartTimings = testee.getTimings()
												expect(result.previousPartContinueIntoPartDuration).toBe(
													keepAliveDurationHigherThanPreRollDuration + postRollDuration
												)
											})
										})

										describe('previous Part does not have PostRoll', () => {
											it('returns previous Part.keepAlive for "previousPartContinueIntoPartDuration"', () => {
												const keepAliveDurationHigherThanPreRollDuration: number = 200
												const previousPart: Part = EntityDefaultFactory.createPart({
													outTransition: {
														keepAliveDuration: keepAliveDurationHigherThanPreRollDuration,
													},
												} as PartInterface)
												previousPart.calculateTimings()

												const preRollDuration: number = 90
												const pieceWithPreRoll: Piece = EntityDefaultFactory.createPiece({
													preRollDuration,
												} as PieceInterface)
												const testee: Part = EntityDefaultFactory.createPart({
													pieces: [pieceWithPreRoll],
												} as PartInterface)

												testee.calculateTimings(previousPart)

												const result: PartTimings = testee.getTimings()
												expect(result.previousPartContinueIntoPartDuration).toBe(
													keepAliveDurationHigherThanPreRollDuration
												)
											})
										})
									})
								})

								describe('previous Part.keepAlive is lower than this Part.preRoll - the Part.delayPieces', () => {
									it('returns this Part.preRoll as "inTransitionStart"', () => {
										const keepAliveDurationLowerThanPreRollDuration: number = 100
										const previousPart: Part = EntityDefaultFactory.createPart({
											outTransition: {
												keepAliveDuration: keepAliveDurationLowerThanPreRollDuration,
											},
										} as PartInterface)
										previousPart.calculateTimings()

										const preRollDuration: number = 200
										const pieceWithPreRoll: Piece = EntityDefaultFactory.createPiece({
											preRollDuration,
										} as PieceInterface)
										const testee: Part = EntityDefaultFactory.createPart({
											pieces: [pieceWithPreRoll],
										} as PartInterface)

										testee.calculateTimings(previousPart)

										const result: PartTimings = testee.getTimings()
										expect(result.inTransitionStart).toBe(preRollDuration)
									})

									describe('this Part has "delayPiecesDuration"', () => {
										it('returns this Part.preRollDuration for "delayStartOfPiecesDuration"', () => {
											const keepAliveDurationLowerThanPreRollDurationMinusDelayPiecesDuration: number = 100
											const previousPart: Part = EntityDefaultFactory.createPart({
												outTransition: {
													keepAliveDuration:
														keepAliveDurationLowerThanPreRollDurationMinusDelayPiecesDuration,
												},
											} as PartInterface)
											previousPart.calculateTimings()

											const delayPiecesDuration: number = 40
											const preRollDuration: number = 200
											const pieceWithPreRoll: Piece = EntityDefaultFactory.createPiece({
												preRollDuration,
											} as PieceInterface)
											const testee: Part = EntityDefaultFactory.createPart({
												inTransition: { delayPiecesDuration },
												pieces: [pieceWithPreRoll],
											} as PartInterface)

											testee.calculateTimings(previousPart)

											const result: PartTimings = testee.getTimings()
											expect(result.delayStartOfPiecesDuration).toBe(preRollDuration)
										})

										describe('previous Part has PostRoll', () => {
											it('returns this Part.preRollDuration - this Part.delayPiecesDuration + previous Part.postRoll for "previousPartContinueIntoPartDuration"', () => {
												const keepAliveDurationLowerThanPreRollDurationMinusDelayPiecesDuration: number = 100
												const postRollDuration: number = 70
												const pieceWithPostRoll: Piece = EntityDefaultFactory.createPiece({
													postRollDuration,
												} as PieceInterface)
												const previousPart: Part = EntityDefaultFactory.createPart({
													outTransition: {
														keepAliveDuration:
															keepAliveDurationLowerThanPreRollDurationMinusDelayPiecesDuration,
													},
													pieces: [pieceWithPostRoll],
												} as PartInterface)
												previousPart.calculateTimings()

												const delayPiecesDuration: number = 40
												const preRollDuration: number = 200
												const pieceWithPreRoll: Piece = EntityDefaultFactory.createPiece({
													preRollDuration,
												} as PieceInterface)
												const testee: Part = EntityDefaultFactory.createPart({
													inTransition: { delayPiecesDuration },
													pieces: [pieceWithPreRoll],
												} as PartInterface)

												testee.calculateTimings(previousPart)

												const result: PartTimings = testee.getTimings()
												expect(result.previousPartContinueIntoPartDuration).toBe(
													preRollDuration - delayPiecesDuration + postRollDuration
												)
											})
										})

										describe('previous Part does not have PostRoll', () => {
											it('returns this Part.preRollDuration - this Part.delayPiecesDuration for "previousPartContinueIntoPartDuration"', () => {
												const keepAliveDurationLowerThanPreRollDurationMinusDelayPiecesDuration: number = 100
												const previousPart: Part = EntityDefaultFactory.createPart({
													outTransition: {
														keepAliveDuration:
															keepAliveDurationLowerThanPreRollDurationMinusDelayPiecesDuration,
													},
												} as PartInterface)
												previousPart.calculateTimings()

												const delayPiecesDuration: number = 40
												const preRollDuration: number = 200
												const pieceWithPreRoll: Piece = EntityDefaultFactory.createPiece({
													preRollDuration,
												} as PieceInterface)
												const testee: Part = EntityDefaultFactory.createPart({
													inTransition: { delayPiecesDuration },
													pieces: [pieceWithPreRoll],
												} as PartInterface)

												testee.calculateTimings(previousPart)

												const result: PartTimings = testee.getTimings()
												expect(result.previousPartContinueIntoPartDuration).toBe(
													preRollDuration - delayPiecesDuration
												)
											})
										})
									})

									describe('this Part does not have "delayPiecesDuration"', () => {
										it('returns this Part.preRollDuration for "delayStartOfPiecesDuration"', () => {
											const keepAliveDurationLowerThanPreRollDuration: number = 100
											const previousPart: Part = EntityDefaultFactory.createPart({
												outTransition: {
													keepAliveDuration: keepAliveDurationLowerThanPreRollDuration,
												},
											} as PartInterface)
											previousPart.calculateTimings()

											const preRollDuration: number = 200
											const pieceWithPreRoll: Piece = EntityDefaultFactory.createPiece({
												preRollDuration: preRollDuration,
											} as PieceInterface)
											const testee: Part = EntityDefaultFactory.createPart({
												pieces: [pieceWithPreRoll],
											} as PartInterface)

											testee.calculateTimings(previousPart)

											const result: PartTimings = testee.getTimings()
											expect(result.delayStartOfPiecesDuration).toBe(preRollDuration)
										})

										describe('previous Part has PostRoll', () => {
											it('returns this Part.preRollDuration + previous Part.postRoll for "previousPartContinueIntoPartDuration"', () => {
												const keepAliveDurationLowerThanPreRollDuration: number = 100
												const postRollDuration: number = 70
												const pieceWithPostRoll: Piece = EntityDefaultFactory.createPiece({
													postRollDuration,
												} as PieceInterface)
												const previousPart: Part = EntityDefaultFactory.createPart({
													outTransition: {
														keepAliveDuration: keepAliveDurationLowerThanPreRollDuration,
													},
													pieces: [pieceWithPostRoll],
												} as PartInterface)
												previousPart.calculateTimings()

												const preRollDuration: number = 200
												const pieceWithPreRoll: Piece = EntityDefaultFactory.createPiece({
													preRollDuration: preRollDuration,
												} as PieceInterface)
												const testee: Part = EntityDefaultFactory.createPart({
													pieces: [pieceWithPreRoll],
												} as PartInterface)

												testee.calculateTimings(previousPart)

												const result: PartTimings = testee.getTimings()
												expect(result.previousPartContinueIntoPartDuration).toBe(
													preRollDuration + postRollDuration
												)
											})
										})

										describe('previous Part does not have PostRoll', () => {
											it('returns this Part.preRollDuration for "previousPartContinueIntoPartDuration"', () => {
												const keepAliveDurationLowerThanPreRollDuration: number = 100
												const previousPart: Part = EntityDefaultFactory.createPart({
													outTransition: {
														keepAliveDuration: keepAliveDurationLowerThanPreRollDuration,
													},
												} as PartInterface)
												previousPart.calculateTimings()

												const preRollDuration: number = 200
												const pieceWithPreRoll: Piece = EntityDefaultFactory.createPiece({
													preRollDuration: preRollDuration,
												} as PieceInterface)
												const testee: Part = EntityDefaultFactory.createPart({
													pieces: [pieceWithPreRoll],
												} as PartInterface)

												testee.calculateTimings(previousPart)

												const result: PartTimings = testee.getTimings()
												expect(result.previousPartContinueIntoPartDuration).toBe(
													preRollDuration
												)
											})
										})
									})
								})
							})
						})

						describe('previous Part does not have "keepAliveDuration"', () => {
							describe('this Part has PreRoll', () => {
								it('returns this Part.preRoll as "inTransitionStart"', () => {
									const previousPart: Part = EntityDefaultFactory.createPart({} as PartInterface)
									previousPart.calculateTimings()

									const preRollDuration: number = 200
									const pieceWithPreRoll: Piece = EntityDefaultFactory.createPiece({
										preRollDuration: preRollDuration,
									} as PieceInterface)
									const testee: Part = EntityDefaultFactory.createPart({
										pieces: [pieceWithPreRoll],
									} as PartInterface)

									testee.calculateTimings(previousPart)

									const result: PartTimings = testee.getTimings()
									expect(result.inTransitionStart).toBe(preRollDuration)
								})

								describe('this Part have "delayPiecesDuration"', () => {
									it('returns this Part.preRollDuration for "delayStartOfPiecesDuration"', () => {
										const previousPart: Part = EntityDefaultFactory.createPart({} as PartInterface)
										previousPart.calculateTimings()

										const delayPiecesDuration: number = 40
										const preRollDuration: number = 200
										const pieceWithPreRoll: Piece = EntityDefaultFactory.createPiece({
											preRollDuration: preRollDuration,
										} as PieceInterface)
										const testee: Part = EntityDefaultFactory.createPart({
											inTransition: { delayPiecesDuration },
											pieces: [pieceWithPreRoll],
										} as PartInterface)

										testee.calculateTimings(previousPart)

										const result: PartTimings = testee.getTimings()
										expect(result.delayStartOfPiecesDuration).toBe(preRollDuration)
									})

									describe('previous Part has PostRoll', () => {
										it('returns this Part.preRollDuration - this Part.delayPiecesDuration + previous Part.postRoll for "previousPartContinueIntoPartDuration"', () => {
											const postRollDuration: number = 70
											const pieceWithPostRoll: Piece = EntityDefaultFactory.createPiece({
												postRollDuration,
											} as PieceInterface)
											const previousPart: Part = EntityDefaultFactory.createPart({
												pieces: [pieceWithPostRoll],
											} as PartInterface)
											previousPart.calculateTimings()

											const delayPiecesDuration: number = 40
											const preRollDuration: number = 200
											const pieceWithPreRoll: Piece = EntityDefaultFactory.createPiece({
												preRollDuration: preRollDuration,
											} as PieceInterface)
											const testee: Part = EntityDefaultFactory.createPart({
												inTransition: { delayPiecesDuration },
												pieces: [pieceWithPreRoll],
											} as PartInterface)

											testee.calculateTimings(previousPart)

											const result: PartTimings = testee.getTimings()
											expect(result.previousPartContinueIntoPartDuration).toBe(
												preRollDuration - delayPiecesDuration + postRollDuration
											)
										})
									})

									describe('previous Part does not have PostRoll', () => {
										it('returns this Part.preRollDuration - this Part.delayPiecesDuration for "previousPartContinueIntoPartDuration"', () => {
											const previousPart: Part = EntityDefaultFactory.createPart(
												{} as PartInterface
											)
											previousPart.calculateTimings()

											const delayPiecesDuration: number = 40
											const preRollDuration: number = 200
											const pieceWithPreRoll: Piece = EntityDefaultFactory.createPiece({
												preRollDuration: preRollDuration,
											} as PieceInterface)
											const testee: Part = EntityDefaultFactory.createPart({
												inTransition: { delayPiecesDuration },
												pieces: [pieceWithPreRoll],
											} as PartInterface)

											testee.calculateTimings(previousPart)

											const result: PartTimings = testee.getTimings()
											expect(result.previousPartContinueIntoPartDuration).toBe(
												preRollDuration - delayPiecesDuration
											)
										})
									})
								})

								describe('this Part does not have "delayPiecesDuration"', () => {
									it('returns this Part.preRollDuration for "delayStartOfPiecesDuration"', () => {
										const previousPart: Part = EntityDefaultFactory.createPart({} as PartInterface)
										previousPart.calculateTimings()

										const preRollDuration: number = 200
										const pieceWithPreRoll: Piece = EntityDefaultFactory.createPiece({
											preRollDuration: preRollDuration,
										} as PieceInterface)
										const testee: Part = EntityDefaultFactory.createPart({
											pieces: [pieceWithPreRoll],
										} as PartInterface)

										testee.calculateTimings(previousPart)

										const result: PartTimings = testee.getTimings()
										expect(result.delayStartOfPiecesDuration).toBe(preRollDuration)
									})

									describe('previous Part has PostRoll', () => {
										it('returns this Part.preRollDuration + previous Part.postRoll for "previousPartContinueIntoPartDuration"', () => {
											const postRollDuration: number = 70
											const pieceWithPostRoll: Piece = EntityDefaultFactory.createPiece({
												postRollDuration,
											} as PieceInterface)
											const previousPart: Part = EntityDefaultFactory.createPart({
												pieces: [pieceWithPostRoll],
											} as PartInterface)
											previousPart.calculateTimings()

											const preRollDuration: number = 200
											const pieceWithPreRoll: Piece = EntityDefaultFactory.createPiece({
												preRollDuration: preRollDuration,
											} as PieceInterface)
											const testee: Part = EntityDefaultFactory.createPart({
												pieces: [pieceWithPreRoll],
											} as PartInterface)

											testee.calculateTimings(previousPart)

											const result: PartTimings = testee.getTimings()
											expect(result.previousPartContinueIntoPartDuration).toBe(
												preRollDuration + postRollDuration
											)
										})
									})

									describe('previous Part does not have PostRoll', () => {
										it('returns this Part.preRollDuration for "previousPartContinueIntoPartDuration"', () => {
											const previousPart: Part = EntityDefaultFactory.createPart(
												{} as PartInterface
											)
											previousPart.calculateTimings()

											const preRollDuration: number = 200
											const pieceWithPreRoll: Piece = EntityDefaultFactory.createPiece({
												preRollDuration: preRollDuration,
											} as PieceInterface)
											const testee: Part = EntityDefaultFactory.createPart({
												pieces: [pieceWithPreRoll],
											} as PartInterface)

											testee.calculateTimings(previousPart)

											const result: PartTimings = testee.getTimings()
											expect(result.previousPartContinueIntoPartDuration).toBe(preRollDuration)
										})
									})
								})
							})

							describe('this Part does not have PreRoll', () => {
								it('returns zero as "inTransitionStart"', () => {
									const previousPart: Part = EntityDefaultFactory.createPart({} as PartInterface)
									previousPart.calculateTimings()

									const testee: Part = EntityDefaultFactory.createPart({} as PartInterface)

									testee.calculateTimings(previousPart)

									const result: PartTimings = testee.getTimings()
									expect(result.inTransitionStart).toBe(0)
								})

								describe('this Part has "delayPiecesDuration"', () => {
									it('returns this Part.delayPiecesDuration for "delayStartOfPiecesDuration"', () => {
										const previousPart: Part = EntityDefaultFactory.createPart({} as PartInterface)
										previousPart.calculateTimings()

										const delayPiecesDuration: number = 40
										const testee: Part = EntityDefaultFactory.createPart({
											inTransition: { delayPiecesDuration },
										} as PartInterface)

										testee.calculateTimings(previousPart)

										const result: PartTimings = testee.getTimings()
										expect(result.delayStartOfPiecesDuration).toBe(delayPiecesDuration)
									})

									describe('previous Part has PostRoll', () => {
										it('return previous Part.postRoll for "previousPartContinueIntoPartDuration"', () => {
											const postRollDuration: number = 70
											const pieceWithPostRoll: Piece = EntityDefaultFactory.createPiece({
												postRollDuration,
											} as PieceInterface)
											const previousPart: Part = EntityDefaultFactory.createPart({
												pieces: [pieceWithPostRoll],
											} as PartInterface)
											previousPart.calculateTimings()

											const delayPiecesDuration: number = 40
											const testee: Part = EntityDefaultFactory.createPart({
												inTransition: { delayPiecesDuration },
											} as PartInterface)

											testee.calculateTimings(previousPart)

											const result: PartTimings = testee.getTimings()
											expect(result.previousPartContinueIntoPartDuration).toBe(postRollDuration)
										})
									})

									describe('previous Part does not have PostRoll', () => {
										it('returns zero for "previousPartContinueIntoPartDuration"', () => {
											const previousPart: Part = EntityDefaultFactory.createPart(
												{} as PartInterface
											)
											previousPart.calculateTimings()

											const delayPiecesDuration: number = 40
											const testee: Part = EntityDefaultFactory.createPart({
												inTransition: { delayPiecesDuration },
											} as PartInterface)

											testee.calculateTimings(previousPart)

											const result: PartTimings = testee.getTimings()
											expect(result.previousPartContinueIntoPartDuration).toBe(0)
										})
									})
								})

								describe('this Part does not have "delayPiecesDuration"', () => {
									it('returns zero for "delayStartOfPiecesDuration"', () => {
										const previousPart: Part = EntityDefaultFactory.createPart({} as PartInterface)
										previousPart.calculateTimings()

										const testee: Part = EntityDefaultFactory.createPart({} as PartInterface)

										testee.calculateTimings(previousPart)

										const result: PartTimings = testee.getTimings()
										expect(result.delayStartOfPiecesDuration).toBe(0)
									})

									describe('previous Part has PostRoll', () => {
										it('returns previous Part.postRoll for "previousPartContinueIntoPartDuration"', () => {
											const postRollDuration: number = 70
											const pieceWithPostRoll: Piece = EntityDefaultFactory.createPiece({
												postRollDuration,
											} as PieceInterface)
											const previousPart: Part = EntityDefaultFactory.createPart({
												pieces: [pieceWithPostRoll],
											} as PartInterface)
											previousPart.calculateTimings()

											const testee: Part = EntityDefaultFactory.createPart({} as PartInterface)

											testee.calculateTimings(previousPart)

											const result: PartTimings = testee.getTimings()
											expect(result.previousPartContinueIntoPartDuration).toBe(postRollDuration)
										})
									})

									describe('previous Part does not have PostRoll', () => {
										it('returns zero for "previousPartContinueIntoPartDuration"', () => {
											const previousPart: Part = EntityDefaultFactory.createPart(
												{} as PartInterface
											)
											previousPart.calculateTimings()

											const testee: Part = EntityDefaultFactory.createPart({} as PartInterface)

											testee.calculateTimings(previousPart)

											const result: PartTimings = testee.getTimings()
											expect(result.previousPartContinueIntoPartDuration).toBe(0)
										})
									})
								})
							})
						})
					})
				})
			})
		})
	})
})
