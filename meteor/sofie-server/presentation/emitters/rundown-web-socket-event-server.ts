import WebSocket, { WebSocketServer } from 'ws'
import express from 'express'
import * as http from 'http'
import { RundownEvent } from '../../model/rundown-event'
import { RundownEventServer } from './interfaces/rundown-event-server'
import { RundownEventListener } from '../../business-logic/services/interfaces/rundown-event-listener'
import { MisconfigurationException } from '../../model/exceptions/misconfiguration-exception'

export class RundownWebSocketEventServer implements RundownEventServer {

	private static instance: RundownEventServer

	static getInstance(rundownEventListener?: RundownEventListener): RundownEventServer {
		if (!this.instance) {
			if (!rundownEventListener) {
				throw new MisconfigurationException(`No RundownEventListener provided. Unable to create instance of ${RundownWebSocketEventServer.name}`)
			}
			this.instance = new RundownWebSocketEventServer(rundownEventListener)
		}
		return this.instance
	}

	private rundownEventListener: RundownEventListener

	private webSocketServer?: WebSocket.Server

	private constructor(rundownEventListener: RundownEventListener) {
		this.rundownEventListener = rundownEventListener
	}

	startServer(port: number): void {
		if (this.webSocketServer) {
			console.log('### Server is already started')
			return
		}
		this.setupWebSocketServer(port)
	}

	private setupWebSocketServer(port: number) {
		if (this.webSocketServer) {
			return
		}

		this.webSocketServer = this.createWebSocketServer(port)

		this.webSocketServer.on('connection', (webSocket: WebSocket) => {
			console.log(`### WebSocket successfully registered to Server`)
			this.addListenerForWebSocket(webSocket)
		})

		this.webSocketServer.on('close', () => {
			console.log('### Server is closed')
			this.webSocketServer = undefined
		})
	}

	private createWebSocketServer(port: number): WebSocketServer {
		const app = express()
		const server = http.createServer(app)
		const webSocketServer = new WebSocketServer({server})

		server.listen(port, () => {
			console.log(`### WebSocketServer started on port: ${port}`)
		})

		return webSocketServer
	}

	private addListenerForWebSocket(webSocket: WebSocket): void {
		this.rundownEventListener.onRundownEvent((rundownEvent: RundownEvent) => {
			webSocket.send(JSON.stringify(rundownEvent))
		})
	}

	killServer(): void {
		if (!this.webSocketServer) {
			console.log('### Server is already dead')
			return
		}
		console.log('### Killing Server')
		this.webSocketServer.close()
	}
}
