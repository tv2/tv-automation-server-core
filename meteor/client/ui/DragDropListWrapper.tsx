import { DropTargetMonitor, useDrop } from 'react-dnd'
import { DragDropItemType } from './DragDropItemType'
import React, { useEffect, useState } from 'react'
import update from 'immutability-helper'
import { DragDropListItemWrapper } from './DragDropListItemWrapper'

interface DragDropListWrapperProps {
	tableClassName: string
	dragDropType: DragDropItemType
	list: any[]

	onDrop: (newArray: any[]) => void
	renderItem: (item: any, index: number) => JSX.Element
}

export const DragDropListWrapper: React.FunctionComponent<DragDropListWrapperProps> = (
	props: DragDropListWrapperProps
) => {
	const [uiArray, setUiArray] = useState(props.list)

	const [, drop] = useDrop({
		accept: props.dragDropType,
		drop: () => props.onDrop(uiArray),
		collect: (monitor: DropTargetMonitor) => ({
			isOver: monitor.isOver(),
			canDrop: monitor.canDrop(),
		}),
	})

	function moveHandler(dragIndex: number, hoverIndex: number): void {
		const prevState = uiArray
		setUiArray(
			update(prevState, {
				$splice: [
					[dragIndex, 1],
					[hoverIndex, 0, prevState[dragIndex]],
				],
			})
		)
	}

	useEffect(() => {
		if (uiArray.length === 0 || uiArray !== props.list) {
			setUiArray(props.list)
		}
	}, [props.list])

	return (
		<table ref={drop}>
			{uiArray.map((child: any, index: number) => {
				const renderItem = props.renderItem(child, index)
				return (
					<DragDropListItemWrapper
						key={index}
						index={index}
						moveHandler={moveHandler}
						onDropOutside={() => {
							props.onDrop(uiArray)
						}}
						listItem={renderItem}
						dragDropType={props.dragDropType}
						tableClassName={props.tableClassName}
					></DragDropListItemWrapper>
				)
			})}
		</table>
	)
}
