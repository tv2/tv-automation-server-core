import { BasicRundown } from '../../model/entities/basic-rundown'

export class BasicRundownDto {
	readonly id: string
	readonly name: string
	readonly isActive: boolean
	readonly modifiedAt: number

	constructor(basicRundown: BasicRundown) {
		this.id = basicRundown.id
		this.name = basicRundown.name
		this.isActive = basicRundown.isActive()
		this.modifiedAt = basicRundown.getLastTimeModified()
	}
}
