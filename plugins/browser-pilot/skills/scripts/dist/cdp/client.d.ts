/**
 * CDP WebSocket Client for Chrome DevTools Protocol communication.
 */
import { EventEmitter } from 'events';
export interface CDPMessage {
    id: number;
    method: string;
    params?: unknown;
}
export interface CDPResponse {
    id: number;
    result?: unknown;
    error?: {
        code: number;
        message: string;
    };
}
export interface CDPEvent {
    method: string;
    params?: unknown;
}
export declare class CDPClient extends EventEmitter {
    private ws;
    private messageId;
    private readonly wsUrl;
    constructor(wsUrl: string);
    /**
     * Connect to Chrome via WebSocket.
     */
    connect(): Promise<void>;
    /**
     * Send CDP command and wait for response.
     */
    sendCommand<T = Record<string, unknown>>(method: string, params?: unknown): Promise<T>;
    /**
     * Close WebSocket connection.
     */
    close(): void;
}
//# sourceMappingURL=client.d.ts.map