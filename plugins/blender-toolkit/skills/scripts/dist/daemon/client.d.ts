/**
 * IPC Client for Blender Toolkit Daemon
 * Used by CLI commands to communicate with the daemon
 */
import { IPCResponse } from './protocol';
export declare class IPCClient {
    private socket;
    private socketPath;
    private pendingRequests;
    private buffer;
    constructor();
    /**
     * Get socket path (platform-specific, project-unique)
     */
    private getSocketPath;
    /**
     * Connect to daemon
     */
    connect(): Promise<void>;
    /**
     * Setup socket event handlers
     */
    private setupSocket;
    /**
     * Handle response from daemon
     */
    private handleResponse;
    /**
     * Reject all pending requests
     */
    private rejectAllPending;
    /**
     * Send request to daemon
     */
    sendRequest(command: string, params?: Record<string, unknown>, timeout?: number): Promise<IPCResponse>;
    /**
     * Close connection
     */
    close(): void;
}
//# sourceMappingURL=client.d.ts.map