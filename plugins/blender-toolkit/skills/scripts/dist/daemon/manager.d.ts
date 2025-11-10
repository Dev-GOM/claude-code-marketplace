/**
 * Daemon Process Manager
 * Handles starting, stopping, and checking status of the Blender Toolkit Daemon
 */
import { DaemonState } from './protocol';
export declare class DaemonManager {
    private outputDir;
    private pidPath;
    constructor();
    /**
     * Start daemon process
     */
    start(options?: {
        verbose?: boolean;
    }): Promise<void>;
    /**
     * Wait for daemon to be ready
     */
    private waitForDaemon;
    /**
     * Stop daemon process
     */
    stop(options?: {
        verbose?: boolean;
        force?: boolean;
    }): Promise<void>;
    /**
     * Force kill daemon process
     */
    private forceKill;
    /**
     * Wait for daemon to shutdown
     */
    private waitForShutdown;
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
     * Check if process is running by PID
     */
    private isProcessRunning;
}
//# sourceMappingURL=manager.d.ts.map