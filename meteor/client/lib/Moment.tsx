import * as React from 'react'
import Moment, { MomentProps } from 'react-moment'
import moment from 'moment'
import { getCurrentTime } from '../../lib/lib'
import timer from 'react-timer-hoc'
import { uniqueId } from 'underscore'
import { RundownUtils } from './rundown'
import _ from 'underscore'
import { RundownTiming } from '../ui/RundownView/RundownTiming/RundownTiming'

const MAX_TIME_WITHOUT_UPDATE = 2000

/**
 * Use instead of <Moment fromNow></Moment>, its result is synced with getCurrentTime()
 * @param args same as for Moment
 */
export const MomentFromNow = timer(60000)(function MomentFromNow(args: MomentProps) {
	return <Moment {...args} from={moment(getCurrentTime())} interval={0}></Moment>
})

type SyncedTimeIsReadyFunction = () => boolean
type SyncedTimeUpdateFunction = () => void
class SyncedTimeDisplays {
	displays: Map<string, { isReady: SyncedTimeIsReadyFunction; update: SyncedTimeUpdateFunction }> = new Map()
	lastUpdated: number = 0

	constructor() {
		window.addEventListener(RundownTiming.Events.timeupdate, () => this.updateTimers())
	}

	/**
	 * Adds a synced time display. Should be called when the component is mounted or otherwise ready to recieve state.
	 * @param isReadyFunc Called to check whether the timer is ready to switch to the next value, should return true if the timer is ready.
	 * @param updateFunc Called to update the timer, when called the timer should switch to the next value.
	 * @returns A unique id that should be stored on the timer element to refer back to later.
	 */
	addDisplay(isReadyFunc: SyncedTimeIsReadyFunction, updateFunc: SyncedTimeUpdateFunction): string {
		let id = uniqueId('synced_moment')
		this.displays.set(id, { isReady: isReadyFunc, update: updateFunc })
		return id
	}

	/**
	 * Expected to be called when a timer is unmounter / no longer alive.
	 * After this call the component will no longer recieve update calls and will appear frozen.
	 * @param id The id the component was assigned by `addDisplay`
	 */
	removeDisplay(id: string): void {
		this.displays.delete(id)
	}

	/**
	 * Checks whether timers should be updated and issues update calls.
	 */
	private updateTimers() {
		let timeSinceLastUpdate = Date.now() - this.lastUpdated
		if (
			timeSinceLastUpdate >= MAX_TIME_WITHOUT_UPDATE ||
			// Iterate over every display and check if it's ready
			Array.from(this.displays.values()).every((display) => display.isReady())
		) {
			this.lastUpdated = Date.now()
			for (const display of this.displays.values()) {
				display.update()
			}
		}
	}
}
const syncedTimeDisplays = new SyncedTimeDisplays()

/**
 * Rounds time to the nearest second.
 * @param time Time in ms.
 * @returns Time value rounded down to nearest second.
 */
function toNearestSecond(time: number): number {
	return (time / 1000) * 1000
}

interface SyncedMomentProps {
	lockedDate: number | undefined
}

interface SyncedMomentState {
	id?: string
	date?: number
	nextDate?: number
}
export class SyncedMoment extends React.Component<SyncedMomentProps & MomentProps, SyncedMomentState> {
	constructor(props) {
		super(props)

		this.state = {}
	}

	componentDidMount() {
		let id = syncedTimeDisplays.addDisplay(
			() => this.hasNextState(),
			() => this.updateMoment()
		)
		this.setState({ id })
	}

	componentWillUnmount() {
		if (this.state.id) {
			syncedTimeDisplays.removeDisplay(this.state.id)
		}
	}

	hasNextState(): boolean {
		// Already got the next state prepared.
		if (this.state.nextDate !== undefined && this.state.nextDate !== this.state.date) {
			return true
		}

		// This is the base state.
		if (this.state.nextDate === undefined && this.props.lockedDate !== undefined) {
			this.setState({ nextDate: this.props.lockedDate })
			return true
		}

		// Props differ.
		if (this.state.date !== this.props.lockedDate) {
			this.setState({ nextDate: this.props.lockedDate })
			return true
		}

		// Moment counts to a date, so all we care about is that the next state has a value.
		return this.state.nextDate !== undefined
	}

	updateMoment() {
		if (this.state.nextDate) {
			this.setState({ date: this.state.nextDate, nextDate: undefined })
		}
	}

	render() {
		return <Moment {..._.omit(this.props, 'lockedDate')} date={this.state.date} />
	}
}

interface SyncedDiffTimecodeProps {
	diff?: number
	showPlus?: boolean
	showHours?: boolean
	enDashAsMinus?: boolean
	useSmartFloor?: boolean
	useSmartHours?: boolean
	minusPrefix?: string
	floorTime?: boolean
	hardFloor?: boolean
}

interface SyncedDiffTimecodeState {
	id?: string
	diff?: string
	nextDiff?: string
}

export class SyncedDiffTimecode extends React.Component<SyncedDiffTimecodeProps, SyncedDiffTimecodeState> {
	constructor(props) {
		super(props)

		this.state = {}
	}

	componentDidMount() {
		let id = syncedTimeDisplays.addDisplay(
			() => this.hasNextState(),
			() => this.updateMoment()
		)
		this.setState({ id })
	}

	componentWillUnmount() {
		if (this.state.id) {
			syncedTimeDisplays.removeDisplay(this.state.id)
		}
	}

	hasNextState(): boolean {
		// Already have a next value selected.
		if (this.state.nextDiff !== undefined && this.state.nextDiff !== this.state.diff) {
			return true
		}

		// Work out the next display value.
		const next = this.props.diff
			? RundownUtils.formatDiffToTimecode(
					this.props.diff,
					this.props.showPlus,
					this.props.showHours,
					this.props.enDashAsMinus,
					this.props.useSmartFloor,
					this.props.useSmartHours,
					this.props.minusPrefix,
					this.props.floorTime,
					this.props.hardFloor
			  )
			: null

		if (!next) {
			return false
		}

		// Next differs from current.
		if (next !== this.state.diff) {
			this.setState({ nextDiff: next })
			return true
		}

		return false
	}

	updateMoment() {
		if (this.state.nextDiff) {
			this.setState({ diff: this.state.nextDiff, nextDiff: undefined })
		}
	}

	render() {
		return this.state.diff ?? null
	}
}
