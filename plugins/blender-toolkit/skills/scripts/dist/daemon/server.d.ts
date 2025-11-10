/**
 * Blender Toolkit Daemon Server
 * Detached background process that maintains connection to Blender WebSocket
 * and provides IPC interface for CLI commands
 */
declare class DaemonServer {
    private ipcServer;
    private blenderClient;
    private socketPath;
    private pidPath;
    private startTime;
    private lastActivity;
    private blenderPort;
    private shutdownRequested;
    private activeSockets;
    private shutdownPromise;
    constructor();
    /**
     * Get socket path (platform-specific)
     */
    private getSocketPath;
    /**
     * Start daemon server
     */
    start(): Promise<void>;
    /**
     * Start IPC server for CLI communication
     */
    private startIPCServer;
    /**
     * Handle IPC connection from CLI
     */
    private handleIPCConnection;
    /**
     * Handle IPC request from CLI
     */
    private handleIPCRequest;
    /**
     * Forward command to Blender WebSocket
     */
    private forwardToBlender;
    /**
     * Get daemon status
     */
    private getStatus;
    /**
     * Setup shutdown handlers
     */
    private setupShutdownHandlers;
    /**
     * Shutdown daemon
     * Browser Pilot 패턴: Race condition 방지
     */
    private shutdown;
    /**
     * 실제 shutdown 수행 (내부 메서드)
     * Browser Pilot 패턴: Promise 기반 안전한 종료
     */
    private performShutdown;
}
export default DaemonServer;
//# sourceMappingURL=server.d.ts.map