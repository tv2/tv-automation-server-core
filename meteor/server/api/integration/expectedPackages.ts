import { check } from '../../../lib/check'
import { Meteor } from 'meteor/meteor'
import { PeripheralDeviceId } from '../../../lib/collections/PeripheralDevices'
import { MethodContext } from '../../../lib/api/methods'
import { checkAccessAndGetPeripheralDevice } from '../ingest/lib'
import { ExpectedPackageId, ExpectedPackages } from '../../../lib/collections/ExpectedPackages'
import { ExpectedPackageStatusAPI, PackageInfo } from '@sofie-automation/blueprints-integration'
import {
	ExpectedPackageWorkStatus,
	ExpectedPackageWorkStatuses,
	ExpectedPackageWorkStatusId,
} from '../../../lib/collections/ExpectedPackageWorkStatuses'
import { assertNever, getCurrentTime, literal, protectString } from '../../../lib/lib'
import {
	getPackageContainerPackageId,
	PackageContainerPackageStatuses,
	PackageContainerPackageStatusDB,
	PackageContainerPackageId,
} from '../../../lib/collections/PackageContainerPackageStatus'
import { getPackageInfoId, PackageInfoDB, PackageInfos } from '../../../lib/collections/PackageInfos'
import type { AnyBulkWriteOperation } from 'mongodb'
import { onUpdatedPackageInfo } from '../ingest/packageInfo'
import {
	getPackageContainerId,
	PackageContainerId,
	PackageContainerStatusDB,
	PackageContainerStatuses,
} from '../../../lib/collections/PackageContainerStatus'

export namespace PackageManagerIntegration {
	export async function updateExpectedPackageWorkStatuses(
		context: MethodContext,
		deviceId: PeripheralDeviceId,
		deviceToken: string,
		changes: (
			| {
					id: ExpectedPackageWorkStatusId
					type: 'delete'
			  }
			| {
					id: ExpectedPackageWorkStatusId
					type: 'insert'
					status: ExpectedPackageStatusAPI.WorkStatus
			  }
			| {
					id: ExpectedPackageWorkStatusId
					type: 'update'
					status: Partial<ExpectedPackageStatusAPI.WorkStatus>
			  }
		)[]
	): Promise<void> {
		type FromPackage = Omit<ExpectedPackageStatusAPI.WorkBaseInfoFromPackage, 'id'> & { id: ExpectedPackageId }

		const peripheralDevice = await checkAccessAndGetPeripheralDevice(deviceId, deviceToken, context)
		if (!peripheralDevice.studioId)
			throw new Meteor.Error(400, 'Device "' + peripheralDevice._id + '" has no studio')

		const bulkChanges: AnyBulkWriteOperation<ExpectedPackageWorkStatus>[] = []
		const removedIds: ExpectedPackageWorkStatusId[] = []

		const ps: Promise<void>[] = []
		for (const change of changes) {
			check(change.id, String)
			check(change, Object)

			if (change.type === 'delete') {
				removedIds.push(change.id)
			} else {
				const workStatus = change.status as any as Omit<ExpectedPackageStatusAPI.WorkStatus, 'fromPackages'> & {
					fromPackages: FromPackage[]
				}

				if (change.type === 'update') {
					// Partial update only:
					bulkChanges.push({
						updateOne: {
							filter: {
								_id: change.id,
							},
							update: {
								$set: {
									...workStatus,
									modified: getCurrentTime(),
								},
							},
						},
					})
				} else if (change.type === 'insert') {
					// For inserts, we need to look up the ExpectedPackage in order to put it in the right studio:
					check(workStatus.fromPackages, Array)
					const fromPackageIds = workStatus.fromPackages.map((p) => p.id)
					if (fromPackageIds.length) {
						ps.push(
							ExpectedPackages.findOneAsync({
								_id: { $in: fromPackageIds },
							}).then((expPackage) => {
								if (!expPackage)
									throw new Meteor.Error(404, `ExpectedPackages "${fromPackageIds}" not found`)

								const doc: ExpectedPackageWorkStatus = {
									...workStatus,

									_id: change.id,
									studioId: expPackage.studioId,
									deviceId: peripheralDevice._id,

									modified: getCurrentTime(),
								}
								bulkChanges.push({
									replaceOne: {
										filter: {
											_id: change.id,
										},
										replacement: doc,
										upsert: true,
									},
								})
							})
						)
					}
				} else {
					assertNever(change)
				}
			}
		}
		if (removedIds.length) {
			bulkChanges.push({
				deleteMany: {
					filter: {
						_id: { $in: removedIds },
					},
				},
			})
		}
		await Promise.all(ps)
		await ExpectedPackageWorkStatuses.bulkWriteAsync(bulkChanges)
	}

