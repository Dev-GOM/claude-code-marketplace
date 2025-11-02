/**
 * CDP WebSocket Client for Chrome DevTools Protocol communication.
 */
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
export declare class CDPClient {
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