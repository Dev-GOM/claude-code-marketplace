/**
 * IPC Protocol definitions for Browser Pilot Daemon
 */
import { FormattedConsoleMessage } from '../cdp/browser';
import { QueryOptions } from '../cdp/map/query-map';
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
    currentUrl: string | null;
    targetId: string | null;
    debugPort: number | null;
    consoleMessageCount: number;
    networkErrorCount: number;
    uptime: number;
    lastActivity: number;
}
/**
 * Command-specific parameter interfaces
 */
export interface NavigateParams {
    url: string;
    waitForLoad?: boolean;
    timeout?: number;
}
export interface ClickParams {
    selector: string;
    waitForSelector?: boolean;
    timeout?: number;
}
export interface FillParams {
    selector: string;
    value: string;
    clear?: boolean;
}
export interface ScrollParams {
    x: number;
    y: number;
}
export interface EvaluateParams {
    expression: string;
    returnByValue?: boolean;
}
export interface ScreenshotParams {
    filename?: string;
    fullPage?: boolean;
    quality?: number;
}
export interface ConsoleParams {
    errorsOnly?: boolean;
    clear?: boolean;
}
export interface WaitParams {
    selector?: string;
    timeout?: number;
    duration?: number;
}
/**
 * Map-related parameter interfaces
 */
export interface MapQueryParams extends QueryOptions {
}
export interface MapGenerateParams {
    force?: boolean;
    useCache?: boolean;
}
/**
 * Command result interfaces
 */
export interface ConsoleResult {
    messages: FormattedConsoleMessage[];
    count: number;
    errorCount: number;
    warningCount: number;
    logCount: number;
}
export interface NavigateResult {
    url: string;
    title?: string;
}
export interface ScreenshotResult {
    path: string;
    size: number;
}
/**
 * Map-related result interfaces
 */
export interface MapQueryResultItem {
    selector: string;
    alternatives: string[];
    element: {
        tag: string;
        text: string | undefined;
        position: {
            x: number;
            y: number;
        };
    };
}
export interface MapQueryResult {
    count: number;
    results: MapQueryResultItem[];
    types?: Record<string, number>;
    texts?: Array<{
        text: string;
        type: string;
        count: number;
    }>;
    total?: number;
}
export interface MapStatusResult {
    exists: boolean;
    url: string | null;
    timestamp: string | null;
    elementCount: number;
    cacheValid: boolean;
}
export interface MapGenerateResult {
    success: boolean;
    url: string;
    elementCount: number;
    timestamp: string;
    cached: boolean;
}
/**
 * Protocol constants
 */
export declare const SOCKET_PATH_PREFIX = "daemon";
export declare const PID_FILENAME = "daemon.pid";
export declare const STATE_FILENAME = "daemon-state.json";
export declare const DEFAULT_TIMEOUT = 30000;
export declare const IDLE_SHUTDOWN_TIMEOUT = 1800000;
/**
 * Get project-specific socket name
 * Uses project folder name + path hash to create unique socket for each project
 */
export declare function getProjectSocketName(): string;
/**
 * Protocol errors
 */
export declare class IPCError extends Error {
    code: string;
    constructor(message: string, code: string);
}
export declare const IPCErrorCodes: {
    readonly TIMEOUT: "TIMEOUT";
    readonly DAEMON_NOT_RUNNING: "DAEMON_NOT_RUNNING";
    readonly DAEMON_ALREADY_RUNNING: "DAEMON_ALREADY_RUNNING";
    readonly BROWSER_NOT_CONNECTED: "BROWSER_NOT_CONNECTED";
    readonly COMMAND_FAILED: "COMMAND_FAILED";
    readonly INVALID_REQUEST: "INVALID_REQUEST";
    readonly CONNECTION_ERROR: "CONNECTION_ERROR";
};
/**
 * Daemon command constants
 */
export declare const DAEMON_COMMANDS: {
    readonly NAVIGATE: "navigate";
    readonly BACK: "back";
    readonly FORWARD: "forward";
    readonly RELOAD: "reload";
    readonly CLICK: "click";
    readonly FILL: "fill";
    readonly HOVER: "hover";
    readonly PRESS: "press";
    readonly TYPE: "type";
    readonly SCREENSHOT: "screenshot";
    readonly PDF: "pdf";
    readonly EXTRACT: "extract";
    readonly CONTENT: "content";
    readonly FIND: "find";
    readonly EVAL: "eval";
    readonly CONSOLE: "console";
    readonly WAIT: "wait";
    readonly WAIT_IDLE: "wait-idle";
    readonly SLEEP: "sleep";
    readonly SCROLL: "scroll";
    readonly DAEMON_STATUS: "daemon-status";
    readonly DAEMON_STOP: "daemon-stop";
    readonly QUERY_MAP: "query-map";
    readonly GENERATE_MAP: "generate-map";
    readonly GET_MAP_STATUS: "get-map-status";
};
export type DaemonCommand = typeof DAEMON_COMMANDS[keyof typeof DAEMON_COMMANDS];
//# sourceMappingURL=protocol.d.ts.map