/**
 * DDP client. Based on:
 *
 * * https://github.com/nytamin/node-ddp-client
 * * https://github.com/oortcloud/node-ddp-client
 *
 * Brought into this project for maintenance reasons, including conversion to Typescript.
 */
/// <reference types="node" />
/// <reference types="../types/faye-websocket" />
import * as WebSocket from 'faye-websocket';
import { EventEmitter } from 'events';
export interface TLSOpts {
    ca?: Buffer[];
    key?: Buffer;
    cert?: Buffer;
    checkServerIdentity?: (hostname: string, cert: object) => Error | undefined;
}
/**
 * Options set when creating a new DDP client connection.
 */
export interface DDPConnectorOptions {
    host: string;
    port: number;
    path?: string;
    ssl?: boolean;
    debug?: boolean;
    autoReconnect?: boolean;
    autoReconnectTimer?: number;
    tlsOpts?: TLSOpts;
    useSockJs?: boolean;
    url?: string;
    maintainCollections?: boolean;
    ddpVersion?: '1' | 'pre2' | 'pre1';
}
/**
 * Observer watching for changes to a collection.
 */
export interface Observer {
    /** Name of the collection being observed */
    readonly name: string;
    /** Identifier of this observer */
    readonly id: string;
    /**
     * Callback when a document is added to a collection.
     * @callback
     * @param id Identifier of the document added
     * @param fields The added document
     */
    added: (id: string, fields?: {
        [attr: string]: unknown;
    }) => void;
    /** Callback when a document is changed in a collection. */
    changed: (id: string, oldFields: {
        [attr: string]: unknown;
    }, clearedFields: Array<string>, newFields: {
        [attr: string]: unknown;
    }) => void;
    /** Callback when a document is removed from a collection. */
    removed: (id: string, oldValue: {
        [attr: string]: unknown;
    }) => void;
    /** Request to stop observing the collection */
    stop: () => void;
}
/** DDP message type for client requests to servers */
export declare type ClientServer = 'connect' | 'ping' | 'pong' | 'method' | 'sub' | 'unsub';
/** DDP message type for server requests to clients */
export declare type ServerClient = 'failed' | 'connected' | 'result' | 'updated' | 'nosub' | 'added' | 'removed' | 'changed' | 'ready' | 'ping' | 'pong' | 'error';
/** All types of DDP messages */
export declare type MessageType = ClientServer | ServerClient;
/**
 * Represents any DDP message sent from as a request or response from a server to a client.
 */
export interface Message {
    /** Kind of meteor message */
    msg: MessageType;
}
/**
 * DDP-specified error.
 * Note. Different fields to a Javascript error.
 */
export interface DDPError {
    error: string | number;
    reason?: string;
    message?: string;
    errorType: 'Meteor.Error';
}
/**
 * Request message to initiate a connection from a client to a server.
 */
interface Connect extends Message {
    msg: 'connect';
    /** If trying to reconnect to an existing DDP session */
    session?: string;
    /** The proposed protocol version */
    version: string;
    /** Protocol versions supported by the client, in order of preference */
    support: Array<string>;
}
/**
 * Response message sent when a client's connection request was successful.
 */
interface Connected extends Message {
    msg: 'connected';
    /** An identifier for the DDP session */
    session: string;
}
/**
 * Response message when a client's connection request was unsuccessful.
 */
interface Failed extends Message {
    msg: 'failed';
    /** A suggested protocol version to connect with */
    version: string;
}
/**
 * Heartbeat request message. Can be sent from server to client or client to server.
 */
interface Ping extends Message {
    msg: 'ping';
    /** Identifier used to correlate with response */
    id?: string;
}
/**
 * Heartbeat response message.
 */
interface Pong extends Message {
    msg: 'pong';
    /** Same as received in the `ping` message */
    id?: string;
}
/**
 * Message from the client specifying the sets of information it is interested in.
 * The server should then send `added`, `changed` and `removed` messages matching
 * the subscribed types.
 */
interface Sub extends Message {
    msg: 'sub';
    /** An arbitrary client-determined identifier for this subscription */
    id: string;
    /** Name of the subscription */
    name: string;
    /** Parameters to the subscription. Most be serializable to EJSON. */
    params?: Array<unknown>;
}
/**
 * Request to unsubscribe from messages related to an existing subscription.
 */
interface UnSub extends Message {
    msg: 'unsub';
    /** The `id` passed to `sub` */
    id: string;
}
/**
 * Message sent when a subscription is unsubscribed. Contains an optional error if a
 * problem occurred.
 */
interface NoSub extends Message {
    msg: 'nosub';
    /** The client `id` passed to `sub` for this subscription. */
    id: string;
    /** An error raised by the subscription as it concludes, or sub-not-found */
    error?: DDPError;
}
/**
 * Notification that a document has been added to a collection.
 */
interface Added extends Message {
    msg: 'added';
    /** Collection name */
    collection: string;
    /** Document identifier */
    id: string;
    /** Document values - serializable with EJSON */
    fields?: {
        [attr: string]: unknown;
    };
}
/**
 * Notification that a document has changed within a collection.
 */
