import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { NoteSeverity } from '@sofie-automation/blueprints-integration'
import { RundownPlaylist } from '../../../lib/collections/RundownPlaylists'
import { SegmentId } from '../../../lib/collections/Segments'
import { Studio } from '../../../lib/collections/Studios'
import { IContextMenuContext } from '../RundownView'
import { PartUi, PieceUi, SegmentUi } from '../SegmentContainer/withResolvedSegment'
import { ContextMenuTrigger } from '@jstarpl/react-contextmenu'
import { CriticalIconSmall, WarningIconSmall } from '../../lib/ui/icons/notifications'
import { SegmentDuration } from '../RundownView/RundownTiming/SegmentDuration'
import { PartCountdown } from '../RundownView/RundownTiming/PartCountdown'
import { contextMenuHoldToDisplayTime, useCombinedRefs } from '../../lib/lib'
import { isPartPlayable, PartId } from '../../../lib/collections/Parts'
import { useTranslation } from 'react-i18next'
import { UIStateStorage } from '../../lib/UIStateStorage'
import { literal, unprotectString } from '../../../lib/lib'
import { lockPointer, scrollToPart, unlockPointer } from '../../lib/viewPort'
import { StoryboardPart } from './StoryboardPart'
import { RundownHoldState } from '../../../lib/collections/Rundowns'
import classNames from 'classnames'
import RundownViewEventBus, {
	GoToPartEvent,
	GoToPartInstanceEvent,
	HighlightEvent,
	RundownViewEvents,
} from '../RundownView/RundownViewEventBus'
import { getElementWidth } from '../../utils/dimensions'
import { HOVER_TIMEOUT } from '../Shelf/DashboardPieceButton'
import { Meteor } from 'meteor/meteor'
import { hidePointerLockCursor, showPointerLockCursor } from '../../lib/PointerLockCursor'
import { SegmentScrollbar } from './SegmentScrollbar'
import { OptionalVelocityComponent } from '../../lib/utilComponents'
import { filterSecondarySourceLayers } from './StoryboardPartSecondaryPieces/StoryboardPartSecondaryPieces'
import { SegmentViewMode } from '../SegmentContainer/SegmentViewModes'
import { SegmentNote } from '@sofie-automation/corelib/dist/dataModel/Notes'
import { ErrorBoundary } from '../../lib/ErrorBoundary'
import { SwitchViewModeButton } from '../SegmentContainer/SwitchViewModeButton'

interface IProps {
	id: string
	key: string
	segment: SegmentUi
	playlist: RundownPlaylist
	studio: Studio
	parts: Array<PartUi>
	segmentNotes: Array<SegmentNote>
	// timeScale: number
	// maxTimeScale: number
	// onRecalculateMaxTimeScale: () => Promise<number>
	// showingAllSegment: boolean
	// onCollapseOutputToggle?: (layer: IOutputLayerUi, event: any) => void
	// collapsedOutputs: {
	// 	[key: string]: boolean
	// }
	hasAlreadyPlayed: boolean
	hasGuestItems: boolean
	hasRemoteItems: boolean
	isLiveSegment: boolean
	isNextSegment: boolean
	isQueuedSegment: boolean
	followLiveLine: boolean
	liveLineHistorySize: number
	displayLiveLineCounter: boolean
	currentPartWillAutoNext: boolean
	onScroll: (scrollLeft: number, event: any) => void
	onFollowLiveLine?: (state: boolean, event: any) => void
	onShowEntireSegment?: (event: any) => void
	onContextMenu?: (contextMenuContext: IContextMenuContext) => void
	onItemClick?: (piece: PieceUi, e: React.MouseEvent<HTMLDivElement>) => void
	onItemDoubleClick?: (item: PieceUi, e: React.MouseEvent<HTMLDivElement>) => void
	onHeaderNoteClick?: (segmentId: SegmentId, level: NoteSeverity) => void
	onSwitchViewMode: (newViewMode: SegmentViewMode) => void
	isLastSegment: boolean
	lastValidPartIndex: number | undefined
	budgetDuration?: number
	showCountdownToSegment: boolean
	fixedSegmentDuration: boolean | undefined
	subscriptionsReady: boolean
}

