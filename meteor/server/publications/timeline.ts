import { Meteor } from 'meteor/meteor'
import {
	Timeline,
	getRoutedTimeline,
	RoutedTimeline,
	TimelineComplete,
	TimelineHash,
	deserializeTimelineBlob,
	serializeTimelineBlob,
	TimelineBlob,
} from '../../lib/collections/Timeline'
import { meteorPublish } from './lib'
import { PubSub } from '../../lib/api/pubsub'
import { FindOptions } from '../../lib/typings/meteor'
import { CustomPublishArray, meteorCustomPublishArray } from '../lib/customPublication'
import { setUpOptimizedObserver, TriggerUpdate } from '../lib/optimizedObserver'
import { PeripheralDeviceId, PeripheralDevices } from '../../lib/collections/PeripheralDevices'
import { Studios, getActiveRoutes, StudioId, ResultingMappingRoutes } from '../../lib/collections/Studios'
import { PeripheralDeviceReadAccess } from '../security/peripheralDevice'
import { StudioReadAccess } from '../security/studio'
import { fetchStudioLight, StudioLight } from '../../lib/collections/optimizations'
import { FastTrackObservers, setupFastTrackObserver } from './fastTrack'
import { logger } from '../logging'
import { getRandomId, literal } from '@sofie-automation/corelib/dist/lib'
import { Time } from '../../lib/lib'
import { ReadonlyDeep } from 'type-fest'

meteorPublish(PubSub.timeline, async function (selector, token) {
	if (!selector) throw new Meteor.Error(400, 'selector argument missing')
	const modifier: FindOptions<TimelineComplete> = {
		fields: {},
	}
	if (await StudioReadAccess.studioContent(selector._id, { userId: this.userId, token })) {
		return Timeline.find(selector, modifier)
	}
	return null
})

meteorCustomPublishArray(
	PubSub.timelineForDevice,
	'studioTimeline',
	async function (pub, deviceId: PeripheralDeviceId, token) {
		if (await PeripheralDeviceReadAccess.peripheralDeviceContent(deviceId, { userId: this.userId, token })) {
			const peripheralDevice = PeripheralDevices.findOne(deviceId)

			if (!peripheralDevice) throw new Meteor.Error('PeripheralDevice "' + deviceId + '" not found')

			const studioId = peripheralDevice.studioId
			if (!studioId) return

			await createObserverForTimelinePublication(pub, PubSub.timelineForDevice, studioId)
		}
	}
)

meteorCustomPublishArray(PubSub.timelineForStudio, 'studioTimeline', async function (pub, studioId: StudioId, token) {
	if (await StudioReadAccess.studio(studioId, { userId: this.userId, token })) {
		await createObserverForTimelinePublication(pub, PubSub.timelineForStudio, studioId)
	}
})

interface RoutedTimelineArgs {
	readonly studioId: StudioId
}

interface RoutedTimelineState {
	timeline: TimelineComplete | undefined

	// invalidateStudio: boolean
	studio: StudioLight | undefined
	routes: ResultingMappingRoutes | undefined

	// re-calc of timeline using timelineHash:
	timelineHash: TimelineHash | undefined
	timelineGenerated: Time
	routedTimeline: TimelineBlob | undefined
}
interface RoutedTimelineUpdateProps {
	invalidateStudio?: boolean

	timeline?: TimelineComplete | null
}

async function setupTimelinePublicationObservers(
	args: ReadonlyDeep<RoutedTimelineArgs>,
	triggerUpdate: TriggerUpdate<RoutedTimelineUpdateProps>
): Promise<Meteor.LiveQueryHandle[]> {
	// Set up observers:
	return [
		Studios.find(args.studioId, {
			fields: {
				// It should be enough to watch the mappingsHash, since that should change whenever there is a
				// change to the mappings or the routes
				mappingsHash: 1,
			},
		}).observe({
			added: () => triggerUpdate({ invalidateStudio: true }),
			changed: () => triggerUpdate({ invalidateStudio: true }),
			removed: () => triggerUpdate({ invalidateStudio: true }),
		}),
		Timeline.find(args.studioId).observe({
			added: (timeline) => {
				console.log(`################## I have been triggered from adding`)
				triggerUpdate({ timeline })
			},
			changed: (timeline) => {
				console.log(`################## I have been triggered from changing`)
				triggerUpdate({ timeline })
			},
			removed: () => triggerUpdate({ timeline: null }),
		}),
		setupFastTrackObserver(FastTrackObservers.TIMELINE, [args.studioId], (timeline: TimelineComplete) => {
			console.log(`################## I have been triggered from fastTrack`)
			triggerUpdate({
				timeline,
			})
		}),
	]
}

