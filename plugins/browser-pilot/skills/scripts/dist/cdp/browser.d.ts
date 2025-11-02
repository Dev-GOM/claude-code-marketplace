/**
 * Chrome browser launcher and connection manager.
 */
export interface ConsoleMessage {
    level: string;
    text: string;
    timestamp: number;
    url?: string;
    lineNumber?: number;
    stackTrace?: any;
}
export declare class ChromeBrowser {
    private readonly headless;
    debugPort: number;
    private chromeProcess;
    private client;
    private consoleMessages;
    constructor(headless?: boolean);
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
    sendCommand(method: string, params?: Record<string, any>): Promise<Record<string, any>>;
    /**
     * Get collected console messages.
     */
    getConsoleMessages(): ConsoleMessage[];
    /**
     * Clear console messages buffer.
     */
    clearConsoleMessages(): void;
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