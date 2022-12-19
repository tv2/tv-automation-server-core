import { DropTargetMonitor, useDrop } from 'react-dnd'
import { ShowStyleDragDropTypes } from './DragDropTypesShowStyle'
import React from 'react'

interface IShowStyleVariantListProps {
	className: string
	children: any
	persistStateVariants: () => void
}

export const ShowStyleVariantList: React.FunctionComponent<IShowStyleVariantListProps> = (
	props: IShowStyleVariantListProps
) => {
	const [, drop] = useDrop({
		accept: ShowStyleDragDropTypes.VARIANT,
		drop: () => props.persistStateVariants(),
		collect: (monitor: DropTargetMonitor) => ({
			isOver: monitor.isOver(),
			canDrop: monitor.canDrop(),
		}),
	})

	return (
		<table ref={drop} className={props.className}>
			{props.children}
		</table>
	)
}
