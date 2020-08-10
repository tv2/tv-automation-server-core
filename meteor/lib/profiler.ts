import { Random } from 'meteor/random'
import { getCurrentTime } from './lib'
import { logger } from '../server/logging'
import { Settings } from './Settings'

interface StoredProfile {
	profiledOperationName: string
	startTime: number
	level: ProfilerLevel
}

export enum ProfilerLevel {
	SIMPLE = 0,
	DETAILED = 1,
	DATABASE_OPERATIONS = 2,
	CACHE_OPERATIONS = 3,
	ALL = 100,
}

const NO_PROFILE = 'NO_PROFILE'

export class Profiler {
	private _startTimes: Map<string, StoredProfile>
	private _level: ProfilerLevel
	private _callStackSimple: string[]

	constructor(level: ProfilerLevel) {
		this._startTimes = new Map()
		this._level = level
		this._callStackSimple = []
	}

	/**
	 * Starts profiling an operation, returns a token for identifying the operation.
	 * @param profiledOperationName Name to log to identify the operation being profiled.
	 */
	public startProfiling(profiledOperationName: string, level: ProfilerLevel): string {
		if (!Settings.enableProfiler) return NO_PROFILE
		if (this._level < level) {
			return NO_PROFILE
		}
		const id = Random.id()

		if (level === ProfilerLevel.SIMPLE) {
			this._callStackSimple.push(profiledOperationName)
		}
		this._startTimes.set(id, { profiledOperationName, startTime: getCurrentTime(), level })
		return id
	}

	/**
	 * Stops profiling an operation and logs the completion time.
	 * @param id Id of the operation.
	 */
	public stopProfiling(id: string) {
		if (!Settings.enableProfiler) return
		if (id === NO_PROFILE) {
			return
		}
		const storedProfile = this._startTimes.get(id)
		if (!storedProfile) {
			return
		}
		this._startTimes.delete(id)

		if (storedProfile.level === ProfilerLevel.SIMPLE) {
			this._callStackSimple.pop()
		}

		const stack = this._callStackSimple.reduce((prev, curr, index) => {
			return prev + `\n${'\t'.repeat(index + 1)}${curr}`
		}, '')

		logger.debug(
			`PROFILER:${stack}${stack.length ? '\n' : ''}${'\t'.repeat(this._callStackSimple.length + 1)}Operation ${
				storedProfile.profiledOperationName
			} took ${getCurrentTime() - storedProfile.startTime}ms to complete`
		)
	}
}

let profiler = new Profiler(ProfilerLevel.ALL)

export { profiler }
