import { TimelineBuilder } from '../interfaces/timeline-builder'
import { SuperflyTimelineBuilder } from '../superfly-timeline-builder'
import { EntityMockFactory } from '../../../model/entities/test/entity-mock-factory'
import { Part } from '../../../model/entities/part'
import { Rundown } from '../../../model/entities/rundown'
import { Timeline, TimelineObjectGroup } from '../../../model/entities/timeline'
import { Piece } from '../../../model/entities/piece'
import { TimelineObject } from '../../../model/entities/timeline-object'
import { TransitionType } from '../../../model/enums/transition-type'
import { PieceLifespan } from '../../../model/enums/piece-lifespan'
import { ObjectCloner } from '../interfaces/object-cloner'
import { anything, instance, mock, when } from 'ts-mockito'

const BASELINE_GROUP_ID: string = 'baseline_group'

const ACTIVE_GROUP_PREFIX: string = 'active_group_'
const PREVIOUS_GROUP_PREFIX: string = 'previous_group_'
const NEXT_GROUP_PREFIX: string = 'next_group_'
const INFINITE_GROUP_PREFIX: string = 'infinite_group_'
const PIECE_PRE_ROLL_PREFIX: string = 'pre_roll_'

const PIECE_CONTROL_INFIX: string = '_piece_control_'
const PIECE_GROUP_INFIX: string = '_piece_group_'

const HIGH_PRIORITY: number = 5
const MEDIUM_PRIORITY: number = 1
const BASELINE_PRIORITY: number = 0
const LOW_PRIORITY: number = -1

