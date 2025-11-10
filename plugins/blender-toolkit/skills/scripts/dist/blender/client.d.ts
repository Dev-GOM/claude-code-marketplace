/**
 * Blender WebSocket Client
 * Blender Python 애드온과 통신하기 위한 WebSocket 클라이언트
 */
import { EventEmitter } from 'events';
export interface BlenderMessage {
    id: number;
    method: string;
    params?: unknown;
}
export interface BlenderResponse {
    id: number;
    result?: unknown;
    error?: {
        code: number;
        message: string;
    };
}
export interface BlenderEvent {
    method: string;
    params?: unknown;
}
export declare class BlenderClient extends EventEmitter {
    private ws;
    private messageId;
    private wsUrl;
    private port;
    constructor(port?: number);
    /**
     * Blender에 WebSocket으로 연결
     */
    connect(port?: number): Promise<void>;
    /**
     * WebSocket 연결 종료
     */
    disconnect(): Promise<void>;
    /**
     * 연결 종료 (disconnect의 alias)
     */
    close(): void;
    /**
     * 연결 상태 확인
     */
    isConnected(): boolean;
}
//# sourceMappingURL=client.d.ts.map