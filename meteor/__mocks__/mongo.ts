import * as _ from 'underscore'
import { literal, ProtectedString, unprotectString, protectString, sleep } from '../lib/lib'
import { RandomMock } from './random'
import { FindOptions, FindOneOptions } from '../lib/typings/meteor'
import { MeteorMock } from './meteor'
import { Random } from 'meteor/random'
import { Meteor } from 'meteor/meteor'
import type { AnyBulkWriteOperation } from 'mongodb'
import {
	AsyncMongoCollection,
	ObserveCallbacks,
	ObserveChangesCallbacks,
	UpdateOptions,
	UpsertOptions,
} from '../lib/collections/lib'
import { mongoWhere, mongoFindOptions, mongoModify } from '@sofie-automation/corelib/dist/mongo'
const clone = require('fast-clone')

export namespace MongoMock {
	interface ObserverEntry<T extends CollectionObject> {
		id: string
		query: any
		callbacksChanges?: ObserveChangesCallbacks<T>
		callbacksObserve?: ObserveCallbacks<T>
	}

	export interface MockCollections<T extends CollectionObject> {
		[collectionName: string]: MockCollection<T>
	}
	export interface MockCollection<T extends CollectionObject> {
		[id: string]: T
	}
	interface CollectionObject {
		_id: ProtectedString<any>
	}

	const mockCollections: MockCollections<any> = {}
	export type MongoCollection = {}
	export class Collection<T extends CollectionObject> implements MongoCollection {
		public _name: string
		private _options: any = {}
		// @ts-expect-error used in test to check that it's a mock
		private _isMock = true as const
		private observers: ObserverEntry<T>[] = []

		public asyncBulkWriteDelay = 100

		constructor(name: string, options?: any) {
			this._options = options || {}
			this._name = name

			if (this._options.transform) throw new Error('document transform is no longer supported')
		}

		find(query: any, options?: FindOptions<T>) {
			if (_.isString(query)) query = { _id: query }
			query = query || {}

			const unimplementedUsedOptions = _.without(_.keys(options), 'sort', 'limit', 'fields')
			if (unimplementedUsedOptions.length > 0) {
				throw new Error(`find being performed using unimplemented options: ${unimplementedUsedOptions}`)
			}

			const docsArray = Object.values(this.documents)
			let docs: T[] = _.compact(
				query._id && typeof query._id === 'string'
					? [this.documents[query._id]]
					: docsArray.filter((doc) => mongoWhere(doc, query))
			)

			docs = mongoFindOptions(docs, options)

			const observers = this.observers

			const removeObserver = (id: string): void => {
				const index = observers.findIndex((o) => o.id === id)
				if (index === -1) throw new Meteor.Error(500, 'Cannot stop observer that is not registered')
				observers.splice(index, 1)
			}

			return {
				_fetchRaw: () => {
					return docs
				},
				fetch: () => {
					return clone(docs)
				},
				count: () => {
					return docs.length
				},
				observe(clbs: ObserveCallbacks<T>) {
					const id = Random.id(5)
					observers.push(
						literal<ObserverEntry<T>>({
							id: id,
							callbacksObserve: clbs,
							query: query,
						})
					)
					return {
						stop() {
							removeObserver(id)
						},
					}
				},
				observeChanges(clbs: ObserveChangesCallbacks<T>) {
					// todo - finish implementing uses of callbacks
					const id = Random.id(5)
					observers.push(
						literal<ObserverEntry<T>>({
							id: id,
							callbacksChanges: clbs,
							query: query,
						})
					)
					return {
						stop() {
							removeObserver(id)
						},
					}
				},
				forEach(f) {
					docs.forEach(f)
				},
				map(f) {
					return docs.map(f)
				},
			}
		}
		findOne(query, options?: FindOneOptions<T>) {
			return this.find(query, options).fetch()[0]
		}
		update(query: any, modifier, options?: UpdateOptions): number {
			const unimplementedUsedOptions = _.without(_.keys(options), 'multi')
			if (unimplementedUsedOptions.length > 0) {
				throw new Error(`update being performed using unimplemented options: ${unimplementedUsedOptions}`)
			}

			// todo
			let docs = this.find(query)._fetchRaw()

			// By default mongo only updates one doc, unless told multi
			if (this.documents.length && !options?.multi) {
				docs = [docs[0]]
			}

			_.each(docs, (doc) => {
				const modifiedDoc = mongoModify(query, doc, modifier)
				this.documents[unprotectString(doc._id)] = modifiedDoc

				Meteor.defer(() => {
					_.each(_.clone(this.observers), (obs) => {
						if (mongoWhere(doc, obs.query)) {
							if (obs.callbacksChanges?.changed) {
								obs.callbacksChanges.changed(doc._id, {}) // TODO - figure out what changed
							}
							if (obs.callbacksObserve?.changed) {
								obs.callbacksObserve.changed(modifiedDoc, doc)
							}
						}
					})
				})
			})

			return docs.length
		}
		insert(doc: T): T['_id'] {
			const d = _.clone(doc)
			if (!d._id) d._id = protectString(RandomMock.id())

			if (this.documents[unprotectString(d._id)]) {
				throw new MeteorMock.Error(500, `Duplicate key '${d._id}'`)
			}

			this.documents[unprotectString(d._id)] = d

			Meteor.defer(() => {
				_.each(_.clone(this.observers), (obs) => {
					if (mongoWhere(d, obs.query)) {
						const fields = _.keys(_.omit(d, '_id'))
						if (obs.callbacksChanges?.addedBefore) {
							obs.callbacksChanges.addedBefore(d._id, fields, null as any)
						}
						if (obs.callbacksChanges?.added) {
							obs.callbacksChanges.added(d._id, fields)
						}
						if (obs.callbacksObserve?.added) {
							obs.callbacksObserve.added(d)
						}
					}
				})
			})

			return d._id
		}
		upsert(
			query: any,
			modifier,
			options?: UpsertOptions
		): { numberAffected: number | undefined; insertedId: T['_id'] | undefined } {
			const id = _.isString(query) ? query : query._id

			const docs = this.find(id)._fetchRaw()

			if (docs.length) {
				const count = this.update(docs[0]._id, modifier, options)
				return { insertedId: undefined, numberAffected: count }
			} else {
				const doc = mongoModify<T>(query, { _id: id } as any, modifier)
				const insertedId = this.insert(doc)
				return { insertedId: insertedId, numberAffected: undefined }
			}
		}
		remove(query: any): number {
			const docs = this.find(query)._fetchRaw()

			_.each(docs, (doc) => {
				delete this.documents[unprotectString(doc._id)]

				Meteor.defer(() => {
					_.each(_.clone(this.observers), (obs) => {
						if (mongoWhere(doc, obs.query)) {
							if (obs.callbacksChanges?.removed) {
								obs.callbacksChanges.removed(doc._id)
							}
							if (obs.callbacksObserve?.removed) {
								obs.callbacksObserve.removed(doc)
							}
						}
					})
				})
			})
			return docs.length
		}

