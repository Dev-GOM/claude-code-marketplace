/**
 * CDP WebSocket Client for Chrome DevTools Protocol communication.
 */
import { EventEmitter } from 'events';
export interface CDPMessage {
    id: number;
    method: string;
    params?: Record<string, any>;
}
export interface CDPResponse {
    id: number;
    result?: Record<string, any>;
    error?: {
        code: number;
        message: string;
    };
}
export interface CDPEvent {
    method: string;
    params?: Record<string, any>;
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
    sendCommand(method: string, params?: Record<string, any>): Promise<Record<string, any>>;
    /**
     * Close WebSocket connection.
     */
    close(): void;
}
//# sourceMappingURL=client.d.ts.map