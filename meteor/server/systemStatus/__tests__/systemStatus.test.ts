import '../../../__mocks__/_extendJest'
import { testInFiber } from '../../../__mocks__/helpers/jest'
import { setupDefaultStudioEnvironment, DefaultEnvironment } from '../../../__mocks__/helpers/database'
import { literal, unprotectString } from '../../../lib/lib'
import { MeteorMock } from '../../../__mocks__/meteor'
import { status2ExternalStatus, setSystemStatus } from '../systemStatus'
import { StatusResponse } from '../../../lib/api/systemStatus'
import { PeripheralDevices } from '../../../lib/collections/PeripheralDevices'
import { PeripheralDeviceAPI } from '../../../lib/api/peripheralDevice'
import { stripVersion } from '../../../lib/collections/CoreSystem'
import semver from 'semver'
import { StatusCode } from '@sofie-automation/blueprints-integration'
import { MeteorCall } from '../../../lib/api/methods'

require('../api')
const PackageInfo = require('../../../package.json')

describe('systemStatus', () => {
	let env: DefaultEnvironment
	testInFiber('getSystemStatus: before startup', async () => {
		// Before starting the system up, the system status will be unknown
		const expectedStatus0 = StatusCode.UNKNOWN
		const result0: StatusResponse = await MeteorCall.systemStatus.getSystemStatus()
		expect(result0).toMatchObject({
			status: status2ExternalStatus(expectedStatus0),
			_status: expectedStatus0,
		})
		expect(result0.checks).toHaveLength(0)
	})
	testInFiber('getSystemStatus: after startup', async () => {
		env = await setupDefaultStudioEnvironment()
		MeteorMock.mockRunMeteorStartup()

		const result0: StatusResponse = await MeteorCall.systemStatus.getSystemStatus()

		// Intial expected status is BAD, because the databaseVersion doesn't match
		const expectedStatus0 = StatusCode.BAD
		expect(result0).toMatchObject({
			status: status2ExternalStatus(expectedStatus0),
			_status: expectedStatus0,
		})
		expect(result0.checks && result0.checks.length).toBeGreaterThan(0)

		const databaseVersionCheck = result0.checks && result0.checks.find((p) => p.description === 'databaseVersion')
		expect(databaseVersionCheck).toMatchObject({
			status: status2ExternalStatus(StatusCode.BAD),
		})
	})
	testInFiber('getSystemStatus: after all migrations completed', async () => {
		// simulate migrations completed
		setSystemStatus('databaseVersion', {
			statusCode: StatusCode.GOOD,
			messages: [`${'databaseVersion'} version: ${PackageInfo.version}`],
		})

		const result0: StatusResponse = await MeteorCall.systemStatus.getSystemStatus()

		// Expected status is GOOD, because the databaseVersion matches
		const expectedStatus0 = StatusCode.GOOD
		expect(result0).toMatchObject({
			status: status2ExternalStatus(expectedStatus0),
			_status: expectedStatus0,
		})
		const databaseVersionCheck = result0.checks && result0.checks.find((p) => p.description === 'databaseVersion')
		expect(databaseVersionCheck).toMatchObject({
			status: status2ExternalStatus(StatusCode.GOOD),
		})
	})
	testInFiber('getSystemStatus: a component has a fault', async () => {
		// simulate device failure
		PeripheralDevices.update(env.ingestDevice._id, {
			$set: {
				status: literal<PeripheralDeviceAPI.StatusObject>({
					statusCode: StatusCode.WARNING_MAJOR,
					messages: [],
				}),
			},
		})

		const result0: StatusResponse = await MeteorCall.systemStatus.getSystemStatus()

		// Expected status is WARNING_MAJOR, because the the device has a warning status
		const expectedStatus0 = StatusCode.WARNING_MAJOR
		expect(result0).toMatchObject({
			status: status2ExternalStatus(expectedStatus0),
			_status: expectedStatus0,
		})
		const component =
			result0.components &&
			result0.components.find((c) => unprotectString(c.instanceId) === unprotectString(env.ingestDevice._id))
		expect(component).toMatchObject({
			status: status2ExternalStatus(expectedStatus0),
		})
	})
	testInFiber('getSystemStatus: a component has a library version mismatch', async () => {
		// simulate device failure
		PeripheralDevices.update(env.ingestDevice._id, {
			$set: {
				status: literal<PeripheralDeviceAPI.StatusObject>({
					statusCode: StatusCode.GOOD,
					messages: [],
				}),
			},
		})

		const result0: StatusResponse = await MeteorCall.systemStatus.getSystemStatus()

		// Expected status is GOOD, because the device is GOOD, check that the system is reset
		const expectedStatus0 = StatusCode.GOOD
		expect(result0).toMatchObject({
			status: status2ExternalStatus(expectedStatus0),
			_status: expectedStatus0,
		})
		const component =
			result0.components &&
			result0.components.find((c) => unprotectString(c.instanceId) === unprotectString(env.ingestDevice._id))
		expect(component).toMatchObject({
			status: status2ExternalStatus(expectedStatus0),
		})

		{
			const coreVersion = semver.parse(stripVersion(PackageInfo.version)) as semver.SemVer
			expect(coreVersion).toBeTruthy()
			coreVersion.major = 99

			// Change integration lib versions, simulate a major version mismatch
			// Expected status is BAD, because the device expects a different major version
			await updateAndCheckSystemStatus(
				{
					versions: {
						'@sofie-automation/server-core-integration': coreVersion.format(),
					},
				},
				env,
				StatusCode.BAD
			)
		}

		{
			const coreVersion = semver.parse(stripVersion(PackageInfo.version)) as semver.SemVer
			expect(coreVersion).toBeTruthy()
			coreVersion.minor = 999

			// Change integration lib versions, simulate a minor version mismatch
			// Expected status is BAD, because the device expects a different minor version
			await updateAndCheckSystemStatus(
				{
					versions: {
						'@sofie-automation/server-core-integration': coreVersion.format(),
					},
				},
				env,
				StatusCode.BAD
			)
		}

		{
			const coreVersion = semver.parse(stripVersion(PackageInfo.version)) as semver.SemVer
			expect(coreVersion).toBeTruthy()
			coreVersion.patch = 999

			// Change integration lib versions, simulate a patch version mismatch
			// Expected status is GOOD, because this should have no effect
			await updateAndCheckSystemStatus(
				{
					versions: {
						'@sofie-automation/server-core-integration': coreVersion.format(),
					},
				},
				env,
				StatusCode.GOOD
			)
		}

		// Try some silly version
		// Expected status is BAD, because the device expects a different version
		await updateAndCheckSystemStatus(
			{
				versions: {
					test: '0.1.2',
				},
			},
			env,
			StatusCode.BAD
		)

		// disableVersion check
		// Expected status is GOOD, as the check has been skipped
		await updateAndCheckSystemStatus(
			{
				disableVersionChecks: true,
			},
			env,
			StatusCode.GOOD
		)
	})
})

async function updateAndCheckSystemStatus(
	setObj: Object,
	env: DefaultEnvironment,
	expected: StatusCode
): Promise<void> {
	PeripheralDevices.update(env.ingestDevice._id, {
		$set: setObj,
	})
	const result: StatusResponse = await MeteorCall.systemStatus.getSystemStatus()

	expect(result).toMatchObject({
		status: status2ExternalStatus(expected),
		_status: expected,
	})
}
