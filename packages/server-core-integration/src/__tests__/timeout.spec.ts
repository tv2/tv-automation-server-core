import { protectString } from '@sofie-automation/shared-lib/dist/lib/protectedString'
import {
	PeripheralDeviceCategory,
	PeripheralDeviceType,
	PERIPHERAL_SUBTYPE_PROCESS,
} from '@sofie-automation/shared-lib/dist/peripheralDevice/peripheralDeviceAPI'
import { CoreConnection } from '../lib/coreConnection'
import { DDPConnector } from '../lib/ddpConnector'
import { DDPClient } from '../lib/ddpClient'

describe('Core method timeout diagnostics', () => {
	beforeEach(() => jest.useFakeTimers())
	afterEach(() => {
		jest.clearAllTimers()
		jest.useRealTimers()
		jest.restoreAllMocks()
	})

	function connection(): { core: CoreConnection; client: DDPClient } {
		const core = new CoreConnection({
			deviceId: protectString('offline-device'),
			deviceToken: 'offline-secret-token',
			deviceCategory: PeripheralDeviceCategory.PLAYOUT,
			deviceType: PeripheralDeviceType.PLAYOUT,
			deviceSubType: PERIPHERAL_SUBTYPE_PROCESS,
			deviceName: 'Offline timeout test',
		})
		const ddp = new DDPConnector({ host: '127.0.0.1', port: 0 })
		const client = new DDPClient({ host: '127.0.0.1', port: 0 })
		ddp.ddpClient = client
		core['_ddp'] = ddp
		return { core, client }
	}

	test('omits credentials and all payloads from console output and rejection', async () => {
		const { core, client } = connection()
		const call = jest.spyOn(client, 'call').mockImplementation(() => undefined)
		const output = jest.spyOn(console, 'error').mockImplementation(() => undefined)
		const payload = { password: 'offline-secret-password', nested: { token: 'offline-other-token' } }
		const rejection = core.callMethod('offline.testMethod', [payload]).catch((error: unknown) => ({ error }))
		jest.advanceTimersByTime(10000)
		await expect(rejection).resolves.toEqual({
			error: 'Timeout when calling method "offline.testMethod" after 10000 ms',
		})
		expect(call).toHaveBeenCalledWith(
			'offline.testMethod',
			['offline-device', 'offline-secret-token', payload],
			expect.any(Function)
		)
		expect(output).toHaveBeenCalledWith('Timeout when calling method "offline.testMethod" after 10000 ms')
		const logged = JSON.stringify(output.mock.calls)
		expect(logged).not.toContain('offline-secret-token')
		expect(logged).not.toContain('offline-secret-password')
		expect(logged).not.toContain('offline-other-token')
	})

	test('successful calls still clear the timeout and return their result', async () => {
		const { core, client } = connection()
		jest.spyOn(client, 'call').mockImplementation((_method, _attrs, callback) => callback(undefined, 'ok'))
		const output = jest.spyOn(console, 'error').mockImplementation(() => undefined)
		await expect(core.callMethod('offline.testMethod', ['payload'])).resolves.toBe('ok')
		jest.advanceTimersByTime(10000)
		expect(output).not.toHaveBeenCalled()
	})
})
