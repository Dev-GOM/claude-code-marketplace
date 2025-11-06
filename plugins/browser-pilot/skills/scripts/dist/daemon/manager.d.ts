/**
 * Daemon Process Manager
 * Handles starting, stopping, and checking status of the Browser Pilot Daemon
 */
import { DaemonState, MapQueryParams, MapQueryResult, MapGenerateParams, MapGenerateResult, MapStatusResult } from './protocol';
export declare class DaemonManager {
    private outputDir;
    private pidPath;
    private socketPath;
    constructor();
    /**
     * Get socket path (platform-specific, project-unique)
     */
    private getSocketPath;
    /**
     * Start daemon process
     */
    start(options?: {
        verbose?: boolean;
        initialUrl?: string;
    }): Promise<void>;
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
    isRunning(): boolean;
    /**
     * Get daemon PID from PID file
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