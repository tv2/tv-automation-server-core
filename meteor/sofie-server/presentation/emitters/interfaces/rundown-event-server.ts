export interface RundownEventServer {
	startServer(port: number): void
	killServer(): void
}
