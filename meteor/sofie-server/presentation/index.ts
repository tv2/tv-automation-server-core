import express, { Express, Router } from 'express'
import { WebApp } from 'meteor/webapp'
import { BaseController } from './controllers/base-controller'
import { ControllerFacade } from './controllers/controller-facade'

export * from './controllers/rundown-controller'

const controllers: BaseController[] = [
	ControllerFacade.createRundownController()
]

class App {
	public server: Express

	constructor() {
		this.configureServer()
		this.configureRoutes()
	}

	configureServer(): void {
		this.server = express()
		this.server.use(express.json())
	}

	configureRoutes(): void {
		controllers
			.map(this.mapControllerToRouter)
			.forEach(router => this.addRouterToServer(router))
	}

	mapControllerToRouter(controller: BaseController): Router {
		const router = Router()
		controller.getRoutes().forEach((route) => router[route.method](route.path, route.action.bind(controller)))
		return router
	}

	addRouterToServer(router: Router): void {
		this.server.use('/api', router)
	}
}

/**
 * Connect our Express instance to the same port as Meteor is running.
 */
function attachExpressServerToMeteor() {
	WebApp.connectHandlers.use(new App().server)
}

/**
 * Connect to our Express instance without using Meteor
 */
function attachExpressServerToPort(port: number): void {
	new App().server.listen(port, () => {
		return console.log(`Express is listening at http://localhost:${port}`)
	})
}

attachExpressServerToMeteor()
attachExpressServerToPort(3005)
