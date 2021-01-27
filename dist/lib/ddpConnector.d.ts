/// <reference types="node" />
import { EventEmitter } from 'events';
import { DDPClient, DDPConnectorOptions } from './ddpClient';
export declare class DDPConnector extends EventEmitter {
    ddpClient: DDPClient | undefined;
    private _options;
    private _connected;
    private _connecting;
    private _connectionId;
    private ddpIsOpen;
    private _monitorDDPConnectionInterval;
    constructor(options: DDPConnectorOptions);
    createClient(): Promise<void>;
    connect(): Promise<void>;
    close(): void;
    get connected(): boolean;
    forceReconnect(): Promise<void>;
    get connectionId(): string | undefined;
    private _setupDDPEvents;
    private _monitorDDPConnection;
    private _onclientConnectionChange;
    private _onClientConnectionFailed;
    private _onClientMessage;
    private _onClientError;
    private _onClientInfo;
}