	export async function removeAllExpectedPackageWorkStatusOfDevice(
		context: MethodContext,
		deviceId: PeripheralDeviceId,
		deviceToken: string
	): Promise<void> {
		const peripheralDevice = await checkAccessAndGetPeripheralDevice(deviceId, deviceToken, context)

		await ExpectedPackageWorkStatuses.removeAsync({
			$or: [
				{ deviceId: peripheralDevice._id },
				// Since we only have one PM in a studio, we can remove everything in the studio:
				{ studioId: peripheralDevice.studioId },
			],
		})
	}

	export async function updatePackageContainerPackageStatuses(
		context: MethodContext,
		deviceId: PeripheralDeviceId,
		deviceToken: string,
		changes: (
			| {
					containerId: string
					packageId: string
					type: 'delete'
			  }
			| {
					containerId: string
					packageId: string
					type: 'update'
					status: ExpectedPackageStatusAPI.PackageContainerPackageStatus
			  }
		)[]
	): Promise<void> {
		const peripheralDevice = await checkAccessAndGetPeripheralDevice(deviceId, deviceToken, context)
		if (!peripheralDevice.studioId)
			throw new Meteor.Error(400, 'Device "' + peripheralDevice._id + '" has no studio')

		const studioId = peripheralDevice.studioId

		const removedIds: PackageContainerPackageId[] = []
		const ps: Promise<unknown>[] = []
		for (const change of changes) {
			check(change.containerId, String)
			check(change.packageId, String)

			const id = getPackageContainerPackageId(
				peripheralDevice.studioId,
				change.containerId,
				protectString(change.packageId)
			)

			if (change.type === 'delete') {
				removedIds.push(id)
			} else if (change.type === 'update') {
				ps.push(
					Promise.resolve().then(async () => {
						const updateCount = await PackageContainerPackageStatuses.updateAsync(id, {
							$set: {
								status: change.status,
								modified: getCurrentTime(),
							},
						})
						if (updateCount === 0) {
							// The PackageContainerStatus doesn't exist
							// Create it on the fly:

							await PackageContainerPackageStatuses.upsertAsync(id, {
								$set: literal<PackageContainerPackageStatusDB>({
									_id: id,
									studioId: studioId,
									containerId: change.containerId,
									deviceId: peripheralDevice._id,
									packageId: protectString<ExpectedPackageId>(change.packageId),
									status: change.status,
									modified: getCurrentTime(),
								}),
							})
						}
					})
				)
			} else {
				assertNever(change)
			}
		}
		if (removedIds.length) {
			ps.push(
				PackageContainerPackageStatuses.removeAsync({
					deviceId: peripheralDevice._id,
					_id: { $in: removedIds },
				})
			)
		}
		await Promise.all(ps)
	}
	export async function removeAllPackageContainerPackageStatusesOfDevice(
		context: MethodContext,
		deviceId: PeripheralDeviceId,
		deviceToken: string
	): Promise<void> {
		const peripheralDevice = await checkAccessAndGetPeripheralDevice(deviceId, deviceToken, context)

		await PackageContainerPackageStatuses.removeAsync({
			$or: [
				{ deviceId: peripheralDevice._id },
				// Since we only have one PM in a studio, we can remove everything in the studio:
				{ studioId: peripheralDevice.studioId },
			],
		})
	}

