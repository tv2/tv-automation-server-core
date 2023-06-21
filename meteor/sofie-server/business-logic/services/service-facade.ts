import { RundownService } from './rundown-service-interface'
import { SofieCoreMeteorRundownService } from './sofie-core-meteor-rundown-service'

export class ServiceFacade {
	static createRundownService(): RundownService {
		return new SofieCoreMeteorRundownService()
	}
}
