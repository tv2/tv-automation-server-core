import cors from 'cors'
import express, { Express, Router } from 'express'
import { BaseController } from './controllers/base-controller'
import { ControllerFacade } from './facades/controller-facade'
import { RundownEventServerFacade } from './facades/rundown-event-server-facade'

export * from './controllers/rundown-controller'

const REST_API_PORT: number = 3005
const RUNDOWN_EVENT_SERVER_PORT: number = 3006

const controllers: BaseController[] = ControllerFacade.getControllers()

class SofieServer {
	public server: Express

	constructor() {
		this.configureServer()
		this.configureRoutes()
	}

	public configureServer(): void {
		this.server = express()
		this.server.use(express.json())
		this.server.use(cors())
	}

	public configureRoutes(): void {
		controllers.map(this.mapControllerToRouter).forEach((router) => this.addRouterToServer(router))
	}

	public mapControllerToRouter(controller: BaseController): Router {
		const router = Router()
		controller.getRoutes().forEach((route) => router[route.method](route.path, route.action.bind(controller)))
		return router
	}

	public addRouterToServer(router: Router): void {
		this.server.use('/api', router)
	}
}

/**
 * Connect our Express instance to the same port as Meteor is running.
 */
// function attachExpressServerToMeteor() {
// 	WebApp.connectHandlers.use(new SofieServer().server)
// }

function startSofieServer(): void {
	attachExpressServerToPort(REST_API_PORT)
	startRundownEventServer()
}

/**
 * Connect to our Express instance without using Meteor
 */
function attachExpressServerToPort(port: number): void {
	new SofieServer().server.listen(port, () => {
		return console.log(`### Express is listening at http://localhost:${port}`)
	})
}

function startRundownEventServer(): void {
	RundownEventServerFacade.createRundownEventServer().startServer(RUNDOWN_EVENT_SERVER_PORT)
}

startSofieServer()
