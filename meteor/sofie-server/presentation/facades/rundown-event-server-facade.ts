import { RundownEventServer } from '../emitters/interfaces/rundown-event-server'
import { RundownWebSocketEventServer } from '../emitters/rundown-web-socket-event-server'
import { EventEmitterFacade } from '../../business-logic/facades/event-emitter-facade'

export class RundownEventServerFacade {
	public static createRundownEventServer(): RundownEventServer {
		return RundownWebSocketEventServer.getInstance(EventEmitterFacade.createRundownEventListener())
	}
}
