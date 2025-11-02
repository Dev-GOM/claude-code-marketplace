"use strict";
/**
 * CDP WebSocket Client for Chrome DevTools Protocol communication.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CDPClient = void 0;
const ws_1 = __importDefault(require("ws"));
const events_1 = require("events");
class CDPClient extends events_1.EventEmitter {
    ws = null;
    messageId = 0;
    wsUrl;
    constructor(wsUrl) {
        super();
        this.wsUrl = wsUrl;
    }
    /**
     * Connect to Chrome via WebSocket.
     */
    async connect() {
        return new Promise((resolve, reject) => {
            this.ws = new ws_1.default(this.wsUrl);
            this.ws.on('open', () => {
                // Set up global message handler for CDP events
                this.ws.on('message', (data) => {
                    try {
                        const message = JSON.parse(data.toString());
                        // CDP events don't have 'id' field, only 'method' and 'params'
                        if (!message.id && message.method) {
                            this.emit('event', message);
                            this.emit(message.method, message.params);
                        }
                    }
                    catch (error) {
                        // Ignore parse errors
                    }
                });
                resolve();
            });
            this.ws.on('error', (error) => {
                reject(error);
            });
        });
    }
    /**
     * Send CDP command and wait for response.
     */
    async sendCommand(method, params) {
        if (!this.ws) {
            throw new Error('Not connected to Chrome');
        }
        this.messageId++;
        const message = {
            id: this.messageId,
            method,
            params: params || {}
        };
        return new Promise((resolve, reject) => {
            const currentMessageId = this.messageId;
            const messageHandler = (data) => {
                try {
                    const response = JSON.parse(data.toString());
                    if (response.id === currentMessageId) {
                        this.ws?.removeListener('message', messageHandler);
                        if (response.error) {
                            reject(new Error(`CDP Error: ${JSON.stringify(response.error)}`));
                        }
                        else {
                            resolve(response.result || {});
                        }
                    }
                }
                catch (error) {
                    // Ignore parse errors for other messages
                }
            };
            this.ws.on('message', messageHandler);
            this.ws.send(JSON.stringify(message));
        });
    }
    /**
     * Close WebSocket connection.
     */
    close() {
        if (this.ws) {
            try {
                this.ws.close();
            }
            catch (error) {
                // Ignore close errors
            }
            this.ws = null;
        }
    }
}
exports.CDPClient = CDPClient;
//# sourceMappingURL=client.js.map