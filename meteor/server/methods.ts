import { Meteor } from 'meteor/meteor'
import * as _ from 'underscore'
import { logger } from './logging'
import { extractFunctionSignature } from './lib'
import { MethodContext, MethodContextAPI } from '../lib/api/methods'
import { isPromise, stringifyError } from '../lib/lib'

type MeteorMethod = (this: MethodContext, ...args: any[]) => any

interface Methods {
	[method: string]: MeteorMethod
}
export interface MethodsInner {
	[method: string]: { wrapped: MeteorMethod; original: MeteorMethod }
}
/** All (non-secret) methods */
export const MeteorMethodSignatures: { [key: string]: string[] } = {}
/** All methods */
export const AllMeteorMethods: string[] = []

export interface RunningMethods {
	[methodId: string]: {
		method: string
		startTime: number
		i: number
	}
}
let runningMethods: RunningMethods = {}
let runningMethodsId: number = 0

function getAllClassMethods(myClass: any): string[] {
	const objectProtProps = Object.getOwnPropertyNames(Object.prototype)
	const classProps = Object.getOwnPropertyNames(myClass.prototype)

	return classProps
		.filter((name) => objectProtProps.indexOf(name) < 0)
		.filter((name) => typeof myClass.prototype[name] === 'function')
}

/** This expects an array of values (likely the output of Parameters<T>), and makes anything optional be nullable instead */
export type ReplaceOptionalWithNullInArray<T extends any[]> = {
	[K in keyof T]: undefined extends T[K] ? NonNullable<T[K]> | null : T[K]
}

/**
 * This expects an interface of functions, and makes any optional parameters to the functions be nullable instead
 * Using this is necessary for any methods exposed to DDP, as undefined values there are encoded as null
 */
export type ReplaceOptionalWithNullInMethodArguments<T> = {
	[K in keyof T]: T[K] extends (...args: infer P) => infer R
		? (...args: ReplaceOptionalWithNullInArray<P>) => R
		: T[K]
}

export function registerClassToMeteorMethods(
	// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
	methodEnum: any,
	orgClass: typeof MethodContextAPI,
	secret?: boolean,
	wrapper?: (methodContext: MethodContext, methodName: string, args: any[], fcn: Function) => any
): void {
	const methods: MethodsInner = {}
	_.each(getAllClassMethods(orgClass), (classMethodName) => {
		const enumValue = methodEnum[classMethodName]
		if (!enumValue)
			throw new Meteor.Error(
				500,
				`registerClassToMeteorMethods: The method "${classMethodName}" is not set in the enum containing methods.`
			)
		if (wrapper) {
			methods[enumValue] = {
				wrapped: function (...args: any[]) {
					return wrapper(this, enumValue, args, orgClass.prototype[classMethodName])
				},
				original: orgClass.prototype[classMethodName],
			}
		} else {
			methods[enumValue] = {
				wrapped: orgClass.prototype[classMethodName],
				original: orgClass.prototype[classMethodName],
			}
		}
	})
	setMeteorMethods(methods, secret)
}
/**
 * Wrapper for Meteor.methods(), keeps track of which methods are currently running
 * @param orgMethods The methods to add
 * @param secret Set to true to not expose methods to API
 */
function setMeteorMethods(orgMethods: MethodsInner, secret?: boolean): void {
	// Wrap methods
	const methods: Methods = {}
	_.each(orgMethods, (m, methodName: string) => {
		const method = m.wrapped
		if (method) {
			methods[methodName] = function (...args: any[]) {
				const i = runningMethodsId++
				const methodId = 'm' + i

				runningMethods[methodId] = {
					method: methodName,
					startTime: Date.now(),
					i: i,
				}
				try {
					logger.info(`################## Running MeteorMethod: ${methodName}`)
					const result = method.apply(this, args)

					if (isPromise(result)) {
						// The method result is a promise
						return Promise.resolve(result)
							.finally(() => {
								const runningMethod = runningMethods[methodId]
								const executionTime = Date.now() - runningMethod.startTime
								logger.info(`################## MeteorMethod ${methodName} took ${executionTime} ms to execute`)
								delete runningMethods[methodId]
							})
							.catch(async (e) => {
								if (!_suppressExtraErrorLogging) {
									logger.error(e.message || e.reason || (e.toString ? e.toString() : null) || e)
								}
								logger.info(`################## MeteorMethod ${methodName} failed to execute`)
								return Promise.reject(e)
							})
					} else {
						const runningMethod = runningMethods[methodId]
						const executionTime = Date.now() - runningMethod.startTime
						logger.info(`################## Non promised based MeteorMethod ${methodName} took ${executionTime} ms to execute`)
						delete runningMethods[methodId]
						return result
					}
				} catch (err) {
					if (!_suppressExtraErrorLogging) {
						logger.error(stringifyError(err))
					}
					delete runningMethods[methodId]
					throw err
				}
			}
			if (!secret) {
				const signature = extractFunctionSignature(m.original)
				if (signature) MeteorMethodSignatures[methodName] = signature
			}
			AllMeteorMethods.push(methodName)
		}
	})
	// @ts-expect-error: incompatible due to userId
	Meteor.methods(methods)
}
export function getRunningMethods(): RunningMethods {
	return runningMethods
}
export function resetRunningMethods(): void {
	runningMethods = {}
}
let _suppressExtraErrorLogging: boolean = false
export function suppressExtraErrorLogging(value: boolean): void {
	_suppressExtraErrorLogging = value
}