		_ensureIndex(_obj: any) {
			// todo
		}
		allow() {
			// todo
		}
		rawCollection() {
			return {
				bulkWrite: async (updates: AnyBulkWriteOperation<any>[], _options) => {
					await sleep(this.asyncBulkWriteDelay)

					for (const update of updates) {
						if ('insertOne' in update) {
							this.insert(update.insertOne.document)
						} else if ('updateOne' in update) {
							if (update.updateOne.upsert) {
								this.upsert(update.updateOne.filter, update.updateOne.update, { multi: false })
							} else {
								this.update(update.updateOne.filter, update.updateOne.update, { multi: false })
							}
						} else if ('updateMany' in update) {
							if (update.updateMany.upsert) {
								this.upsert(update.updateMany.filter, update.updateMany.update, { multi: true })
							} else {
								this.update(update.updateMany.filter, update.updateMany.update, { multi: true })
							}
						} else if ('deleteOne' in update) {
							const docs = this.find(update.deleteOne.filter).fetch()
							if (docs.length) {
								this.remove(docs[0]._id)
							}
						} else if ('deleteMany' in update) {
							this.remove(update.deleteMany.filter)
						} else if (update['replaceOne']) {
							this.upsert(update.replaceOne.filter, update.replaceOne.replacement)
						}
					}
				},
				collectionName: this._name,
			}
		}
		private get documents(): MockCollection<T> {
			if (!mockCollections[this._name]) mockCollections[this._name] = {}
			return mockCollections[this._name]
		}
	}
	// Mock functions:
	export function mockSetData<T extends CollectionObject>(
		collection: AsyncMongoCollection<T>,
		data: MockCollection<T> | Array<T> | null
	) {
		const collectionName = collection.name
		if (collectionName === null) {
			throw new Meteor.Error(500, 'mockSetData can only be done for named collections')
		}

		data = data || {}
		if (_.isArray(data)) {
			const collectionData = {}
			_.each(data, (doc) => {
				if (!doc._id) throw Error(`mockSetData: "${collectionName}": doc._id missing`)
				collectionData[unprotectString(doc._id)] = doc
			})
			mockCollections[collectionName] = collectionData
		} else {
			mockCollections[collectionName] = data
		}
	}

	export function deleteAllData() {
		Object.keys(mockCollections).forEach((id) => {
			mockCollections[id] = {}
		})
	}

	/**
	 * The Mock Collection type does a sleep before starting on executing the bulkWrite.
	 * This simulates the async nature of writes to mongo, and aims to detect race conditions in our code.
	 * This method will change the duration of the sleep, and returns the old delay value
	 */
	export function setCollectionAsyncBulkWriteDelay(collection: AsyncMongoCollection<any>, delay: number): number {
		const collection2 = collection as any
		if (typeof collection2.asyncWriteDelay !== 'number') {
			throw new Error(
				"asyncWriteDelay must be defined already, or this won't do anything. Perhaps some refactoring?"
			)
		}
		const oldDelay = collection2.asyncWriteDelay
		collection2.asyncWriteDelay = delay
		return oldDelay
	}
}
export function setup() {
	return {
		Mongo: MongoMock,
	}
}

MeteorMock.mockSetUsersCollection(new MongoMock.Collection('Meteor.users'))
