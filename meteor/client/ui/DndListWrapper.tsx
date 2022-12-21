import { DropTargetMonitor, useDrop } from 'react-dnd'
import { DragDropItemTypes } from './DragDropItemTypes'
import React, { useEffect, useState } from 'react'
import update from 'immutability-helper'
import { DndListItemWrapper } from './DndListItemWrapper'

interface IDndListWrapperProps {
	className: string
	dndType: DragDropItemTypes
	stateUIArray: any[]

	onDrop: (newArray: any[]) => void
	provideItemForRender: (item: any, index: number) => JSX.Element
}

export const DndListWrapper: React.FunctionComponent<IDndListWrapperProps> = (props: IDndListWrapperProps) => {
	const [uiArray, setUiArray] = useState(props.stateUIArray)

	const [, drop] = useDrop({
		accept: props.dndType,
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
		if (uiArray.length === 0 || uiArray !== props.stateUIArray) {
			setUiArray(props.stateUIArray)
		}
	}, [props.stateUIArray])

	return (
		<table ref={drop}>
			{uiArray.map((child: any, index: number) => {
				const renderItem = props.provideItemForRender(child, index)
				return (
					<DndListItemWrapper
						key={index}
						index={index}
						moveHandler={moveHandler}
						onDropOutside={() => {
							props.onDrop(uiArray)
						}}
						listItem={renderItem}
						dndType={props.dndType}
						className={props.className}
					></DndListItemWrapper>
				)
			})}
		</table>
	)
}
