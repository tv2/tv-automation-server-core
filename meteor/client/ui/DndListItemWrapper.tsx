import { DragDropItemTypes } from './DragDropItemTypes'
import React, { useRef } from 'react'
import { DragSourceMonitor, DropTargetMonitor, useDrag, useDrop } from 'react-dnd'
import { Identifier } from 'dnd-core'
import { faGripLines } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

interface IDndListItemWrapperProps {
	index: number
	dndType: DragDropItemTypes
	listItem: any
	className: string

	onDropOutside: () => void
	moveHandler: (dragIndex: number, hoverIndex: number) => void
}

interface DraggableItem {
	index: number
	type: DragDropItemTypes
}

export const DndListItemWrapper: React.FunctionComponent<IDndListItemWrapperProps> = (
	props: IDndListItemWrapperProps
) => {
	const ref = useRef<HTMLTableRowElement>(null)
	const index = props.index

	const [{ handlerId }, drop] = useDrop<DraggableItem, void, { handlerId: Identifier | null }>({
		accept: props.dndType,
		collect: (monitor: DropTargetMonitor) => ({ handlerId: monitor.getHandlerId() }),
		hover(draggableItem: DraggableItem) {
			const dragIndex = draggableItem.index
			const hoverIndex = index

			if (dragIndex !== hoverIndex) {
				props.moveHandler(dragIndex, hoverIndex)
				draggableItem.index = hoverIndex
			}
		},
	})

	const [{ isDragging }, drag] = useDrag({
		item: { index, type: props.dndType },
		collect: (monitor: DragSourceMonitor) => ({
			isDragging: monitor.isDragging(),
		}),
		end: (_item, monitor) => {
			if (!monitor.didDrop()) {
				props.onDropOutside()
			}
		},
	})

	const opacity = isDragging ? 0.4 : 1

	drag(drop(ref))

	return (
		<tbody>
			<tr data-handler-id={handlerId} ref={ref} style={{ opacity }}>
				<td className="settings-studio-table-drag expando-background">
					<FontAwesomeIcon icon={faGripLines} />
				</td>
				<td>
					<table className={props.className}>{props.listItem}</table>
				</td>
			</tr>
		</tbody>
	)
}
