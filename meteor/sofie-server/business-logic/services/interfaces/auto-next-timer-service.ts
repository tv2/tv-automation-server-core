export interface AutoNextTimerService {
	start(pointInTimeToStop: number, callback: () => void): void
	stop(): void
}
