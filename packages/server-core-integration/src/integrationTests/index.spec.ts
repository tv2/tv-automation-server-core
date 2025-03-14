jest.dontMock('ddp')
import { protectString } from '@sofie-automation/shared-lib/dist/lib/protectedString'
import { StatusCode } from '@sofie-automation/shared-lib/dist/lib/status'
import {
	PeripheralDeviceCategory,
	PeripheralDeviceType,
} from '@sofie-automation/shared-lib/dist/peripheralDevice/peripheralDeviceAPI'
import { CoreConnection } from '../index'

process.on('unhandledRejection', (reason) => {
	console.log('Unhandled Promise rejection!', reason)
})

async function wait(time: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve()
		}, time)
	})
}
const coreHost = '127.0.0.1'
const corePort = 3000

const defaultDeviceId = protectString('JestTest')

test('Integration: Test connection and basic Core functionality', async () => {
	// Note: This is an integration test, that require a Core to connect to

	const core = new CoreConnection({
		deviceId: defaultDeviceId,
		deviceToken: 'abcd',
		deviceType: PeripheralDeviceType.PLAYOUT,
		deviceCategory: PeripheralDeviceCategory.PLAYOUT,
		deviceName: 'Jest test framework',
	})

	const onConnectionChanged = jest.fn()
	const onConnected = jest.fn()
	const onDisconnected = jest.fn()
	const onError = jest.fn()
	core.onConnectionChanged(onConnectionChanged)
	core.onConnected(onConnected)
	core.onDisconnected(onDisconnected)

	core.onError(onError)

	expect(core.connected).toEqual(false)
	// Initiate connection to Core:

	let id = await core.init({
		host: coreHost,
		port: corePort,
	})

	expect(core.connected).toEqual(true)
	expect(id).toEqual(core.deviceId)

	expect(onConnectionChanged).toHaveBeenCalledTimes(1)
	expect(onConnectionChanged.mock.calls[0][0]).toEqual(true)
	expect(onConnected).toHaveBeenCalledTimes(1)
	expect(onDisconnected).toHaveBeenCalledTimes(0)

	// Set some statuses:

	let statusResponse = await core.setStatus({
		statusCode: StatusCode.WARNING_MAJOR,
		messages: ['testing testing'],
	})

	expect(statusResponse).toMatchObject({
		statusCode: StatusCode.WARNING_MAJOR,
	})

	statusResponse = await core.setStatus({
		statusCode: StatusCode.GOOD,
	})

	expect(statusResponse).toMatchObject({
		statusCode: StatusCode.GOOD,
	})

	// Observe data:
	const observer = core.observe('peripheralDevices')
	observer.added = jest.fn()
	observer.changed = jest.fn()
	observer.removed = jest.fn()

	// Subscribe to data:
	const coll0 = core.getCollection('peripheralDevices')
	expect(coll0.findOne({ _id: id })).toBeFalsy()
	const subId = await core.subscribe('peripheralDevices', {
		_id: id,
	})
	const coll1 = core.getCollection('peripheralDevices')
	expect(coll1.findOne({ _id: id })).toMatchObject({
		_id: id,
	})
	expect(observer.added).toHaveBeenCalledTimes(1)

	// Call a method
	await expect(core.callMethod('peripheralDevice.testMethod', ['return123'])).resolves.toEqual('return123')
	// Call a method which will throw error:
	await expect(core.callMethod('peripheralDevice.testMethod', ['abcd', true])).rejects.toMatchObject({
		error: 418,
		reason: /error/,
	})
	// Call an unknown method
	await expect(core.callMethod('myunknownMethod123', ['a', 'b'])).rejects.toMatchObject({
		error: 404,
		reason: /error/,
	})

	// Unsubscribe:
	core.unsubscribe(subId)

	await wait(200) // wait for unsubscription to go through

	expect(observer.removed).toHaveBeenCalledTimes(1)

	// Uninitialize

	id = await core.unInitialize()

	expect(id).toEqual(core.deviceId)

	// Set the status now (should cause an error)
	await expect(
		core.setStatus({
			statusCode: StatusCode.GOOD,
		})
	).rejects.toMatchObject({
		error: 404,
	})

	expect(onConnectionChanged).toHaveBeenCalledTimes(1)
	// Close connection:
	await core.destroy()

	expect(core.connected).toEqual(false)
	expect(onConnectionChanged).toHaveBeenCalledTimes(2)
	expect(onConnectionChanged.mock.calls[1][0]).toEqual(false)
	expect(onConnected).toHaveBeenCalledTimes(1)
	expect(onDisconnected).toHaveBeenCalledTimes(1)

	expect(onError).toHaveBeenCalledTimes(0)
})
test('Integration: Connection timeout', async () => {
	// Note: This is an integration test, that require a Core to connect to

	const core = new CoreConnection({
		deviceId: defaultDeviceId,
		deviceToken: 'abcd',
		deviceType: PeripheralDeviceType.PLAYOUT,
		deviceCategory: PeripheralDeviceCategory.PLAYOUT,
		deviceName: 'Jest test framework',
	})

	const onConnectionChanged = jest.fn()
	const onConnected = jest.fn()
	const onDisconnected = jest.fn()
	const onFailed = jest.fn()
	const onError = jest.fn()
	core.onConnectionChanged(onConnectionChanged)
	core.onConnected(onConnected)
	core.onDisconnected(onDisconnected)
	core.onFailed(onFailed)
	core.onError(onError)

	expect(core.connected).toEqual(false)
	// Initiate connection to Core:

	let err = null
	try {
		await core.init({
			host: '127.0.0.999',
			port: corePort,
		})
	} catch (e) {
		err = e
	}
	expect(err).toMatch('Network error')

	expect(core.connected).toEqual(false)

	await core.destroy()
})
test('Integration: Connection recover from close', async () => {
	// Note: This is an integration test, that require a Core to connect to

	const core = new CoreConnection({
		deviceId: defaultDeviceId,
		deviceToken: 'abcd',
		deviceType: PeripheralDeviceType.PLAYOUT,
		deviceCategory: PeripheralDeviceCategory.PLAYOUT,
		deviceName: 'Jest test framework',
	})

	const onConnectionChanged = jest.fn()
	const onConnected = jest.fn()
	const onDisconnected = jest.fn()
	const onFailed = jest.fn()
	const onError = jest.fn()
	core.onConnectionChanged(onConnectionChanged)
	core.onConnected(onConnected)
	core.onDisconnected(onDisconnected)
	core.onFailed(onFailed)
	core.onError(onError)

	expect(core.connected).toEqual(false)
	// Initiate connection to Core:

	await core.init({
		host: coreHost,
		port: corePort,
	})
	expect(core.connected).toEqual(true)

	// Force-close the socket:
	core.ddp.ddpClient?.socket?.close()

	await wait(10)
	expect(core.connected).toEqual(false)

	await wait(1300)
	// should have reconnected by now

	expect(core.connected).toEqual(true)

	await core.destroy()
})
test('Integration: autoSubscription', async () => {
	// Note: This is an integration test, that require a Core to connect to

	const core = new CoreConnection({
		deviceId: defaultDeviceId,
		deviceToken: 'abcd',
		deviceType: PeripheralDeviceType.PLAYOUT,
		deviceCategory: PeripheralDeviceCategory.PLAYOUT,
		deviceName: 'Jest test framework',
	})

	const onConnectionChanged = jest.fn()
	const onConnected = jest.fn()
	const onDisconnected = jest.fn()
	const onFailed = jest.fn()
	const onError = jest.fn()
	core.onConnectionChanged(onConnectionChanged)
	core.onConnected(onConnected)
	core.onDisconnected(onDisconnected)
	core.onFailed(onFailed)
	core.onError(onError)

	expect(core.connected).toEqual(false)
	// Initiate connection to Core:

	await core.init({
		host: coreHost,
		port: corePort,
	})
	expect(core.connected).toEqual(true)

	const observerAdded = jest.fn()
	const observerChanged = jest.fn()
	const observerRemoved = jest.fn()
	const observer = core.observe('peripheralDevices')
	observer.added = observerAdded
	observer.changed = observerChanged
	observer.removed = observerRemoved

	await core.autoSubscribe('peripheralDevices', { _id: defaultDeviceId })

	expect(observerAdded).toHaveBeenCalledTimes(1)

	await core.setStatus({
		statusCode: StatusCode.GOOD,
		messages: ['Jest A ' + Date.now()],
	})
	await wait(300)
	expect(observerChanged).toHaveBeenCalledTimes(1)

	// Force-close the socket:
	core.ddp.ddpClient?.socket?.close()

	await wait(10)
	expect(core.connected).toEqual(false)

	await wait(1300)
	// should have reconnected by now
	expect(core.connected).toEqual(true)

	observerChanged.mockClear()
	await core.setStatus({
		statusCode: StatusCode.GOOD,
		messages: ['Jest B' + Date.now()],
	})
	await wait(300)
	expect(observerChanged).toHaveBeenCalledTimes(1)

	await core.destroy()
})
test('Integration: Connection recover from a close that lasts some time', async () => {
	// Note: This is an integration test, that require a Core to connect to

	const core = new CoreConnection({
		deviceId: defaultDeviceId,
		deviceToken: 'abcd',
		deviceType: PeripheralDeviceType.PLAYOUT,
		deviceCategory: PeripheralDeviceCategory.PLAYOUT,
		deviceName: 'Jest test framework',
	})

	const onConnectionChanged = jest.fn()
	const onConnected = jest.fn()
	const onDisconnected = jest.fn()
	const onFailed = jest.fn()
	const onError = jest.fn()
	core.onConnectionChanged(onConnectionChanged)
	core.onConnected(onConnected)
	core.onDisconnected(onDisconnected)
	core.onFailed(onFailed)
	core.onError(onError)

	expect(core.connected).toEqual(false)
	// Initiate connection to Core:

	await core.init({
		host: coreHost,
		port: corePort,
		autoReconnect: true,
		autoReconnectTimer: 100,
	})
	expect(core.connected).toEqual(true)

	// temporary scramble the ddp host:
	;(core.ddp.ddpClient as any).host = '127.0.0.9'
	// Force-close the socket:
	core.ddp.ddpClient?.socket?.close()

	await wait(10)
	expect(core.connected).toEqual(false)

	await wait(1000) // allow for some reconnections

	// restore ddp host:
	;(core.ddp.ddpClient as any).host = '127.0.0.1'
	await wait(1000)
	// should have reconnected by now

	expect(core.connected).toEqual(true)

	await core.destroy()
})
test('Integration: Parent connections', async () => {
	// Note: This is an integration test, that require a Core to connect to
	const coreParent = new CoreConnection({
		deviceId: defaultDeviceId,
		deviceToken: 'abcd',
		deviceType: PeripheralDeviceType.PLAYOUT,
		deviceCategory: PeripheralDeviceCategory.PLAYOUT,
		deviceName: 'Jest test framework',
	})
	const onError = jest.fn()
	coreParent.onError(onError)

	const parentOnConnectionChanged = jest.fn()
	coreParent.onConnectionChanged(parentOnConnectionChanged)

	let id = await coreParent.init({
		host: coreHost,
		port: corePort,
	})
	expect(coreParent.connected).toEqual(true)

	// Set child connection:
	const coreChild = new CoreConnection({
		deviceId: protectString('JestTestChild'),
		deviceToken: 'abcd2',
		deviceType: PeripheralDeviceType.PLAYOUT,
		deviceCategory: PeripheralDeviceCategory.PLAYOUT,
		deviceName: 'Jest test framework child',
	})

	const onChildConnectionChanged = jest.fn()
	const onChildConnected = jest.fn()
	const onChildDisconnected = jest.fn()
	const onChildError = jest.fn()
	coreChild.onConnectionChanged(onChildConnectionChanged)
	coreChild.onConnected(onChildConnected)
	coreChild.onDisconnected(onChildDisconnected)
	coreChild.onError(onChildError)

	const idChild = await coreChild.init(coreParent)

	expect(idChild).toEqual(coreChild.deviceId)
	expect(coreChild.connected).toEqual(true)

	expect(onChildConnectionChanged).toHaveBeenCalledTimes(1)
	expect(onChildConnectionChanged.mock.calls[0][0]).toEqual(true)
	expect(onChildConnected).toHaveBeenCalledTimes(1)
	expect(onChildDisconnected).toHaveBeenCalledTimes(0)

	// Set some statuses:
	let statusResponse = await coreChild.setStatus({
		statusCode: StatusCode.WARNING_MAJOR,
		messages: ['testing testing'],
	})

	expect(statusResponse).toMatchObject({
		statusCode: StatusCode.WARNING_MAJOR,
	})

	statusResponse = await coreChild.setStatus({
		statusCode: StatusCode.GOOD,
	})

	expect(statusResponse).toMatchObject({
		statusCode: StatusCode.GOOD,
	})

	// Uninitialize:

	id = await coreChild.unInitialize()

	expect(id).toEqual(coreChild.deviceId)

	// Set the status now (should cause an error)
	await expect(
		coreChild.setStatus({
			statusCode: StatusCode.GOOD,
		})
	).rejects.toMatchObject({
		error: 404,
	})

	await coreParent.destroy()
	await coreChild.destroy()

	expect(onError).toHaveBeenCalledTimes(0)
	expect(onChildError).toHaveBeenCalledTimes(0)
})

