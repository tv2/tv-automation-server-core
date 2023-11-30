import {
	RundownLayoutElementAny,
	RundownLayoutElementBase,
	RundownLayoutElementType,
} from '../../../../lib/collections/RundownLayouts'
import { double as phrase } from 'paraphrase'
import { ShowStyleBase } from '../../../../lib/collections/ShowStyleBases'
import { Studio } from '../../../../lib/collections/Studios'

export interface InterpolatedPropsSource {
	studio: Studio
	showStyleBase: ShowStyleBase
}

const RUNDOWN_LAYOUT_ELEMENT_INTERPOLABLE_PROPS: {
	[key in RundownLayoutElementType]?: (keyof Extract<RundownLayoutElementAny, { type: key }>)[]
} = {
	[RundownLayoutElementType.FILTER]: ['name'],
	[RundownLayoutElementType.TEXT_LABEL]: ['name', 'text'],
	[RundownLayoutElementType.EXTERNAL_FRAME]: ['name', 'url'],
	[RundownLayoutElementType.NEXT_INFO]: ['name'],
}

export function interpolatePanelStrings<T extends RundownLayoutElementBase>(
	panel: T,
	source: InterpolatedPropsSource
): T {
	const interpolableProps = RUNDOWN_LAYOUT_ELEMENT_INTERPOLABLE_PROPS[panel.type ?? RundownLayoutElementType.FILTER]
	if (!interpolableProps) {
		return panel
	}

	const interpolatedPanel: Partial<T> = {}
	for (const prop of interpolableProps) {
		if (typeof panel[prop] === 'string') {
			interpolatedPanel[prop] = phrase(panel[prop], source)
		}
	}
	return {
		...panel,
		...interpolatedPanel,
	}
}
