import { Meteor } from 'meteor/meteor'
import { check, Match } from '../../lib/check'
import { registerClassToMeteorMethods } from '../methods'
import { NewRundownLayoutsAPI, RundownLayoutsAPIMethods } from '../../lib/api/rundownLayouts'
import {
	RundownLayouts,
	RundownLayoutType,
	RundownLayoutBase,
	RundownLayoutId,
	CustomizableRegions,
} from '../../lib/collections/RundownLayouts'
import { literal, getRandomId, protectString } from '../../lib/lib'
import { ServerResponse, IncomingMessage } from 'http'
import { logger } from '../logging'
import { ShowStyleBaseId } from '../../lib/collections/ShowStyleBases'
import { BlueprintId } from '../../lib/collections/Blueprints'
import { MethodContext, MethodContextAPI } from '../../lib/api/methods'
import { UserId } from '../../lib/collections/Users'
import { ShowStyleContentWriteAccess } from '../security/showStyle'
import { PickerPOST, PickerGET } from './http'
import {
	fetchShowStyleBaseLight,
	fetchShowStyleBasesLight,
	ShowStyleBaseLight,
} from '../../lib/collections/optimizations'

export async function createRundownLayout(
	name: string,
	type: RundownLayoutType,
	showStyleBaseId: ShowStyleBaseId,
	regionId: CustomizableRegions,
	blueprintId: BlueprintId | undefined,
	userId?: UserId | undefined
): Promise<RundownLayoutId> {
	const id: RundownLayoutId = getRandomId()
	await RundownLayouts.insertAsync(
		literal<RundownLayoutBase>({
			_id: id,
			name,
			showStyleBaseId,
			blueprintId,
			type,
			userId,
			icon: '',
			iconColor: '#ffffff',
			regionId,
			isDefaultLayout: false,
		})
	)
	return id
}

export async function removeRundownLayout(layoutId: RundownLayoutId): Promise<void> {
	await RundownLayouts.removeAsync(layoutId)
}

PickerPOST.route('/shelfLayouts/upload/:showStyleBaseId', async (params, req: IncomingMessage, res: ServerResponse) => {
	res.setHeader('Content-Type', 'text/plain')

	const showStyleBaseId: ShowStyleBaseId = protectString(params.showStyleBaseId)

	check(showStyleBaseId, String)

	const showStyleBase = await fetchShowStyleBaseLight(showStyleBaseId)

	let content = ''
	try {
		if (!showStyleBase) throw new Meteor.Error(404, `Show Style Base "${showStyleBaseId}" not found`)

		const rundownLayoutBase = validateAndGetRestoredLayoutBody(req)
		await upsertLayout(rundownLayoutBase, showStyleBase)

		res.statusCode = 200
	} catch (e) {
		res.statusCode = 500
		content = e + ''
		logger.error('Shelf Layout restore failed: ' + e)
	}

	res.end(content)
})

/**
 * Uploads the layout to the first Show Style Base that uses the given blueprint id
 */
PickerPOST.route(
	'/shelfLayouts/uploadByShowStyleBlueprintId/:showStyleBlueprintId',
	async (params, req: IncomingMessage, res: ServerResponse) => {
		res.setHeader('Content-Type', 'text/plain')

		const showStyleBlueprintId: BlueprintId = protectString(params.showStyleBlueprintId)

		check(showStyleBlueprintId, String)

		const showStyleBases = await fetchShowStyleBasesLight({ blueprintId: showStyleBlueprintId })

		let content = ''
		try {
			if (!showStyleBases.length)
				throw new Meteor.Error(404, `Show Style Base not found for blueprint "${showStyleBlueprintId}"`)

			const rundownLayoutBase = validateAndGetRestoredLayoutBody(req)
			await upsertLayout(rundownLayoutBase, showStyleBases[0])

			res.statusCode = 200
		} catch (e) {
			res.statusCode = 500
			content = e + ''
			logger.error('Shelf Layout restore failed: ' + e)
		}

		res.end(content)
	}
)

PickerGET.route('/shelfLayouts/download/:id', async (params, _req: IncomingMessage, res: ServerResponse) => {
	const layoutId: RundownLayoutId = protectString(params.id)

	check(layoutId, String)

	let content = ''
	const layout = await RundownLayouts.findOneAsync(layoutId)
	if (!layout) {
		res.statusCode = 404
		content = 'Shelf Layout not found'
		res.end(content)
		return
	}

	try {
		content = JSON.stringify(layout, undefined, 2)
		res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(layout.name)}.json`)
		res.setHeader('Content-Type', 'application/json')
		res.statusCode = 200
	} catch (e) {
		res.statusCode = 500
		content = e + ''
		logger.error('Shelf layout restore failed: ' + e)
	}

	res.end(content)
})

function validateAndGetRestoredLayoutBody(req: IncomingMessage): RundownLayoutBase {
	if (!req.body) throw new Meteor.Error(400, 'Restore Shelf Layout: Missing request body')

	if (typeof req.body !== 'object') throw new Meteor.Error(400, 'Restore Shelf Layout: Invalid request body')

	const layout: Partial<RundownLayoutBase> = req.body

	check(layout._id, Match.Optional(String))
	check(layout.name, String)
	check(layout.type, String)

	return layout as RundownLayoutBase
}

async function upsertLayout(layout: RundownLayoutBase, showStyleBase: ShowStyleBaseLight) {
	layout.showStyleBaseId = showStyleBase._id

	await RundownLayouts.upsertAsync(layout._id, layout)
}

/** Add RundownLayout into showStyleBase */
async function apiCreateRundownLayout(
	context: MethodContext,
	name: string,
	type: RundownLayoutType,
	showStyleBaseId: ShowStyleBaseId,
	regionId: CustomizableRegions
) {
	check(name, String)
	check(type, String)
	check(showStyleBaseId, String)
	check(regionId, String)

	const access = await ShowStyleContentWriteAccess.anyContent(context, showStyleBaseId)

	return createRundownLayout(name, type, showStyleBaseId, regionId, undefined, access.userId || undefined)
}
async function apiRemoveRundownLayout(context: MethodContext, id: RundownLayoutId) {
	check(id, String)

	const access = await ShowStyleContentWriteAccess.rundownLayout(context, id)
	const rundownLayout = access.rundownLayout
	if (!rundownLayout) throw new Meteor.Error(404, `RundownLayout "${id}" not found`)

	await removeRundownLayout(id)
}

class ServerRundownLayoutsAPI extends MethodContextAPI implements NewRundownLayoutsAPI {
	async createRundownLayout(
		name: string,
		type: RundownLayoutType,
		showStyleBaseId: ShowStyleBaseId,
		regionId: CustomizableRegions
	) {
		return apiCreateRundownLayout(this, name, type, showStyleBaseId, regionId)
	}
	async removeRundownLayout(rundownLayoutId: RundownLayoutId) {
		return apiRemoveRundownLayout(this, rundownLayoutId)
	}
}
registerClassToMeteorMethods(RundownLayoutsAPIMethods, ServerRundownLayoutsAPI, false)
