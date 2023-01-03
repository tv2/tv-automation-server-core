import { DragDropItemTypes } from './DragDropItemTypes'
import React, { useRef } from 'react'
import { DragSourceMonitor, DropTargetMonitor, useDrag, useDrop, XYCoord } from 'react-dnd'
import { Identifier } from 'dnd-core'
import { faGripLines } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

interface IDndItemWrapperProps {
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

export const DndListItemWrapper: React.FunctionComponent<IDndItemWrapperProps> = (props: IDndItemWrapperProps) => {
	const ref = useRef<HTMLTableRowElement>(null)
	const index = props.index

	const [{ handlerId }, drop] = useDrop<DraggableItem, void, { handlerId: Identifier | null }>({
		accept: props.dndType,
		collect: (monitor: DropTargetMonitor) => ({ handlerId: monitor.getHandlerId() }),
		hover(variant: DraggableItem, monitor: DropTargetMonitor) {
			if (!ref.current) {
				return
			}
			const dragIndex = variant.index
			const hoverIndex = index

			if (dragIndex === hoverIndex) {
				return
			}

			const hoverBoundingRect = ref.current?.getBoundingClientRect()
			const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2
			const clientOffset = monitor.getClientOffset()
			const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top

			if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
				return
			}

			if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
				return
			}

			props.moveHandler(dragIndex, hoverIndex)
			variant.index = hoverIndex
		},
	})

	const [{ isDragging }, drag] = useDrag({
		item: { index, type: DragDropItemTypes.VARIANT },
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