test('Integration: Parent destroy', async () => {
	// Note: This is an integration test, that require a Core to connect to
	const coreParent = new CoreConnection({
		deviceId: defaultDeviceId,
		deviceToken: 'abcd',
		deviceType: PeripheralDeviceType.PLAYOUT,
		deviceCategory: PeripheralDeviceCategory.PLAYOUT,
		deviceName: 'Jest test framework',
	})
	const onParentError = jest.fn()
	coreParent.onError(onParentError)

	await coreParent.init({
		host: coreHost,
		port: corePort,
	})
	// Set child connection:
	const coreChild = new CoreConnection({
		deviceId: protectString('JestTestChild'),
		deviceToken: 'abcd2',
		deviceType: PeripheralDeviceType.PLAYOUT,
		deviceCategory: PeripheralDeviceCategory.PLAYOUT,
		deviceName: 'Jest test framework child',
	})
	const onChildConnectionChanged = jest.fn()
	const onChildConnected = jest.fn()
	const onChildDisconnected = jest.fn()
	const onChildError = jest.fn()
	coreChild.onConnectionChanged(onChildConnectionChanged)
	coreChild.onConnected(onChildConnected)
	coreChild.onDisconnected(onChildDisconnected)
	coreChild.onError(onChildError)

	await coreChild.init(coreParent)

	expect(coreChild.connected).toEqual(true)

	// Close parent connection:
	await coreParent.destroy()

	expect(coreChild.connected).toEqual(false)

	expect(onChildConnectionChanged).toHaveBeenCalledTimes(2)
	expect(onChildConnectionChanged.mock.calls[1][0]).toEqual(false)
	expect(onChildConnected).toHaveBeenCalledTimes(1)
	expect(onChildDisconnected).toHaveBeenCalledTimes(1)
	// Setup stuff again
	onChildConnectionChanged.mockClear()
	onChildConnected.mockClear()
	onChildDisconnected.mockClear()

	coreChild.onConnectionChanged(onChildConnectionChanged)
	coreChild.onConnected(onChildConnected)
	coreChild.onDisconnected(onChildDisconnected)
	// connect parent again:

	await coreParent.init({
		host: coreHost,
		port: corePort,
	})

	await coreChild.init(coreParent)

	expect(coreChild.connected).toEqual(true)

	expect(onChildConnected).toHaveBeenCalledTimes(1)
	expect(onChildConnectionChanged).toHaveBeenCalledTimes(1)
	expect(onChildConnectionChanged.mock.calls[0][0]).toEqual(true)
	expect(onChildDisconnected).toHaveBeenCalledTimes(0)

	await coreParent.destroy()
	await coreChild.destroy()

	expect(onChildError).toHaveBeenCalledTimes(0)
	expect(onParentError).toHaveBeenCalledTimes(0)
})
test('Integration: Child destroy', async () => {
	// Note: This is an integration test, that require a Core to connect to
	const coreParent = new CoreConnection({
		deviceId: defaultDeviceId,
		deviceToken: 'abcd',
		deviceType: PeripheralDeviceType.PLAYOUT,
		deviceCategory: PeripheralDeviceCategory.PLAYOUT,
		deviceName: 'Jest test framework',
	})
	const onParentError = jest.fn()
	coreParent.onError(onParentError)
	await coreParent.init({
		host: coreHost,
		port: corePort,
	})
	// Set child connection:
	const coreChild = new CoreConnection({
		deviceId: protectString('JestTestChild'),
		deviceToken: 'abcd2',
		deviceType: PeripheralDeviceType.PLAYOUT,
		deviceCategory: PeripheralDeviceCategory.PLAYOUT,
		deviceName: 'Jest test framework child',
	})
	const onChildConnectionChanged = jest.fn()
	const onChildConnected = jest.fn()
	const onChildDisconnected = jest.fn()
	const onChildError = jest.fn()
	coreChild.onConnectionChanged(onChildConnectionChanged)
	coreChild.onConnected(onChildConnected)
	coreChild.onDisconnected(onChildDisconnected)
	coreChild.onError(onChildError)

	await coreChild.init(coreParent)

	expect(coreChild.connected).toEqual(true)

	// Close parent connection:
	await coreChild.destroy()

	expect(coreChild.connected).toEqual(false)

	expect(onChildConnectionChanged).toHaveBeenCalledTimes(2)
	expect(onChildConnectionChanged.mock.calls[1][0]).toEqual(false)
	expect(onChildConnected).toHaveBeenCalledTimes(1)
	expect(onChildDisconnected).toHaveBeenCalledTimes(1)

	await coreParent.destroy()

	expect(onParentError).toHaveBeenCalledTimes(0)
	expect(onChildError).toHaveBeenCalledTimes(0)
})
test('Integration: Test callMethodLowPrio', async () => {
	// Note: This is an integration test, that require a Core to connect to

	const core = new CoreConnection({
		deviceId: defaultDeviceId,
		deviceToken: 'abcd',
		deviceType: PeripheralDeviceType.PLAYOUT,
		deviceCategory: PeripheralDeviceCategory.PLAYOUT,
		deviceName: 'Jest test framework',
	})

	const onError = jest.fn()
	core.onError(onError)

	await core.init({
		host: coreHost,
		port: corePort,
	})

	expect(core.connected).toEqual(true)

	// Call a method
	await expect(core.callMethod('peripheralDevice.testMethod', ['return123'])).resolves.toEqual('return123')
	// Call a low-prio method
	await expect(core.callMethodLowPrio('peripheralDevice.testMethod', ['low123'])).resolves.toEqual('low123')

	const ps: Promise<any>[] = []

	// method should be called before low-prio:
	let i = 0
	ps.push(
		core.callMethodLowPrio('peripheralDevice.testMethod', ['return123']).then(() => {
			return i++
		})
	)
	ps.push(
		core.callMethod('peripheralDevice.testMethod', ['low123']).then(() => {
			return i++
		})
	)

	const r = await Promise.all(ps)

	expect(r[0]).toBeGreaterThan(r[1]) // because callMethod should have run before callMethodLowPrio

	// Clean up
	await core.destroy()

	expect(onError).toHaveBeenCalledTimes(0)
})
