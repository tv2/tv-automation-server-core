import { readAllMessages, writeMessage } from '../../../api/serviceMessages/serviceMessagesApi'
import * as CoreSystem from '../../../../lib/collections/CoreSystem'
import { protectString } from '../../../../lib/lib'

function convertExternalToServiceMessage(message: CoreSystem.ExternalServiceMessage): CoreSystem.ServiceMessage {
	return {
		...message,
		timestamp: new Date(message.timestamp).getTime(),
	}
}

jest.mock('../../../../lib/collections/CoreSystem')

const message1: CoreSystem.ExternalServiceMessage = {
	id: '294a7079efdce49fb553e52d9e352e24',
	criticality: CoreSystem.Criticality.CRITICAL,
	message: 'Something is wrong that should have been right',
	sender: 'ola',
	timestamp: new Date(),
}

const message2: CoreSystem.ExternalServiceMessage = {
	id: '4d6fb1e005ac3364784acc7194e329c2',
	criticality: CoreSystem.Criticality.WARNING,
	message: 'Something is rotten in the state of Denmark',
	sender: 'ola',
	timestamp: new Date(),
}

const fakeCoreSystem: CoreSystem.ICoreSystem = {
	_id: protectString('core'),
	created: 1,
	modified: 2,
	version: '3',
	previousVersion: null,
	serviceMessages: {},
	storePath: '/dev/null',
}

describe('Service messages internal API', () => {
	// const mockedGetCoreSystem: jest.Mock<typeof CoreSystem.getCoreSystem> = CoreSystem.getCoreSystem as any

	describe('readAllMessages', () => {
		it('should throw when core system object cant be accessed', async () => {
			const spy = jest.spyOn(CoreSystem, 'getCoreSystemAsync').mockImplementation(async () => undefined)

			await expect(readAllMessages()).rejects.toThrow()

			spy.mockRestore()
		})

		it('should throw when core system object doesnt have a serviceMessages field', async () => {
			const spy = jest.spyOn(CoreSystem, 'getCoreSystemAsync').mockImplementation(async () => {
				const brokenCore = { ...fakeCoreSystem }
				// @ts-expect-error
				delete brokenCore.serviceMessages
				return brokenCore
			})

			await expect(readAllMessages()).rejects.toThrow()

			spy.mockRestore()
		})

		it('should return an empty array when there are no service messages', async () => {
			const cs = { ...fakeCoreSystem }
			cs.serviceMessages = {}
			const spy = jest.spyOn(CoreSystem, 'getCoreSystemAsync').mockImplementation(async () => cs)

			const actual = await readAllMessages()

			expect(actual).toEqual([])

			spy.mockRestore()
		})

		it('should return all service messages as an array', async () => {
			const cs = { ...fakeCoreSystem }
			cs.serviceMessages[message1.id] = convertExternalToServiceMessage(message1)
			cs.serviceMessages[message2.id] = convertExternalToServiceMessage(message2)
			const spy = jest.spyOn(CoreSystem, 'getCoreSystemAsync').mockImplementation(async () => cs)

			const actual = await readAllMessages()

			expect(actual).toContainEqual(convertExternalToServiceMessage(message1))
			expect(actual).toContainEqual(convertExternalToServiceMessage(message2))
			spy.mockRestore()
		})
	})

	describe('writeMessage', () => {
		it('should throw when core system object cant be accessed', async () => {
			const spy = jest.spyOn(CoreSystem, 'getCoreSystemAsync').mockImplementation(async () => undefined)

			await expect(writeMessage({} as any)).rejects.toThrow()

			spy.mockRestore()
		})

		it('should throw when core system object doesnt have a serviceMessages field', async () => {
			const spy = jest.spyOn(CoreSystem, 'getCoreSystemAsync').mockImplementation(async () => {
				const brokenCore = { ...fakeCoreSystem }
				// @ts-expect-error
				delete brokenCore.serviceMessages
				return brokenCore
			})

			await expect(writeMessage({} as any)).rejects.toThrow()

			spy.mockRestore()
		})

		it('should set isUpdate flag true when message with given id exists in system already', async () => {
			const cs = Object.assign({}, fakeCoreSystem, {
				serviceMessages: {},
			})
			cs.serviceMessages[message1.id] = convertExternalToServiceMessage(message1)
			const spy = jest.spyOn(CoreSystem, 'getCoreSystemAsync').mockImplementation(async () => cs)

			const actual = await writeMessage(convertExternalToServiceMessage(message1))

			expect(actual).toHaveProperty('isUpdate', true)
			spy.mockRestore()
		})

		it('should set isUpdate flag false when message does not already exist in system', async () => {
			const cs = Object.assign({}, fakeCoreSystem, {
				serviceMessages: {},
			})
			cs.serviceMessages[message1.id] = convertExternalToServiceMessage(message1)
			const spy = jest.spyOn(CoreSystem, 'getCoreSystemAsync').mockImplementation(async () => cs)
			const actual = await writeMessage(convertExternalToServiceMessage(message2))

			expect(actual).toHaveProperty('isUpdate', false)
			spy.mockRestore()
		})

		it('should write message to CoreSystem.serviceMessages', async () => {
			const expected = {}
			expected[message2.id] = convertExternalToServiceMessage(message2)
			const cs = Object.assign({}, fakeCoreSystem, {
				serviceMessages: {},
			})
			const spyGetCoreSystem = jest.spyOn(CoreSystem, 'getCoreSystemAsync').mockImplementation(async () => cs)

			await writeMessage(convertExternalToServiceMessage(message2))

			expect(CoreSystem.CoreSystem.updateAsync).toHaveBeenCalledWith(cs._id, {
				$set: {
					serviceMessages: expected,
				},
			})
			spyGetCoreSystem.mockRestore()
		})

		it('should leave existing messages untouched', async () => {
			const expected = {}
			expected[message1.id] = convertExternalToServiceMessage(message1)
			expected[message2.id] = convertExternalToServiceMessage(message2)
			const cs = Object.assign({}, fakeCoreSystem, {
				serviceMessages: {},
			})
			cs.serviceMessages[message1.id] = convertExternalToServiceMessage(message1)
			const spy = jest.spyOn(CoreSystem, 'getCoreSystemAsync').mockImplementation(async () => cs)
			await writeMessage(convertExternalToServiceMessage(message2))

			expect(CoreSystem.CoreSystem.updateAsync).toHaveBeenCalledWith(cs._id, {
				$set: {
					serviceMessages: expected,
				},
			})
			spy.mockRestore()
		})

		it('should throw when message cant be written', async () => {
			const spyUpdate = jest.spyOn(CoreSystem.CoreSystem, 'updateAsync').mockImplementation(() => {
				throw new Error('lol')
			})
			const cs = Object.assign({}, fakeCoreSystem, {
				serviceMessages: {},
			})
			const spyGetCoreSystem = jest.spyOn(CoreSystem, 'getCoreSystemAsync').mockImplementation(async () => cs)

			await expect(writeMessage(convertExternalToServiceMessage(message2))).rejects.toThrow()

			spyGetCoreSystem.mockRestore()
			spyUpdate.mockRestore()
		})
	})
})
