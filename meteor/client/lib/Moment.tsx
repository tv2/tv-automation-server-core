import * as React from 'react'
import Moment, { MomentProps } from 'react-moment'
import moment from 'moment'
import { getCurrentTime } from '../../lib/lib'
import timer from 'react-timer-hoc'
import { uniqueId } from 'underscore'
import { RundownUtils } from './rundown'
import _ from 'underscore'
import { RundownTiming } from '../ui/RundownView/RundownTiming/RundownTiming'

const MAX_TIME_WITHOUT_UPDATE = 1000

/**
 * Use instead of <Moment fromNow></Moment>, its result is synced with getCurrentTime()
 * @param args same as for Moment
 */
export const MomentFromNow = timer(60000)(function MomentFromNow(args: MomentProps) {
	return <Moment {...args} from={moment(getCurrentTime())} interval={0}></Moment>
})

type SyncedTimeReadyFunction = () => boolean
type SyncedTimeUpdateFunction = () => void
class SyncedTimeDisplays {
	displays: Map<string, { ready: SyncedTimeReadyFunction; update: SyncedTimeUpdateFunction }> = new Map()
	lastUpdated: number = 0

	constructor() {
		window.addEventListener(RundownTiming.Events.timeupdate, () => this.updateMoments())
	}

	addMoment(readyFunc: SyncedTimeReadyFunction, updateFunc: SyncedTimeUpdateFunction): string {
		let id = uniqueId('synced_moment')
		this.displays.set(id, { ready: readyFunc, update: updateFunc })
		return id
	}
	removeMoment(id: string): void {
		this.displays.delete(id)
	}

	updateMoments() {
		let timeSinceLastUpdate = Date.now() - this.lastUpdated
		if (
			timeSinceLastUpdate >= MAX_TIME_WITHOUT_UPDATE ||
			Array.from(this.displays.values()).every((display) => display.ready())
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
 * Rounds time to the nearest second
 * @param time Time in ms
 * @returns Time value rounded down to nearest second
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
		let id = syncedTimeDisplays.addMoment(
			() => this.hasNextState(),
			() => this.updateMoment()
		)
		this.setState({ id })
	}

	componentWillUnmount() {
		if (this.state.id) {
			syncedTimeDisplays.removeMoment(this.state.id)
		}
	}

	hasNextState(): boolean {
		if (this.state.nextDate !== undefined && this.state.nextDate !== this.state.date) {
			return true
		}

		const now = toNearestSecond(Date.now())
		if (this.props.lockedDate === undefined && this.state.date !== now) {
			this.setState({ nextDate: now })
			return true
		}

		if (this.state.date !== this.props.lockedDate) {
			this.setState({ nextDate: this.props.lockedDate })
			return true
		}

		return true
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
		let id = syncedTimeDisplays.addMoment(
			() => this.hasNextState(),
			() => this.updateMoment()
		)
		this.setState({ id })
	}

	componentWillUnmount() {
		if (this.state.id) {
			syncedTimeDisplays.removeMoment(this.state.id)
		}
	}

	hasNextState(): boolean {
		if (this.state.nextDiff !== undefined && this.state.nextDiff !== this.state.diff) {
			return true
		}

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