interface Changed extends Message {
    msg: 'changed';
    /** Collection name */
    collection: string;
    /** Document identifier */
    id: string;
    /** Document values - serializable with EJSON */
    fields?: {
        [attr: string]: unknown;
    };
    /** Field names to delete */
    cleared?: Array<string>;
}
/**
 * Notification that a document has been removed from a collection.
 */
interface Removed extends Message {
    msg: 'removed';
    /** Collection name */
    collection: string;
    /** Document identifier */
    id: string;
}
/**
 * Message sent to client after an initial salvo of updates have sent a
 * complete set of initial data.
 */
interface Ready extends Message {
    msg: 'ready';
    /** Identifiers passed to `sub` which have sent their initial batch of data */
    subs: Array<string>;
}
/**
 * Remote procedure call request request.
 */
interface Method extends Message {
    msg: 'method';
    /** Method name */
    method: string;
    /** Parameters to the method */
    params?: Array<unknown>;
    /** An arbitrary client-determined identifier for this method call */
    id: string;
    /** An arbitrary client-determined seed for pseudo-random generators  */
    randomSeed?: string;
}
/**
 * Remote procedure call response message, either an error or a return value _result_.
 */
interface Result extends Message {
    msg: 'result';
    /** Method name */
    id: string;
    /** An error thrown by the method, or method nor found */
    error?: DDPError;
    /** Return value of the method */
    result?: unknown;
}
/**
 * Message sent to indicate that all side-effect changes to subscribed data caused by
 * a method have completed.
 */
interface Updated extends Message {
    msg: 'updated';
    /** Identifiers passed to `method`, all of whose writes have been reflected in data messages */
    methods: Array<string>;
}
/**
 * Erroneous messages sent from the client to the server can result in receiving a top-level
 * `error` message in response.
 */
interface ErrorMessage extends Message {
    msg: 'error';
    /** Description of the error */
    reason: string;
    /** If the original message parsed properly, it is included here */
    offendingMessage?: Message;
}
export declare type AnyMessage = Connect | Connected | Failed | Ping | Pong | Sub | UnSub | NoSub | Added | Changed | Removed | Ready | Method | Result | Updated | ErrorMessage;
/**
 * Class reprsenting a DDP client and its connection.
 */
export declare class DDPClient extends EventEmitter {
    collections: {
        [collectionName: string]: {
            [id: string]: {
                _id: string;
                [attr: string]: unknown;
            };
        };
    };
    socket: WebSocket.Client;
    session: string;
    private hostInt;
    get host(): string;
    private portInt;
    get port(): number;
    private pathInt?;
    get path(): string | undefined;
    private sslInt;
    get ssl(): boolean;
    private useSockJSInt;
    get useSockJS(): boolean;
    private autoReconnectInt;
    get autoReconnect(): boolean;
    private autoReconnectTimerInt;
    get autoReconnectTimer(): number;
    private ddpVersionInt;
    get ddpVersion(): "1" | "pre2" | "pre1";
    private urlInt?;
    get url(): string | undefined;
    private maintainCollectionsInt;
    get maintainCollections(): boolean;
    static readonly ERRORS: {
        [name: string]: DDPError;
    };
    static readonly supportedDdpVersions: string[];
    private tlsOpts;
    private isConnecting;
    private isReconnecting;
    private isClosing;
    private connectionFailed;
    private nextId;
    private callbacks;
    private updatedCallbacks;
    private pendingMethods;
    private observers;
    private reconnectTimeout;
    constructor(opts?: DDPConnectorOptions);
    resetOptions(opts: DDPConnectorOptions): void;
    private prepareHandlers;
    private clearReconnectTimeout;
    private recoverNetworkError;
    private send;
    private failed;
    private connected;
    private result;
    private updated;
    private nosub;
    private added;
    private removed;
    private changed;
    private ready;
    private ping;
    private messageWork;
    private message;
    private getNextId;
    private addObserver;
    private removeObserver;
    connect(connected?: (error?: Error, wasReconnect?: boolean) => void): void;
    private endPendingMethodCalls;
    private makeSockJSConnection;
    private buildWsUrl;
    private makeWebSocketConnection;
    close(): void;
    call(methodName: string, data: Array<unknown>, callback: (err: Error, result: unknown) => void, updatedCallback?: (err: Error, result: unknown) => void): void;
    callWithRandomSeed(methodName: string, data: Array<unknown>, randomSeed: string, callback: (err?: DDPError, result?: unknown) => void, updatedCallback?: (err?: Error, result?: unknown) => void): void;
    subscribe(subscriptionName: string, data: Array<unknown>, callback: () => void): string;
    unsubscribe(subscriptionId: string): void;
    /**
     * Adds an observer to a collection and returns the observer.
     * Observation can be stopped by calling the stop() method on the observer.
     * Functions for added, changed and removed can be added to the observer
     * afterward.
     */
    observe(collectionName: string, added?: () => {}, changed?: () => {}, removed?: () => {}): Observer;
}
export {};
