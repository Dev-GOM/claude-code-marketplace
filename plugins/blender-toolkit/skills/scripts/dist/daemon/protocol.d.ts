/**
 * IPC Protocol definitions for Blender Toolkit Daemon
 */
/**
 * IPC Request from CLI to Daemon
 */
export interface IPCRequest {
    id: string;
    command: string;
    params: Record<string, unknown>;
    timeout?: number;
}
/**
 * IPC Response from Daemon to CLI
 */
export interface IPCResponse {
    id: string;
    success: boolean;
    data?: unknown;
    error?: string;
}
/**
 * Daemon state information
 */
export interface DaemonState {
    connected: boolean;
    port: number | null;
    host: string;
    uptime: number;
    lastActivity: number;
    blenderVersion?: string;
}
/**
 * File names and paths
 */
export declare const PID_FILENAME = "daemon.pid";
export declare const SOCKET_PATH_PREFIX = "daemon";
/**
 * Get project-specific socket name for daemon IPC
 * Same logic as browser-pilot
 */
export declare function getProjectSocketName(projectRoot?: string): string;
/**
 * Daemon commands
 */
export declare const DAEMON_COMMANDS: {
    readonly PING: "ping";
    readonly GET_STATUS: "get-status";
    readonly SHUTDOWN: "shutdown";
    readonly BLENDER_COMMAND: "blender-command";
};
export type DaemonCommand = typeof DAEMON_COMMANDS[keyof typeof DAEMON_COMMANDS];
//# sourceMappingURL=protocol.d.ts.map