async function manipulateTimelinePublicationData(
	args: RoutedTimelineArgs,
	state: Partial<RoutedTimelineState>,
	updateProps: RoutedTimelineUpdateProps | undefined
): Promise<RoutedTimeline[] | null> {
	if (!updateProps) {
		// First fetch
		updateProps = {
			invalidateStudio: true,
			timeline: (await Timeline.findOneAsync(args.studioId)) ?? null,
		}
	}

	// Prepare data for publication:

	if (updateProps.invalidateStudio) {
		// If studio changed, or this is the first run, then fetch the studio
		state.studio = await fetchStudioLight(args.studioId)
		state.routes = undefined
	}

	let invalidateTimeline = false

	if (updateProps.timeline === null) {
		state.timeline = undefined
		invalidateTimeline = true
	} else if (updateProps.timeline) {
		if (state.timelineGenerated && state.timelineGenerated > Date.now() + 10000) {
			// Take height for something going really really wrong with the generated time,
			// like if a NTP-sync sets it to 50 years into the future or something...
			logger.warn(
				`Existing timeline is from the future, resetting time: ${new Date(
					state.timelineGenerated
				).toISOString()}`
			)
			state.timelineGenerated = 0
		}
		if (!state.timeline || !state.timelineGenerated || state.timelineGenerated <= updateProps.timeline.generated) {
			state.timeline = updateProps.timeline
			invalidateTimeline = true
		} else {
			// Hm, the generated is actually older than what we've already sent
			// Ignore the incoming timline
			logger.warn('Incoming timeline is older than the last sent timeline, rejecting the update')
		}
	}

	if (!state.studio) {
		// Looks like studio doesn't exist
		return []
	}

	if (!state.routes) {
		// Routes need recalculating
		state.routes = getActiveRoutes(state.studio)
		invalidateTimeline = true
	}

	if (invalidateTimeline) {
		// Something changed, so regenerate the timeline
		state.timelineHash = state.timeline?.timelineHash ?? getRandomId()
		state.timelineGenerated = state.timeline?.generated ?? 0
		const timeline = state.timeline ? deserializeTimelineBlob(state.timeline.timelineBlob) : []
		state.routedTimeline = serializeTimelineBlob(getRoutedTimeline(timeline, state.routes))
	} else {
		// Nothing was invalidated
		return null
	}

	// Return the new data
	return [
		literal<RoutedTimeline>({
			_id: args.studioId,
			mappingsHash: state.studio.mappingsHash,
			timelineHash: state.timelineHash,
			timelineBlob: state.routedTimeline,
			generated: state.timeline?.generated ?? Date.now(),
		}),
	]
}

/** Create an observer for each publication, to simplify the stop conditions */
async function createObserverForTimelinePublication(
	pub: CustomPublishArray<RoutedTimeline>,
	observerId: PubSub,
	studioId: StudioId
) {
	const observer = await setUpOptimizedObserver<
		RoutedTimeline,
		RoutedTimelineArgs,
		RoutedTimelineState,
		RoutedTimelineUpdateProps
	>(
		`pub_${observerId}_${studioId}`,
		{ studioId },
		setupTimelinePublicationObservers,
		manipulateTimelinePublicationData,
		(_args, data) => {
			// Don't need to perform any deep diffing, that's being done by CustomPublishArray
			pub.updatedDocs(data)
		},
		0 // ms
	)
	pub.onStop(() => {
		observer.stop()
	})
}
