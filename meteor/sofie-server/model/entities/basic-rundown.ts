export class BasicRundown {
	readonly id: string
	readonly name: string
	protected isRundownActive: boolean
	protected lastTimeModified: number

	constructor(id: string, name: string, isActive: boolean, lastTimeModified: number) {
		this.id = id
		this.name = name
		this.isRundownActive = isActive
		this.lastTimeModified = lastTimeModified
	}

	public isActive(): boolean {
		return this.isRundownActive
	}

	public getLastTimeModified(): number {
		return this.lastTimeModified
	}
}
