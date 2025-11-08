/**
 * Daemon Process Manager
 * Handles starting, stopping, and checking status of the Browser Pilot Daemon
 */
import { DaemonState, MapQueryParams, MapQueryResult, MapGenerateParams, MapGenerateResult, MapStatusResult } from './protocol';
export declare class DaemonManager {
    private outputDir;
    private pidPath;
    private socketPath;
    private cachedPid;
    private readonly PID_CACHE_TTL;
    constructor();
    /**
     * Get socket path (platform-specific, project-unique)
     */
    private getSocketPath;
    /**
     * Start daemon process with retry and port fallback
     */
    start(options?: {
        verbose?: boolean;
        initialUrl?: string;
    }): Promise<void>;
    /**
     * Change port automatically to find available port
     */
    private changePortAutomatically;
    /**
     * Find available port starting from base + 1
     */
    private findAvailablePort;
    /**
     * Check if port is available
     */
    private isPortAvailable;
    /**
     * Stop daemon process
     */
    stop(options?: {
        verbose?: boolean;
        force?: boolean;
    }): Promise<void>;
    /**
     * Restart daemon
     */
    restart(options?: {
        verbose?: boolean;
    }): Promise<void>;
    /**
     * Get daemon status
     */
    getStatus(options?: {
        verbose?: boolean;
    }): Promise<DaemonState | null>;
    /**
     * Check if daemon is running
     */
    isRunning(): Promise<boolean>;
    /**
     * Get daemon PID from PID file (with caching, async for non-blocking I/O)
     */
    private getPid;
    /**
     * Wait for daemon to start
     */
    private waitForDaemon;
    /**
     * Wait for daemon to stop
     */
    private waitForStop;
    /**
     * Ensure daemon is running (auto-start if needed)
     */
    ensureRunning(options?: {
        verbose?: boolean;
        initialUrl?: string;
    }): Promise<void>;
    /**
     * Query interaction map for elements
     */
    queryMap(params: MapQueryParams, options?: {
        verbose?: boolean;
    }): Promise<MapQueryResult>;
    /**
     * Generate interaction map for current page
     */
    generateMap(params: MapGenerateParams, options?: {
        verbose?: boolean;
    }): Promise<MapGenerateResult>;
    /**
     * Get interaction map status
     */
    getMapStatus(options?: {
        verbose?: boolean;
    }): Promise<MapStatusResult>;
}
//# sourceMappingURL=manager.d.ts.map