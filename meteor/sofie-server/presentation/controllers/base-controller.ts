import 'reflect-metadata'

type MethodDecorator = (target: object, methodName: string) => void
type Constructor = { prototype: object }
type RouteDecorator = (constructor: Constructor) => void
type Action = (...args: unknown[]) => void

enum ControllerMetadata {
	METHODS = 'routable-methods',
	PATHS = 'routable-paths',
	BASE_PATH = 'routable-base-path',
}

enum Method {
	GET = 'get',
	POST = 'post',
	PUT = 'put',
	DELETE = 'delete',
}

interface Route {
	path: string
	method: Method
	action: Action
}

export abstract class BaseController {
	public getRoutes(): Route[] {
		const methods = getMethods(this)
		const paths = getPaths(this)
		return [...methods.keys()].map((methodName: string) => ({
			path: this.getFullPath(paths.get(methodName) ?? ''),
			method: methods.get(methodName) ?? Method.GET,
			action: this.getAction(methodName as keyof this),
		}))
	}

	private getFullPath(path: string): string {
		const basePath = getBasePath(this)
		return `/${basePath}/${path}`.replace(/\/+/g, '/').replace(/(?<!^)\/$/g, '')
	}

	private getAction(methodName: keyof this): Action {
		return this[methodName] as unknown as Action
	}
}

export function RestController(path: string): RouteDecorator {
	return (constructor: Constructor) => setBasePath(constructor.prototype, path)
}

function getBasePath(target: object): string {
	return Reflect.getMetadata(ControllerMetadata.BASE_PATH, target) ?? ''
}
function setBasePath(target: object, path: string): void {
	Reflect.defineMetadata(ControllerMetadata.BASE_PATH, path, target)
}

export function GetRequest(path?: string): MethodDecorator {
	return (target: object, methodName: string) => setRoute(target, methodName, Method.GET, path)
}

export function PostRequest(path?: string): MethodDecorator {
	return (target: object, methodName: string) => setRoute(target, methodName, Method.POST, path)
}

export function PutRequest(path?: string): MethodDecorator {
	return (target: object, methodName: string) => setRoute(target, methodName, Method.PUT, path)
}

export function DeleteRequest(path?: string): MethodDecorator {
	return (target: object, methodName: string) => setRoute(target, methodName, Method.DELETE, path)
}

function setRoute(target: object, methodName: string, method: Method, path?: string): void {
	if (path) {
		setPath(target, methodName, path)
	}
	setMethod(target, methodName, method)
}

function setPath(target: object, methodName: string, path: string): void {
	const paths = getPaths(target)
	paths.set(methodName, path)
	setPaths(target, paths)
}

function getPaths(target: object): Map<string, string> {
	return Reflect.getMetadata(ControllerMetadata.PATHS, target) ?? new Map()
}

function setPaths(target: object, paths: Map<string, string>): void {
	Reflect.defineMetadata(ControllerMetadata.PATHS, paths, target)
}

function setMethod(target: object, methodName: string, method: Method): void {
	const methods = getMethods(target)
	methods.set(methodName, method)
	setMethods(target, methods)
}

function getMethods(target: object): Map<string, Method> {
	return Reflect.getMetadata(ControllerMetadata.METHODS, target) ?? new Map()
}

function setMethods(target: object, methods: Map<string, Method>): void {
	Reflect.defineMetadata(ControllerMetadata.METHODS, methods, target)
}
