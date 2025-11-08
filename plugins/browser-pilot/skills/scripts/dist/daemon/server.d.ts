/**
 * Browser Pilot Daemon Server
 * Maintains persistent CDP connection and handles IPC requests from CLI
 */
import { ChromeBrowser } from '../cdp/browser';
export declare class DaemonServer {
    private server;
    private browser;
    private socketPath;
    private pidPath;
    private outputDir;
    private idleTimeout;
    private lastActivity;
    private startTime;
    private isShuttingDown;
    private shutdownPromise;
    private mapManager;
    private pendingNetworkRequests;
    private mapGenerationInProgress;
    private activeSockets;
    private initialUrl;
    private readonly MAX_MESSAGE_SIZE;
    constructor();
    /**
     * Get socket path (platform-specific, project-unique)
     */
    private getSocketPath;
    /**
     * Start daemon server
     */
    start(): Promise<void>;
    /**
     * Auto-restore last visited URL if enabled
     */
    private autoRestoreUrl;
    /**
     * Setup Page domain for navigation events
     */
    private setupPageDomain;
    /**
     * Setup network request tracking
     */
    private setupNetworkTracking;
    /**
     * Generate map after DOM stabilization
     * @param skipLoadEvent Skip waiting for Page.loadEventFired (for SPA navigation)
     */
    private generateMapAfterStabilization;
    /**
     * Check if daemon is already running
     */
    private isAlreadyRunning;
    /**
     * Write PID file
     */
    private writePidFile;
    /**
     * Start idle timer for auto-shutdown
     */
    private startIdleTimer;
    /**
     * Reset idle timer
     */
    private resetIdleTimer;
    /**
     * Handle client connection
     */
    private handleConnection;
    /**
     * Handle IPC request
     */
    private handleRequest;
    /**
     * Graceful shutdown
     */
    shutdown(): Promise<void>;
    /**
     * Internal shutdown implementation
     */
    private _doShutdown;
    /**
     * Get current browser instance (for testing)
     */
    get currentBrowser(): ChromeBrowser | null;
    /**
     * Expose client property for Page event listener
     */
    get client(): import("../cdp/client").CDPClient | null | undefined;
}
//# sourceMappingURL=server.d.ts.map