describe('superfly-timeline-builder', () => {
	describe('buildTimeline', () => {
		describe('for baseline', () => {
			describe('it creates a group for the baseline', () => {
				it('sets the correct baseline group id', () => {
					const rundown: Rundown = EntityMockFactory.createActiveRundown()

					const testee: TimelineBuilder = createTestee()
					const timeline: Timeline = testee.buildTimeline(rundown)

					const baselineGroup: TimelineObjectGroup | undefined = timeline.timelineGroups.find(
						(group) => group.id === BASELINE_GROUP_ID
					)
					expect(baselineGroup).not.toBeUndefined()
				})

				it('sets the enable to while="1"', () => {
					const rundown: Rundown = EntityMockFactory.createActiveRundown()

					const testee: TimelineBuilder = createTestee()
					const timeline: Timeline = testee.buildTimeline(rundown)

					const baselineGroup: TimelineObjectGroup = timeline.timelineGroups.find(
						(group) => group.id === BASELINE_GROUP_ID
					)!
					expect(baselineGroup.enable.while).toBe('1')
				})

				it('sets an empty layer', () => {
					const rundown: Rundown = EntityMockFactory.createActiveRundown()

					const testee: TimelineBuilder = createTestee()
					const timeline: Timeline = testee.buildTimeline(rundown)

					const baselineGroup: TimelineObjectGroup = timeline.timelineGroups.find(
						(group) => group.id === BASELINE_GROUP_ID
					)!
					expect(baselineGroup.layer).toBe('')
				})

				it('sets priority to "baseline" priority', () => {
					const rundown: Rundown = EntityMockFactory.createActiveRundown()

					const testee: TimelineBuilder = createTestee()
					const timeline: Timeline = testee.buildTimeline(rundown)

					const baselineGroup: TimelineObjectGroup = timeline.timelineGroups.find(
						(group) => group.id === BASELINE_GROUP_ID
					)!
					expect(baselineGroup.priority).toBe(BASELINE_PRIORITY)
				})

				it('sets the children to the baseline objects of the Rundown', () => {
					const baselineTimelineObjects: TimelineObject[] = [
						{ id: 'object1' } as TimelineObject,
						{ id: 'object2' } as TimelineObject,
						{ id: 'object3' } as TimelineObject,
						{ id: 'object4' } as TimelineObject,
					]
					const rundown: Rundown = EntityMockFactory.createActiveRundown({}, { baselineTimelineObjects })

					const testee: TimelineBuilder = createTestee()
					const timeline: Timeline = testee.buildTimeline(rundown)

					const baselineGroup: TimelineObjectGroup = timeline.timelineGroups.find(
						(group) => group.id === BASELINE_GROUP_ID
					)!
					const timelineObjectIds: string[] = baselineGroup.children.map(
						(timelineObject) => timelineObject.id
					)
					expect(timelineObjectIds).toHaveLength(baselineTimelineObjects.length)
					baselineTimelineObjects.forEach((timelineObject) =>
						expect(timelineObjectIds).toContainEqual(timelineObject.id)
					)
				})
			})
		})

		describe('for active Part', () => {
			describe('it creates a group for active Part', () => {
				it('sets correct active group id for the active Part', () => {
					const rundown: Rundown = EntityMockFactory.createActiveRundown()

					const testee: TimelineBuilder = createTestee()
					const timeline: Timeline = testee.buildTimeline(rundown)

					const expectedGroupIdForPart = `${ACTIVE_GROUP_PREFIX}${rundown.getActivePart().id}`
					const result: TimelineObjectGroup | undefined = timeline.timelineGroups.find(
						(group) => group.id === expectedGroupIdForPart
					)

					// If the result is undefined it means the active group Part was not created or created with incorrect id.
					expect(result).not.toBeUndefined()
				})

				it('sets TimelineEnable.start set to now', () => {
					const now: number = Date.now()
					jest.useFakeTimers('modern').setSystemTime(now)

					const rundown: Rundown = EntityMockFactory.createActiveRundown()

					const testee: TimelineBuilder = createTestee()
					const timeline: Timeline = testee.buildTimeline(rundown)

					const result: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
						group.id.includes(ACTIVE_GROUP_PREFIX)
					)!

					expect(result.enable.start).toBe(now)
				})

				it('sets an empty layer', () => {
					const rundown: Rundown = EntityMockFactory.createActiveRundown()

					const testee: TimelineBuilder = createTestee()
					const timeline: Timeline = testee.buildTimeline(rundown)

					const result: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
						group.id.includes(ACTIVE_GROUP_PREFIX)
					)!

					expect(result.layer).toBe('')
				})

				it('sets priority to high', () => {
					const rundown: Rundown = EntityMockFactory.createActiveRundown()

					const testee: TimelineBuilder = createTestee()
					const timeline: Timeline = testee.buildTimeline(rundown)

					const result: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
						group.id.includes(ACTIVE_GROUP_PREFIX)
					)!

					expect(result.priority).toBe(HIGH_PRIORITY)
				})
			})

			describe("active Part doesn't have any Pieces", () => {
				it("don't create any children for active Part group", () => {
					const rundown: Rundown = EntityMockFactory.createActiveRundown()

					const testee: TimelineBuilder = createTestee()
					const timeline: Timeline = testee.buildTimeline(rundown)

					const result: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
						group.id.includes(ACTIVE_GROUP_PREFIX)
					)!

					expect(result.children).toHaveLength(0)
				})
			})

			describe('active Part has one Piece', () => {
				describe('creates a Piece control group on the active group', () => {
					it('sets correct control group id for Piece on active group', () => {
						const piece: Piece = EntityMockFactory.createPiece({
							transitionType: TransitionType.NO_TRANSITION,
						})
						const activePart: Part = EntityMockFactory.createPart({ pieces: [piece] })
						const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart })

						const testee: TimelineBuilder = createTestee()
						const timeline: Timeline = testee.buildTimeline(rundown)

						const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
							group.id.includes(ACTIVE_GROUP_PREFIX)
						)!
						const expectedControlIdForPiece = `${activeGroup.id}${PIECE_CONTROL_INFIX}${piece.id}`
						const controlGroup: TimelineObject | undefined = activeGroup.children.find(
							(child) => child.id === expectedControlIdForPiece
						)

						expect(controlGroup).not.toBeUndefined()
					})

					it('sets correct parentGroup id', () => {
						const piece: Piece = EntityMockFactory.createPiece({
							transitionType: TransitionType.NO_TRANSITION,
						})
						const activePart: Part = EntityMockFactory.createPart({ pieces: [piece] })
						const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart })

						const testee: TimelineBuilder = createTestee()
						const timeline: Timeline = testee.buildTimeline(rundown)

						const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
							group.id.includes(ACTIVE_GROUP_PREFIX)
						)!
						const controlObject: TimelineObject = activeGroup.children.find((child) =>
							child.id.includes(PIECE_CONTROL_INFIX)
						)!

						expect(controlObject.inGroup).toBe(activeGroup.id)
					})

					it('sets layer to Piece.layer', () => {
						const layer: string = 'someLayerForPiece'
						const piece: Piece = EntityMockFactory.createPiece({
							layer,
							transitionType: TransitionType.NO_TRANSITION,
						})
						const activePart: Part = EntityMockFactory.createPart({ pieces: [piece] })
						const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart })

						const testee: TimelineBuilder = createTestee()
						const timeline: Timeline = testee.buildTimeline(rundown)

						const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
							group.id.includes(ACTIVE_GROUP_PREFIX)
						)!
						const controlObject: TimelineObject = activeGroup.children.find((child) =>
							child.id.includes(PIECE_CONTROL_INFIX)
						)!

						expect(controlObject.layer).toBe(layer)
					})

					it('sets priority to MEDIUM', () => {
						const piece: Piece = EntityMockFactory.createPiece({
							transitionType: TransitionType.NO_TRANSITION,
						})
						const activePart: Part = EntityMockFactory.createPart({ pieces: [piece] })
						const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart })

						const testee: TimelineBuilder = createTestee()
						const timeline: Timeline = testee.buildTimeline(rundown)

						const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
							group.id.includes(ACTIVE_GROUP_PREFIX)
						)!
						const controlObject: TimelineObject = activeGroup.children.find((child) =>
							child.id.includes(PIECE_CONTROL_INFIX)
						)!

						expect(controlObject.priority).toBe(MEDIUM_PRIORITY)
					})

					describe('creates TimelineEnable for IN_TRANSITION Piece', () => {
						describe('active Part has an "inTransitionStart"', () => {
							it('sets TimelineEnable.start to Part.timings.inTransitionStart + Piece.start', () => {
								const inTransitionStart: number = 20
								const piece: Piece = EntityMockFactory.createPiece({
									start: 10,
									transitionType: TransitionType.IN_TRANSITION,
								})

								const activePart: Part = EntityMockFactory.createPart(
									{ pieces: [piece] },
									{ partTimings: { inTransitionStart } }
								)
								const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart })

								const testee: TimelineBuilder = createTestee()
								const timeline: Timeline = testee.buildTimeline(rundown)

								const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
									group.id.includes(ACTIVE_GROUP_PREFIX)
								)!
								const controlObject: TimelineObject = activeGroup.children.find((child) =>
									child.id.includes(PIECE_CONTROL_INFIX)
								)!

								expect(controlObject.enable.start).toBe(inTransitionStart + piece.start)
							})

							it('sets TimelineEnable.duration to Piece.duration', () => {
								const piece: Piece = EntityMockFactory.createPiece({
									duration: 15,
									transitionType: TransitionType.IN_TRANSITION,
								})
								const activePart: Part = EntityMockFactory.createPart(
									{ pieces: [piece] },
									{ partTimings: { inTransitionStart: 20 } }
								)
								const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart })

								const testee: TimelineBuilder = createTestee()
								const timeline: Timeline = testee.buildTimeline(rundown)

								const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
									group.id.includes(ACTIVE_GROUP_PREFIX)
								)!
								const controlObject: TimelineObject = activeGroup.children.find((child) =>
									child.id.includes(PIECE_CONTROL_INFIX)
								)!

								expect(controlObject.enable.duration).toBe(piece.duration)
							})
						})

						describe('active Part does not have an "inTransitionStart"', () => {
							it('does not create any groups for Piece', () => {
								const piece: Piece = EntityMockFactory.createPiece({
									transitionType: TransitionType.IN_TRANSITION,
								})
								const activePart: Part = EntityMockFactory.createPart({
									pieces: [piece],
								})
								const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart })

								const testee: TimelineBuilder = createTestee()
								const timeline: Timeline = testee.buildTimeline(rundown)

								const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
									group.id.includes(ACTIVE_GROUP_PREFIX)
								)!
								const expectedControlIdForPiece = `${activeGroup.id}${PIECE_CONTROL_INFIX}${piece.id}`
								const controlObject: TimelineObject | undefined = activeGroup.children.find(
									(child) => child.id === expectedControlIdForPiece
								)

								expect(controlObject).toBeUndefined()
							})
						})
					})

					describe('creates TimelineEnable for OUT_TRANSITION Piece', () => {
						describe('active Part has a "KeepAliveDuration"', () => {
							describe('active Part has a PostRollDuration', () => {
								it('sets TimelineEnable.start to activeGroup.end - Part.keepAliveDuration - Part.postRollDuration', () => {
									const piece: Piece = EntityMockFactory.createPiece({
										transitionType: TransitionType.OUT_TRANSITION,
									})

									const postRollDuration: number = 20
									const keepAliveDuration: number = 30

									const activePart: Part = EntityMockFactory.createPart(
										{
											outTransition: { keepAliveDuration },
											pieces: [piece],
										},
										{ partTimings: { postRollDuration } }
									)
									const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart })

									const testee: TimelineBuilder = createTestee()
									const timeline: Timeline = testee.buildTimeline(rundown)

									const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
										group.id.includes(ACTIVE_GROUP_PREFIX)
									)!
									const controlObject: TimelineObject = activeGroup.children.find((child) =>
										child.id.includes(PIECE_CONTROL_INFIX)
									)!

									expect(controlObject.enable.start).toBe(
										`#${activeGroup.id}.end - ${keepAliveDuration} - ${postRollDuration}`
									)
								})
							})

							describe('active Part does not have a PostRollDuration', () => {
								it('sets TimelineEnable.start to activeGroup.end - Part.keepAliveDuration', () => {
									const piece: Piece = EntityMockFactory.createPiece({
										transitionType: TransitionType.OUT_TRANSITION,
									})

									const keepAliveDuration: number = 30

									const activePart: Part = EntityMockFactory.createPart({
										outTransition: { keepAliveDuration },
										pieces: [piece],
									})
									const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart })

									const testee: TimelineBuilder = createTestee()
									const timeline: Timeline = testee.buildTimeline(rundown)

									const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
										group.id.includes(ACTIVE_GROUP_PREFIX)
									)!
									const controlObject: TimelineObject = activeGroup.children.find((child) =>
										child.id.includes(PIECE_CONTROL_INFIX)
									)!

									expect(controlObject.enable.start).toBe(
										`#${activeGroup.id}.end - ${keepAliveDuration}`
									)
								})
							})
						})

						describe('active Part does not have a "KeepAliveDuration"', () => {
							it('does not create any groups for Piece', () => {
								const piece: Piece = EntityMockFactory.createPiece({
									transitionType: TransitionType.OUT_TRANSITION,
								})
								const activePart: Part = EntityMockFactory.createPart({
									pieces: [piece],
								})
								const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart })

								const testee: TimelineBuilder = createTestee()
								const timeline: Timeline = testee.buildTimeline(rundown)

								const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
									group.id.includes(ACTIVE_GROUP_PREFIX)
								)!
								const controlObject: TimelineObject | undefined = activeGroup.children.find(
									(child) => child.id === `${activeGroup.id}${PIECE_CONTROL_INFIX}${piece.id}`
								)

								expect(controlObject).toBeUndefined()
							})
						})
					})

					describe('creates TimelineEnable for NO_TRANSITION Piece', () => {
						it('sets TimelineEnable.start to Piece.start', () => {
							const piece: Piece = EntityMockFactory.createPiece({
								start: 5,
								transitionType: TransitionType.NO_TRANSITION,
							})
							const activePart: Part = EntityMockFactory.createPart({ pieces: [piece] })
							const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart })

							const testee: TimelineBuilder = createTestee()
							const timeline: Timeline = testee.buildTimeline(rundown)

							const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
								group.id.includes(ACTIVE_GROUP_PREFIX)
							)!
							const controlObject: TimelineObject = activeGroup.children.find((child) =>
								child.id.includes(PIECE_CONTROL_INFIX)
							)!

							expect(controlObject.enable.start).toBe(piece.start)
						})

						describe('Piece has a duration', () => {
							it('sets TimelineEnable.duration to Piece.duration', () => {
								const piece: Piece = EntityMockFactory.createPiece({
									duration: 50,
									transitionType: TransitionType.NO_TRANSITION,
								})
								const activePart: Part = EntityMockFactory.createPart({
									pieces: [piece],
								})
								const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart })

								const testee: TimelineBuilder = createTestee()
								const timeline: Timeline = testee.buildTimeline(rundown)

								const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
									group.id.includes(ACTIVE_GROUP_PREFIX)
								)!
								const controlObject: TimelineObject = activeGroup.children.find((child) =>
									child.id.includes(PIECE_CONTROL_INFIX)
								)!

								expect(controlObject.enable.duration).toBe(piece.duration)
							})
						})

						describe('Piece does not have a duration', () => {
							describe('active Part has PostRoll', () => {
								it('sets TimelineEnable.duration activeGroup.end - Part.timings.postRollDuration', () => {
									const piece: Piece = EntityMockFactory.createPiece({
										transitionType: TransitionType.NO_TRANSITION,
									})

									const postRollDuration: number = 20

									const activePart: Part = EntityMockFactory.createPart(
										{ pieces: [piece] },
										{ partTimings: { postRollDuration } }
									)
									const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart })

									const testee: TimelineBuilder = createTestee()
									const timeline: Timeline = testee.buildTimeline(rundown)

									const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
										group.id.includes(ACTIVE_GROUP_PREFIX)
									)!
									const controlObject: TimelineObject = activeGroup.children.find((child) =>
										child.id.includes(PIECE_CONTROL_INFIX)
									)!

									expect(controlObject.enable.duration).toBe(
										`#${activeGroup.id} - ${postRollDuration}`
									)
								})
							})

							describe('active Part does not have PostRoll', () => {
								it('sets TimelineEnable.duration to be zero', () => {
									const piece: Piece = EntityMockFactory.createPiece({
										transitionType: TransitionType.NO_TRANSITION,
									})
									const activePart: Part = EntityMockFactory.createPart({
										pieces: [piece],
									})
									const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart })

									const testee: TimelineBuilder = createTestee()
									const timeline: Timeline = testee.buildTimeline(rundown)

									const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
										group.id.includes(ACTIVE_GROUP_PREFIX)
									)!
									const controlObject: TimelineObject = activeGroup.children.find((child) =>
										child.id.includes(PIECE_CONTROL_INFIX)
									)!

									expect(controlObject.enable.duration).toBe(0)
								})
							})
						})
					})

					describe('controlGroup has TimelineEnable.start === zero && Piece has PreRoll', () => {
						describe('creates PreRollControlGroup for Piece', () => {
							it('sets id to correct id for PreRollControlGroup', () => {
								const piece: Piece = EntityMockFactory.createPiece({
									start: 0,
									preRollDuration: 10,
									transitionType: TransitionType.NO_TRANSITION,
								})
								const activePart: Part = EntityMockFactory.createPart({
									pieces: [piece],
								})
								const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart })

								const testee: TimelineBuilder = createTestee()
								const timeline: Timeline = testee.buildTimeline(rundown)

								const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
									group.id.includes(ACTIVE_GROUP_PREFIX)
								)!
								const controlObject: TimelineObject = activeGroup.children.find(
									(child) => child.id === `${activeGroup.id}${PIECE_CONTROL_INFIX}${piece.id}`
								)!
								const expectedPreRollIdForPiece: string = `${PIECE_PRE_ROLL_PREFIX}${controlObject.id}`
								const preRollObject: TimelineObject | undefined = activeGroup.children.find(
									(child) => child.id === expectedPreRollIdForPiece
								)

								expect(preRollObject).not.toBeUndefined()
							})

							it('sets TimelineEnable.start to "activeGroup.id.start"', () => {
								const piece: Piece = EntityMockFactory.createPiece({
									start: 0,
									preRollDuration: 10,
									transitionType: TransitionType.NO_TRANSITION,
								})
								const activePart: Part = EntityMockFactory.createPart({
									pieces: [piece],
								})
								const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart })

								const testee: TimelineBuilder = createTestee()
								const timeline: Timeline = testee.buildTimeline(rundown)

								const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
									group.id.includes(ACTIVE_GROUP_PREFIX)
								)!
								const preRollObject: TimelineObject = activeGroup.children.find((child) =>
									child.id.includes(PIECE_PRE_ROLL_PREFIX)
								)!

								expect(preRollObject.enable.start).toBe(`#${activeGroup.id}.start`)
							})

							it('sets an empty layer', () => {
								const piece: Piece = EntityMockFactory.createPiece({
									start: 0,
									preRollDuration: 10,
									transitionType: TransitionType.NO_TRANSITION,
								})
								const activePart: Part = EntityMockFactory.createPart({
									pieces: [piece],
								})
								const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart })

								const testee: TimelineBuilder = createTestee()
								const timeline: Timeline = testee.buildTimeline(rundown)

								const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
									group.id.includes(ACTIVE_GROUP_PREFIX)
								)!
								const preRollObject: TimelineObject = activeGroup.children.find((child) =>
									child.id.includes(PIECE_PRE_ROLL_PREFIX)
								)!

								expect(preRollObject.layer).toBe('')
							})

							it('updates controlPiece to start at PreRollControlGroup + Piece.preRollDuration', () => {
								const piece: Piece = EntityMockFactory.createPiece({
									start: 0,
									preRollDuration: 10,
									transitionType: TransitionType.NO_TRANSITION,
								})
								const activePart: Part = EntityMockFactory.createPart({
									pieces: [piece],
								})
								const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart })

								const testee: TimelineBuilder = createTestee()
								const timeline: Timeline = testee.buildTimeline(rundown)

								const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
									group.id.includes(ACTIVE_GROUP_PREFIX)
								)!
								const controlObject: TimelineObject = activeGroup.children.find((child) =>
									child.id.includes(PIECE_CONTROL_INFIX)
								)!
								const preRollObject: TimelineObject = activeGroup.children.find((child) =>
									child.id.includes(PIECE_PRE_ROLL_PREFIX)
								)!

								expect(controlObject.enable.start).toBe(
									`#${preRollObject.id} + ${piece.preRollDuration}`
								)
							})
						})
					})
				})

				describe('create a Piece child group on the active group', () => {
					it('sets correct Piece group id for Piece on active group', () => {
						const piece: Piece = EntityMockFactory.createPiece({
							transitionType: TransitionType.NO_TRANSITION,
						})
						const activePart: Part = EntityMockFactory.createPart({ pieces: [piece] })
						const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart })

						const testee: TimelineBuilder = createTestee()
						const timeline: Timeline = testee.buildTimeline(rundown)

						const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
							group.id.includes(ACTIVE_GROUP_PREFIX)
						)!
						const expectedChildGroupIdForPiece: string = `${activeGroup.id}${PIECE_GROUP_INFIX}${piece.id}`
						const childGroup: TimelineObject | undefined = activeGroup.children.find(
							(child) => child.id === expectedChildGroupIdForPiece
						)

						expect(childGroup).not.toBeUndefined()
					})

					it('sets correct parentGroup id', () => {
						const piece: Piece = EntityMockFactory.createPiece({
							transitionType: TransitionType.NO_TRANSITION,
						})
						const activePart: Part = EntityMockFactory.createPart({ pieces: [piece] })
						const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart })

						const testee: TimelineBuilder = createTestee()
						const timeline: Timeline = testee.buildTimeline(rundown)

						const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
							group.id.includes(ACTIVE_GROUP_PREFIX)
						)!
						const childGroup: TimelineObject = activeGroup.children.find((child) =>
							child.id.includes(PIECE_GROUP_INFIX)
						)!

						expect(childGroup.inGroup).toBe(activeGroup.id)
					})

					it('sets an empty layer', () => {
						const piece: Piece = EntityMockFactory.createPiece({
							transitionType: TransitionType.NO_TRANSITION,
						})
						const activePart: Part = EntityMockFactory.createPart({ pieces: [piece] })
						const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart })

						const testee: TimelineBuilder = createTestee()
						const timeline: Timeline = testee.buildTimeline(rundown)

						const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
							group.id.includes(ACTIVE_GROUP_PREFIX)
						)!
						const childGroup: TimelineObject = activeGroup.children.find((child) =>
							child.id.includes(PIECE_GROUP_INFIX)
						)!

						expect(childGroup.layer).toBe('')
					})

					describe('Piece has PreRoll', () => {
						it('sets TimelineEnable.start PieceControlGroup.start - Piece.preRollDuration', () => {
							const piece: Piece = EntityMockFactory.createPiece({
								preRollDuration: 20,
								transitionType: TransitionType.NO_TRANSITION,
							})
							const activePart: Part = EntityMockFactory.createPart({ pieces: [piece] })
							const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart })

							const testee: TimelineBuilder = createTestee()
							const timeline: Timeline = testee.buildTimeline(rundown)

							const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
								group.id.includes(ACTIVE_GROUP_PREFIX)
							)!
							const controlObject: TimelineObject = activeGroup.children.find(
								(child) => child.id === `${activeGroup.id}${PIECE_CONTROL_INFIX}${piece.id}`
							)!
							const childGroup: TimelineObject = activeGroup.children.find((child) =>
								child.id.includes(PIECE_GROUP_INFIX)
							)!

							expect(childGroup.enable.start).toBe(
								`#${controlObject.id}.start - ${piece.preRollDuration}`
							)
						})
					})

					describe('Piece does not have PreRoll', () => {
						it('sets TimelineEnable.start to PieceControlGroup.start', () => {
							const piece: Piece = EntityMockFactory.createPiece({
								transitionType: TransitionType.NO_TRANSITION,
							})
							const activePart: Part = EntityMockFactory.createPart({ pieces: [piece] })
							const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart })

							const testee: TimelineBuilder = createTestee()
							const timeline: Timeline = testee.buildTimeline(rundown)

							const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
								group.id.includes(ACTIVE_GROUP_PREFIX)
							)!
							const controlObject: TimelineObject = activeGroup.children.find((child) =>
								child.id.includes(PIECE_CONTROL_INFIX)
							)!
							const childGroup: TimelineObject = activeGroup.children.find((child) =>
								child.id.includes(PIECE_GROUP_INFIX)
							)!

							expect(childGroup.enable.start).toBe(`#${controlObject.id}.start`)
						})
					})

					describe('Piece has PostRoll', () => {
						it('sets TimelineEnable.end to PieceControlGroup.end - Piece.postRollDuration', () => {
							const piece: Piece = EntityMockFactory.createPiece({
								postRollDuration: 30,
								transitionType: TransitionType.NO_TRANSITION,
							})
							const activePart: Part = EntityMockFactory.createPart({ pieces: [piece] })
							const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart })

							const testee: TimelineBuilder = createTestee()
							const timeline: Timeline = testee.buildTimeline(rundown)

							const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
								group.id.includes(ACTIVE_GROUP_PREFIX)
							)!
							const controlObject: TimelineObject = activeGroup.children.find((child) =>
								child.id.includes(PIECE_CONTROL_INFIX)
							)!
							const childGroup: TimelineObject = activeGroup.children.find((child) =>
								child.id.includes(PIECE_GROUP_INFIX)
							)!

							expect(childGroup.enable.end).toBe(`#${controlObject.id}.end - ${piece.postRollDuration}`)
						})
					})

					describe('Piece does not have PostRoll', () => {
						it('sets TimelineEnable.end to PieceControlGroup.end', () => {
							const piece: Piece = EntityMockFactory.createPiece({
								transitionType: TransitionType.NO_TRANSITION,
							})
							const activePart: Part = EntityMockFactory.createPart({ pieces: [piece] })
							const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart })

							const testee: TimelineBuilder = createTestee()
							const timeline: Timeline = testee.buildTimeline(rundown)

							const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
								group.id.includes(ACTIVE_GROUP_PREFIX)
							)!
							const controlObject: TimelineObject = activeGroup.children.find((child) =>
								child.id.includes(PIECE_CONTROL_INFIX)
							)!
							const childGroup: TimelineObject = activeGroup.children.find((child) =>
								child.id.includes(PIECE_GROUP_INFIX)
							)!

							expect(childGroup.enable.end).toBe(`#${controlObject.id}.end`)
						})
					})

					describe('Piece has a TimelineObject', () => {
						it('sets the id of the TimelineObject to be pieceChildGroup.id_piece.id_timelineObject.id', () => {
							const timelineObject: TimelineObject = { id: 'timelineObjectId' } as TimelineObject
							const piece: Piece = EntityMockFactory.createPiece({
								timelineObjects: [timelineObject],
								transitionType: TransitionType.NO_TRANSITION,
							})
							const activePart: Part = EntityMockFactory.createPart({ pieces: [piece] })
							const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart })

							const testee: TimelineBuilder = createTestee()
							const timeline: Timeline = testee.buildTimeline(rundown)

							const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
								group.id.includes(ACTIVE_GROUP_PREFIX)
							)!
							const childGroup: TimelineObjectGroup = activeGroup.children.find((child) =>
								child.id.includes(PIECE_GROUP_INFIX)
							)! as TimelineObjectGroup
							const result: TimelineObject = childGroup.children[0]

							expect(result.id).toBe(`${childGroup.id}_${piece.id}_${timelineObject.id}`)
						})

						it('sets the group of the TimelineObject to be the Piece child group', () => {
							const timelineObject: TimelineObject = { id: 'timelineObjectId' } as TimelineObject
							const piece: Piece = EntityMockFactory.createPiece({
								timelineObjects: [timelineObject],
								transitionType: TransitionType.NO_TRANSITION,
							})
							const activePart: Part = EntityMockFactory.createPart({ pieces: [piece] })
							const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart })

							const testee: TimelineBuilder = createTestee()
							const timeline: Timeline = testee.buildTimeline(rundown)

							const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
								group.id.includes(ACTIVE_GROUP_PREFIX)
							)!
							const childGroup: TimelineObjectGroup = activeGroup.children.find((child) =>
								child.id.includes(PIECE_GROUP_INFIX)
							)! as TimelineObjectGroup
							const result: TimelineObject = childGroup.children[0]

							expect(result.inGroup).toBe(childGroup.id)
						})

						it('has same content as the TimelineObject', () => {
							const content: any = { someContent: 'someContent' }
							const timelineObject: TimelineObject = { id: 'timelineObjectId', content } as TimelineObject
							const piece: Piece = EntityMockFactory.createPiece({
								timelineObjects: [timelineObject],
								transitionType: TransitionType.NO_TRANSITION,
							})
							const activePart: Part = EntityMockFactory.createPart({ pieces: [piece] })
							const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart })

							const objectCloner: ObjectCloner = mock<ObjectCloner>()
							when(objectCloner.clone(timelineObject)).thenReturn(
								JSON.parse(JSON.stringify(timelineObject))
							)

							const testee: TimelineBuilder = createTestee(instance(objectCloner))
							const timeline: Timeline = testee.buildTimeline(rundown)

							const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
								group.id.includes(ACTIVE_GROUP_PREFIX)
							)!
							const childGroup: TimelineObjectGroup = activeGroup.children.find((child) =>
								child.id.includes(PIECE_GROUP_INFIX)
							)! as TimelineObjectGroup
							const result: TimelineObject = childGroup.children[0]

							expect(result.content).toEqual(content)
						})
					})

					describe('Piece has five TimelineObjects', () => {
						it('adds all five TimelineObjects to the children of the Piece child group', () => {
							const timelineObjects: TimelineObject[] = [
								{ id: '1' } as TimelineObject,
								{ id: '2' } as TimelineObject,
								{ id: '3' } as TimelineObject,
								{ id: '4' } as TimelineObject,
								{ id: '5' } as TimelineObject,
							]
							const piece: Piece = EntityMockFactory.createPiece({
								timelineObjects,
								transitionType: TransitionType.NO_TRANSITION,
							})
							const activePart: Part = EntityMockFactory.createPart({ pieces: [piece] })
							const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart })

							const objectCloner: ObjectCloner = mock<ObjectCloner>()
							timelineObjects.forEach((timelineObject) =>
								when(objectCloner.clone(timelineObject)).thenReturn(
									JSON.parse(JSON.stringify(timelineObject))
								)
							)

							const testee: TimelineBuilder = createTestee(instance(objectCloner))
							const timeline: Timeline = testee.buildTimeline(rundown)

							const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
								group.id.includes(ACTIVE_GROUP_PREFIX)
							)!
							const childGroup: TimelineObjectGroup = activeGroup.children.find((child) =>
								child.id.includes(PIECE_GROUP_INFIX)
							)! as TimelineObjectGroup

							const timelineObjectIds: string[] = childGroup.children.map(
								(timelineObject) => timelineObject.id
							)
							timelineObjects.forEach((timelineObject) =>
								expect(timelineObjectIds).toContainEqual(
									`${childGroup.id}_${piece.id}_${timelineObject.id}`
								)
							)
						})
					})
				})
			})

			describe('active Part has five Pieces', () => {
				it('creates five Piece control groups on the active group', () => {
					const pieces: Piece[] = [
						EntityMockFactory.createPiece({
							id: '1',
							transitionType: TransitionType.NO_TRANSITION,
						}),
						EntityMockFactory.createPiece({
							id: '2',
							transitionType: TransitionType.NO_TRANSITION,
						}),
						EntityMockFactory.createPiece({
							id: '3',
							transitionType: TransitionType.NO_TRANSITION,
						}),
						EntityMockFactory.createPiece({
							id: '4',
							transitionType: TransitionType.NO_TRANSITION,
						}),
						EntityMockFactory.createPiece({
							id: '5',
							transitionType: TransitionType.NO_TRANSITION,
						}),
					]
					const activePart: Part = EntityMockFactory.createPart({ pieces })
					const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart })

					const testee: TimelineBuilder = createTestee()
					const timeline: Timeline = testee.buildTimeline(rundown)

					const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
						group.id.includes(ACTIVE_GROUP_PREFIX)
					)!
					const controlGroups: TimelineObject[] = activeGroup.children.filter((child) =>
						child.id.includes(PIECE_CONTROL_INFIX)
					)
					const controlGroupIds: string[] = controlGroups.map((controlGroup) => controlGroup.id)
					pieces.forEach((piece) =>
						expect(controlGroupIds).toContainEqual(`${activeGroup.id}${PIECE_CONTROL_INFIX}${piece.id}`)
					)
				})

				it('creates five Piece child groups on the active group', () => {
					const pieces: Piece[] = [
						EntityMockFactory.createPiece({
							id: '1',
							transitionType: TransitionType.NO_TRANSITION,
						}),
						EntityMockFactory.createPiece({
							id: '2',
							transitionType: TransitionType.NO_TRANSITION,
						}),
						EntityMockFactory.createPiece({
							id: '3',
							transitionType: TransitionType.NO_TRANSITION,
						}),
						EntityMockFactory.createPiece({
							id: '4',
							transitionType: TransitionType.NO_TRANSITION,
						}),
						EntityMockFactory.createPiece({
							id: '5',
							transitionType: TransitionType.NO_TRANSITION,
						}),
					]
					const activePart: Part = EntityMockFactory.createPart({ pieces })
					const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart })

					const testee: TimelineBuilder = createTestee()
					const timeline: Timeline = testee.buildTimeline(rundown)

					const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
						group.id.includes(ACTIVE_GROUP_PREFIX)
					)!
					const childGroups: TimelineObject[] = activeGroup.children.filter((child) =>
						child.id.includes(PIECE_GROUP_INFIX)
					)
					const childGroupIds: string[] = childGroups.map((controlGroup) => controlGroup.id)
					pieces.forEach((piece) =>
						expect(childGroupIds).toContainEqual(`${activeGroup.id}${PIECE_GROUP_INFIX}${piece.id}`)
					)
				})

				describe('four of the Pieces are infinite Pieces', () => {
					it('still creates groups for five Pieces', () => {
						const pieces: Piece[] = [
							EntityMockFactory.createPiece({
								id: '1',
								pieceLifespan: PieceLifespan.WITHIN_PART,
								transitionType: TransitionType.NO_TRANSITION,
							}),
							EntityMockFactory.createPiece({
								id: '2',
								pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
								transitionType: TransitionType.NO_TRANSITION,
							}),
							EntityMockFactory.createPiece({
								id: '3',
								pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
								transitionType: TransitionType.NO_TRANSITION,
							}),
							EntityMockFactory.createPiece({
								id: '4',
								pieceLifespan: PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE,
								transitionType: TransitionType.NO_TRANSITION,
							}),
							EntityMockFactory.createPiece({
								id: '5',
								pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
								transitionType: TransitionType.NO_TRANSITION,
							}),
						]
						const activePart: Part = EntityMockFactory.createPart({ pieces })
						const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart })

						const testee: TimelineBuilder = createTestee()
						const timeline: Timeline = testee.buildTimeline(rundown)

						const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
							group.id.includes(ACTIVE_GROUP_PREFIX)
						)!
						const controlGroups: TimelineObject[] = activeGroup.children.filter((child) =>
							child.id.includes(PIECE_CONTROL_INFIX)
						)
						const controlGroupIds: string[] = controlGroups.map((controlGroup) => controlGroup.id)
						pieces.forEach((piece) =>
							expect(controlGroupIds).toContainEqual(`${activeGroup.id}${PIECE_CONTROL_INFIX}${piece.id}`)
						)
					})
				})
			})
		})

		describe('Rundown has a previous Part', () => {
			describe('previous Part does not have an executedAt', () => {
				it('throws an error', () => {
					const previousPart: Part = EntityMockFactory.createPart({ id: 'previousId' })
					const activePart: Part = EntityMockFactory.createPart({ id: 'activeId' })
					const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart, previousPart })

					const testee: TimelineBuilder = createTestee()

					expect(() => testee.buildTimeline(rundown)).toThrow()
				})
			})

			describe('it creates a group for previous Part', () => {
				it('sets correct previous group id for the previous Part', () => {
					const previousPart: Part = EntityMockFactory.createPart(
						{ id: 'previousId' },
						{
							executedAt: 10,
						}
					)
					const activePart: Part = EntityMockFactory.createPart({ id: 'activeId' })
					const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart, previousPart })

					const testee: TimelineBuilder = createTestee()
					const timeline: Timeline = testee.buildTimeline(rundown)

					const expectedGroupIdForPart: string = `${PREVIOUS_GROUP_PREFIX}${previousPart.id}`
					const result: TimelineObjectGroup | undefined = timeline.timelineGroups.find(
						(group) => group.id === expectedGroupIdForPart
					)

					expect(result).not.toBeUndefined()
				})

				it('sets priority of the group to low', () => {
					const previousPart: Part = EntityMockFactory.createPart(
						{ id: 'previousId' },
						{
							executedAt: 10,
						}
					)
					const activePart: Part = EntityMockFactory.createPart({ id: 'activeId' })
					const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart, previousPart })

					const testee: TimelineBuilder = createTestee()
					const timeline: Timeline = testee.buildTimeline(rundown)

					const result: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
						group.id.includes(PREVIOUS_GROUP_PREFIX)
					)!

					expect(result.priority).toBe(LOW_PRIORITY)
				})

				it('sets an empty layer', () => {
					const previousPart: Part = EntityMockFactory.createPart(
						{ id: 'previousId' },
						{
							executedAt: 10,
						}
					)
					const activePart: Part = EntityMockFactory.createPart({ id: 'activeId' })
					const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart, previousPart })

					const testee: TimelineBuilder = createTestee()
					const timeline: Timeline = testee.buildTimeline(rundown)

					const result: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
						group.id.includes(PREVIOUS_GROUP_PREFIX)
					)!

					expect(result.layer).toBe('')
				})

				it('sets the TimelineEnable.start to be when the previous Part was executed', () => {
					const previousPart: Part = EntityMockFactory.createPart(
						{ id: 'previousId' },
						{
							executedAt: 10,
						}
					)
					const activePart: Part = EntityMockFactory.createPart({ id: 'activeId' })
					const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart, previousPart })

					const testee: TimelineBuilder = createTestee()
					const timeline: Timeline = testee.buildTimeline(rundown)

					const result: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
						group.id.includes(PREVIOUS_GROUP_PREFIX)
					)!

					expect(result.enable.start).toBe(previousPart.getExecutedAt())
				})

				describe('active Part has a "previousPartContinueIntoPartDuration"', () => {
					it('sets the TimelineEnable.end to activeGroup.start + active Part.previousPartContinueIntoPartDuration', () => {
						const previousPartContinueIntoPartDuration: number = 50

						const previousPart: Part = EntityMockFactory.createPart(
							{ id: 'previousId' },
							{
								executedAt: 10,
							}
						)
						const activePart: Part = EntityMockFactory.createPart(
							{ id: 'activeId' },
							{
								partTimings: { previousPartContinueIntoPartDuration },
							}
						)
						const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart, previousPart })

						const testee: TimelineBuilder = createTestee()
						const timeline: Timeline = testee.buildTimeline(rundown)

						const activeGroupId: string = `${ACTIVE_GROUP_PREFIX}${activePart.id}`
						const result: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
							group.id.includes(PREVIOUS_GROUP_PREFIX)
						)!

						expect(result.enable.end).toBe(
							`#${activeGroupId}.start + ${previousPartContinueIntoPartDuration}`
						)
					})
				})

				describe('active Part does not have a "previousPartContinueIntoPartDuration"', () => {
					it('sets the TimelineEnable.end to activeGroup.start + 0', () => {
						const previousPart: Part = EntityMockFactory.createPart(
							{ id: 'previousId' },
							{
								executedAt: 10,
							}
						)
						const activePart: Part = EntityMockFactory.createPart({ id: 'activeId' })
						const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart, previousPart })

						const testee: TimelineBuilder = createTestee()
						const timeline: Timeline = testee.buildTimeline(rundown)

						const activeGroupId: string = `${ACTIVE_GROUP_PREFIX}${activePart.id}`
						const result: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
							group.id.includes(PREVIOUS_GROUP_PREFIX)
						)!

						expect(result.enable.end).toBe(`#${activeGroupId}.start + 0`)
					})
				})

				describe('previous Part has a Piece', () => {
					describe('creates a Piece control group on the previous group', () => {
						it('sets correct control group id for Piece on previous group', () => {
							const piece: Piece = EntityMockFactory.createPiece({
								transitionType: TransitionType.NO_TRANSITION,
							})
							const previousPart: Part = EntityMockFactory.createPart(
								{ id: 'previousId', pieces: [piece] },
								{ executedAt: 10, piecesWithLifespanFilters: [piece] }
							)
							const activePart: Part = EntityMockFactory.createPart({ id: 'activeId' })
							const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart, previousPart })

							const testee: TimelineBuilder = createTestee()
							const timeline: Timeline = testee.buildTimeline(rundown)

							const previousGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
								group.id.includes(PREVIOUS_GROUP_PREFIX)
							)!
							const expectedControlIdForPiece = `${previousGroup.id}${PIECE_CONTROL_INFIX}${piece.id}`
							const controlGroup: TimelineObject | undefined = previousGroup.children.find(
								(child) => child.id === expectedControlIdForPiece
							)

							expect(controlGroup).not.toBeUndefined()
						})

						it('sets correct parentGroup id', () => {
							const piece: Piece = EntityMockFactory.createPiece({
								transitionType: TransitionType.NO_TRANSITION,
							})
							const previousPart: Part = EntityMockFactory.createPart(
								{ id: 'previousId', pieces: [piece] },
								{ executedAt: 10, piecesWithLifespanFilters: [piece] }
							)
							const activePart: Part = EntityMockFactory.createPart({ id: 'activeId' })
							const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart, previousPart })

							const testee: TimelineBuilder = createTestee()
							const timeline: Timeline = testee.buildTimeline(rundown)

							const previousGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
								group.id.includes(PREVIOUS_GROUP_PREFIX)
							)!
							const controlGroup: TimelineObject = previousGroup.children.find((child) =>
								child.id.includes(PIECE_CONTROL_INFIX)
							)!

							expect(controlGroup.inGroup).toBe(previousGroup.id)
						})

						it('sets layer to Piece.layer', () => {
							const layer: string = 'someLayerForPiece'
							const piece: Piece = EntityMockFactory.createPiece({
								layer,
								transitionType: TransitionType.NO_TRANSITION,
							})
							const previousPart: Part = EntityMockFactory.createPart(
								{ id: 'previousId', pieces: [piece] },
								{ executedAt: 10, piecesWithLifespanFilters: [piece] }
							)
							const activePart: Part = EntityMockFactory.createPart({ id: 'activeId' })
							const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart, previousPart })

							const testee: TimelineBuilder = createTestee()
							const timeline: Timeline = testee.buildTimeline(rundown)

							const previousGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
								group.id.includes(PREVIOUS_GROUP_PREFIX)
							)!
							const controlGroup: TimelineObject = previousGroup.children.find((child) =>
								child.id.includes(PIECE_CONTROL_INFIX)
							)!

							expect(controlGroup.layer).toBe(layer)
						})

						it('sets priority to MEDIUM', () => {
							const piece: Piece = EntityMockFactory.createPiece({
								transitionType: TransitionType.NO_TRANSITION,
							})
							const previousPart: Part = EntityMockFactory.createPart(
								{ id: 'previousId', pieces: [piece] },
								{ executedAt: 10, piecesWithLifespanFilters: [piece] }
							)
							const activePart: Part = EntityMockFactory.createPart({ id: 'activeId' })
							const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart, previousPart })

							const testee: TimelineBuilder = createTestee()
							const timeline: Timeline = testee.buildTimeline(rundown)

							const previousGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
								group.id.includes(PREVIOUS_GROUP_PREFIX)
							)!
							const controlGroup: TimelineObject = previousGroup.children.find((child) =>
								child.id.includes(PIECE_CONTROL_INFIX)
							)!

							expect(controlGroup.priority).toBe(MEDIUM_PRIORITY)
						})

						describe('creates TimelineEnable for IN_TRANSITION Piece', () => {
							describe('previous Part has an "inTransitionStart"', () => {
								it('sets TimelineEnable.start to Part.timings.inTransitionStart + Piece.start', () => {
									const piece: Piece = EntityMockFactory.createPiece({
										start: 10,
										transitionType: TransitionType.IN_TRANSITION,
									})
									const inTransitionStart: number = 20
									const previousPart: Part = EntityMockFactory.createPart(
										{ id: 'previousId', pieces: [piece] },
										{
											partTimings: { inTransitionStart },
											executedAt: 10,
											piecesWithLifespanFilters: [piece],
										}
									)
									const activePart: Part = EntityMockFactory.createPart({
										id: 'activeId',
									})
									const rundown: Rundown = EntityMockFactory.createActiveRundown({
										activePart,
										previousPart,
									})

									const testee: TimelineBuilder = createTestee()
									const timeline: Timeline = testee.buildTimeline(rundown)

									const previousGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
										group.id.includes(PREVIOUS_GROUP_PREFIX)
									)!
									const controlGroup: TimelineObject = previousGroup.children.find((child) =>
										child.id.includes(PIECE_CONTROL_INFIX)
									)!

									expect(controlGroup.enable.start).toBe(inTransitionStart + piece.start)
								})

								it('sets TimelineEnable.duration to Piece.duration', () => {
									const piece: Piece = EntityMockFactory.createPiece({
										duration: 15,
										transitionType: TransitionType.IN_TRANSITION,
									})
									const inTransitionStart: number = 20
									const previousPart: Part = EntityMockFactory.createPart(
										{ id: 'previousId', pieces: [piece] },
										{
											partTimings: { inTransitionStart },
											executedAt: 10,
											piecesWithLifespanFilters: [piece],
										}
									)
									const activePart: Part = EntityMockFactory.createPart({
										id: 'activeId',
									})
									const rundown: Rundown = EntityMockFactory.createActiveRundown({
										activePart,
										previousPart,
									})

									const testee: TimelineBuilder = createTestee()
									const timeline: Timeline = testee.buildTimeline(rundown)

									const previousGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
										group.id.includes(PREVIOUS_GROUP_PREFIX)
									)!
									const controlGroup: TimelineObject = previousGroup.children.find((child) =>
										child.id.includes(PIECE_CONTROL_INFIX)
									)!

									expect(controlGroup.enable.duration).toBe(piece.duration)
								})
							})

							describe('previous Part does not have an "inTransitionStart"', () => {
								it('does not create any groups for Piece', () => {
									const piece: Piece = EntityMockFactory.createPiece({
										transitionType: TransitionType.IN_TRANSITION,
									})
									const previousPart: Part = EntityMockFactory.createPart(
										{ id: 'previousId', pieces: [piece] },
										{ executedAt: 10, piecesWithLifespanFilters: [piece] }
									)
									const activePart: Part = EntityMockFactory.createPart({
										id: 'activeId',
									})
									const rundown: Rundown = EntityMockFactory.createActiveRundown({
										activePart,
										previousPart,
									})

									const testee: TimelineBuilder = createTestee()
									const timeline: Timeline = testee.buildTimeline(rundown)

									const previousGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
										group.id.includes(PREVIOUS_GROUP_PREFIX)
									)!
									const controlGroup: TimelineObject | undefined = previousGroup.children.find(
										(child) => child.id.includes(PIECE_CONTROL_INFIX)
									)

									expect(controlGroup).toBeUndefined()
								})
							})
						})

						describe('creates TimelineEnable for OUT_TRANSITION Piece', () => {
							describe('previous Part has a "KeepAliveDuration"', () => {
								describe('previous Part has a PostRollDuration', () => {
									it('sets TimelineEnable.start to previousGroup.end - Part.keepAliveDuration - previous Part.postRoll', () => {
										const postRollDuration: number = 20
										const keepAliveDuration: number = 30

										const piece: Piece = EntityMockFactory.createPiece({
											transitionType: TransitionType.OUT_TRANSITION,
										})
										const previousPart: Part = EntityMockFactory.createPart(
											{
												id: 'previousId',
												outTransition: { keepAliveDuration },
												pieces: [piece],
											},
											{
												partTimings: { postRollDuration },
												executedAt: 10,
												piecesWithLifespanFilters: [piece],
											}
										)
										const activePart: Part = EntityMockFactory.createPart({
											id: 'activeId',
										})
										const rundown: Rundown = EntityMockFactory.createActiveRundown({
											activePart,
											previousPart,
										})

										const testee: TimelineBuilder = createTestee()
										const timeline: Timeline = testee.buildTimeline(rundown)

										const previousGroup: TimelineObjectGroup = timeline.timelineGroups.find(
											(group) => group.id.includes(PREVIOUS_GROUP_PREFIX)
										)!
										const controlObject: TimelineObject = previousGroup.children.find((child) =>
											child.id.includes(PIECE_CONTROL_INFIX)
										)!

										expect(controlObject.enable.start).toBe(
											`#${previousGroup.id}.end - ${keepAliveDuration} - ${postRollDuration}`
										)
									})
								})

								describe('previous Part does not have a PostRollDuration', () => {
									it('sets TimelineEnable.start to previousGroup.end - previous Part.keepAliveDuration', () => {
										const keepAliveDuration: number = 30

										const piece: Piece = EntityMockFactory.createPiece({
											transitionType: TransitionType.OUT_TRANSITION,
										})
										const previousPart: Part = EntityMockFactory.createPart(
											{
												id: 'previousId',
												outTransition: { keepAliveDuration },
												pieces: [piece],
											},
											{ executedAt: 10, piecesWithLifespanFilters: [piece] }
										)
										const activePart: Part = EntityMockFactory.createPart({
											id: 'activeId',
										})
										const rundown: Rundown = EntityMockFactory.createActiveRundown({
											activePart,
											previousPart,
										})

										const testee: TimelineBuilder = createTestee()
										const timeline: Timeline = testee.buildTimeline(rundown)

										const previousGroup: TimelineObjectGroup = timeline.timelineGroups.find(
											(group) => group.id.includes(PREVIOUS_GROUP_PREFIX)
										)!
										const controlObject: TimelineObject = previousGroup.children.find((child) =>
											child.id.includes(PIECE_CONTROL_INFIX)
										)!

										expect(controlObject.enable.start).toBe(
											`#${previousGroup.id}.end - ${keepAliveDuration}`
										)
									})
								})
							})

							describe('previous Part does not have a "KeepAliveDuration"', () => {
								it('does not create any groups for Piece', () => {
									const piece: Piece = EntityMockFactory.createPiece({
										transitionType: TransitionType.OUT_TRANSITION,
									})
									const previousPart: Part = EntityMockFactory.createPart(
										{ id: 'previousId', pieces: [piece] },
										{ executedAt: 10, piecesWithLifespanFilters: [piece] }
									)
									const activePart: Part = EntityMockFactory.createPart({
										id: 'activeId',
									})
									const rundown: Rundown = EntityMockFactory.createActiveRundown({
										activePart,
										previousPart,
									})

									const testee: TimelineBuilder = createTestee()
									const timeline: Timeline = testee.buildTimeline(rundown)

									const previousGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
										group.id.includes(PREVIOUS_GROUP_PREFIX)
									)!
									const controlObject: TimelineObject | undefined = previousGroup.children.find(
										(child) => child.id.includes(PIECE_CONTROL_INFIX)
									)

									expect(controlObject).toBeUndefined()
								})
							})
						})

						describe('creates TimelineEnable for NO_TRANSITION Piece', () => {
							it('sets TimelineEnable.start to Piece.start', () => {
								const piece: Piece = EntityMockFactory.createPiece({
									start: 10,
									transitionType: TransitionType.NO_TRANSITION,
								})
								const previousPart: Part = EntityMockFactory.createPart(
									{ id: 'previousId', pieces: [piece] },
									{ executedAt: 10, piecesWithLifespanFilters: [piece] }
								)
								const activePart: Part = EntityMockFactory.createPart({
									id: 'activeId',
								})
								const rundown: Rundown = EntityMockFactory.createActiveRundown({
									activePart,
									previousPart,
								})

								const testee: TimelineBuilder = createTestee()
								const timeline: Timeline = testee.buildTimeline(rundown)

								const previousGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
									group.id.includes(PREVIOUS_GROUP_PREFIX)
								)!
								const controlObject: TimelineObject = previousGroup.children.find((child) =>
									child.id.includes(PIECE_CONTROL_INFIX)
								)!

								expect(controlObject.enable.start).toBe(piece.start)
							})

							describe('Piece has a duration', () => {
								it('sets TimelineEnable.duration to Piece.duration', () => {
									const piece: Piece = EntityMockFactory.createPiece({
										duration: 15,
										transitionType: TransitionType.NO_TRANSITION,
									})
									const previousPart: Part = EntityMockFactory.createPart(
										{ id: 'previousId', pieces: [piece] },
										{ executedAt: 10, piecesWithLifespanFilters: [piece] }
									)
									const activePart: Part = EntityMockFactory.createPart({
										id: 'activeId',
									})
									const rundown: Rundown = EntityMockFactory.createActiveRundown({
										activePart,
										previousPart,
									})

									const testee: TimelineBuilder = createTestee()
									const timeline: Timeline = testee.buildTimeline(rundown)

									const previousGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
										group.id.includes(PREVIOUS_GROUP_PREFIX)
									)!
									const controlObject: TimelineObject = previousGroup.children.find((child) =>
										child.id.includes(PIECE_CONTROL_INFIX)
									)!

									expect(controlObject.enable.duration).toBe(piece.duration)
								})
							})

							describe('Piece does not have a duration', () => {
								describe('previous Part has PostRoll', () => {
									it('sets TimelineEnable.duration to previousGroup - Part.timings.postRollDuration', () => {
										const postRollDuration: number = 30

										const piece: Piece = EntityMockFactory.createPiece({
											transitionType: TransitionType.NO_TRANSITION,
										})
										const previousPart: Part = EntityMockFactory.createPart(
											{ id: 'previousId', pieces: [piece] },
											{
												partTimings: { postRollDuration },
												executedAt: 10,
												piecesWithLifespanFilters: [piece],
											}
										)
										const activePart: Part = EntityMockFactory.createPart({
											id: 'activeId',
										})
										const rundown: Rundown = EntityMockFactory.createActiveRundown({
											activePart,
											previousPart,
										})

										const testee: TimelineBuilder = createTestee()
										const timeline: Timeline = testee.buildTimeline(rundown)

										const previousGroup: TimelineObjectGroup = timeline.timelineGroups.find(
											(group) => group.id.includes(PREVIOUS_GROUP_PREFIX)
										)!
										const controlObject: TimelineObject = previousGroup.children.find((child) =>
											child.id.includes(PIECE_CONTROL_INFIX)
										)!

										expect(controlObject.enable.duration).toBe(
											`#${previousGroup.id} - ${postRollDuration}`
										)
									})
								})

								describe('previous Part does not have PostRoll', () => {
									it('sets TimelineEnable.duration to zero', () => {
										const piece: Piece = EntityMockFactory.createPiece({
											transitionType: TransitionType.NO_TRANSITION,
										})
										const previousPart: Part = EntityMockFactory.createPart(
											{ id: 'previousId', pieces: [piece] },
											{ executedAt: 10, piecesWithLifespanFilters: [piece] }
										)
										const activePart: Part = EntityMockFactory.createPart({
											id: 'activeId',
										})
										const rundown: Rundown = EntityMockFactory.createActiveRundown({
											activePart,
											previousPart,
										})

										const testee: TimelineBuilder = createTestee()
										const timeline: Timeline = testee.buildTimeline(rundown)

										const previousGroup: TimelineObjectGroup = timeline.timelineGroups.find(
											(group) => group.id.includes(PREVIOUS_GROUP_PREFIX)
										)!
										const controlObject: TimelineObject = previousGroup.children.find((child) =>
											child.id.includes(PIECE_CONTROL_INFIX)
										)!

										expect(controlObject.enable.duration).toBe(0)
									})
								})
							})
						})

						describe('controlGroup has TimelineEnable.start === zero && Piece has PreRoll', () => {
							describe('creates PreRollControlGroup for Piece', () => {
								it('sets id to correct id for PreRollControlGroup', () => {
									const piece: Piece = EntityMockFactory.createPiece({
										start: 0,
										preRollDuration: 10,
										transitionType: TransitionType.NO_TRANSITION,
									})
									const previousPart: Part = EntityMockFactory.createPart(
										{ id: 'previousId', pieces: [piece] },
										{ executedAt: 10, piecesWithLifespanFilters: [piece] }
									)
									const activePart: Part = EntityMockFactory.createPart({
										id: 'activeId',
									})
									const rundown: Rundown = EntityMockFactory.createActiveRundown({
										activePart,
										previousPart,
									})

									const testee: TimelineBuilder = createTestee()
									const timeline: Timeline = testee.buildTimeline(rundown)

									const previousGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
										group.id.includes(PREVIOUS_GROUP_PREFIX)
									)!
									const controlObject: TimelineObject = previousGroup.children.find((child) =>
										child.id.includes(PIECE_CONTROL_INFIX)
									)!
									const expectedPreRollIdForPiece: string = `${PIECE_PRE_ROLL_PREFIX}${controlObject.id}`
									const preRollObject: TimelineObject | undefined = previousGroup.children.find(
										(child) => child.id === expectedPreRollIdForPiece
									)

									expect(preRollObject).not.toBeUndefined()
								})

								it('sets TimelineEnable.start to "previousGroup.id.start"', () => {
									const piece: Piece = EntityMockFactory.createPiece({
										start: 0,
										preRollDuration: 10,
										transitionType: TransitionType.NO_TRANSITION,
									})
									const previousPart: Part = EntityMockFactory.createPart(
										{ id: 'previousId', pieces: [piece] },
										{ executedAt: 10, piecesWithLifespanFilters: [piece] }
									)
									const activePart: Part = EntityMockFactory.createPart({
										id: 'activeId',
									})
									const rundown: Rundown = EntityMockFactory.createActiveRundown({
										activePart,
										previousPart,
									})

									const testee: TimelineBuilder = createTestee()
									const timeline: Timeline = testee.buildTimeline(rundown)

									const previousGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
										group.id.includes(PREVIOUS_GROUP_PREFIX)
									)!
									const preRollObject: TimelineObject = previousGroup.children.find((child) =>
										child.id.includes(PIECE_PRE_ROLL_PREFIX)
									)!

									expect(preRollObject.enable.start).toBe(`#${previousGroup.id}.start`)
								})

								it('sets an empty layer', () => {
									const piece: Piece = EntityMockFactory.createPiece({
										start: 0,
										preRollDuration: 10,
										transitionType: TransitionType.NO_TRANSITION,
									})
									const previousPart: Part = EntityMockFactory.createPart(
										{ id: 'previousId', pieces: [piece] },
										{ executedAt: 10, piecesWithLifespanFilters: [piece] }
									)
									const activePart: Part = EntityMockFactory.createPart({
										id: 'activeId',
									})
									const rundown: Rundown = EntityMockFactory.createActiveRundown({
										activePart,
										previousPart,
									})

									const testee: TimelineBuilder = createTestee()
									const timeline: Timeline = testee.buildTimeline(rundown)

									const previousGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
										group.id.includes(PREVIOUS_GROUP_PREFIX)
									)!
									const preRollObject: TimelineObject = previousGroup.children.find((child) =>
										child.id.includes(PIECE_PRE_ROLL_PREFIX)
									)!

									expect(preRollObject.layer).toBe('')
								})

								it('updates controlPiece to start at PreRollControlGroup + Piece.preRollDuration', () => {
									const piece: Piece = EntityMockFactory.createPiece({
										start: 0,
										preRollDuration: 10,
										transitionType: TransitionType.NO_TRANSITION,
									})
									const previousPart: Part = EntityMockFactory.createPart(
										{ id: 'previousId', pieces: [piece] },
										{ executedAt: 10, piecesWithLifespanFilters: [piece] }
									)
									const activePart: Part = EntityMockFactory.createPart({
										id: 'activeId',
									})
									const rundown: Rundown = EntityMockFactory.createActiveRundown({
										activePart,
										previousPart,
									})

									const testee: TimelineBuilder = createTestee()
									const timeline: Timeline = testee.buildTimeline(rundown)

									const previousGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
										group.id.includes(PREVIOUS_GROUP_PREFIX)
									)!
									const controlObject: TimelineObject = previousGroup.children.find((child) =>
										child.id.includes(PIECE_CONTROL_INFIX)
									)!
									const preRollObject: TimelineObject = previousGroup.children.find((child) =>
										child.id.includes(PIECE_PRE_ROLL_PREFIX)
									)!

									expect(controlObject.enable.start).toBe(
										`#${preRollObject.id} + ${piece.preRollDuration}`
									)
								})
							})
						})
					})

					describe('create a Piece child group on the previous group', () => {
						it('sets correct Piece group id for Piece on previous group', () => {
							const piece: Piece = EntityMockFactory.createPiece({
								transitionType: TransitionType.NO_TRANSITION,
							})
							const previousPart: Part = EntityMockFactory.createPart(
								{ id: 'previousId', pieces: [piece] },
								{ executedAt: 10, piecesWithLifespanFilters: [piece] }
							)
							const activePart: Part = EntityMockFactory.createPart({ id: 'activeId' })
							const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart, previousPart })

							const testee: TimelineBuilder = createTestee()
							const timeline: Timeline = testee.buildTimeline(rundown)

							const previousGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
								group.id.includes(PREVIOUS_GROUP_PREFIX)
							)!
							const expectedChildGroupIdForPiece: string = `${previousGroup.id}${PIECE_GROUP_INFIX}${piece.id}`
							const childGroup: TimelineObject | undefined = previousGroup.children.find(
								(child) => child.id === expectedChildGroupIdForPiece
							)

							expect(childGroup).not.toBeUndefined()
						})

						it('sets correct parentGroup id', () => {
							const piece: Piece = EntityMockFactory.createPiece({
								transitionType: TransitionType.NO_TRANSITION,
							})
							const previousPart: Part = EntityMockFactory.createPart(
								{ id: 'previousId', pieces: [piece] },
								{ executedAt: 10, piecesWithLifespanFilters: [piece] }
							)
							const activePart: Part = EntityMockFactory.createPart({ id: 'activeId' })
							const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart, previousPart })

							const testee: TimelineBuilder = createTestee()
							const timeline: Timeline = testee.buildTimeline(rundown)

							const previousGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
								group.id.includes(PREVIOUS_GROUP_PREFIX)
							)!
							const childGroup: TimelineObject = previousGroup.children.find((child) =>
								child.id.includes(PIECE_GROUP_INFIX)
							)!

							expect(childGroup.inGroup).toBe(previousGroup.id)
						})

						it('sets an empty layer', () => {
							const piece: Piece = EntityMockFactory.createPiece({
								transitionType: TransitionType.NO_TRANSITION,
							})
							const previousPart: Part = EntityMockFactory.createPart(
								{ id: 'previousId', pieces: [piece] },
								{ executedAt: 10, piecesWithLifespanFilters: [piece] }
							)
							const activePart: Part = EntityMockFactory.createPart({ id: 'activeId' })
							const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart, previousPart })

							const testee: TimelineBuilder = createTestee()
							const timeline: Timeline = testee.buildTimeline(rundown)

							const previousGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
								group.id.includes(PREVIOUS_GROUP_PREFIX)
							)!
							const childGroup: TimelineObject = previousGroup.children.find((child) =>
								child.id.includes(PIECE_GROUP_INFIX)
							)!

							expect(childGroup.layer).toBe('')
						})

						describe('Piece has PreRoll', () => {
							it('sets TimelineEnable.start PieceControlGroup.start - Piece.preRollDuration', () => {
								const piece: Piece = EntityMockFactory.createPiece({
									preRollDuration: 10,
									transitionType: TransitionType.NO_TRANSITION,
								})
								const previousPart: Part = EntityMockFactory.createPart(
									{ id: 'previousId', pieces: [piece] },
									{ executedAt: 10, piecesWithLifespanFilters: [piece] }
								)
								const activePart: Part = EntityMockFactory.createPart({
									id: 'activeId',
								})
								const rundown: Rundown = EntityMockFactory.createActiveRundown({
									activePart,
									previousPart,
								})

								const testee: TimelineBuilder = createTestee()
								const timeline: Timeline = testee.buildTimeline(rundown)

								const previousGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
									group.id.includes(PREVIOUS_GROUP_PREFIX)
								)!
								const controlGroup: TimelineObject = previousGroup.children.find((child) =>
									child.id.includes(PIECE_CONTROL_INFIX)
								)!
								const childGroup: TimelineObject = previousGroup.children.find((child) =>
									child.id.includes(PIECE_GROUP_INFIX)
								)!

								expect(childGroup.enable.start).toBe(
									`#${controlGroup.id}.start - ${piece.preRollDuration}`
								)
							})
						})

						describe('Piece does not have PreRoll', () => {
							it('sets TimelineEnable.start to PieceControlGroup.start - 0', () => {
								const piece: Piece = EntityMockFactory.createPiece({
									transitionType: TransitionType.NO_TRANSITION,
								})
								const previousPart: Part = EntityMockFactory.createPart(
									{ id: 'previousId', pieces: [piece] },
									{ executedAt: 10, piecesWithLifespanFilters: [piece] }
								)
								const activePart: Part = EntityMockFactory.createPart({
									id: 'activeId',
								})
								const rundown: Rundown = EntityMockFactory.createActiveRundown({
									activePart,
									previousPart,
								})

								const testee: TimelineBuilder = createTestee()
								const timeline: Timeline = testee.buildTimeline(rundown)

								const previousGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
									group.id.includes(PREVIOUS_GROUP_PREFIX)
								)!
								const controlGroup: TimelineObject = previousGroup.children.find((child) =>
									child.id.includes(PIECE_CONTROL_INFIX)
								)!
								const childGroup: TimelineObject = previousGroup.children.find((child) =>
									child.id.includes(PIECE_GROUP_INFIX)
								)!

								expect(childGroup.enable.start).toBe(`#${controlGroup.id}.start`)
							})
						})

						describe('Piece has PostRoll', () => {
							it('sets TimelineEnable.end to PieceControlGroup.end - Piece.postRollDuration', () => {
								const piece: Piece = EntityMockFactory.createPiece({
									postRollDuration: 30,
									transitionType: TransitionType.NO_TRANSITION,
								})
								const previousPart: Part = EntityMockFactory.createPart(
									{ id: 'previousId', pieces: [piece] },
									{ executedAt: 10, piecesWithLifespanFilters: [piece] }
								)
								const activePart: Part = EntityMockFactory.createPart({
									id: 'activeId',
								})
								const rundown: Rundown = EntityMockFactory.createActiveRundown({
									activePart,
									previousPart,
								})

								const testee: TimelineBuilder = createTestee()
								const timeline: Timeline = testee.buildTimeline(rundown)

								const previousGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
									group.id.includes(PREVIOUS_GROUP_PREFIX)
								)!
								const controlGroup: TimelineObject = previousGroup.children.find((child) =>
									child.id.includes(PIECE_CONTROL_INFIX)
								)!
								const childGroup: TimelineObject = previousGroup.children.find((child) =>
									child.id.includes(PIECE_GROUP_INFIX)
								)!

								expect(childGroup.enable.end).toBe(
									`#${controlGroup.id}.end - ${piece.postRollDuration}`
								)
							})
						})

						describe('Piece does not have PostRoll', () => {
							it('sets TimelineEnable.end to PieceControlGroup.end', () => {
								const piece: Piece = EntityMockFactory.createPiece({
									transitionType: TransitionType.NO_TRANSITION,
								})
								const previousPart: Part = EntityMockFactory.createPart(
									{ id: 'previousId', pieces: [piece] },
									{ executedAt: 10, piecesWithLifespanFilters: [piece] }
								)
								const activePart: Part = EntityMockFactory.createPart({
									id: 'activeId',
								})
								const rundown: Rundown = EntityMockFactory.createActiveRundown({
									activePart,
									previousPart,
								})

								const testee: TimelineBuilder = createTestee()
								const timeline: Timeline = testee.buildTimeline(rundown)

								const previousGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
									group.id.includes(PREVIOUS_GROUP_PREFIX)
								)!
								const controlGroup: TimelineObject = previousGroup.children.find((child) =>
									child.id.includes(PIECE_CONTROL_INFIX)
								)!
								const childGroup: TimelineObject = previousGroup.children.find((child) =>
									child.id.includes(PIECE_GROUP_INFIX)
								)!

								expect(childGroup.enable.end).toBe(`#${controlGroup.id}.end`)
							})
						})

						describe('Piece has a TimelineObject', () => {
							it('sets the id of the TimelineObject to be pieceChildGroup.id_piece.id_timelineObject.id', () => {
								const timelineObject: TimelineObject = { id: 'timelineObjectId' } as TimelineObject
								const piece: Piece = EntityMockFactory.createPiece({
									timelineObjects: [timelineObject],
									transitionType: TransitionType.NO_TRANSITION,
								})
								const previousPart: Part = EntityMockFactory.createPart(
									{ id: 'previousId', pieces: [piece] },
									{ executedAt: 10, piecesWithLifespanFilters: [piece] }
								)
								const activePart: Part = EntityMockFactory.createPart({
									id: 'activeId',
								})
								const rundown: Rundown = EntityMockFactory.createActiveRundown({
									activePart,
									previousPart,
								})

								const testee: TimelineBuilder = createTestee()
								const timeline: Timeline = testee.buildTimeline(rundown)

								const previousGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
									group.id.includes(PREVIOUS_GROUP_PREFIX)
								)!
								const childGroup: TimelineObjectGroup = previousGroup.children.find((child) =>
									child.id.includes(PIECE_GROUP_INFIX)
								)! as TimelineObjectGroup
								const result: TimelineObject = childGroup.children[0]

								expect(result.id).toBe(`${childGroup.id}_${piece.id}_${timelineObject.id}`)
							})

							it('sets the group of the TimelineObject to be the Piece child group', () => {
								const timelineObject: TimelineObject = { id: 'timelineObjectId' } as TimelineObject
								const piece: Piece = EntityMockFactory.createPiece({
									timelineObjects: [timelineObject],
									transitionType: TransitionType.NO_TRANSITION,
								})
								const previousPart: Part = EntityMockFactory.createPart(
									{ id: 'previousId', pieces: [piece] },
									{ executedAt: 10, piecesWithLifespanFilters: [piece] }
								)
								const activePart: Part = EntityMockFactory.createPart({
									id: 'activeId',
								})
								const rundown: Rundown = EntityMockFactory.createActiveRundown({
									activePart,
									previousPart,
								})

								const testee: TimelineBuilder = createTestee()
								const timeline: Timeline = testee.buildTimeline(rundown)

								const previousGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
									group.id.includes(PREVIOUS_GROUP_PREFIX)
								)!
								const childGroup: TimelineObjectGroup = previousGroup.children.find((child) =>
									child.id.includes(PIECE_GROUP_INFIX)
								)! as TimelineObjectGroup
								const result: TimelineObject = childGroup.children[0]

								expect(result.inGroup).toBe(childGroup.id)
							})

							it('has same content as the TimelineObject', () => {
								const content: any = { someContent: 'someContent' }
								const timelineObject: TimelineObject = {
									id: 'timelineObjectId',
									content,
								} as TimelineObject
								const piece: Piece = EntityMockFactory.createPiece({
									timelineObjects: [timelineObject],
									transitionType: TransitionType.NO_TRANSITION,
								})
								const previousPart: Part = EntityMockFactory.createPart(
									{ id: 'previousId', pieces: [piece] },
									{ executedAt: 10, piecesWithLifespanFilters: [piece] }
								)
								const activePart: Part = EntityMockFactory.createPart({
									id: 'activeId',
								})
								const rundown: Rundown = EntityMockFactory.createActiveRundown({
									activePart,
									previousPart,
								})

								const objectCloner: ObjectCloner = mock<ObjectCloner>()
								when(objectCloner.clone(timelineObject)).thenReturn(
									JSON.parse(JSON.stringify(timelineObject))
								)

								const testee: TimelineBuilder = createTestee(instance(objectCloner))
								const timeline: Timeline = testee.buildTimeline(rundown)

								const previousGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
									group.id.includes(PREVIOUS_GROUP_PREFIX)
								)!
								const childGroup: TimelineObjectGroup = previousGroup.children.find((child) =>
									child.id.includes(PIECE_GROUP_INFIX)
								)! as TimelineObjectGroup
								const result: TimelineObject = childGroup.children[0]

								expect(result.content).toEqual(content)
							})
						})

						describe('Piece has five TimelineObjects', () => {
							it('adds all five TimelineObjects to the children of the Piece child group', () => {
								const timelineObjects: TimelineObject[] = [
									{ id: '1' } as TimelineObject,
									{ id: '2' } as TimelineObject,
									{ id: '3' } as TimelineObject,
									{ id: '4' } as TimelineObject,
									{ id: '5' } as TimelineObject,
								]
								const piece: Piece = EntityMockFactory.createPiece({
									timelineObjects,
									transitionType: TransitionType.NO_TRANSITION,
								})
								const previousPart: Part = EntityMockFactory.createPart(
									{ id: 'previousId', pieces: [piece] },
									{ executedAt: 10, piecesWithLifespanFilters: [piece] }
								)
								const activePart: Part = EntityMockFactory.createPart({
									id: 'activeId',
								})
								const rundown: Rundown = EntityMockFactory.createActiveRundown({
									activePart,
									previousPart,
								})

								const objectCloner: ObjectCloner = mock<ObjectCloner>()
								timelineObjects.forEach((timelineObject) =>
									when(objectCloner.clone(timelineObject)).thenReturn(
										JSON.parse(JSON.stringify(timelineObject))
									)
								)

								const testee: TimelineBuilder = createTestee(instance(objectCloner))
								const timeline: Timeline = testee.buildTimeline(rundown)

								const previousGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
									group.id.includes(PREVIOUS_GROUP_PREFIX)
								)!
								const childGroup: TimelineObjectGroup = previousGroup.children.find((child) =>
									child.id.includes(PIECE_GROUP_INFIX)
								)! as TimelineObjectGroup

								const timelineObjectIds: string[] = childGroup.children.map(
									(timelineObject) => timelineObject.id
								)
								timelineObjects.forEach((timelineObject) =>
									expect(timelineObjectIds).toContainEqual(
										`${childGroup.id}_${piece.id}_${timelineObject.id}`
									)
								)
							})
						})
					})
				})
			})

			describe('previous Part does not have any Pieces', () => {
				it('does not create any groups for the Pieces', () => {
					const previousPart: Part = EntityMockFactory.createPart(
						{ id: 'previousId' },
						{
							executedAt: 10,
						}
					)
					const activePart: Part = EntityMockFactory.createPart({ id: 'activeId' })
					const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart, previousPart })

					const testee: TimelineBuilder = createTestee()
					const timeline: Timeline = testee.buildTimeline(rundown)

					const previousGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
						group.id.includes(PREVIOUS_GROUP_PREFIX)
					)!
					const controlGroup: TimelineObject | undefined = previousGroup.children.find((child) =>
						child.id.includes(PIECE_CONTROL_INFIX)
					)

					expect(controlGroup).toBeUndefined()
				})
			})

			describe('previous Part has Pieces', () => {
				describe('previous Part has five Pieces, but one of them is an infinite Piece', () => {
					it('only creates groups for four Pieces', () => {
						const infinitePiece: Piece = EntityMockFactory.createPiece({
							pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
							transitionType: TransitionType.NO_TRANSITION,
						})
						const nonInfinitePieces: Piece[] = [
							EntityMockFactory.createPiece({
								pieceLifespan: PieceLifespan.WITHIN_PART,
								transitionType: TransitionType.NO_TRANSITION,
							}),
							EntityMockFactory.createPiece({
								pieceLifespan: PieceLifespan.WITHIN_PART,
								transitionType: TransitionType.NO_TRANSITION,
							}),
							EntityMockFactory.createPiece({
								pieceLifespan: PieceLifespan.WITHIN_PART,
								transitionType: TransitionType.NO_TRANSITION,
							}),
							EntityMockFactory.createPiece({
								pieceLifespan: PieceLifespan.WITHIN_PART,
								transitionType: TransitionType.NO_TRANSITION,
							}),
						]
						const previousPart: Part = EntityMockFactory.createPart(
							{ id: 'previousId', pieces: [infinitePiece, ...nonInfinitePieces] },
							{ executedAt: 10, piecesWithLifespanFilters: nonInfinitePieces }
						)
						const activePart: Part = EntityMockFactory.createPart({ id: 'activeId' })
						const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart, previousPart })

						const testee: TimelineBuilder = createTestee()
						const timeline: Timeline = testee.buildTimeline(rundown)

						const previousGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
							group.id.includes(PREVIOUS_GROUP_PREFIX)
						)!
						const controlGroups: TimelineObject[] = previousGroup.children.filter((child) =>
							child.id.includes(PIECE_CONTROL_INFIX)
						)

						expect(controlGroups).toHaveLength(4)
					})
				})

				describe('previous Part has five Pieces, but all of them are infinite Pieces', () => {
					it('does not create any groups for the Pieces', () => {
						const infinitePieces: Piece[] = [
							EntityMockFactory.createPiece({
								pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
								transitionType: TransitionType.NO_TRANSITION,
							}),
							EntityMockFactory.createPiece({
								pieceLifespan: PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE,
								transitionType: TransitionType.NO_TRANSITION,
							}),
							EntityMockFactory.createPiece({
								pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
								transitionType: TransitionType.NO_TRANSITION,
							}),
							EntityMockFactory.createPiece({
								pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
								transitionType: TransitionType.NO_TRANSITION,
							}),
							EntityMockFactory.createPiece({
								pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
								transitionType: TransitionType.NO_TRANSITION,
							}),
						]
						const previousPart: Part = EntityMockFactory.createPart(
							{ id: 'previousId', pieces: infinitePieces },
							{ executedAt: 10 }
						)
						const activePart: Part = EntityMockFactory.createPart({ id: 'activeId' })
						const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart, previousPart })

						const testee: TimelineBuilder = createTestee()
						const timeline: Timeline = testee.buildTimeline(rundown)

						const previousGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
							group.id.includes(PREVIOUS_GROUP_PREFIX)
						)!
						const controlGroups: TimelineObject[] = previousGroup.children.filter((child) =>
							child.id.includes(PIECE_CONTROL_INFIX)
						)

						expect(controlGroups).toHaveLength(0)
					})
				})
			})
		})

		describe('Rundown does not have a previous Part', () => {
			it('does not create a group for previous Part', () => {
				const activePart: Part = EntityMockFactory.createPart({ id: 'activeId' })
				const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart, previousPart: undefined })

				const testee: TimelineBuilder = createTestee()
				const timeline: Timeline = testee.buildTimeline(rundown)

				const previousGroup: TimelineObjectGroup | undefined = timeline.timelineGroups.find((group) =>
					group.id.includes(PREVIOUS_GROUP_PREFIX)
				)

				expect(previousGroup).toBeUndefined()
			})
		})

		describe('active Part has autoNext', () => {
			describe('active Part has an expected duration longer than zero', () => {
				describe('active Part has "delayStartOfPiecesDuration', () => {
					it('sets TimelineEnable.duration of the active group to active Part.expectedDuration + active Part.timings.delayStartOfPiecesDuration', () => {
						const delayStartOfPiecesDuration: number = 5

						const nextPart: Part = EntityMockFactory.createPart({ id: 'nextId' })
						const activePart: Part = EntityMockFactory.createPart(
							{ id: 'activeId', expectedDuration: 15, autoNext: { overlap: 0 } },
							{ partTimings: { delayStartOfPiecesDuration } }
						)
						const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart, nextPart })

						const testee: TimelineBuilder = createTestee()
						const timeline: Timeline = testee.buildTimeline(rundown)

						const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
							group.id.includes(ACTIVE_GROUP_PREFIX)
						)!

						expect(activeGroup.enable.duration).toBe(
							activePart.expectedDuration + delayStartOfPiecesDuration
						)
					})
				})

				describe('active Part does not have "delayStartOfPiecesDuration', () => {
					it('sets TimelineEnable.duration of the active group to active Part.expectedDuration', () => {
						const nextPart: Part = EntityMockFactory.createPart({ id: 'nextId' })
						const activePart: Part = EntityMockFactory.createPart({
							id: 'activeId',
							expectedDuration: 15,
							autoNext: { overlap: 0 },
						})
						const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart, nextPart })

						const testee: TimelineBuilder = createTestee()
						const timeline: Timeline = testee.buildTimeline(rundown)

						const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
							group.id.includes(ACTIVE_GROUP_PREFIX)
						)!

						expect(activeGroup.enable.duration).toBe(activePart.expectedDuration)
					})
				})

				it('sets Timeline.autoNext.epochTimeToTakeNext to be now + active Part.expected duration + active Part.delayStartOffPiecesDuration - next Part.previousPartContinueIntoPartDuration', () => {
					const now: number = Date.now()
					jest.useFakeTimers('modern').setSystemTime(now)

					const delayStartOfPiecesDuration: number = 30
					const continueIntoPartDuration: number = 50

					const nextPart: Part = EntityMockFactory.createPart(
						{ id: 'nextId' },
						{
							partTimings: { previousPartContinueIntoPartDuration: continueIntoPartDuration },
						}
					)
					const activePart: Part = EntityMockFactory.createPart(
						{ id: 'activeId', expectedDuration: 15, autoNext: { overlap: 0 } },
						{ partTimings: { delayStartOfPiecesDuration } }
					)
					const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart, nextPart })

					const testee: TimelineBuilder = createTestee()
					const timeline: Timeline = testee.buildTimeline(rundown)

					expect(timeline.autoNext).not.toBeUndefined()
					const expectedEpochTimeToTakeNext: number =
						now + activePart.expectedDuration + delayStartOfPiecesDuration - continueIntoPartDuration
					expect(timeline.autoNext?.epochTimeToTakeNext).toBe(expectedEpochTimeToTakeNext)
				})

				describe('it creates a group for next Part', () => {
					it('sets correct next group id for the next Part', () => {
						const nextPart: Part = EntityMockFactory.createPart({ id: 'nextId' })
						const activePart: Part = EntityMockFactory.createPart({
							id: 'activeId',
							expectedDuration: 15,
							autoNext: { overlap: 0 },
						})
						const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart, nextPart })

						const testee: TimelineBuilder = createTestee()
						const timeline: Timeline = testee.buildTimeline(rundown)

						const expectNextGroupId: string = `${NEXT_GROUP_PREFIX}${nextPart.id}`
						const nextGroup: TimelineObjectGroup | undefined = timeline.timelineGroups.find(
							(group) => group.id === expectNextGroupId
						)

						expect(nextGroup).not.toBeUndefined()
					})

					it('sets priority of the group to high', () => {
						const nextPart: Part = EntityMockFactory.createPart({ id: 'nextId' })
						const activePart: Part = EntityMockFactory.createPart({
							id: 'activeId',
							expectedDuration: 15,
							autoNext: { overlap: 0 },
						})
						const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart, nextPart })

						const testee: TimelineBuilder = createTestee()
						const timeline: Timeline = testee.buildTimeline(rundown)

						const nextGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
							group.id.includes(NEXT_GROUP_PREFIX)
						)!

						expect(nextGroup.priority).toBe(HIGH_PRIORITY)
					})

					it('sets an empty layer', () => {
						const nextPart: Part = EntityMockFactory.createPart({ id: 'nextId' })
						const activePart: Part = EntityMockFactory.createPart({
							id: 'activeId',
							expectedDuration: 15,
							autoNext: { overlap: 0 },
						})
						const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart, nextPart })

						const testee: TimelineBuilder = createTestee()
						const timeline: Timeline = testee.buildTimeline(rundown)

						const nextGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
							group.id.includes(NEXT_GROUP_PREFIX)
						)!

						expect(nextGroup.layer).toBe('')
					})

					describe('next Part has "previousPartContinueIntoPartDuration', () => {
						it('sets the TimelineEnable.start to be activeGroup.end - next Part.previousPartContinueIntoPartDuration', () => {
							const previousPartContinueIntoPartDuration: number = 50

							const nextPart: Part = EntityMockFactory.createPart(
								{ id: 'nextId' },
								{
									partTimings: { previousPartContinueIntoPartDuration },
								}
							)
							const activePart: Part = EntityMockFactory.createPart({
								id: 'activeId',
								expectedDuration: 15,
								autoNext: { overlap: 0 },
							})
							const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart, nextPart })

							const testee: TimelineBuilder = createTestee()
							const timeline: Timeline = testee.buildTimeline(rundown)

							const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
								group.id.includes(ACTIVE_GROUP_PREFIX)
							)!
							const nextGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
								group.id.includes(NEXT_GROUP_PREFIX)
							)!

							expect(nextGroup.enable.start).toBe(
								`#${activeGroup.id}.end - ${previousPartContinueIntoPartDuration}`
							)
						})
					})

					describe('next Part does not have "previousPartContinueIntoPartDuration', () => {
						it('sets the TimelineEnable.start to be activeGroup.end - 0', () => {
							const nextPart: Part = EntityMockFactory.createPart({ id: 'nextId' })
							const activePart: Part = EntityMockFactory.createPart({
								id: 'activeId',
								expectedDuration: 15,
								autoNext: { overlap: 0 },
							})
							const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart, nextPart })

							const testee: TimelineBuilder = createTestee()
							const timeline: Timeline = testee.buildTimeline(rundown)

							const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
								group.id.includes(ACTIVE_GROUP_PREFIX)
							)!
							const nextGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
								group.id.includes(NEXT_GROUP_PREFIX)
							)!

							expect(nextGroup.enable.start).toBe(`#${activeGroup.id}.end - 0`)
						})
					})

					describe('next Part has a Piece', () => {
						describe('creates a Piece control group on the next group', () => {
							it('sets correct control group id for Piece on next group', () => {
								const piece: Piece = EntityMockFactory.createPiece({
									transitionType: TransitionType.NO_TRANSITION,
								})
								const nextPart: Part = EntityMockFactory.createPart(
									{ id: 'nextId', pieces: [piece] },
									{ piecesWithLifespanFilters: [piece] }
								)
								const activePart: Part = EntityMockFactory.createPart({
									id: 'activeId',
									expectedDuration: 15,
									autoNext: { overlap: 0 },
								})
								const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart, nextPart })

								const testee: TimelineBuilder = createTestee()
								const timeline: Timeline = testee.buildTimeline(rundown)

								const nextGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
									group.id.includes(NEXT_GROUP_PREFIX)
								)!
								const expectedControlIdForPiece = `${nextGroup.id}${PIECE_CONTROL_INFIX}${piece.id}`
								const controlGroup: TimelineObject | undefined = nextGroup.children.find(
									(child) => child.id === expectedControlIdForPiece
								)

								expect(controlGroup).not.toBeUndefined()
							})

							it('sets correct parentGroup id', () => {
								const piece: Piece = EntityMockFactory.createPiece({
									transitionType: TransitionType.NO_TRANSITION,
								})
								const nextPart: Part = EntityMockFactory.createPart(
									{ id: 'nextId', pieces: [piece] },
									{ piecesWithLifespanFilters: [piece] }
								)
								const activePart: Part = EntityMockFactory.createPart({
									id: 'activeId',
									expectedDuration: 15,
									autoNext: { overlap: 0 },
								})
								const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart, nextPart })

								const testee: TimelineBuilder = createTestee()
								const timeline: Timeline = testee.buildTimeline(rundown)

								const nextGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
									group.id.includes(NEXT_GROUP_PREFIX)
								)!
								const controlGroup: TimelineObject = nextGroup.children.find((child) =>
									child.id.includes(PIECE_CONTROL_INFIX)
								)!

								expect(controlGroup.inGroup).toBe(nextGroup.id)
							})

							it('sets layer to Piece.layer', () => {
								const layer: string = 'someLayerForPiece'
								const piece: Piece = EntityMockFactory.createPiece({
									layer,
									transitionType: TransitionType.NO_TRANSITION,
								})
								const nextPart: Part = EntityMockFactory.createPart(
									{ id: 'nextId', pieces: [piece] },
									{ piecesWithLifespanFilters: [piece] }
								)
								const activePart: Part = EntityMockFactory.createPart({
									id: 'activeId',
									expectedDuration: 15,
									autoNext: { overlap: 0 },
								})
								const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart, nextPart })

								const testee: TimelineBuilder = createTestee()
								const timeline: Timeline = testee.buildTimeline(rundown)

								const nextGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
									group.id.includes(NEXT_GROUP_PREFIX)
								)!
								const controlGroup: TimelineObject = nextGroup.children.find((child) =>
									child.id.includes(PIECE_CONTROL_INFIX)
								)!

								expect(controlGroup.layer).toBe(layer)
							})

							it('sets priority to MEDIUM', () => {
								const piece: Piece = EntityMockFactory.createPiece({
									transitionType: TransitionType.NO_TRANSITION,
								})
								const nextPart: Part = EntityMockFactory.createPart(
									{ id: 'nextId', pieces: [piece] },
									{ piecesWithLifespanFilters: [piece] }
								)
								const activePart: Part = EntityMockFactory.createPart({
									id: 'activeId',
									expectedDuration: 15,
									autoNext: { overlap: 0 },
								})
								const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart, nextPart })

								const testee: TimelineBuilder = createTestee()
								const timeline: Timeline = testee.buildTimeline(rundown)

								const nextGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
									group.id.includes(NEXT_GROUP_PREFIX)
								)!
								const controlGroup: TimelineObject = nextGroup.children.find((child) =>
									child.id.includes(PIECE_CONTROL_INFIX)
								)!

								expect(controlGroup.priority).toBe(MEDIUM_PRIORITY)
							})

							describe('creates TimelineEnable for IN_TRANSITION Piece', () => {
								describe('next Part has an "inTransitionStart"', () => {
									it('sets TimelineEnable.start to Part.timings.inTransitionStart + Piece.start', () => {
										const inTransitionStart: number = 20

										const piece: Piece = EntityMockFactory.createPiece({
											start: 10,
											transitionType: TransitionType.IN_TRANSITION,
										})
										const nextPart: Part = EntityMockFactory.createPart(
											{ id: 'nextId', pieces: [piece] },
											{
												partTimings: { inTransitionStart },
												piecesWithLifespanFilters: [piece],
											}
										)
										const activePart: Part = EntityMockFactory.createPart({
											id: 'activeId',
											expectedDuration: 15,
											autoNext: { overlap: 0 },
										})
										const rundown: Rundown = EntityMockFactory.createActiveRundown({
											activePart,
											nextPart,
										})

										const testee: TimelineBuilder = createTestee()
										const timeline: Timeline = testee.buildTimeline(rundown)

										const nextGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
											group.id.includes(NEXT_GROUP_PREFIX)
										)!
										const controlGroup: TimelineObject = nextGroup.children.find((child) =>
											child.id.includes(PIECE_CONTROL_INFIX)
										)!

										expect(controlGroup.enable.start).toBe(inTransitionStart + piece.start)
									})

									it('sets TimelineEnable.duration to Piece.duration', () => {
										const inTransitionStart: number = 20
										const piece: Piece = EntityMockFactory.createPiece({
											duration: 30,
											transitionType: TransitionType.IN_TRANSITION,
										})
										const nextPart: Part = EntityMockFactory.createPart(
											{ id: 'nextId', pieces: [piece] },
											{
												partTimings: { inTransitionStart },
												piecesWithLifespanFilters: [piece],
											}
										)
										const activePart: Part = EntityMockFactory.createPart({
											id: 'activeId',
											expectedDuration: 15,
											autoNext: { overlap: 0 },
										})
										const rundown: Rundown = EntityMockFactory.createActiveRundown({
											activePart,
											nextPart,
										})

										const testee: TimelineBuilder = createTestee()
										const timeline: Timeline = testee.buildTimeline(rundown)

										const nextGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
											group.id.includes(NEXT_GROUP_PREFIX)
										)!
										const controlGroup: TimelineObject = nextGroup.children.find((child) =>
											child.id.includes(PIECE_CONTROL_INFIX)
										)!

										expect(controlGroup.enable.duration).toBe(piece.duration)
									})
								})

								describe('next Part does not have an "inTransitionStart"', () => {
									it('does not create any groups for Piece', () => {
										const piece: Piece = EntityMockFactory.createPiece({
											transitionType: TransitionType.IN_TRANSITION,
										})
										const nextPart: Part = EntityMockFactory.createPart(
											{ id: 'nextId', pieces: [piece] },
											{ piecesWithLifespanFilters: [piece] }
										)
										const activePart: Part = EntityMockFactory.createPart({
											id: 'activeId',
											expectedDuration: 15,
											autoNext: { overlap: 0 },
										})
										const rundown: Rundown = EntityMockFactory.createActiveRundown({
											activePart,
											nextPart,
										})

										const testee: TimelineBuilder = createTestee()
										const timeline: Timeline = testee.buildTimeline(rundown)

										const nextGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
											group.id.includes(NEXT_GROUP_PREFIX)
										)!
										const controlGroup: TimelineObject | undefined = nextGroup.children.find(
											(child) => child.id.includes(PIECE_CONTROL_INFIX)
										)

										expect(controlGroup).toBeUndefined()
									})
								})
							})

							describe('creates TimelineEnable for OUT_TRANSITION Piece', () => {
								describe('next Part has a "KeepAliveDuration"', () => {
									describe('next Part has a PostRollDuration', () => {
										it('sets TimelineEnable.start to nextGroup.end - Part.keepAliveDuration - next Part.postRoll', () => {
											const postRollDuration: number = 20
											const keepAliveDuration: number = 30

											const piece: Piece = EntityMockFactory.createPiece({
												transitionType: TransitionType.OUT_TRANSITION,
											})

											const nextPart: Part = EntityMockFactory.createPart(
												{
													id: 'nextId',
													outTransition: { keepAliveDuration },
													pieces: [piece],
												},
												{
													partTimings: { postRollDuration },
													piecesWithLifespanFilters: [piece],
												}
											)
											const activePart: Part = EntityMockFactory.createPart({
												id: 'activeId',
												expectedDuration: 15,
												autoNext: { overlap: 0 },
											})
											const rundown: Rundown = EntityMockFactory.createActiveRundown({
												activePart,
												nextPart,
											})

											const testee: TimelineBuilder = createTestee()
											const timeline: Timeline = testee.buildTimeline(rundown)

											const nextGroup: TimelineObjectGroup = timeline.timelineGroups.find(
												(group) => group.id.includes(NEXT_GROUP_PREFIX)
											)!
											const controlGroup: TimelineObject = nextGroup.children.find((child) =>
												child.id.includes(PIECE_CONTROL_INFIX)
											)!

											expect(controlGroup.enable.start).toBe(
												`#${nextGroup.id}.end - ${keepAliveDuration} - ${postRollDuration}`
											)
										})
									})

									describe('next Part does not have a PostRollDuration', () => {
										it('sets TimelineEnable.start to nextGroup.end - next Part.keepAliveDuration', () => {
											const keepAliveDuration: number = 30

											const piece: Piece = EntityMockFactory.createPiece({
												transitionType: TransitionType.OUT_TRANSITION,
											})

											const nextPart: Part = EntityMockFactory.createPart(
												{
													id: 'nextId',
													outTransition: { keepAliveDuration },
													pieces: [piece],
												},
												{ piecesWithLifespanFilters: [piece] }
											)
											const activePart: Part = EntityMockFactory.createPart({
												id: 'activeId',
												expectedDuration: 15,
												autoNext: { overlap: 0 },
											})
											const rundown: Rundown = EntityMockFactory.createActiveRundown({
												activePart,
												nextPart,
											})

											const testee: TimelineBuilder = createTestee()
											const timeline: Timeline = testee.buildTimeline(rundown)

											const nextGroup: TimelineObjectGroup = timeline.timelineGroups.find(
												(group) => group.id.includes(NEXT_GROUP_PREFIX)
											)!
											const controlGroup: TimelineObject = nextGroup.children.find((child) =>
												child.id.includes(PIECE_CONTROL_INFIX)
											)!

											expect(controlGroup.enable.start).toBe(
												`#${nextGroup.id}.end - ${keepAliveDuration}`
											)
										})
									})
								})

								describe('next Part does not have a "KeepAliveDuration"', () => {
									it('does not create any groups for Piece', () => {
										const piece: Piece = EntityMockFactory.createPiece({
											transitionType: TransitionType.OUT_TRANSITION,
										})

										const nextPart: Part = EntityMockFactory.createPart(
											{ id: 'nextId', pieces: [piece] },
											{ piecesWithLifespanFilters: [piece] }
										)
										const activePart: Part = EntityMockFactory.createPart({
											id: 'activeId',
											expectedDuration: 15,
											autoNext: { overlap: 0 },
										})
										const rundown: Rundown = EntityMockFactory.createActiveRundown({
											activePart,
											nextPart,
										})

										const testee: TimelineBuilder = createTestee()
										const timeline: Timeline = testee.buildTimeline(rundown)

										const nextGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
											group.id.includes(NEXT_GROUP_PREFIX)
										)!
										const controlGroup: TimelineObject | undefined = nextGroup.children.find(
											(child) => child.id.includes(PIECE_CONTROL_INFIX)
										)

										expect(controlGroup).toBeUndefined()
									})
								})
							})

							describe('creates TimelineEnable for NO_TRANSITION Piece', () => {
								it('sets TimelineEnable.start to Piece.start', () => {
									const piece: Piece = EntityMockFactory.createPiece({
										start: 10,
										transitionType: TransitionType.NO_TRANSITION,
									})
									const nextPart: Part = EntityMockFactory.createPart(
										{ id: 'nextId', pieces: [piece] },
										{ piecesWithLifespanFilters: [piece] }
									)
									const activePart: Part = EntityMockFactory.createPart({
										id: 'activeId',
										expectedDuration: 15,
										autoNext: { overlap: 0 },
									})
									const rundown: Rundown = EntityMockFactory.createActiveRundown({
										activePart,
										nextPart,
									})

									const testee: TimelineBuilder = createTestee()
									const timeline: Timeline = testee.buildTimeline(rundown)

									const nextGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
										group.id.includes(NEXT_GROUP_PREFIX)
									)!
									const controlGroup: TimelineObject = nextGroup.children.find((child) =>
										child.id.includes(PIECE_CONTROL_INFIX)
									)!

									expect(controlGroup.enable.start).toBe(piece.start)
								})

								describe('Piece has a duration', () => {
									it('sets TimelineEnable.duration to Piece.duration', () => {
										const piece: Piece = EntityMockFactory.createPiece({
											duration: 30,
											transitionType: TransitionType.NO_TRANSITION,
										})
										const nextPart: Part = EntityMockFactory.createPart(
											{ id: 'nextId', pieces: [piece] },
											{ piecesWithLifespanFilters: [piece] }
										)
										const activePart: Part = EntityMockFactory.createPart({
											id: 'activeId',
											expectedDuration: 15,
											autoNext: { overlap: 0 },
										})
										const rundown: Rundown = EntityMockFactory.createActiveRundown({
											activePart,
											nextPart,
										})

										const testee: TimelineBuilder = createTestee()
										const timeline: Timeline = testee.buildTimeline(rundown)

										const nextGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
											group.id.includes(NEXT_GROUP_PREFIX)
										)!
										const controlGroup: TimelineObject = nextGroup.children.find((child) =>
											child.id.includes(PIECE_CONTROL_INFIX)
										)!

										expect(controlGroup.enable.duration).toBe(piece.duration)
									})
								})

								describe('Piece does not have a duration', () => {
									describe('next Part has PostRoll', () => {
										it('sets TimelineEnable.duration previousGroup.end - Part.timings.postRollDuration', () => {
											const postRollDuration: number = 50

											const piece: Piece = EntityMockFactory.createPiece({
												transitionType: TransitionType.NO_TRANSITION,
											})
											const nextPart: Part = EntityMockFactory.createPart(
												{ id: 'nextId', pieces: [piece] },
												{
													partTimings: { postRollDuration },
													piecesWithLifespanFilters: [piece],
												}
											)
											const activePart: Part = EntityMockFactory.createPart({
												id: 'activeId',
												expectedDuration: 15,
												autoNext: { overlap: 0 },
											})
											const rundown: Rundown = EntityMockFactory.createActiveRundown({
												activePart,
												nextPart,
											})

											const testee: TimelineBuilder = createTestee()
											const timeline: Timeline = testee.buildTimeline(rundown)

											const nextGroup: TimelineObjectGroup = timeline.timelineGroups.find(
												(group) => group.id.includes(NEXT_GROUP_PREFIX)
											)!
											const controlGroup: TimelineObject = nextGroup.children.find((child) =>
												child.id.includes(PIECE_CONTROL_INFIX)
											)!

											expect(controlGroup.enable.duration).toBe(
												`#${nextGroup.id} - ${postRollDuration}`
											)
										})
									})

									describe('next Part does not have PostRoll', () => {
										it('sets TimelineEnable.duration to zero', () => {
											const piece: Piece = EntityMockFactory.createPiece({
												transitionType: TransitionType.NO_TRANSITION,
											})
											const nextPart: Part = EntityMockFactory.createPart(
												{ id: 'nextId', pieces: [piece] },
												{ piecesWithLifespanFilters: [piece] }
											)
											const activePart: Part = EntityMockFactory.createPart({
												id: 'activeId',
												expectedDuration: 15,
												autoNext: { overlap: 0 },
											})
											const rundown: Rundown = EntityMockFactory.createActiveRundown({
												activePart,
												nextPart,
											})

											const testee: TimelineBuilder = createTestee()
											const timeline: Timeline = testee.buildTimeline(rundown)

											const nextGroup: TimelineObjectGroup = timeline.timelineGroups.find(
												(group) => group.id.includes(NEXT_GROUP_PREFIX)
											)!
											const controlGroup: TimelineObject = nextGroup.children.find((child) =>
												child.id.includes(PIECE_CONTROL_INFIX)
											)!

											expect(controlGroup.enable.duration).toBe(0)
										})
									})
								})
							})

							describe('controlGroup has TimelineEnable.start === zero && Piece has PreRoll', () => {
								describe('creates PreRollControlGroup for Piece', () => {
									it('sets id to correct id for PreRollControlGroup', () => {
										const piece: Piece = EntityMockFactory.createPiece({
											start: 0,
											preRollDuration: 10,
											transitionType: TransitionType.NO_TRANSITION,
										})
										const nextPart: Part = EntityMockFactory.createPart(
											{ id: 'nextId', pieces: [piece] },
											{ piecesWithLifespanFilters: [piece] }
										)
										const activePart: Part = EntityMockFactory.createPart({
											id: 'activeId',
											expectedDuration: 15,
											autoNext: { overlap: 0 },
										})
										const rundown: Rundown = EntityMockFactory.createActiveRundown({
											activePart,
											nextPart,
										})

										const testee: TimelineBuilder = createTestee()
										const timeline: Timeline = testee.buildTimeline(rundown)

										const nextGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
											group.id.includes(NEXT_GROUP_PREFIX)
										)!
										const controlObject: TimelineObject = nextGroup.children.find((child) =>
											child.id.includes(PIECE_CONTROL_INFIX)
										)!
										const expectedPreRollIdForPiece: string = `${PIECE_PRE_ROLL_PREFIX}${controlObject.id}`
										const preRollObject: TimelineObject | undefined = nextGroup.children.find(
											(child) => child.id === expectedPreRollIdForPiece
										)

										expect(preRollObject).not.toBeUndefined()
									})

									it('sets TimelineEnable.start to "nextGroup.id.start"', () => {
										const piece: Piece = EntityMockFactory.createPiece({
											start: 0,
											preRollDuration: 10,
											transitionType: TransitionType.NO_TRANSITION,
										})
										const nextPart: Part = EntityMockFactory.createPart(
											{ id: 'nextId', pieces: [piece] },
											{ piecesWithLifespanFilters: [piece] }
										)
										const activePart: Part = EntityMockFactory.createPart({
											id: 'activeId',
											expectedDuration: 15,
											autoNext: { overlap: 0 },
										})
										const rundown: Rundown = EntityMockFactory.createActiveRundown({
											activePart,
											nextPart,
										})

										const testee: TimelineBuilder = createTestee()
										const timeline: Timeline = testee.buildTimeline(rundown)

										const nextGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
											group.id.includes(NEXT_GROUP_PREFIX)
										)!
										const preRollObject: TimelineObject = nextGroup.children.find((child) =>
											child.id.includes(`${PIECE_PRE_ROLL_PREFIX}${NEXT_GROUP_PREFIX}`)
										)!

										expect(preRollObject.enable.start).toBe(`#${nextGroup.id}.start`)
									})

									it('sets an empty layer', () => {
										const piece: Piece = EntityMockFactory.createPiece({
											start: 0,
											preRollDuration: 10,
											transitionType: TransitionType.NO_TRANSITION,
										})
										const nextPart: Part = EntityMockFactory.createPart(
											{ id: 'nextId', pieces: [piece] },
											{ piecesWithLifespanFilters: [piece] }
										)
										const activePart: Part = EntityMockFactory.createPart({
											id: 'activeId',
											expectedDuration: 15,
											autoNext: { overlap: 0 },
										})
										const rundown: Rundown = EntityMockFactory.createActiveRundown({
											activePart,
											nextPart,
										})

										const testee: TimelineBuilder = createTestee()
										const timeline: Timeline = testee.buildTimeline(rundown)

										const nextGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
											group.id.includes(NEXT_GROUP_PREFIX)
										)!
										const preRollObject: TimelineObject = nextGroup.children.find((child) =>
											child.id.includes(PIECE_PRE_ROLL_PREFIX)
										)!

										expect(preRollObject.layer).toBe('')
									})

									it('updates controlPiece to start at PreRollControlGroup + Piece.preRollDuration', () => {
										const piece: Piece = EntityMockFactory.createPiece({
											start: 0,
											preRollDuration: 10,
											transitionType: TransitionType.NO_TRANSITION,
										})
										const nextPart: Part = EntityMockFactory.createPart(
											{ id: 'nextId', pieces: [piece] },
											{ piecesWithLifespanFilters: [piece] }
										)
										const activePart: Part = EntityMockFactory.createPart({
											id: 'activeId',
											expectedDuration: 15,
											autoNext: { overlap: 0 },
										})
										const rundown: Rundown = EntityMockFactory.createActiveRundown({
											activePart,
											nextPart,
										})

										const testee: TimelineBuilder = createTestee()
										const timeline: Timeline = testee.buildTimeline(rundown)

										const nextGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
											group.id.includes(NEXT_GROUP_PREFIX)
										)!
										const controlGroup: TimelineObject = nextGroup.children.find((child) =>
											child.id.includes(PIECE_CONTROL_INFIX)
										)!
										const preRollObject: TimelineObject = nextGroup.children.find((child) =>
											child.id.includes(PIECE_PRE_ROLL_PREFIX)
										)!

										expect(controlGroup.enable.start).toBe(
											`#${preRollObject.id} + ${piece.preRollDuration}`
										)
									})
								})
							})
						})

						describe('create a Piece child group on the next group', () => {
							it('sets correct Piece group id for Piece on next group', () => {
								const piece: Piece = EntityMockFactory.createPiece({
									transitionType: TransitionType.NO_TRANSITION,
								})
								const nextPart: Part = EntityMockFactory.createPart(
									{ id: 'nextId', pieces: [piece] },
									{ piecesWithLifespanFilters: [piece] }
								)
								const activePart: Part = EntityMockFactory.createPart({
									id: 'activeId',
									expectedDuration: 15,
									autoNext: { overlap: 0 },
								})
								const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart, nextPart })

								const testee: TimelineBuilder = createTestee()
								const timeline: Timeline = testee.buildTimeline(rundown)

								const nextGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
									group.id.includes(NEXT_GROUP_PREFIX)
								)!
								const expectedChildGroupIdForPiece: string = `${nextGroup.id}${PIECE_GROUP_INFIX}${piece.id}`
								const childGroup: TimelineObject | undefined = nextGroup.children.find(
									(child) => child.id === expectedChildGroupIdForPiece
								)

								expect(childGroup).not.toBeUndefined()
							})

							it('sets correct parentGroup id', () => {
								const piece: Piece = EntityMockFactory.createPiece({
									transitionType: TransitionType.NO_TRANSITION,
								})
								const nextPart: Part = EntityMockFactory.createPart(
									{ id: 'nextId', pieces: [piece] },
									{ piecesWithLifespanFilters: [piece] }
								)
								const activePart: Part = EntityMockFactory.createPart({
									id: 'activeId',
									expectedDuration: 15,
									autoNext: { overlap: 0 },
								})
								const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart, nextPart })

								const testee: TimelineBuilder = createTestee()
								const timeline: Timeline = testee.buildTimeline(rundown)

								const nextGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
									group.id.includes(NEXT_GROUP_PREFIX)
								)!
								const childGroup: TimelineObject = nextGroup.children.find((child) =>
									child.id.includes(PIECE_GROUP_INFIX)
								)!

								expect(childGroup.inGroup).toBe(nextGroup.id)
							})

							it('sets an empty layer', () => {
								const piece: Piece = EntityMockFactory.createPiece({
									transitionType: TransitionType.NO_TRANSITION,
								})
								const nextPart: Part = EntityMockFactory.createPart(
									{ id: 'nextId', pieces: [piece] },
									{ piecesWithLifespanFilters: [piece] }
								)
								const activePart: Part = EntityMockFactory.createPart({
									id: 'activeId',
									expectedDuration: 15,
									autoNext: { overlap: 0 },
								})
								const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart, nextPart })

								const testee: TimelineBuilder = createTestee()
								const timeline: Timeline = testee.buildTimeline(rundown)

								const nextGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
									group.id.includes(NEXT_GROUP_PREFIX)
								)!
								const childGroup: TimelineObject = nextGroup.children.find((child) =>
									child.id.includes(PIECE_GROUP_INFIX)
								)!

								expect(childGroup.layer).toBe('')
							})

							describe('Piece has PreRoll', () => {
								it('sets TimelineEnable.start PieceControlGroup.start - Piece.preRollDuration', () => {
									const piece: Piece = EntityMockFactory.createPiece({
										preRollDuration: 15,
										transitionType: TransitionType.NO_TRANSITION,
									})
									const nextPart: Part = EntityMockFactory.createPart(
										{ id: 'nextId', pieces: [piece] },
										{ piecesWithLifespanFilters: [piece] }
									)
									const activePart: Part = EntityMockFactory.createPart({
										id: 'activeId',
										expectedDuration: 15,
										autoNext: { overlap: 0 },
									})
									const rundown: Rundown = EntityMockFactory.createActiveRundown({
										activePart,
										nextPart,
									})

									const testee: TimelineBuilder = createTestee()
									const timeline: Timeline = testee.buildTimeline(rundown)

									const nextGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
										group.id.includes(NEXT_GROUP_PREFIX)
									)!
									const controlGroup: TimelineObject = nextGroup.children.find((child) =>
										child.id.includes(PIECE_CONTROL_INFIX)
									)!
									const childGroup: TimelineObject = nextGroup.children.find((child) =>
										child.id.includes(PIECE_GROUP_INFIX)
									)!

									expect(childGroup.enable.start).toBe(
										`#${controlGroup.id}.start - ${piece.preRollDuration}`
									)
								})
							})

							describe('Piece does not have PreRoll', () => {
								it('sets TimelineEnable.start to PieceControlGroup.start', () => {
									const piece: Piece = EntityMockFactory.createPiece({
										transitionType: TransitionType.NO_TRANSITION,
									})
									const nextPart: Part = EntityMockFactory.createPart(
										{ id: 'nextId', pieces: [piece] },
										{ piecesWithLifespanFilters: [piece] }
									)
									const activePart: Part = EntityMockFactory.createPart({
										id: 'activeId',
										expectedDuration: 15,
										autoNext: { overlap: 0 },
									})
									const rundown: Rundown = EntityMockFactory.createActiveRundown({
										activePart,
										nextPart,
									})

									const testee: TimelineBuilder = createTestee()
									const timeline: Timeline = testee.buildTimeline(rundown)

									const nextGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
										group.id.includes(NEXT_GROUP_PREFIX)
									)!
									const controlGroup: TimelineObject = nextGroup.children.find((child) =>
										child.id.includes(PIECE_CONTROL_INFIX)
									)!
									const childGroup: TimelineObject = nextGroup.children.find((child) =>
										child.id.includes(PIECE_GROUP_INFIX)
									)!

									expect(childGroup.enable.start).toBe(`#${controlGroup.id}.start`)
								})
							})

							describe('Piece has PostRoll', () => {
								it('sets TimelineEnable.end to PieceControlGroup.end - Piece.postRollDuration', () => {
									const piece: Piece = EntityMockFactory.createPiece({
										postRollDuration: 40,
										transitionType: TransitionType.NO_TRANSITION,
									})
									const nextPart: Part = EntityMockFactory.createPart(
										{ id: 'nextId', pieces: [piece] },
										{ piecesWithLifespanFilters: [piece] }
									)
									const activePart: Part = EntityMockFactory.createPart({
										id: 'activeId',
										expectedDuration: 15,
										autoNext: { overlap: 0 },
									})
									const rundown: Rundown = EntityMockFactory.createActiveRundown({
										activePart,
										nextPart,
									})

									const testee: TimelineBuilder = createTestee()
									const timeline: Timeline = testee.buildTimeline(rundown)

									const nextGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
										group.id.includes(NEXT_GROUP_PREFIX)
									)!
									const controlGroup: TimelineObject = nextGroup.children.find((child) =>
										child.id.includes(PIECE_CONTROL_INFIX)
									)!
									const childGroup: TimelineObject = nextGroup.children.find((child) =>
										child.id.includes(PIECE_GROUP_INFIX)
									)!

									expect(childGroup.enable.end).toBe(
										`#${controlGroup.id}.end - ${piece.postRollDuration}`
									)
								})
							})

							describe('Piece does not have PostRoll', () => {
								it('sets TimelineEnable.end to PieceControlGroup.end', () => {
									const piece: Piece = EntityMockFactory.createPiece({
										transitionType: TransitionType.NO_TRANSITION,
									})
									const nextPart: Part = EntityMockFactory.createPart(
										{ id: 'nextId', pieces: [piece] },
										{ piecesWithLifespanFilters: [piece] }
									)
									const activePart: Part = EntityMockFactory.createPart({
										id: 'activeId',
										expectedDuration: 15,
										autoNext: { overlap: 0 },
									})
									const rundown: Rundown = EntityMockFactory.createActiveRundown({
										activePart,
										nextPart,
									})

									const testee: TimelineBuilder = createTestee()
									const timeline: Timeline = testee.buildTimeline(rundown)

									const nextGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
										group.id.includes(NEXT_GROUP_PREFIX)
									)!
									const controlGroup: TimelineObject = nextGroup.children.find((child) =>
										child.id.includes(PIECE_CONTROL_INFIX)
									)!
									const childGroup: TimelineObject = nextGroup.children.find((child) =>
										child.id.includes(PIECE_GROUP_INFIX)
									)!

									expect(childGroup.enable.end).toBe(`#${controlGroup.id}.end`)
								})
							})

							describe('Piece has a TimelineObject', () => {
								it('sets the id of the TimelineObject to be pieceChildGroup.id_piece.id_timelineObject.id', () => {
									const timelineObject: TimelineObject = { id: 'timelineObjectId' } as TimelineObject
									const piece: Piece = EntityMockFactory.createPiece({
										timelineObjects: [timelineObject],
										transitionType: TransitionType.NO_TRANSITION,
									})
									const nextPart: Part = EntityMockFactory.createPart(
										{ id: 'nextId', pieces: [piece] },
										{ piecesWithLifespanFilters: [piece] }
									)
									const activePart: Part = EntityMockFactory.createPart({
										id: 'activeId',
										expectedDuration: 15,
										autoNext: { overlap: 0 },
									})
									const rundown: Rundown = EntityMockFactory.createActiveRundown({
										activePart,
										nextPart,
									})

									const testee: TimelineBuilder = createTestee()
									const timeline: Timeline = testee.buildTimeline(rundown)

									const nextGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
										group.id.includes(NEXT_GROUP_PREFIX)
									)!
									const childGroup: TimelineObjectGroup = nextGroup.children.find((child) =>
										child.id.includes(PIECE_GROUP_INFIX)
									)! as TimelineObjectGroup
									const result: TimelineObject = childGroup.children[0]

									expect(result.id).toBe(`${childGroup.id}_${piece.id}_${timelineObject.id}`)
								})

								it('sets the group of the TimelineObject to be the Piece child group', () => {
									const timelineObject: TimelineObject = { id: 'timelineObjectId' } as TimelineObject
									const piece: Piece = EntityMockFactory.createPiece({
										timelineObjects: [timelineObject],
										transitionType: TransitionType.NO_TRANSITION,
									})
									const nextPart: Part = EntityMockFactory.createPart(
										{ id: 'nextId', pieces: [piece] },
										{ piecesWithLifespanFilters: [piece] }
									)
									const activePart: Part = EntityMockFactory.createPart({
										id: 'activeId',
										expectedDuration: 15,
										autoNext: { overlap: 0 },
									})
									const rundown: Rundown = EntityMockFactory.createActiveRundown({
										activePart,
										nextPart,
									})

									const testee: TimelineBuilder = createTestee()
									const timeline: Timeline = testee.buildTimeline(rundown)

									const nextGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
										group.id.includes(NEXT_GROUP_PREFIX)
									)!
									const childGroup: TimelineObjectGroup = nextGroup.children.find((child) =>
										child.id.includes(PIECE_GROUP_INFIX)
									)! as TimelineObjectGroup
									const result: TimelineObject = childGroup.children[0]

									expect(result.inGroup).toBe(childGroup.id)
								})

								it('has same content as the TimelineObject', () => {
									const content: any = { someContent: 'someContent' }
									const timelineObject: TimelineObject = {
										id: 'timelineObjectId',
										content,
									} as TimelineObject
									const piece: Piece = EntityMockFactory.createPiece({
										timelineObjects: [timelineObject],
										transitionType: TransitionType.NO_TRANSITION,
									})
									const nextPart: Part = EntityMockFactory.createPart(
										{ id: 'nextId', pieces: [piece] },
										{ piecesWithLifespanFilters: [piece] }
									)
									const activePart: Part = EntityMockFactory.createPart({
										id: 'activeId',
										expectedDuration: 15,
										autoNext: { overlap: 0 },
									})
									const rundown: Rundown = EntityMockFactory.createActiveRundown({
										activePart,
										nextPart,
									})

									const objectCloner: ObjectCloner = mock<ObjectCloner>()
									when(objectCloner.clone(timelineObject)).thenReturn(
										JSON.parse(JSON.stringify(timelineObject))
									)

									const testee: TimelineBuilder = createTestee(instance(objectCloner))
									const timeline: Timeline = testee.buildTimeline(rundown)

									const nextGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
										group.id.includes(NEXT_GROUP_PREFIX)
									)!
									const childGroup: TimelineObjectGroup = nextGroup.children.find((child) =>
										child.id.includes(PIECE_GROUP_INFIX)
									)! as TimelineObjectGroup
									const result: TimelineObject = childGroup.children[0]

									expect(result.content).toEqual(content)
								})
							})

							describe('Piece has five TimelineObjects', () => {
								it('adds all five TimelineObjects to the children of the Piece child group', () => {
									const timelineObjects: TimelineObject[] = [
										{ id: '1' } as TimelineObject,
										{ id: '2' } as TimelineObject,
										{ id: '3' } as TimelineObject,
										{ id: '4' } as TimelineObject,
										{ id: '5' } as TimelineObject,
									]
									const piece: Piece = EntityMockFactory.createPiece({
										timelineObjects,
										transitionType: TransitionType.NO_TRANSITION,
									})
									const nextPart: Part = EntityMockFactory.createPart(
										{ id: 'nextId', pieces: [piece] },
										{ piecesWithLifespanFilters: [piece] }
									)
									const activePart: Part = EntityMockFactory.createPart({
										id: 'activeId',
										expectedDuration: 15,
										autoNext: { overlap: 0 },
									})
									const rundown: Rundown = EntityMockFactory.createActiveRundown({
										activePart,
										nextPart,
									})

									const objectCloner: ObjectCloner = mock<ObjectCloner>()
									timelineObjects.forEach((timelineObject) =>
										when(objectCloner.clone(timelineObject)).thenReturn(
											JSON.parse(JSON.stringify(timelineObject))
										)
									)

									const testee: TimelineBuilder = createTestee(instance(objectCloner))
									const timeline: Timeline = testee.buildTimeline(rundown)

									const nextGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
										group.id.includes(NEXT_GROUP_PREFIX)
									)!
									const childGroup: TimelineObjectGroup = nextGroup.children.find((child) =>
										child.id.includes(PIECE_GROUP_INFIX)
									)! as TimelineObjectGroup

									const timelineObjectIds: string[] = childGroup.children.map(
										(timelineObject) => timelineObject.id
									)
									timelineObjects.forEach((timelineObject) =>
										expect(timelineObjectIds).toContainEqual(
											`${childGroup.id}_${piece.id}_${timelineObject.id}`
										)
									)
								})
							})
						})
					})

					describe('next Part does not have any Pieces', () => {
						it('does not create any groups for the Pieces', () => {
							const nextPart: Part = EntityMockFactory.createPart({ id: 'nextId' })
							const activePart: Part = EntityMockFactory.createPart({
								id: 'activeId',
								expectedDuration: 15,
								autoNext: { overlap: 0 },
							})
							const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart, nextPart })

							const testee: TimelineBuilder = createTestee()
							const timeline: Timeline = testee.buildTimeline(rundown)

							const nextGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
								group.id.includes(NEXT_GROUP_PREFIX)
							)!
							const childGroup: TimelineObject | undefined = nextGroup.children.find((child) =>
								child.id.includes(PIECE_GROUP_INFIX)
							)

							expect(childGroup).toBeUndefined()
						})
					})

					describe('next Part has Pieces', () => {
						describe('next Part has five Pieces, but one of them is an infinite Piece', () => {
							it('only creates groups for four Pieces', () => {
								const infinitePiece: Piece = EntityMockFactory.createPiece({
									pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
									transitionType: TransitionType.NO_TRANSITION,
								})
								const nonInfinitePieces: Piece[] = [
									EntityMockFactory.createPiece({
										pieceLifespan: PieceLifespan.WITHIN_PART,
										transitionType: TransitionType.NO_TRANSITION,
									}),
									EntityMockFactory.createPiece({
										pieceLifespan: PieceLifespan.WITHIN_PART,
										transitionType: TransitionType.NO_TRANSITION,
									}),
									EntityMockFactory.createPiece({
										pieceLifespan: PieceLifespan.WITHIN_PART,
										transitionType: TransitionType.NO_TRANSITION,
									}),
									EntityMockFactory.createPiece({
										pieceLifespan: PieceLifespan.WITHIN_PART,
										transitionType: TransitionType.NO_TRANSITION,
									}),
								]
								const nextPart: Part = EntityMockFactory.createPart(
									{ id: 'nextId', pieces: [infinitePiece, ...nonInfinitePieces] },
									{ piecesWithLifespanFilters: nonInfinitePieces }
								)
								const activePart: Part = EntityMockFactory.createPart({
									id: 'activeId',
									expectedDuration: 15,
									autoNext: { overlap: 0 },
								})
								const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart, nextPart })

								const testee: TimelineBuilder = createTestee()
								const timeline: Timeline = testee.buildTimeline(rundown)

								const nextGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
									group.id.includes(NEXT_GROUP_PREFIX)
								)!
								const controlGroups: TimelineObject[] = nextGroup.children.filter((child) =>
									child.id.includes(PIECE_CONTROL_INFIX)
								)

								expect(controlGroups).toHaveLength(4)
							})
						})

						describe('next Part has five Pieces, but all of them are infinite Pieces', () => {
							it('does not create any groups for the Pieces', () => {
								const infinitePieces: Piece[] = [
									EntityMockFactory.createPiece({
										pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
										transitionType: TransitionType.NO_TRANSITION,
									}),
									EntityMockFactory.createPiece({
										pieceLifespan: PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE,
										transitionType: TransitionType.NO_TRANSITION,
									}),
									EntityMockFactory.createPiece({
										pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
										transitionType: TransitionType.NO_TRANSITION,
									}),
									EntityMockFactory.createPiece({
										pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
										transitionType: TransitionType.NO_TRANSITION,
									}),
									EntityMockFactory.createPiece({
										pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
										transitionType: TransitionType.NO_TRANSITION,
									}),
								]
								const nextPart: Part = EntityMockFactory.createPart({
									id: 'nextId',
									pieces: infinitePieces,
								})
								const activePart: Part = EntityMockFactory.createPart({
									id: 'activeId',
									expectedDuration: 15,
									autoNext: { overlap: 0 },
								})
								const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart, nextPart })

								const testee: TimelineBuilder = createTestee()
								const timeline: Timeline = testee.buildTimeline(rundown)

								const nextGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
									group.id.includes(NEXT_GROUP_PREFIX)
								)!
								const controlGroups: TimelineObject[] = nextGroup.children.filter((child) =>
									child.id.includes(PIECE_CONTROL_INFIX)
								)

								expect(controlGroups).toHaveLength(0)
							})
						})
					})
				})
			})

			describe('active Part does not have an expected duration longer than zero', () => {
				it('does not create a group for next Part', () => {
					const nextPart: Part = EntityMockFactory.createPart({ id: 'nextId' })
					const activePart: Part = EntityMockFactory.createPart({
						id: 'activeId',
						autoNext: { overlap: 0 },
					})
					const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart, nextPart })

					const testee: TimelineBuilder = createTestee()
					const timeline: Timeline = testee.buildTimeline(rundown)

					const nextGroup: TimelineObjectGroup | undefined = timeline.timelineGroups.find((group) =>
						group.id.includes(NEXT_GROUP_PREFIX)
					)

					expect(nextGroup).toBeUndefined()
				})

				it('does not set Timeline.autoNext', () => {
					const nextPart: Part = EntityMockFactory.createPart({ id: 'nextId' })
					const activePart: Part = EntityMockFactory.createPart({
						id: 'activeId',
						autoNext: { overlap: 0 },
					})
					const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart, nextPart })

					const testee: TimelineBuilder = createTestee()
					const timeline: Timeline = testee.buildTimeline(rundown)

					expect(timeline.autoNext).toBeUndefined()
				})
			})
		})

		describe('active Part does not have autoNext', () => {
			it('does not create a group for next Part', () => {
				const nextPart: Part = EntityMockFactory.createPart({ id: 'nextId' })
				const activePart: Part = EntityMockFactory.createPart({ id: 'activeId' })
				const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart, nextPart })

				const testee: TimelineBuilder = createTestee()
				const timeline: Timeline = testee.buildTimeline(rundown)

				const nextGroup: TimelineObjectGroup | undefined = timeline.timelineGroups.find((group) =>
					group.id.includes(NEXT_GROUP_PREFIX)
				)

				expect(nextGroup).toBeUndefined()
			})

			it('does not set Timeline.autoNext', () => {
				const nextPart: Part = EntityMockFactory.createPart({ id: 'nextId' })
				const activePart: Part = EntityMockFactory.createPart({ id: 'activeId' })
				const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart, nextPart })

				const testee: TimelineBuilder = createTestee()
				const timeline: Timeline = testee.buildTimeline(rundown)

				expect(timeline.autoNext).toBeUndefined()
			})
		})

		describe('Rundown has an infinite Piece', () => {
			describe('infinite Piece is an "inTransition" Pieces', () => {
				it('does not create an infinite Piece group', () => {
					const infinitePiece: Piece = EntityMockFactory.createPiece({
						transitionType: TransitionType.IN_TRANSITION,
						pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
					})
					const rundown: Rundown = EntityMockFactory.createActiveRundown({ infinitePieces: [infinitePiece] })

					const testee: TimelineBuilder = createTestee()
					const timeline: Timeline = testee.buildTimeline(rundown)

					const infiniteGroup: TimelineObjectGroup | undefined = timeline.timelineGroups.find((group) =>
						group.id.includes(INFINITE_GROUP_PREFIX)
					)

					expect(infiniteGroup).toBeUndefined()
				})
			})

			describe('infinite Piece is an "outTransition" Pieces', () => {
				it('does not create an infinite Piece group', () => {
					const infinitePiece: Piece = EntityMockFactory.createPiece({
						transitionType: TransitionType.OUT_TRANSITION,
						pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
					})
					const rundown: Rundown = EntityMockFactory.createActiveRundown({ infinitePieces: [infinitePiece] })

					const testee: TimelineBuilder = createTestee()
					const timeline: Timeline = testee.buildTimeline(rundown)

					const infiniteGroup: TimelineObjectGroup | undefined = timeline.timelineGroups.find((group) =>
						group.id.includes(INFINITE_GROUP_PREFIX)
					)

					expect(infiniteGroup).toBeUndefined()
				})
			})

			describe('infinite Piece is not a "transition" Piece"', () => {
				describe('infinite Piece belongs to the active Part', () => {
					it('does not create infinite groups for Piece', () => {
						const activePartId: string = 'activePartId'
						const infinitePiece: Piece = EntityMockFactory.createPiece({
							partId: activePartId,
							transitionType: TransitionType.NO_TRANSITION,
							pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
						})
						const activePart: Part = EntityMockFactory.createPart({ id: activePartId })
						const rundown: Rundown = EntityMockFactory.createActiveRundown({
							activePart,
							infinitePieces: [infinitePiece],
						})

						const testee: TimelineBuilder = createTestee()
						const timeline: Timeline = testee.buildTimeline(rundown)

						const infiniteGroup: TimelineObjectGroup | undefined = timeline.timelineGroups.find((group) =>
							group.id.includes(INFINITE_GROUP_PREFIX)
						)

						expect(infiniteGroup).toBeUndefined()
					})
				})

				describe('infinite Piece does not belong to the active Part', () => {
					describe('infinite Piece does not have an executedAt larger than zero', () => {
						it('throws an error', () => {
							const infinitePiece: Piece = EntityMockFactory.createPiece({
								partId: 'randomPartId',
								transitionType: TransitionType.NO_TRANSITION,
								pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
							})
							const activePart: Part = EntityMockFactory.createPart({ id: 'activeId' })
							const rundown: Rundown = EntityMockFactory.createActiveRundown({
								activePart,
								infinitePieces: [infinitePiece],
							})

							const testee: TimelineBuilder = createTestee()

							expect(() => testee.buildTimeline(rundown)).toThrow()
						})
					})

					describe('infinite Piece has an executedAt larger than zero', () => {
						describe('creates an infinite group for Piece', () => {
							it('sets correct infinite group id', () => {
								const infinitePiece: Piece = EntityMockFactory.createPiece(
									{
										partId: 'randomPartId',
										transitionType: TransitionType.NO_TRANSITION,
										pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
									},
									{ executedAt: 100 }
								)
								const activePart: Part = EntityMockFactory.createPart({
									id: 'activeId',
								})
								const rundown: Rundown = EntityMockFactory.createActiveRundown({
									activePart,
									infinitePieces: [infinitePiece],
								})

								const testee: TimelineBuilder = createTestee()
								const timeline: Timeline = testee.buildTimeline(rundown)

								const expectedInfinitePieceGroupId: string = `${INFINITE_GROUP_PREFIX}${activePart.id}_${infinitePiece.id}`
								const infiniteGroup: TimelineObjectGroup | undefined = timeline.timelineGroups.find(
									(group) => group.id === expectedInfinitePieceGroupId
								)

								expect(infiniteGroup).not.toBeUndefined()
							})

							it('sets priority to medium', () => {
								const infinitePiece: Piece = EntityMockFactory.createPiece(
									{
										partId: 'randomPartId',
										transitionType: TransitionType.NO_TRANSITION,
										pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
									},
									{ executedAt: 100 }
								)
								const activePart: Part = EntityMockFactory.createPart({
									id: 'activeId',
								})
								const rundown: Rundown = EntityMockFactory.createActiveRundown({
									activePart,
									infinitePieces: [infinitePiece],
								})

								const testee: TimelineBuilder = createTestee()
								const timeline: Timeline = testee.buildTimeline(rundown)

								const infiniteGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
									group.id.includes(INFINITE_GROUP_PREFIX)
								)!

								expect(infiniteGroup.priority).toBe(MEDIUM_PRIORITY)
							})

							it('sets TimelineEnable.start to Piece.executedAt', () => {
								const executedAt: number = 200
								const infinitePiece: Piece = EntityMockFactory.createPiece(
									{
										partId: 'randomPartId',
										transitionType: TransitionType.NO_TRANSITION,
										pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
									},
									{ executedAt }
								)
								const activePart: Part = EntityMockFactory.createPart({
									id: 'activeId',
								})
								const rundown: Rundown = EntityMockFactory.createActiveRundown({
									activePart,
									infinitePieces: [infinitePiece],
								})

								const testee: TimelineBuilder = createTestee()
								const timeline: Timeline = testee.buildTimeline(rundown)

								const infiniteGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
									group.id.includes(INFINITE_GROUP_PREFIX)
								)!

								expect(infiniteGroup.enable.start).toBe(executedAt)
							})

							it('sets the layer to Piece.layer', () => {
								const layer: string = 'someLayerForInfinitePiece'
								const infinitePiece: Piece = EntityMockFactory.createPiece(
									{
										layer,
										partId: 'randomPartId',
										transitionType: TransitionType.NO_TRANSITION,
										pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
									},
									{ executedAt: 100 }
								)
								const activePart: Part = EntityMockFactory.createPart({
									id: 'activeId',
								})
								const rundown: Rundown = EntityMockFactory.createActiveRundown({
									activePart,
									infinitePieces: [infinitePiece],
								})

								const testee: TimelineBuilder = createTestee()
								const timeline: Timeline = testee.buildTimeline(rundown)

								const infiniteGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
									group.id.includes(INFINITE_GROUP_PREFIX)
								)!

								expect(infiniteGroup.layer).toBe(layer)
							})

							//TODO: Need to figure out if we even need a PreRoll group for infinite Pieces. Keep these in until then.
							// describe('infinite Piece has PreRoll', () => {
							// 	describe('it creates a preRoll infinite group for Piece', () => {
							// 		it('sets correct preRoll infinite group id', () => {
							//             const infinitePiece: Piece = EntityDefaultFactory.createPiece({ preRollDuration: 10, partId: 'randomPartId', transitionType: TransitionType.NO_TRANSITION, pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE } )
							//
							//             const segment: Segment = createSegmentWithPieces([infinitePiece])
							//             const rundown: Rundown = EntityDefaultFactory.createActiveRundown([segment])
							//
							//             const testee: TimelineBuilder = createTestee()
							//             const timeline: Timeline = testee.buildTimeline(rundown)
							//
							//             const infiniteGroup: TimelineObjectGroup = timeline.timelineGroups.find(group => group.id === `${INFINITE_GROUP_PREFIX}${segment.getParts()[0].id}_${infinitePiece.id}`)!
							// 			const expectedPreRollGroupId: string = `${PIECE_PRE_ROLL_PREFIX}${infiniteGroup.id}`
							// 			const preRollGroup: TimelineObject | undefined = timeline.timelineGroups.find(group => group.id === expectedPreRollGroupId)
							//
							//             expect(preRollGroup).not.toBeUndefined()
							// 		})
							//
							// 		it('sets TimelineEnable.start to Piece.executedAt - Piece.preRollDuration', () => {
							//             const infinitePiece: Piece = EntityDefaultFactory.createPiece({ preRollDuration: 10, partId: 'randomPartId', transitionType: TransitionType.NO_TRANSITION, pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE } )
							//
							//             const segment: Segment = createSegmentWithPieces([infinitePiece])
							//             const rundown: Rundown = EntityDefaultFactory.createActiveRundown([segment])
							//
							//             const testee: TimelineBuilder = createTestee()
							//             const timeline: Timeline = testee.buildTimeline(rundown)
							//
							//             const preRollGroup: TimelineObject = timeline.timelineGroups.find(group => group.id.includes(PIECE_PRE_ROLL_PREFIX))!
							//
							//             expect(preRollGroup.enable.start).toBe(infinitePiece.executedAt - infinitePiece.preRollDuration)
							// 		})
							//
							// 		it('sets empty layer', () => {
							//             const infinitePiece: Piece = EntityDefaultFactory.createPiece({ preRollDuration: 10, partId: 'randomPartId', transitionType: TransitionType.NO_TRANSITION, pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE } )
							//
							//             const segment: Segment = createSegmentWithPieces([infinitePiece])
							//             const rundown: Rundown = EntityDefaultFactory.createActiveRundown([segment])
							//
							//             const testee: TimelineBuilder = createTestee()
							//             const timeline: Timeline = testee.buildTimeline(rundown)
							//
							//             const preRollGroup: TimelineObject = timeline.timelineGroups.find(group => group.id.includes(PIECE_PRE_ROLL_PREFIX))!
							//
							//             expect(preRollGroup.layer).toBe('')
							// 		})
							//
							// 		it('sets the TimelineEnable.start of the infinite group for Piece to preRollInfiniteGroup + Piece.preRollDuration', () => {
							//             const infinitePiece: Piece = EntityDefaultFactory.createPiece({ preRollDuration: 10, partId: 'randomPartId', transitionType: TransitionType.NO_TRANSITION, pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE } )
							//
							//             const segment: Segment = createSegmentWithPieces([infinitePiece])
							//             const rundown: Rundown = EntityDefaultFactory.createActiveRundown([segment])
							//
							//             const testee: TimelineBuilder = createTestee()
							//             const timeline: Timeline = testee.buildTimeline(rundown)
							//
							//             const infiniteGroup: TimelineObjectGroup = timeline.timelineGroups.find(group => group.id === `${INFINITE_GROUP_PREFIX}${segment.getParts()[0].id}_${infinitePiece.id}`)!
							//             const preRollGroup: TimelineObject = timeline.timelineGroups.find(group => group.id.includes(PIECE_PRE_ROLL_PREFIX))!
							//
							//             expect(infiniteGroup.enable.start).toBe(`#${preRollGroup.id} + ${infinitePiece.preRollDuration}`)
							// 		})
							// 	})
							// })

							describe('infinite Piece has a TimelineObject', () => {
								it('sets the id of the TimelineObject to be infinitePieceGroup.id_piece.id_timelineObject.id', () => {
									const timelineObject: TimelineObject = { id: 'timelineObject' } as TimelineObject
									const infinitePiece: Piece = EntityMockFactory.createPiece(
										{
											timelineObjects: [timelineObject],
											partId: 'randomPartId',
											transitionType: TransitionType.NO_TRANSITION,
											pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
										},
										{ executedAt: 100 }
									)
									const activePart: Part = EntityMockFactory.createPart({
										id: 'activeId',
									})
									const rundown: Rundown = EntityMockFactory.createActiveRundown({
										activePart,
										infinitePieces: [infinitePiece],
									})

									const testee: TimelineBuilder = createTestee()
									const timeline: Timeline = testee.buildTimeline(rundown)

									const infiniteGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
										group.id.includes(INFINITE_GROUP_PREFIX)
									)!
									const expectedTimelineObjectId: string = `${infiniteGroup.id}_${infinitePiece.id}_${timelineObject.id}`
									const result: TimelineObject | undefined = infiniteGroup.children.find(
										(child) => child.id === expectedTimelineObjectId
									)

									expect(result).not.toBeUndefined()
								})

								it('sets the group of the TimelineObject to be the infinite Piece group', () => {
									const timelineObject: TimelineObject = { id: 'timelineObject' } as TimelineObject
									const infinitePiece: Piece = EntityMockFactory.createPiece(
										{
											timelineObjects: [timelineObject],
											partId: 'randomPartId',
											transitionType: TransitionType.NO_TRANSITION,
											pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
										},
										{ executedAt: 100 }
									)
									const activePart: Part = EntityMockFactory.createPart({
										id: 'activeId',
									})
									const rundown: Rundown = EntityMockFactory.createActiveRundown({
										activePart,
										infinitePieces: [infinitePiece],
									})

									const testee: TimelineBuilder = createTestee()
									const timeline: Timeline = testee.buildTimeline(rundown)

									const infiniteGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
										group.id.includes(INFINITE_GROUP_PREFIX)
									)!
									const expectedTimelineObjectId: string = `${infiniteGroup.id}_${infinitePiece.id}_${timelineObject.id}`
									const result: TimelineObject = infiniteGroup.children.find(
										(child) => child.id === expectedTimelineObjectId
									)!

									expect(result.inGroup).toBe(infiniteGroup.id)
								})

								it('has same content as the TimelineObject', () => {
									const content: any = { someContent: 'someContent' }
									const timelineObject: TimelineObject = {
										id: 'timelineObjectId',
										content,
									} as TimelineObject
									const infinitePiece: Piece = EntityMockFactory.createPiece(
										{
											timelineObjects: [timelineObject],
											partId: 'randomPartId',
											transitionType: TransitionType.NO_TRANSITION,
											pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
										},
										{ executedAt: 100 }
									)
									const activePart: Part = EntityMockFactory.createPart({
										id: 'activeId',
									})
									const rundown: Rundown = EntityMockFactory.createActiveRundown({
										activePart,
										infinitePieces: [infinitePiece],
									})

									const objectCloner: ObjectCloner = mock<ObjectCloner>()
									when(objectCloner.clone(timelineObject)).thenReturn(
										JSON.parse(JSON.stringify(timelineObject))
									)

									const testee: TimelineBuilder = createTestee(instance(objectCloner))
									const timeline: Timeline = testee.buildTimeline(rundown)

									const infiniteGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
										group.id.includes(INFINITE_GROUP_PREFIX)
									)!
									const expectedTimelineObjectId: string = `${infiniteGroup.id}_${infinitePiece.id}_${timelineObject.id}`
									const result: TimelineObject = infiniteGroup.children.find(
										(child) => child.id === expectedTimelineObjectId
									)!

									expect(result.content).toEqual(content)
								})
							})

							describe('Piece has five TimelineObjects', () => {
								it('adds all five TimelineObjects to the children of the infinite Piece group', () => {
									const timelineObjects: TimelineObject[] = [
										{ id: '1' } as TimelineObject,
										{ id: '2' } as TimelineObject,
										{ id: '3' } as TimelineObject,
										{ id: '4' } as TimelineObject,
										{ id: '5' } as TimelineObject,
									]
									const infinitePiece: Piece = EntityMockFactory.createPiece(
										{
											timelineObjects,
											partId: 'randomPartId',
											transitionType: TransitionType.NO_TRANSITION,
											pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
										},
										{ executedAt: 100 }
									)
									const activePart: Part = EntityMockFactory.createPart({
										id: 'activeId',
									})
									const rundown: Rundown = EntityMockFactory.createActiveRundown({
										activePart,
										infinitePieces: [infinitePiece],
									})

									const objectCloner: ObjectCloner = mock<ObjectCloner>()
									timelineObjects.forEach((timelineObject) =>
										when(objectCloner.clone(timelineObject)).thenReturn(
											JSON.parse(JSON.stringify(timelineObject))
										)
									)

									const testee: TimelineBuilder = createTestee(instance(objectCloner))
									const timeline: Timeline = testee.buildTimeline(rundown)

									const infiniteGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
										group.id.includes(INFINITE_GROUP_PREFIX)
									)!

									const timelineObjectIds: string[] = infiniteGroup.children.map(
										(timelineObject) => timelineObject.id
									)
									timelineObjects.forEach((timelineObject) =>
										expect(timelineObjectIds).toContainEqual(
											`${infiniteGroup.id}_${infinitePiece.id}_${timelineObject.id}`
										)
									)
								})
							})
						})
					})
				})
			})
		})

		describe('Rundown has multiple valid infinite Pieces', () => {
			it('creates infinite groups for all infinite Pieces', () => {
				const infinitePieces: Piece[] = [
					EntityMockFactory.createPiece(
						{
							id: 'infiniteOne',
							layer: 'layerOne',
							partId: 'randomPartId',
							transitionType: TransitionType.NO_TRANSITION,
							pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
						},
						{
							executedAt: 100,
						}
					),
					EntityMockFactory.createPiece(
						{
							id: 'infiniteTwo',
							layer: 'layerTwo',
							partId: 'randomPartId',
							transitionType: TransitionType.NO_TRANSITION,
							pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
						},
						{
							executedAt: 100,
						}
					),
					EntityMockFactory.createPiece(
						{
							id: 'infiniteThree',
							layer: 'layerThree',
							partId: 'randomPartId',
							transitionType: TransitionType.NO_TRANSITION,
							pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
						},
						{
							executedAt: 100,
						}
					),
				]
				const activePart: Part = EntityMockFactory.createPart({ id: 'activeId' })
				const rundown: Rundown = EntityMockFactory.createActiveRundown({ activePart, infinitePieces })

				const testee: TimelineBuilder = createTestee()
				const timeline: Timeline = testee.buildTimeline(rundown)

				const infiniteGroups: TimelineObjectGroup[] = timeline.timelineGroups.filter((group) =>
					group.id.includes(INFINITE_GROUP_PREFIX)
				)

				expect(infiniteGroups).toHaveLength(3)
			})
		})

		describe('Rundown does not have any infinite Pieces', () => {
			it('does not create any infinite Piece groups', () => {
				const rundown: Rundown = EntityMockFactory.createActiveRundown()

				const testee: TimelineBuilder = createTestee()
				const timeline: Timeline = testee.buildTimeline(rundown)

				const infiniteGroups: TimelineObjectGroup[] = timeline.timelineGroups.filter((group) =>
					group.id.includes(INFINITE_GROUP_PREFIX)
				)

				expect(infiniteGroups).toHaveLength(0)
			})
		})
	})
})

function createTestee(objectCloner?: ObjectCloner): SuperflyTimelineBuilder {
	if (!objectCloner) {
		const objectClonerMock: ObjectCloner = mock<ObjectCloner>()
		when(objectClonerMock.clone(anything())).thenReturn({})
		objectCloner = instance(objectClonerMock)
	}

	return new SuperflyTimelineBuilder(objectCloner)
}
