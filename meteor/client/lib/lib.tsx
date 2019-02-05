import * as _ from 'underscore'
import * as React from 'react'

export function multilineText (txt: string) {
	return _.map((txt + '').split('\n'), (line: string) => {
		return <p>{line}</p>
	})
}
