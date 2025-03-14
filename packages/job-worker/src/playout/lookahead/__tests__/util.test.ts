import { RundownPlaylistId, SegmentId, PartId, RundownId } from '@sofie-automation/corelib/dist/dataModel/Ids'
import { DBPart } from '@sofie-automation/corelib/dist/dataModel/Part'
import { MappingsExt } from '@sofie-automation/corelib/dist/dataModel/Studio'
import { protectString } from '@sofie-automation/corelib/dist/protectedString'
import { getCurrentTime } from '../../../lib'
import { LookaheadMode, PlaylistTimingType, TSR } from '@sofie-automation/blueprints-integration'
import { getOrderedPartsAfterPlayhead } from '../util'
import { MockJobContext, setupDefaultJobEnvironment } from '../../../__mocks__/context'
import { runJobWithPlayoutCache } from '../../../playout/lock'
import { defaultRundownPlaylist } from '../../../__mocks__/defaultCollectionObjects'
import _ = require('underscore')
import { wrapPartToTemporaryInstance } from '../../../__mocks__/partinstance'

describe('getOrderedPartsAfterPlayhead', () => {
	let context!: MockJobContext
	let playlistId: RundownPlaylistId
	let rundownId: RundownId
	let segmentId0: SegmentId
	let segmentId1: SegmentId
	let segmentId2: SegmentId
	let partIds: PartId[]

	beforeEach(async () => {
		context = setupDefaultJobEnvironment()

		const mappings: MappingsExt = {}
		for (const [k, v] of Object.entries(LookaheadMode)) {
			mappings[k] = {
				device: TSR.DeviceType.ABSTRACT,
				deviceId: protectString('fake0'),
				lookahead: v as LookaheadMode,
				// lookaheadDepth: 0,
				// lookaheadMaxSearchDistance: 0,
			}
		}
		context.setStudio({
			...context.studio,
			mappings: mappings,
		})

		// Create a playlist with some parts
		rundownId = protectString(`rundown0`)
		playlistId = protectString(`playlist0`)

		await context.directCollections.RundownPlaylists.insertOne({
			...defaultRundownPlaylist(playlistId, context.studioId),
			activationId: protectString('active'),
		})
		await context.directCollections.Rundowns.insertOne({
			peripheralDeviceId: undefined,
			organizationId: null,
			studioId: context.studioId,
			showStyleBaseId: protectString('showStyleBase0'),
			showStyleVariantId: protectString('showStyleVariante0'),

			playlistId: playlistId,

			_id: rundownId,
			externalId: 'MOCK_RUNDOWN',
			name: 'Default Rundown',

			created: getCurrentTime(),
			modified: getCurrentTime(),
			importVersions: {
				studio: '',
				showStyleBase: '',
				showStyleVariant: '',
				blueprint: '',
				core: '',
			},

			externalNRCSName: 'mock',
			timing: {
				type: PlaylistTimingType.None,
			},
		})

		const segmentIds = await Promise.all([
			context.directCollections.Segments.insertOne({
				_id: protectString(rundownId + '_segment0'),
				_rank: 0,
				externalId: 'MOCK_SEGMENT_0',
				rundownId: rundownId,
				name: 'Segment 0',
				externalModified: 1,
			}),
			context.directCollections.Segments.insertOne({
				_id: protectString(rundownId + '_segment01'),
				_rank: 1,
				externalId: 'MOCK_SEGMENT_1',
				rundownId: rundownId,
				name: 'Segment 1',
				externalModified: 1,
			}),
			context.directCollections.Segments.insertOne({
				_id: protectString(rundownId + '_segment2'),
				_rank: 2,
				externalId: 'MOCK_SEGMENT_2',
				rundownId: rundownId,
				name: 'Segment 2',
				externalModified: 1,
			}),
		])
		segmentId0 = segmentIds[0]
		segmentId1 = segmentIds[1]
		segmentId2 = segmentIds[2]

		function createMockPart(index: number, segId: SegmentId): DBPart {
			return {
				_id: protectString(rundownId + '_part' + index),
				segmentId: segId,
				rundownId: rundownId,
				_rank: index,
				externalId: 'MOCK_PART_' + index,
				title: 'Part ' + index,
				expectedDurationWithPreroll: undefined,
			}
		}

		partIds = await Promise.all([
			context.directCollections.Parts.insertOne(createMockPart(0, segmentId0)),
			context.directCollections.Parts.insertOne(createMockPart(1, segmentId0)),
			context.directCollections.Parts.insertOne(createMockPart(2, segmentId0)),
			context.directCollections.Parts.insertOne(createMockPart(3, segmentId0)),
			context.directCollections.Parts.insertOne(createMockPart(4, segmentId0)),

			context.directCollections.Parts.insertOne(createMockPart(10, segmentId1)),
			context.directCollections.Parts.insertOne(createMockPart(11, segmentId1)),
			context.directCollections.Parts.insertOne(createMockPart(12, segmentId1)),

			context.directCollections.Parts.insertOne(createMockPart(20, segmentId2)),
			context.directCollections.Parts.insertOne(createMockPart(21, segmentId2)),
			context.directCollections.Parts.insertOne(createMockPart(22, segmentId2)),
		])
	})
	test('all parts come back', async () => {
		const parts = await runJobWithPlayoutCache(context, { playlistId }, null, async (cache) =>
			getOrderedPartsAfterPlayhead(context, cache, 100)
		)

		expect(parts.map((p) => p._id)).toEqual(partIds)
	})

	test('first part is next', async () => {
		const firstPart = (await context.directCollections.Parts.findOne(partIds[0])) as DBPart
		expect(firstPart).toBeTruthy()

		// Convert to instance and set as next
		const firstInstanceId = await context.directCollections.PartInstances.insertOne(
			wrapPartToTemporaryInstance(protectString('active'), firstPart)
		)
		await context.directCollections.RundownPlaylists.update(playlistId, {
			$set: { nextPartInstanceId: firstInstanceId },
		})

		const parts = await runJobWithPlayoutCache(context, { playlistId }, null, async (cache) =>
			getOrderedPartsAfterPlayhead(context, cache, 100)
		)
		// Should not have the first
		expect(parts.map((p) => p._id)).toEqual(partIds.slice(1))

		// Try with a limit
		const parts2 = await runJobWithPlayoutCache(context, { playlistId }, null, async (cache) =>
			getOrderedPartsAfterPlayhead(context, cache, 5)
		)
		// Should not have the first
		expect(parts2.map((p) => p._id)).toEqual(partIds.slice(1, 6))
	})

	test('first part is current', async () => {
		const firstPart = (await context.directCollections.Parts.findOne(partIds[0])) as DBPart
		expect(firstPart).toBeTruthy()

		// Convert to instance and set as next
		const firstInstanceId = await context.directCollections.PartInstances.insertOne(
			wrapPartToTemporaryInstance(protectString('active'), firstPart)
		)
		await context.directCollections.RundownPlaylists.update(playlistId, {
			$set: { nextPartInstanceId: firstInstanceId },
		})

		const parts = await runJobWithPlayoutCache(context, { playlistId }, null, async (cache) =>
			getOrderedPartsAfterPlayhead(context, cache, 100)
		)
		// Should not have the first
		expect(parts.map((p) => p._id)).toEqual(partIds.slice(1))

		// Try with a limit
		const parts2 = await runJobWithPlayoutCache(context, { playlistId }, null, async (cache) =>
			getOrderedPartsAfterPlayhead(context, cache, 5)
		)
		// Should not have the first
		expect(parts2.map((p) => p._id)).toEqual(partIds.slice(1, 6))
	})

	test('last part is next', async () => {
		const lastPart = (await context.directCollections.Parts.findOne(_.last(partIds))) as DBPart
		expect(lastPart).toBeTruthy()

		// Convert to instance and set as next
		const lastInstanceId = await context.directCollections.PartInstances.insertOne(
			wrapPartToTemporaryInstance(protectString('active'), lastPart)
		)
		await context.directCollections.RundownPlaylists.update(playlistId, {
			$set: { nextPartInstanceId: lastInstanceId },
		})

		const parts = await runJobWithPlayoutCache(context, { playlistId }, null, async (cache) =>
			getOrderedPartsAfterPlayhead(context, cache, 100)
		)
		// Should be empty
		expect(parts.map((p) => p._id)).toEqual([])

		// Playlist could loop
		await context.directCollections.RundownPlaylists.update(playlistId, { $set: { loop: true } })
		const parts2 = await runJobWithPlayoutCache(context, { playlistId }, null, async (cache) =>
			getOrderedPartsAfterPlayhead(context, cache, 5)
		)
		// Should be empty
		expect(parts2.map((p) => p._id)).toEqual(partIds.slice(0, 5))

		// Set some parts as unplayable
		await context.directCollections.Parts.update(
			{
				_id: { $in: [partIds[1], partIds[4]] },
			},
			{
				$set: { invalid: true },
			}
		)
		const parts3 = await runJobWithPlayoutCache(context, { playlistId }, null, async (cache) =>
			getOrderedPartsAfterPlayhead(context, cache, 5)
		)
		// Should be empty
		expect(parts3.map((p) => p._id)).toEqual([partIds[0], ...partIds.slice(2, 4), ...partIds.slice(5, 7)])
	})

	test('filter unplayable part is current', async () => {
		const nextPart = (await context.directCollections.Parts.findOne(partIds[3])) as DBPart
		expect(nextPart).toBeTruthy()

		await context.directCollections.Parts.update(
			{
				_id: { $in: [partIds[4], partIds[7]] },
			},
			{
				$set: { invalid: true },
			}
		)

		// Convert to instance and set as next
		const nextInstanceId = await context.directCollections.PartInstances.insertOne(
			wrapPartToTemporaryInstance(protectString('active'), nextPart)
		)
		await context.directCollections.RundownPlaylists.update(playlistId, {
			$set: { nextPartInstanceId: nextInstanceId },
		})

		const parts = await runJobWithPlayoutCache(context, { playlistId }, null, async (cache) =>
			getOrderedPartsAfterPlayhead(context, cache, 5)
		)
		// Should not have the first
		expect(parts.map((p) => p._id)).toEqual([partIds[5], partIds[6], partIds[8], partIds[9], partIds[10]])
	})

	test('filter unplayable part is current2', async () => {
		const firstPart = (await context.directCollections.Parts.findOne(partIds[0])) as DBPart
		expect(firstPart).toBeTruthy()

		// Convert to instance and set as next
		const nextInstanceId = await context.directCollections.PartInstances.insertOne(
			wrapPartToTemporaryInstance(protectString('active'), firstPart)
		)
		await context.directCollections.RundownPlaylists.update(playlistId, {
			$set: { currentPartInstanceId: nextInstanceId },
		})

		// Change next segment
		await context.directCollections.RundownPlaylists.update(playlistId, { $set: { nextSegmentId: segmentId2 } })
		const parts = await runJobWithPlayoutCache(context, { playlistId }, null, async (cache) =>
			getOrderedPartsAfterPlayhead(context, cache, 10)
		)
		expect(parts.map((p) => p._id)).toEqual([...partIds.slice(1, 5), ...partIds.slice(8)])

		// Set start of next segment to unplayable
		await context.directCollections.Parts.update(
			{
				_id: { $in: [partIds[8]] },
			},
			{
				$set: { invalid: true },
			}
		)
		const parts2 = await runJobWithPlayoutCache(context, { playlistId }, null, async (cache) =>
			getOrderedPartsAfterPlayhead(context, cache, 10)
		)
		expect(parts2.map((p) => p._id)).toEqual([...partIds.slice(1, 5), ...partIds.slice(9)])

		// Set the rest of next segment to unplayable
		await context.directCollections.Parts.update(
			{
				_id: { $in: partIds.slice(9) },
			},
			{
				$set: { invalid: true },
			}
		)
		const parts3 = await runJobWithPlayoutCache(context, { playlistId }, null, async (cache) =>
			getOrderedPartsAfterPlayhead(context, cache, 10)
		)
		expect(parts3.map((p) => p._id)).toEqual(partIds.slice(1, 8))
	})
})
