import { DragDropItemType } from './DragDropItemType'
import React, { useRef } from 'react'
import { DragSourceMonitor, DropTargetMonitor, useDrag, useDrop } from 'react-dnd'
import { Identifier } from 'dnd-core'
import { faGripLines } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

interface DragDropListItemWrapperProps {
	index: number
	dragDropType: DragDropItemType
	listItem: any
	tableClassName: string

	onDropOutside: () => void
	moveHandler: (dragIndex: number, hoverIndex: number) => void
}

interface DraggableItem {
	index: number
	type: DragDropItemType
}

export const DragDropListItemWrapper: React.FunctionComponent<DragDropListItemWrapperProps> = (
	props: DragDropListItemWrapperProps
) => {
	const ref = useRef<HTMLTableRowElement>(null)
	const index = props.index

	const [{ handlerId }, drop] = useDrop<DraggableItem, void, { handlerId: Identifier | null }>({
		accept: props.dragDropType,
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

	const [, drag] = useDrag({
		item: { index, type: props.dragDropType },
		collect: (monitor: DragSourceMonitor) => ({
			isDragging: monitor.isDragging(),
		}),
		end: (_item, monitor) => {
			if (!monitor.didDrop()) {
				props.onDropOutside()
			}
		},
	})

	drag(drop(ref))

	return (
		<tbody>
			<tr data-handler-id={handlerId} ref={ref}>
				<td className="settings-studio-table-drag expando-background">
					<FontAwesomeIcon icon={faGripLines} />
				</td>
				<td>
					<table className={props.tableClassName}>{props.listItem}</table>
				</td>
			</tr>
		</tbody>
	)
}
