export interface CallbackScheduler {
	start(epochTimeToExecuteCallback: number, callback: () => void): void
	stop(): void
}
