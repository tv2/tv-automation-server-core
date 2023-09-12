import { StudioLayer } from '../value-objects/studio-layer'

export interface Studio {
	layers: StudioLayer[]
	blueprintConfiguration: unknown
}