const PART_WIDTH = 166 // Must match SCSS: $segment-storyboard-part-width
const PART_LIST_LEAD_IN = 0 // Must match SCSS: .segment-storyboard__part-list(padding-left)
const PART_SHADE_WIDTH = 100

export const SegmentStoryboard = React.memo(
	React.forwardRef<HTMLDivElement, IProps>(function SegmentStoryboard(props: IProps, ref) {
		const innerRef = useRef<HTMLDivElement>(null)
		const combinedRef = useCombinedRefs(null, ref, innerRef)
		const listRef = useRef<HTMLDivElement>(null)
		const [listWidth, setListWidth] = useState(0)
		const [scrollLeft, setScrollLeft] = useState(0)
		const [grabbed, setGrabbed] = useState<{ clientX: number; clientY: number } | null>(null)
		const [touched, setTouched] = useState<{ clientX: number; clientY: number } | null>(null)
		const [animateScrollLeft, setAnimateScrollLeft] = useState(true)
		const { t } = useTranslation()
		const notes: Array<SegmentNote> = props.segmentNotes
		const [squishedHover, setSquishedHover] = useState<null | number>(null)
		const [highlight, setHighlight] = useState(false)
		const squishedHoverTimeout = useRef<number | null>(null)

		const identifiers: Array<{ partId: PartId; ident?: string }> = props.parts
			.map((p) =>
				p.instance.part.identifier
					? {
							partId: p.partId,
							ident: p.instance.part.identifier,
					  }
					: null
			)
			.filter((entry) => entry !== null) as Array<{ partId: PartId; ident?: string }>

		let countdownToPartId: PartId | undefined = undefined
		if (!props.isLiveSegment) {
			const nextPart = props.isNextSegment
				? props.parts.find((p) => p.instance._id === props.playlist.nextPartInstanceId)
				: props.parts[0]

			if (nextPart) {
				countdownToPartId = nextPart.instance.part._id
			}
		}

		const criticalNotes = notes.reduce((prev, item) => {
			if (item.type === NoteSeverity.ERROR) return ++prev
			return prev
		}, 0)
		const warningNotes = notes.reduce((prev, item) => {
			if (item.type === NoteSeverity.WARNING) return ++prev
			return prev
		}, 0)

		const [useTimeOfDayCountdowns, setUseTimeOfDayCountdowns] = useState(
			UIStateStorage.getItemBoolean(
				`rundownView.${props.playlist._id}`,
				`segment.${props.segment._id}.useTimeOfDayCountdowns`,
				!!props.playlist.timeOfDayCountdowns
			)
		)

		const getSegmentContext = (_props) => {
			const ctx = literal<IContextMenuContext>({
				segment: props.segment,
				part: props.parts.find((p) => isPartPlayable(p.instance.part)) || null,
			})

			if (props.onContextMenu && typeof props.onContextMenu === 'function') {
				props.onContextMenu(ctx)
			}

			return ctx
		}

		const onTimeUntilClick = () => {
			const newUseTimeOfDayCountdowns = !useTimeOfDayCountdowns
			setUseTimeOfDayCountdowns(!useTimeOfDayCountdowns)
			UIStateStorage.setItem(
				`rundownView.${props.playlist._id}`,
				`segment.${props.segment._id}.useTimeOfDayCountdowns`,
				newUseTimeOfDayCountdowns
			)
		}

		const onClickPartIdent = (partId: PartId) => {
			scrollToPart(partId, false, true, true).catch((error) => {
				if (!error.toString().match(/another scroll/)) console.error(error)
			})
		}

		let nextPartIndex = -1
		let currentPartIndex = -1

		const parts: JSX.Element[] = []
		const squishedParts: JSX.Element[] = []

		const renderedParts = props.parts.filter((part) => !(part.instance.part.invalid && part.instance.part.gap))

		const lastValidPartId = props.parts[props.lastValidPartIndex ?? props.parts.length - 1]?.instance._id

		const maxScrollLeft = PART_WIDTH * (renderedParts.length - 1) - PART_LIST_LEAD_IN / 2

		let fittingParts = 1
		let spaceLeft = 0
		let modifier = 2
		let squishedPartsNum = renderedParts.length
		while (fittingParts < renderedParts.length && spaceLeft < PART_WIDTH * 1.25 && squishedPartsNum > 1) {
			fittingParts = Math.ceil((listWidth + scrollLeft - PART_LIST_LEAD_IN) / PART_WIDTH) - modifier
			spaceLeft = listWidth + scrollLeft - PART_LIST_LEAD_IN - fittingParts * PART_WIDTH
			squishedPartsNum = Math.max(0, renderedParts.length - fittingParts)
			modifier++

			if (fittingParts <= 1) {
				// we must at least fit a single part in the Segment, we'll just overflow beyond that point
				fittingParts = 1
				spaceLeft = listWidth - PART_LIST_LEAD_IN - fittingParts * PART_WIDTH
				squishedPartsNum = Math.max(0, renderedParts.length - fittingParts)
				break
			}
		}

		const squishedPartCardStride =
			squishedPartsNum > 1 ? Math.max(4, (spaceLeft - PART_WIDTH) / (squishedPartsNum - 1)) : null

		const playlistHasNextPart = !!props.playlist.nextPartInstanceId
		const playlistIsLooping = props.playlist.loop

		renderedParts.forEach((part, index) => {
			const isLivePart = part.instance._id === props.playlist.currentPartInstanceId
			const isNextPart = part.instance._id === props.playlist.nextPartInstanceId

			if (isLivePart) currentPartIndex = index
			if (isNextPart) nextPartIndex = index

			if (part.instance.part.invalid && part.instance.part.gap) return null

			const needsToBeSquished = index > fittingParts - 1
			const partComponent = (
				<StoryboardPart
					key={unprotectString(part.instance._id)}
					segment={props.segment}
					part={part}
					isLivePart={isLivePart}
					isNextPart={isNextPart}
					isLastPartInSegment={part.instance._id === lastValidPartId}
					isLastSegment={props.isLastSegment}
					isPlaylistLooping={playlistIsLooping}
					doesPlaylistHaveNextPart={playlistHasNextPart}
					displayLiveLineCounter={props.displayLiveLineCounter}
					inHold={!!(props.playlist.holdState && props.playlist.holdState !== RundownHoldState.COMPLETE)}
					currentPartWillAutonext={isNextPart && props.currentPartWillAutoNext}
					outputLayers={props.segment.outputLayers}
					subscriptionsReady={props.subscriptionsReady}
					onContextMenu={props.onContextMenu}
					className={
						squishedHover === null
							? index - fittingParts > 0
								? 'background'
								: undefined
							: squishedHover === index
							? 'hover'
							: undefined
					}
					style={
						needsToBeSquished && squishedPartCardStride
							? {
									transform: `translate(${(index - fittingParts) * squishedPartCardStride}px, 0)`,
									zIndex:
										squishedHover !== null
											? index <= squishedHover
												? renderedParts.length + index
												: renderedParts.length - index
											: undefined,
							  }
							: undefined
					}
					onHoverOver={() => needsToBeSquished && setSquishedHover(index)}
				/>
			)

			if (needsToBeSquished) {
				squishedParts.unshift(partComponent)
			} else {
				parts.push(partComponent)
			}
		})

		useEffect(() => {
			if (!props.followLiveLine) return

			if (nextPartIndex >= 0 && currentPartIndex >= 0) {
				setScrollLeft(Math.max(0, currentPartIndex * PART_WIDTH - props.liveLineHistorySize))
			} else if (nextPartIndex >= 0) {
				setScrollLeft(Math.max(0, nextPartIndex * PART_WIDTH - props.liveLineHistorySize))
			} else if (currentPartIndex >= 0) {
				setScrollLeft(Math.max(0, currentPartIndex * PART_WIDTH - props.liveLineHistorySize))
			}
		}, [currentPartIndex, nextPartIndex, props.followLiveLine])

		const onRewindSegment = useCallback(() => {
			if (!props.isLiveSegment) {
				setScrollLeft(0)
			}
		}, [])

		const onGoToPart = useCallback(
			(e: GoToPartEvent) => {
				const idx = renderedParts.findIndex((partInstance) => e.partId === partInstance.partId)
				if (idx >= 0) {
					setScrollLeft(idx * PART_WIDTH - props.liveLineHistorySize)
				}
			},
			[renderedParts, props.followLiveLine]
		)

		const onGoToPartInstance = useCallback(
			(e: GoToPartInstanceEvent) => {
				const idx = renderedParts.findIndex((partInstance) => partInstance.instance._id === e.partInstanceId)
				if (idx >= 0) {
					setScrollLeft(idx * PART_WIDTH - props.liveLineHistorySize)
				}
			},
			[renderedParts, props.followLiveLine]
		)

		const highlightTimeout = useRef<number | null>(null)
		const onHighlight = useCallback(
			(e: HighlightEvent) => {
				if (props.segment._id === e.segmentId && !e.partId) {
					setHighlight(true)
					if (highlightTimeout.current) Meteor.clearTimeout(highlightTimeout.current)
					highlightTimeout.current = Meteor.setTimeout(() => setHighlight(false), 5000)
				}
			},
			[props.segment._id]
		)
		useEffect(() => {
			return () => {
				if (highlightTimeout.current) Meteor.clearTimeout(highlightTimeout.current)
			}
		}, [])
		useEffect(() => {
			RundownViewEventBus.on(RundownViewEvents.REWIND_SEGMENTS, onRewindSegment)
			RundownViewEventBus.on(RundownViewEvents.GO_TO_PART, onGoToPart)
			RundownViewEventBus.on(RundownViewEvents.GO_TO_PART_INSTANCE, onGoToPartInstance)
			RundownViewEventBus.on(RundownViewEvents.HIGHLIGHT, onHighlight)

			return () => {
				RundownViewEventBus.off(RundownViewEvents.REWIND_SEGMENTS, onRewindSegment)
				RundownViewEventBus.off(RundownViewEvents.GO_TO_PART, onGoToPart)
				RundownViewEventBus.off(RundownViewEvents.GO_TO_PART_INSTANCE, onGoToPartInstance)
				RundownViewEventBus.off(RundownViewEvents.HIGHLIGHT, onHighlight)
			}
		}, [onRewindSegment, onGoToPart, onGoToPartInstance, onHighlight])

		useLayoutEffect(() => {
			if (!listRef.current) return

			const width = getElementWidth(listRef.current)
			if (width >= 0) {
				setListWidth(width)
			}

			const resizeObserver = new ResizeObserver((e) => {
				if (e[0].target === listRef.current) {
					const width = Math.floor(e[0].contentRect.width || 0)
					setListWidth(width)
				}
			})

			resizeObserver.observe(listRef.current)

			return () => {
				resizeObserver.disconnect()
			}
		}, [listRef.current])

		const onSquishedPointerEnter = (e: React.PointerEvent<HTMLDivElement>) => {
			if (e.pointerType === 'mouse') {
				squishedHoverTimeout.current = Meteor.setTimeout(() => setSquishedHover(null), HOVER_TIMEOUT)
			}
		}

		const clearSquishedHoverTimeout = () => {
			if (squishedHoverTimeout.current) {
				Meteor.clearTimeout(squishedHoverTimeout.current)
				squishedHoverTimeout.current = null
			}
		}

		const onSquishedPointerLeave = (e: React.PointerEvent<HTMLDivElement>) => {
			if (e.pointerType === 'mouse') {
				clearSquishedHoverTimeout()
				setSquishedHover(null)
			}
		}

		const onSquishedPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
			if (e.pointerType === 'mouse') {
				clearSquishedHoverTimeout()
				squishedHoverTimeout.current = Meteor.setTimeout(() => setSquishedHover(null), HOVER_TIMEOUT)
			}
		}

		useEffect(() => {
			return () => clearSquishedHoverTimeout()
		}, [])

		const onListPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
			if (e.pointerType === 'mouse' && e.buttons === 1) {
				setGrabbed({
					clientX: e.clientX,
					clientY: e.clientY,
				})
				setAnimateScrollLeft(false)
			} else if ((e.pointerType === 'touch' && e.isPrimary) || (e.pointerType === 'pen' && e.isPrimary)) {
				setTouched({
					clientX: e.clientX,
					clientY: e.clientY,
				})
				setAnimateScrollLeft(false)
			}
		}

		const onSegmentWheel = (e: WheelEvent) => {
			let scrollDelta = 0
			if (
				(!e.ctrlKey && e.altKey && !e.metaKey && !e.shiftKey) ||
				(e.ctrlKey && !e.metaKey && !e.shiftKey && e.altKey)
			) {
				// this.props.onScroll(Math.max(0, this.props.scrollLeft + e.deltaY / this.props.timeScale), e)
				scrollDelta = e.deltaY * -1
				e.preventDefault()
			} else if (!e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey) {
				// no modifier
				if (e.deltaX !== 0) {
					// this.props.onScroll(Math.max(0, this.props.scrollLeft + e.deltaX / this.props.timeScale), e)
					scrollDelta = e.deltaX * -1
					e.preventDefault()
				}
			}

			if (scrollDelta !== 0) {
				setScrollLeft((value) => {
					const newScrollLeft = Math.max(0, Math.min(value - scrollDelta, maxScrollLeft))
					props.onScroll(newScrollLeft, e)
					return newScrollLeft
				})
			}
		}

		useEffect(() => {
			if (!grabbed) return

			const onListPointerRelease = () => {
				setGrabbed(null)
				setAnimateScrollLeft(true)
			}
			const onPointerLockChange = () => {
				if (!document.pointerLockElement) {
					setGrabbed(null)
					setAnimateScrollLeft(true)
				}
			}
			const onPointerMove = (e: PointerEvent) => {
				setScrollLeft((value) => {
					const newScrollLeft = Math.max(0, Math.min(value - e.movementX, maxScrollLeft))
					props.onScroll(newScrollLeft, e)
					return newScrollLeft
				})
			}

			document.addEventListener('pointerup', onListPointerRelease)
			document.addEventListener('pointercancel', onListPointerRelease)
			document.addEventListener('pointerlockchange', onPointerLockChange)
			document.addEventListener('pointerlockerror', onListPointerRelease)
			document.addEventListener('pointermove', onPointerMove)
			lockPointer()
			showPointerLockCursor(grabbed.clientX, grabbed.clientY)

			return () => {
				unlockPointer()
				hidePointerLockCursor()
				document.removeEventListener('pointerup', onListPointerRelease)
				document.removeEventListener('pointercancel', onListPointerRelease)
				document.removeEventListener('pointerlockchange', onPointerLockChange)
				document.removeEventListener('pointerlockerror', onListPointerRelease)
				document.removeEventListener('pointermove', onPointerMove)
			}
		}, [grabbed, renderedParts.length, props.onScroll])

		useEffect(() => {
			if (!touched) return

			const startingScrollLeft = scrollLeft

			const onListTouchRelease = () => {
				setTouched(null)
				setAnimateScrollLeft(true)
			}
			const onTouchMove = (e: TouchEvent) => {
				e.preventDefault()
				setScrollLeft(() => {
					const newScrollLeft = Math.max(
						0,
						Math.min(startingScrollLeft + (touched.clientX - e.touches[0].clientX), maxScrollLeft)
					)
					props.onScroll(newScrollLeft, e)
					return newScrollLeft
				})
			}

			document.addEventListener('touchend', onListTouchRelease)
			document.addEventListener('touchcancel', onListTouchRelease)
			document.addEventListener('touchmove', onTouchMove, {
				passive: false,
			})

			return () => {
				document.removeEventListener('touchend', onListTouchRelease)
				document.removeEventListener('touchcancel', onListTouchRelease)
				document.removeEventListener('touchmove', onTouchMove)
			}
		}, [touched, renderedParts.length, props.onScroll])

		useLayoutEffect(() => {
			const segment = innerRef.current
			if (!segment) return

			segment.addEventListener('wheel', onSegmentWheel, {
				passive: false,
			})

			return () => {
				segment.removeEventListener('wheel', onSegmentWheel)
			}
		}, [innerRef.current])

		const onScrollbarChange = useCallback((left: number) => {
			setScrollLeft(Math.max(0, Math.min(left, maxScrollLeft)))
		}, [])

		const onScrollbarScrollStart = () => {
			setAnimateScrollLeft(false)
		}

		const onScrollbarScrollEnd = () => {
			setAnimateScrollLeft(true)
		}

		return (
			<div
				id={props.id}
				className={classNames('segment-timeline', 'segment-storyboard', {
					live: props.isLiveSegment,
					next: !props.isLiveSegment && props.isNextSegment,
					queued: props.isQueuedSegment,

					'has-played':
						props.hasAlreadyPlayed &&
						!props.isLiveSegment &&
						!props.isNextSegment &&
						!props.hasGuestItems &&
						!props.hasRemoteItems,

					'has-guest-items': props.hasGuestItems,
					'has-remote-items': props.hasRemoteItems,
					'has-identifiers': identifiers.length > 0,
					'invert-flash': highlight,

					'time-of-day-countdowns': useTimeOfDayCountdowns,
				})}
				data-obj-id={props.segment._id}
				ref={combinedRef}
				role="region"
				aria-labelledby={`segment-name-${props.segment._id}`}
				aria-roledescription={t('segment')}
			>
				<ContextMenuTrigger
					id="segment-timeline-context-menu"
					collect={getSegmentContext}
					attributes={{
						className: 'segment-timeline__title',
					}}
					holdToDisplay={contextMenuHoldToDisplayTime()}
					renderTag="div"
				>
					<h2
						id={`segment-name-${props.segment._id}`}
						className={'segment-timeline__title__label' + (props.segment.identifier ? ' identifier' : '')}
						data-identifier={props.segment.identifier}
					>
						{props.segment.name}
					</h2>
					{(criticalNotes > 0 || warningNotes > 0) && (
						<div className="segment-timeline__title__notes">
							{criticalNotes > 0 && (
								<div
									className="segment-timeline__title__notes__note segment-timeline__title__notes__note--critical"
									onClick={() =>
										props.onHeaderNoteClick && props.onHeaderNoteClick(props.segment._id, NoteSeverity.ERROR)
									}
									aria-label={t('Critical problems')}
								>
									<CriticalIconSmall />
									<div className="segment-timeline__title__notes__count">{criticalNotes}</div>
								</div>
							)}
							{warningNotes > 0 && (
								<div
									className="segment-timeline__title__notes__note segment-timeline__title__notes__note--warning"
									onClick={() =>
										props.onHeaderNoteClick && props.onHeaderNoteClick(props.segment._id, NoteSeverity.WARNING)
									}
									aria-label={t('Warnings')}
								>
									<WarningIconSmall />
									<div className="segment-timeline__title__notes__count">{warningNotes}</div>
								</div>
							)}
						</div>
					)}
					{identifiers.length > 0 && (
						<div className="segment-timeline__part-identifiers">
							{identifiers.map((ident) => (
								<div
									className="segment-timeline__part-identifiers__identifier"
									key={ident.partId + ''}
									onClick={() => onClickPartIdent(ident.partId)}
								>
									{ident.ident}
								</div>
							))}
						</div>
					)}
				</ContextMenuTrigger>
				<div className="segment-timeline__duration" tabIndex={0}>
					{props.playlist &&
						props.parts &&
						props.parts.length > 0 &&
						(!props.hasAlreadyPlayed || props.isNextSegment || props.isLiveSegment) && (
							<SegmentDuration
								segmentId={props.segment._id}
								parts={props.parts}
								label={<span className="segment-timeline__duration__label">{t('Duration')}</span>}
								fixed={props.fixedSegmentDuration}
							/>
						)}
				</div>
				<div className="segment-timeline__timeUntil" onClick={onTimeUntilClick}>
					{props.playlist && props.parts && props.parts.length > 0 && props.showCountdownToSegment && (
						<PartCountdown
							partId={countdownToPartId}
							hideOnZero={!useTimeOfDayCountdowns}
							useWallClock={useTimeOfDayCountdowns}
							playlist={props.playlist}
							label={
								useTimeOfDayCountdowns ? (
									<span className="segment-timeline__timeUntil__label">{t('On Air At')}</span>
								) : (
									<span className="segment-timeline__timeUntil__label">{t('On Air In')}</span>
								)
							}
						/>
					)}
					{props.studio.settings.preserveUnsyncedPlayingSegmentContents && props.segment.orphaned && (
						<span className="segment-timeline__unsynced">{t('Unsynced')}</span>
					)}
				</div>
				<div className="segment-timeline__mos-id">{props.segment.externalId}</div>
				<div className="segment-timeline__source-layers" role="tree" aria-label={t('Sources')}>
					{Object.values(props.segment.outputLayers)
						.filter((outputGroup) => outputGroup.used)
						.map((outputGroup) => (
							<div className="segment-timeline__output-group" key={outputGroup._id}>
								{filterSecondarySourceLayers(outputGroup.sourceLayers).map((sourceLayer) =>
									sourceLayer.pieces.length > 0 ? (
										<div className="segment-timeline__source-layer" key={sourceLayer._id} role="treeitem">
											{sourceLayer.name}
										</div>
									) : null
								)}
							</div>
						))}
				</div>
				<ErrorBoundary>
					<SwitchViewModeButton currentMode={SegmentViewMode.Storyboard} onSwitchViewMode={props.onSwitchViewMode} />
				</ErrorBoundary>
				<div className="segment-storyboard__part-list__container" ref={listRef} onPointerDown={onListPointerDown}>
					<OptionalVelocityComponent
						animation={{
							translateX: `-${scrollLeft}px`,
						}}
						duration={100}
						shouldAnimate={animateScrollLeft}
					>
						<div
							className={classNames('segment-storyboard__part-list', {
								loading: !props.subscriptionsReady /*  */,
							})}
							style={!animateScrollLeft ? { transform: `translateX(-${scrollLeft}px)` } : undefined}
						>
							{parts}
							<div
								className={classNames(
									'segment-storyboard__part-list',
									'segment-storyboard__part-list--squished-parts',
									{
										hover: squishedHover !== null,
									}
								)}
								style={{
									minWidth: `${spaceLeft}px`,
								}}
								onPointerEnter={onSquishedPointerEnter}
								onPointerLeave={onSquishedPointerLeave}
								onPointerMove={onSquishedPointerMove}
							>
								{squishedParts}
							</div>
						</div>
					</OptionalVelocityComponent>
					<div
						className="segment-storyboard__history-shade"
						style={{
							opacity: 1 - Math.min(1, Math.max(0, (PART_SHADE_WIDTH - scrollLeft) / PART_SHADE_WIDTH)),
						}}
					></div>
					<div
						className={classNames('segment-timeline__zoom-area', {
							hidden: scrollLeft === 0 && !props.isLiveSegment,
						})}
					>
						<SegmentScrollbar
							scrollLeft={scrollLeft}
							maxScrollLeft={maxScrollLeft}
							onScrollLeftChange={onScrollbarChange}
							onScrollStart={onScrollbarScrollStart}
							onScrollEnd={onScrollbarScrollEnd}
						/>
					</div>
				</div>
			</div>
		)
	})
)

SegmentStoryboard.displayName = 'SegmentStoryboard'
