export interface TimeSyncOptions {
    syncPeriod: number;
    minSyncQuality: number;
    minTryCount: number;
    maxTryCount: number;
    retryWaitTime: number;
    serverDelayTime: number;
}
export interface TimeSyncOptionsOptional {
    syncPeriod?: number;
    minSyncQuality?: number;
    minTryCount?: number;
    maxTryCount?: number;
    retryWaitTime?: number;
    serverDelayTime?: number;
}
export declare class TimeSync {
    private _options;
    private _invalidationCallback?;
    private _timeSource;
    private _syncDiff;
    private _syncQuality;
    private _lastSyncTime;
    private _timeInterval;
    constructor(options: TimeSyncOptionsOptional, timeSource: () => Promise<number>, invalidationCallback?: () => void);
    localTime(): number;
    currentTime(): number;
    get quality(): number | null;
    get diff(): number;
    isGood(): boolean;
    init(): Promise<boolean>;
    stop(): void;
    maybeTriggerSync(): void;
    private syncTime;
}