	export async function updatePackageContainerStatuses(
		context: MethodContext,
		deviceId: PeripheralDeviceId,
		deviceToken: string,
		changes: (
			| {
					containerId: string
					type: 'delete'
			  }
			| {
					containerId: string
					type: 'update'
					status: ExpectedPackageStatusAPI.PackageContainerStatus
			  }
		)[]
	): Promise<void> {
		const peripheralDevice = await checkAccessAndGetPeripheralDevice(deviceId, deviceToken, context)
		if (!peripheralDevice.studioId)
			throw new Meteor.Error(400, 'Device "' + peripheralDevice._id + '" has no studio')

		const studioId = peripheralDevice.studioId

		const removedIds: PackageContainerId[] = []
		const ps: Promise<unknown>[] = []
		for (const change of changes) {
			check(change.containerId, String)

			const id = getPackageContainerId(peripheralDevice.studioId, change.containerId)

			if (change.type === 'delete') {
				removedIds.push(id)
			} else if (change.type === 'update') {
				ps.push(
					Promise.resolve().then(async () => {
						const updateCount = await PackageContainerStatuses.updateAsync(id, {
							$set: {
								status: change.status,
								modified: getCurrentTime(),
							},
						})
						if (updateCount === 0) {
							// The PackageContainerStatus doesn't exist
							// Create it on the fly:

							await PackageContainerStatuses.upsertAsync(id, {
								$set: literal<PackageContainerStatusDB>({
									_id: id,
									studioId: studioId,
									containerId: change.containerId,
									deviceId: peripheralDevice._id,
									status: change.status,
									modified: getCurrentTime(),
								}),
							})
						}
					})
				)
			} else {
				assertNever(change)
			}
		}
		if (removedIds.length) {
			ps.push(
				PackageContainerStatuses.removeAsync({
					deviceId: peripheralDevice._id,
					_id: { $in: removedIds },
				})
			)
		}
		await Promise.all(ps)
	}
	export async function removeAllPackageContainerStatusesOfDevice(
		context: MethodContext,
		deviceId: PeripheralDeviceId,
		deviceToken: string
	): Promise<void> {
		const peripheralDevice = await checkAccessAndGetPeripheralDevice(deviceId, deviceToken, context)

		await PackageContainerStatuses.removeAsync({
			$or: [
				{ deviceId: peripheralDevice._id },
				// Since we only have one PM in a studio, we can remove everything in the studio:
				{ studioId: peripheralDevice.studioId },
			],
		})
	}

	export async function fetchPackageInfoMetadata(
		context: MethodContext,
		deviceId: PeripheralDeviceId,
		deviceToken: string,
		type: string,
		packageIds: ExpectedPackageId[]
	): Promise<
		Array<{ packageId: ExpectedPackageId; expectedContentVersionHash: string; actualContentVersionHash: string }>
	> {
		const peripheralDevice = await checkAccessAndGetPeripheralDevice(deviceId, deviceToken, context)
		check(packageIds, [String])
		check(type, String)
		if (!peripheralDevice.studioId)
			throw new Meteor.Error(400, 'Device "' + peripheralDevice._id + '" has no studio')

		const ids = packageIds.map((packageId) => getPackageInfoId(packageId, type))
		const packageInfos = await PackageInfos.findFetchAsync(
			{ _id: { $in: ids } },
			{
				fields: {
					payload: 0,
				},
			}
		)
		return packageInfos.map((packageInfo) => ({
			packageId: packageInfo.packageId,
			expectedContentVersionHash: packageInfo.expectedContentVersionHash,
			actualContentVersionHash: packageInfo.actualContentVersionHash,
		}))
	}
	export async function updatePackageInfo(
		context: MethodContext,
		deviceId: PeripheralDeviceId,
		deviceToken: string,
		type: PackageInfo.Type, // string
		packageId: ExpectedPackageId,
		expectedContentVersionHash: string,
		actualContentVersionHash: string,
		payload: unknown
	): Promise<void> {
		const peripheralDevice = await checkAccessAndGetPeripheralDevice(deviceId, deviceToken, context)
		check(packageId, String)
		check(type, String)
		if (!peripheralDevice.studioId)
			throw new Meteor.Error(400, 'Device "' + peripheralDevice._id + '" has no studio')

		const id = getPackageInfoId(packageId, type)

		const doc: PackageInfoDB = {
			_id: id,

			packageId: packageId,
			expectedContentVersionHash: expectedContentVersionHash,
			actualContentVersionHash: actualContentVersionHash,

			studioId: peripheralDevice.studioId,

			deviceId: peripheralDevice._id,

			type: type,
			payload: payload,
		}
		await PackageInfos.upsertAsync(id, {
			$set: doc,
		})

		onUpdatedPackageInfo(packageId, doc)
	}
	export async function removePackageInfo(
		context: MethodContext,
		deviceId: PeripheralDeviceId,
		deviceToken: string,
		type: string,
		packageId: ExpectedPackageId
	): Promise<void> {
		const peripheralDevice = await checkAccessAndGetPeripheralDevice(deviceId, deviceToken, context)
		check(packageId, String)
		check(type, String)
		if (!peripheralDevice.studioId)
			throw new Meteor.Error(400, 'Device "' + peripheralDevice._id + '" has no studio')

		const id = getPackageInfoId(packageId, type)

		await PackageInfos.removeAsync(id)

		onUpdatedPackageInfo(packageId, null) // ?
	}
}
