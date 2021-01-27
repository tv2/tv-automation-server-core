"use strict";
/**
 * DDP client. Based on:
 *
 * * https://github.com/nytamin/node-ddp-client
 * * https://github.com/oortcloud/node-ddp-client
 *
 * Brought into this project for maintenance reasons, including conversion to Typescript.
 */
/// <reference types="../types/faye-websocket" />
Object.defineProperty(exports, "__esModule", { value: true });
exports.DDPClient = void 0;
const WebSocket = require("faye-websocket");
const EJSON = require("ejson");
const events_1 = require("events");
const got_1 = require("got");
/**
 * Class reprsenting a DDP client and its connection.
 */
class DDPClient extends events_1.EventEmitter {
    constructor(opts) {
        super();
        this.isConnecting = false;
        this.isReconnecting = false;
        this.isClosing = false;
        this.connectionFailed = false;
        this.nextId = 0;
        this.callbacks = {};
        this.updatedCallbacks = {};
        this.pendingMethods = {};
        this.observers = {};
        this.reconnectTimeout = null;
        this.messageWork = {
            failed: this.failed.bind(this),
            connected: this.connected.bind(this),
            result: this.result.bind(this),
            updated: this.updated.bind(this),
            nosub: this.nosub.bind(this),
            added: this.added.bind(this),
            removed: this.removed.bind(this),
            changed: this.changed.bind(this),
            ready: this.ready.bind(this),
            ping: this.ping.bind(this),
            pong: () => { },
            error: () => { } // TODO - really do nothing!?!
        };
        opts || (opts = { host: '127.0.0.1', port: 3000, tlsOpts: {} });
        this.resetOptions(opts);
        this.ddpVersionInt = opts.ddpVersion || '1';
        // very very simple collections (name -> [{id -> document}])
        if (this.maintainCollections) {
            this.collections = {};
        }
    }
    get host() { return this.hostInt; }
    get port() { return this.portInt; }
    get path() { return this.pathInt; }
    get ssl() { return this.sslInt; }
    get useSockJS() { return this.useSockJSInt; }
    get autoReconnect() { return this.autoReconnectInt; }
    get autoReconnectTimer() { return this.autoReconnectTimerInt; }
    get ddpVersion() { return this.ddpVersionInt; }
    get url() { return this.urlInt; }
    get maintainCollections() { return this.maintainCollectionsInt; }
    resetOptions(opts) {
        // console.log(opts)
        this.hostInt = opts.host || '127.0.0.1';
        this.portInt = opts.port || 3000;
        this.pathInt = opts.path;
        this.sslInt = opts.ssl || this.port === 443;
        this.tlsOpts = opts.tlsOpts || {};
        this.useSockJSInt = opts.useSockJs || false;
        this.autoReconnectInt = opts.autoReconnect === false ? false : true;
        this.autoReconnectTimerInt = opts.autoReconnectTimer || 500;
        this.maintainCollectionsInt = opts.maintainCollections || true;
        this.urlInt = opts.url;
        this.ddpVersionInt = opts.ddpVersion || '1';
    }
    prepareHandlers() {
        this.socket.on('open', () => {
            // just go ahead and open the connection on connect
            this.send({
                msg: 'connect',
                version: this.ddpVersion,
                support: DDPClient.supportedDdpVersions
            });
        });
        this.socket.on('error', (error) => {
            // error received before connection was established
            if (this.isConnecting) {
                this.emit('failed', error.message);
            }
            this.emit('socket-error', error);
        });
        this.socket.on('close', (event) => {
            this.emit('socket-close', event.code, event.reason);
            this.endPendingMethodCalls();
            this.recoverNetworkError();
        });
        this.socket.on('message', (event) => {
            this.message(event.data);
            this.emit('message', event.data);
        });
    }
    clearReconnectTimeout() {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
    }
    recoverNetworkError(err) {
        // console.log('autoReconnect', this.autoReconnect, 'connectionFailed', this.connectionFailed, 'isClosing', this.isClosing)
        if (this.autoReconnect && !this.connectionFailed && !this.isClosing) {
            this.clearReconnectTimeout();
            this.reconnectTimeout = setTimeout(() => { this.connect(); }, this.autoReconnectTimer);
            this.isReconnecting = true;
        }
        else {
            if (err) {
                throw err;
            }
        }
    }
    ///////////////////////////////////////////////////////////////////////////
    // RAW, low level functions
    send(data) {
        if (data.msg !== 'connect' && this.isConnecting) {
            this.endPendingMethodCalls();
        }
        else {
            this.socket.send(EJSON.stringify(data));
        }
    }
    failed(data) {
        if (DDPClient.supportedDdpVersions.indexOf(data.version) !== -1) {
            this.ddpVersionInt = data.version;
            this.connect();
        }
        else {
            this.autoReconnectInt = false;
            this.emit('failed', 'Cannot negotiate DDP version');
        }
    }
    connected(data) {
        this.session = data.session;
        this.isConnecting = false;
        this.isReconnecting = false;
        this.emit('connected');
    }
    result(data) {
        // console.log('Received result', data, this.callbacks, this.callbacks[data.id])
        const cb = this.callbacks[data.id] || undefined;
        if (cb) {
            cb(data.error, data.result);
            data.id && (delete this.callbacks[data.id]);
        }
    }
    updated(data) {
        if (data.methods) {
            data.methods.forEach(method => {
                const cb = this.updatedCallbacks[method];
                if (cb) {
                    cb();
                    delete this.updatedCallbacks[method];
                }
            });
        }
    }
    nosub(data) {
        const cb = data.id && this.callbacks[data.id] || undefined;
        if (cb) {
            cb(data.error);
            data.id && (delete this.callbacks[data.id]);
        }
    }
    added(data) {
        // console.log('Received added', data, this.maintainCollections)
        if (this.maintainCollections) {
            const name = data.collection;
            const id = data.id || 'unknown';
            if (!this.collections[name]) {
                this.collections[name] = {};
            }
            if (!this.collections[name][id]) {
                this.collections[name][id] = { _id: id };
            }
            if (data.fields) {
                Object.entries(data.fields).forEach(([key, value]) => {
                    this.collections[name][id][key] = value;
                });
            }
            if (this.observers[name]) {
                Object.values(this.observers[name]).forEach(ob => ob.added(id, data.fields));
            }
        }
    }
    removed(data) {
        if (this.maintainCollections) {
            const name = data.collection;
            const id = data.id || 'unknown';
            if (!this.collections[name][id]) {
                return;
            }
            let oldValue = this.collections[name][id];
            delete this.collections[name][id];
            if (this.observers[name]) {
                Object.values(this.observers[name]).forEach(ob => ob.removed(id, oldValue));
            }
        }
    }
    changed(data) {
        if (this.maintainCollections) {
            const name = data.collection;
            const id = data.id || 'unknown';
            if (!this.collections[name]) {
                return;
            }
            if (!this.collections[name][id]) {
                return;
            }
            let oldFields = {};
            const clearedFields = data.cleared || [];
            let newFields = {};
            if (data.fields) {
                Object.entries(data.fields).forEach(([key, value]) => {
                    oldFields[key] = this.collections[name][id][key];
                    newFields[key] = value;
                    this.collections[name][id][key] = value;
                });
            }
            if (data.cleared) {
                data.cleared.forEach(value => {
                    delete this.collections[name][id][value];
                });
            }
            if (this.observers[name]) {
                Object.values(this.observers[name]).forEach(ob => ob.changed(id, oldFields, clearedFields, newFields));
            }
        }
    }
    ready(data) {
        // console.log('Received ready', data, this.callbacks)
        data.subs.forEach(id => {
            const cb = this.callbacks[id];
            if (cb) {
                cb();
                delete this.callbacks[id];
            }
        });
    }
    ping(data) {
        this.send(data.id && { msg: 'pong', id: data.id } || { msg: 'pong' });
    }
    // handle a message from the server
    message(rawData) {
        // console.log('Received message', rawData)
        const data = EJSON.parse(rawData);
        if (this.messageWork[data.msg]) {
            this.messageWork[data.msg](data);
        }
    }
    getNextId() {
        return (this.nextId += 1).toString();
    }
    addObserver(observer) {
        if (!this.observers[observer.name]) {
            this.observers[observer.name] = {};
        }
        this.observers[observer.name][observer.id] = observer;
    }
    removeObserver(observer) {
        if (!this.observers[observer.name]) {
            return;
        }
        delete this.observers[observer.name][observer.id];
    }
    //////////////////////////////////////////////////////////////////////////
    // USER functions -- use these to control the client
    /* open the connection to the server
    *
    *  connected(): Called when the 'connected' message is received
    *               If autoReconnect is true (default), the callback will be
    *               called each time the connection is opened.
    */
    connect(connected) {
        this.isConnecting = true;
        this.connectionFailed = false;
        this.isClosing = false;
        if (connected) {
            this.addListener('connected', () => {
                this.clearReconnectTimeout();
                this.isConnecting = false;
                this.isReconnecting = false;
                connected(undefined, this.isReconnecting);
            });
            this.addListener('failed', error => {
                this.isConnecting = false;
                this.connectionFailed = true;
                connected(error, this.isReconnecting);
            });
        }
        if (this.useSockJS) {
            this.makeSockJSConnection().catch(e => {
                this.emit('failed', e);
            });
        }
        else {
            const url = this.buildWsUrl();
            this.makeWebSocketConnection(url);
        }
    }
    endPendingMethodCalls() {
        const ids = Object.keys(this.pendingMethods);
        this.pendingMethods = {};
        ids.forEach(id => {
            if (this.callbacks[id]) {
                this.callbacks[id](DDPClient.ERRORS.DISCONNECTED);
                delete this.callbacks[id];
            }
            if (this.updatedCallbacks[id]) {
                this.updatedCallbacks[id]();
                delete this.updatedCallbacks[id];
            }
        });
    }
    async makeSockJSConnection() {
        var _a;
        const protocol = this.ssl ? 'https://' : 'http://';
        if (this.path && !((_a = this.path) === null || _a === void 0 ? void 0 : _a.endsWith('/'))) {
            this.pathInt = this.path + '/';
        }
        const url = `${protocol}${this.host}:${this.port}/${this.path || ''}sockjs/info`;
        try {
            let response = await got_1.default(url, {
                https: {
                    certificateAuthority: this.tlsOpts.ca,
                    key: this.tlsOpts.key,
                    certificate: this.tlsOpts.cert,
                    checkServerIdentity: this.tlsOpts.checkServerIdentity
                },
                responseType: 'json'
            });
            // Info object defined here(?): https://github.com/sockjs/sockjs-node/blob/master/lib/info.js
            const info = response.body;
            if (!info || !info.base_url) {
                const url = this.buildWsUrl();
                this.makeWebSocketConnection(url);
            }
            else if (info.base_url.indexOf('http') === 0) {
                const url = info.base_url + '/websocket';
                url.replace(/^http/, 'ws');
                this.makeWebSocketConnection(url);
            }
            else {
                const path = info.base_url + '/websocket';
                const url = this.buildWsUrl(path);
                this.makeWebSocketConnection(url);
            }
        }
        catch (err) {
            this.recoverNetworkError(err);
        }
    }
    buildWsUrl(path) {
        let url;
        path = path || this.path || 'websocket';
        const protocol = this.ssl ? 'wss://' : 'ws://';
        if (this.url && !this.useSockJS) {
            url = this.url;
        }
        else {
            url = `${protocol}${this.host}:${this.port}${(path.indexOf('/') === 0) ? path : '/' + path}`;
        }
        return url;
    }
    makeWebSocketConnection(url) {
        // console.log('About to create WebSocket client')
        this.socket = new WebSocket.Client(url, null, { tls: this.tlsOpts });
        this.prepareHandlers();
    }
    close() {
        this.isClosing = true;
        this.socket && this.socket.close(); // with mockJS connection, might not get created
        this.removeAllListeners('connected');
        this.removeAllListeners('failed');
    }
    call(methodName, data, callback, updatedCallback) {
        // console.log('Call', methodName, 'with this.isConnecting = ', this.isConnecting)
        const id = this.getNextId();
        this.callbacks[id] = (error, result) => {
            delete this.pendingMethods[id];
            if (callback) {
                callback.apply(this, [error, result]);
            }
        };
        const self = this;
        this.updatedCallbacks[id] = function () {
            delete self.pendingMethods[id];
            if (updatedCallback) {
                updatedCallback.apply(this, arguments);
            }
        };
        this.pendingMethods[id] = true;
        this.send({
            msg: 'method',
            id: id,
            method: methodName,
            params: data
        });
    }
    callWithRandomSeed(methodName, data, randomSeed, callback, updatedCallback) {
        const id = this.getNextId();
        if (callback) {
            this.callbacks[id] = callback;
        }
        if (updatedCallback) {
            this.updatedCallbacks[id] = updatedCallback;
        }
        this.send({
            msg: 'method',
            id: id,
            method: methodName,
            randomSeed: randomSeed,
            params: data
        });
    }
    // open a subscription on the server, callback should handle on ready and nosub
    subscribe(subscriptionName, data, callback) {
        const id = this.getNextId();
        if (callback) {
            this.callbacks[id] = callback;
        }
        this.send({
            msg: 'sub',
            id: id,
            name: subscriptionName,
            params: data
        });
        return id;
    }
    unsubscribe(subscriptionId) {
        this.send({
            msg: 'unsub',
            id: subscriptionId
        });
    }
    /**
     * Adds an observer to a collection and returns the observer.
     * Observation can be stopped by calling the stop() method on the observer.
     * Functions for added, changed and removed can be added to the observer
     * afterward.
     */
    observe(collectionName, added, changed, removed) {
        const observer = {
            id: this.getNextId(),
            name: collectionName,
            added: added || (() => { }),
            changed: changed || (() => { }),
            removed: removed || (() => { }),
            stop: () => { this.removeObserver(observer); }
        };
        this.addObserver(observer);
        return observer;
    }
}
exports.DDPClient = DDPClient;
DDPClient.ERRORS = {
    DISCONNECTED: {
        error: 'DISCONNECTED',
        message: 'DDPClient: Disconnected from DDP server',
        errorType: 'Meteor.Error'
    }
};
DDPClient.supportedDdpVersions = ['1', 'pre2', 'pre1'];
//# sourceMappingURL=ddpClient.js.map