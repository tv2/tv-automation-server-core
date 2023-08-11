export class BasicRundown {
	readonly id: string
	readonly name: string
	protected isRundownActive: boolean
	protected modifiedAt: number

	constructor(id: string, name: string, isActive: boolean, modifiedAt: number) {
		this.id = id
		this.name = name
		this.isRundownActive = isActive
		this.modifiedAt = modifiedAt
	}

	public isActive(): boolean {
		return this.isRundownActive
	}

	public getLastTimeModified(): number {
		return this.modifiedAt
	}
}
