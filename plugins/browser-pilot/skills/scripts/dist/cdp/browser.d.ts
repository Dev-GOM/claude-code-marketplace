/**
 * Chrome browser launcher and connection manager.
 */
import { CDPClient } from './client';
export interface StackTrace {
    callFrames?: Array<{
        url?: string;
        lineNumber?: number;
        columnNumber?: number;
        functionName?: string;
    }>;
}
export interface RemoteObject {
    type?: string;
    value?: unknown;
    description?: string;
    [key: string]: unknown;
}
export interface PageNavigatedWithinDocumentPayload {
    frameId: string;
    url: string;
    navigationType: 'fragment' | 'historyApi' | 'other';
}
export interface ConsoleMessage {
    level: string;
    text: string;
    timestamp: number;
    url?: string;
    lineNumber?: number;
    stackTrace?: StackTrace;
}
export interface FormattedConsoleMessage {
    level: string;
    text: string;
    timestamp: string;
    url?: string;
    lineNumber?: number;
}
export interface NetworkError {
    url: string;
    errorText: string;
    timestamp: number;
    statusCode?: number;
    requestId: string;
}
export interface NetworkFailedPayload {
    requestId: string;
    timestamp: number;
    type?: string;
    errorText: string;
    canceled?: boolean;
}
export interface NetworkResponsePayload {
    requestId: string;
    response: {
        url: string;
        status: number;
        statusText: string;
    };
}
export interface NetworkRequestPayload {
    requestId: string;
    request: {
        url: string;
        method?: string;
        headers?: Record<string, string>;
    };
    timestamp: number;
    type?: string;
}
export declare class ChromeBrowser {
    private readonly headless;
    debugPort: number | null;
    private chromeProcess;
    client: CDPClient | null;
    private consoleMessages;
    private networkErrors;
    private readonly MAX_CONSOLE_MESSAGES;
    private readonly MAX_NETWORK_ERRORS;
    private pendingRequests;
    private readonly REQUEST_TIMEOUT;
    private cleanupInterval;
    private eventListeners;
    constructor(headless?: boolean);
    /**
     * Add console message with size limit to prevent memory issues.
     */
    private addConsoleMessage;
    /**
     * Add network error with size limit to prevent memory issues.
     */
    private addNetworkError;
    /**
     * Clean up stale pending requests to prevent memory leak.
     */
    private cleanupStaleRequests;
    /**
     * Find Chrome executable path.
     */
    private getChromePath;
    /**
     * Connect to already running Chrome instance.
     */
    connect(): Promise<void>;
    /**
     * Launch Chrome in debugging mode.
     */
    launch(): Promise<void>;
    /**
     * Connect to a Chrome page target.
     */
    private connectToPage;
    /**
     * Send CDP command.
     */
    sendCommand<T = Record<string, unknown>>(method: string, params?: unknown): Promise<T>;
    /**
     * Get collected console messages.
     */
    getConsoleMessages(): ConsoleMessage[];
    /**
     * Clear console messages buffer.
     */
    clearConsoleMessages(): void;
    /**
     * Get collected network errors.
     */
    getNetworkErrors(): NetworkError[];
    /**
     * Clear network errors buffer.
     */
    clearNetworkErrors(): void;
    /**
     * Close browser and cleanup.
     */
    close(): Promise<void>;
    /**
     * Sleep for specified milliseconds.
     */
    private sleep;
}
//# sourceMappingURL=browser.d.ts.map