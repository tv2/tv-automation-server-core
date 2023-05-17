import '../../../__mocks__/_extendJest'
import { testInFiber } from '../../../__mocks__/helpers/jest'
import { setupDefaultStudioEnvironment, DefaultEnvironment } from '../../../__mocks__/helpers/database'
import { protectString, literal, unprotectString, getRandomString } from '../../../lib/lib'
import {
	PickerMock,
	parseResponseBuffer,
	MockResponseDataString,
	PickerMockRoute,
} from '../../../__mocks__/meteorhacks-picker'
import { Response as MockResponse, Request as MockRequest } from 'mock-http'
import {
	RundownLayoutType,
	RundownLayouts,
	RundownLayout,
	CustomizableRegions,
	RundownLayoutId,
} from '../../../lib/collections/RundownLayouts'
import { MeteorCall } from '../../../lib/api/methods'
import { beforeEachInFiber } from '../../../__mocks__/helpers/jest'
import { BlueprintId } from '@sofie-automation/corelib/dist/dataModel/Ids'

require('../client') // include in order to create the Meteor methods needed
require('../rundownLayouts') // include in order to create the Meteor methods needed

describe('Rundown Layouts', () => {
	let env: DefaultEnvironment
	beforeAll(async () => {
		env = await setupDefaultStudioEnvironment()
	})
	let rundownLayoutId: RundownLayoutId
	testInFiber('Create rundown layout', async () => {
		const res = await MeteorCall.rundownLayout.createRundownLayout(
			'Test',
			RundownLayoutType.RUNDOWN_LAYOUT,
			env.showStyleBaseId,
			'shelf_layouts'
		)
		expect(typeof res).toBe('string') // this should contain the ID for the rundown layout
		rundownLayoutId = res

		const item = RundownLayouts.findOne(rundownLayoutId)
		expect(item).toMatchObject({
			_id: rundownLayoutId,
		})
	})
	testInFiber('Remove rundown layout', async () => {
		const item0 = RundownLayouts.findOne(rundownLayoutId)
		expect(item0).toMatchObject({
			_id: rundownLayoutId,
		})

		await MeteorCall.rundownLayout.removeRundownLayout(rundownLayoutId)

		const item1 = RundownLayouts.findOne(rundownLayoutId)
		expect(item1).toBeUndefined()
	})

	describe('HTTP API', () => {
		function makeMockLayout(env: DefaultEnvironment) {
			const rundownLayoutId = getRandomString()
			const mockLayout = literal<RundownLayout>({
				_id: protectString(rundownLayoutId),
				name: 'MOCK LAYOUT',
				filters: [],
				showStyleBaseId: env.showStyleBaseId,
				type: RundownLayoutType.RUNDOWN_LAYOUT,
				exposeAsStandalone: false,
				icon: '',
				iconColor: '',
				showInspector: true,
				openByDefault: false,
				disableContextMenu: true,
				hideDefaultStartExecute: false,
				regionId: CustomizableRegions.Shelf,
				isDefaultLayout: false,
			})
			return { rundownLayout: mockLayout, rundownLayoutId }
		}

		testInFiber('download shelf layout', async () => {
			const { rundownLayout: mockLayout, rundownLayoutId } = makeMockLayout(env)
			RundownLayouts.insert(mockLayout)

			const routeName = '/shelfLayouts/download/:id'
			const route = PickerMock.mockRoutes[routeName]
			expect(route).toBeTruthy()

			{
				const fakeId = 'FAKE_ID'
				const res = new MockResponse()
				const req = new MockRequest({
					method: 'GET',
					url: `/shelfLayouts/download/${fakeId}`,
				})

				await route.handler({ id: fakeId }, req, res, jest.fn())

				const resStr = parseResponseBuffer(res)
				expect(resStr).toMatchObject(
					literal<Partial<MockResponseDataString>>({
						statusCode: 404,
						timedout: false,
						ended: true,
					})
				)
				expect(resStr.bufferStr).toContain('not found')
			}

			{
				const res = new MockResponse()
				const req = new MockRequest({
					method: 'GET',
					url: `/shelfLayouts/download/${rundownLayoutId}`,
				})

				await route.handler({ id: rundownLayoutId }, req, res, jest.fn())

				const resStr = parseResponseBuffer(res)
				expect(resStr).toMatchObject(
					literal<Partial<MockResponseDataString>>({
						statusCode: 200,
						headers: {
							'content-type': 'application/json',
						},
						timedout: false,
						ended: true,
					})
				)

				const layout = JSON.parse(resStr.bufferStr)
				expect(layout).toMatchObject(mockLayout)
			}
		})

		describe('upload shelf layout', () => {
			let mockLayout: RundownLayout
			let route: PickerMockRoute
			beforeAll(() => {
				mockLayout = makeMockLayout(env).rundownLayout
				const routeName = '/shelfLayouts/upload/:showStyleBaseId'
				route = PickerMock.mockRoutes[routeName]
			})

			test('route exists', () => {
				expect(route).toBeTruthy()
			})

			testInFiber('returns 500 when uploading to a non-existent showStyleBase', async () => {
				const fakeId = 'FAKE_ID'
				const res = new MockResponse()
				const req = new MockRequest({
					method: 'POST',
					url: `/shelfLayouts/upload/${fakeId}`,
				})
				req.body = mockLayout

				await route.handler({ showStyleBaseId: fakeId }, req, res, jest.fn())

				const resStr = parseResponseBuffer(res)
				expect(resStr).toMatchObject(
					literal<Partial<MockResponseDataString>>({
						statusCode: 500,
						timedout: false,
						ended: true,
					})
				)
				expect(resStr.bufferStr).toContain('not found')
			})

			testInFiber('returns 500 when body is empty', async () => {
				const res = new MockResponse()
				const req = new MockRequest({
					method: 'POST',
					url: `/shelfLayouts/upload/${env.showStyleBaseId}`,
				})

				await route.handler({ showStyleBaseId: unprotectString(env.showStyleBaseId) }, req, res, jest.fn())

				const resStr = parseResponseBuffer(res)
				expect(resStr).toMatchObject(
					literal<Partial<MockResponseDataString>>({
						statusCode: 500,
						timedout: false,
						ended: true,
					})
				)
				expect(resStr.bufferStr).toContain('body')
			})

			testInFiber('returns 500 when body is not an object', async () => {
				const res = new MockResponse()
				const req = new MockRequest({
					method: 'POST',
					url: `/shelfLayouts/upload/${env.showStyleBaseId}`,
				})
				req.body = '{ "type": "sometype" }'

				await route.handler({ showStyleBaseId: unprotectString(env.showStyleBaseId) }, req, res, jest.fn())

				const resStr = parseResponseBuffer(res)
				expect(resStr).toMatchObject(
					literal<Partial<MockResponseDataString>>({
						statusCode: 500,
						timedout: false,
						ended: true,
					})
				)
				expect(resStr.bufferStr).toContain('body')
			})

			testInFiber('returns 500 when body is missing required properties', async () => {
				const res = new MockResponse()
				const req = new MockRequest({
					method: 'POST',
					url: `/shelfLayouts/upload/${env.showStyleBaseId}`,
				})
				req.body = { type: 'sometype' }

				await route.handler({ showStyleBaseId: unprotectString(env.showStyleBaseId) }, req, res, jest.fn())

				const resStr = parseResponseBuffer(res)
				expect(resStr).toMatchObject(
					literal<Partial<MockResponseDataString>>({
						statusCode: 500,
						timedout: false,
						ended: true,
					})
				)
				expect(resStr.bufferStr).toContain('Match error')
			})

			testInFiber('uploads the layout when body is correct and showstyle exists', async () => {
				const res = new MockResponse()
				const req = new MockRequest({
					method: 'POST',
					url: `/shelfLayouts/upload/${env.showStyleBaseId}`,
				})
				req.body = mockLayout

				await route.handler({ showStyleBaseId: unprotectString(env.showStyleBaseId) }, req, res, jest.fn())

				const resStr = parseResponseBuffer(res)
				expect(resStr).toMatchObject(
					literal<Partial<MockResponseDataString>>({
						statusCode: 200,
						timedout: false,
						ended: true,
					})
				)

				expect(RundownLayouts.findOne(mockLayout._id)).toBeTruthy()
			})
		})

		describe('upload shelf layout by blueprint id', () => {
			let mockLayout: RundownLayout
			let route: PickerMockRoute
			let showStyleBlueprintId: BlueprintId
			beforeAll(() => {
				mockLayout = makeMockLayout(env).rundownLayout
				const routeName = '/shelfLayouts/uploadByShowStyleBlueprintId/:showStyleBlueprintId'
				route = PickerMock.mockRoutes[routeName]
				showStyleBlueprintId = env.showStyleBlueprint._id
			})
			beforeEachInFiber(() => {
				RundownLayouts.remove({})
			})

			test('route exists', () => {
				expect(route).toBeTruthy()
			})

			testInFiber('returns 500 when uploading to a non-existent showStyleBase', async () => {
				const fakeId = 'FAKE_ID'
				const res = new MockResponse()
				const req = new MockRequest({
					method: 'POST',
					url: `/shelfLayouts/uploadByShowStyleBlueprintId/${fakeId}`,
				})
				req.body = mockLayout

				await route.handler({ showStyleBlueprintId: fakeId }, req, res, jest.fn())

				const resStr = parseResponseBuffer(res)
				expect(resStr).toMatchObject(
					literal<Partial<MockResponseDataString>>({
						statusCode: 500,
						timedout: false,
						ended: true,
					})
				)
				expect(resStr.bufferStr).toContain('not found')
			})

			testInFiber('returns 500 when body is empty', async () => {
				const res = new MockResponse()
				const req = new MockRequest({
					method: 'POST',
					url: `/shelfLayouts/uploadByShowStyleBlueprintId/${showStyleBlueprintId}`,
				})

				await route.handler(
					{ showStyleBlueprintId: unprotectString(showStyleBlueprintId) },
					req,
					res,
					jest.fn()
				)

				const resStr = parseResponseBuffer(res)
				expect(resStr).toMatchObject(
					literal<Partial<MockResponseDataString>>({
						statusCode: 500,
						timedout: false,
						ended: true,
					})
				)
				expect(resStr.bufferStr).toContain('body')
			})

			testInFiber('returns 500 when body is not an object', async () => {
				const res = new MockResponse()
				const req = new MockRequest({
					method: 'POST',
					url: `/shelfLayouts/uploadByShowStyleBlueprintId/${showStyleBlueprintId}`,
				})
				req.body = '{ "type": "sometype" }'

				await route.handler(
					{ showStyleBlueprintId: unprotectString(showStyleBlueprintId) },
					req,
					res,
					jest.fn()
				)

				const resStr = parseResponseBuffer(res)
				expect(resStr).toMatchObject(
					literal<Partial<MockResponseDataString>>({
						statusCode: 500,
						timedout: false,
						ended: true,
					})
				)
				expect(resStr.bufferStr).toContain('body')
			})

			testInFiber('returns 500 when body is missing required propertoes', async () => {
				const res = new MockResponse()
				const req = new MockRequest({
					method: 'POST',
					url: `/shelfLayouts/uploadByShowStyleBlueprintId/${showStyleBlueprintId}`,
				})
				req.body = { type: 'sometype' }

				await route.handler(
					{ showStyleBlueprintId: unprotectString(showStyleBlueprintId) },
					req,
					res,
					jest.fn()
				)

				const resStr = parseResponseBuffer(res)
				expect(resStr).toMatchObject(
					literal<Partial<MockResponseDataString>>({
						statusCode: 500,
						timedout: false,
						ended: true,
					})
				)
				expect(resStr.bufferStr).toContain('Match error')
			})

			testInFiber('uploads the layout when body is correct and showstyle exists', async () => {
				const res = new MockResponse()
				const req = new MockRequest({
					method: 'POST',
					url: `/shelfLayouts/uploadByShowStyleBlueprintId/${showStyleBlueprintId}`,
				})
				req.body = mockLayout

				await route.handler(
					{ showStyleBlueprintId: unprotectString(showStyleBlueprintId) },
					req,
					res,
					jest.fn()
				)

				const resStr = parseResponseBuffer(res)
				expect(resStr).toMatchObject(
					literal<Partial<MockResponseDataString>>({
						statusCode: 200,
						timedout: false,
						ended: true,
					})
				)

				expect(
					RundownLayouts.findOne({ _id: mockLayout._id, showStyleBaseId: env.showStyleBaseId })
				).toBeTruthy()
			})
		})
	})
})
