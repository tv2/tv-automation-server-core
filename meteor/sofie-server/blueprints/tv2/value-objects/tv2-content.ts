// These are taking from Blueprints BaseContent
export interface Tv2Content {
	// TODO: These values are included in Blueprints
	// sourceDuration?: number
	// ignoreMediaObjectStatus?: boolean
	// ignoreBlackFrames?: boolean
	// ignoreFreezeFrame?: boolean
	// ignoreAudioFormat?: boolean
}

export interface Tv2GraphicsContent extends Tv2Content {
	fileName: string
	// TODO: These values are included in Blueprints
	// path: string
	// mediaFlowIds?: string[]
	// thumbnail?: string
	// templateData?: Record<string, any>
}
