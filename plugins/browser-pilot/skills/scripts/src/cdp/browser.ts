/**
 * Chrome browser launcher and connection manager.
 */

import { spawn, ChildProcess } from 'child_process';
import { homedir, platform } from 'os';
import { existsSync } from 'fs';
import { join } from 'path';
import { CDPClient } from './client';
import {
  getProjectConfig as _getProjectConfig,
  getProjectPort,
  updateProjectLastUsed,
  cleanupProjectIfNeeded,
  isPortAvailable
} from './config';
import { logger } from '../utils/logger';
import { TIMING, CDP } from '../constants';

interface Target {
  type: string;
  webSocketDebuggerUrl: string;
  id?: string;
  title?: string;
  url?: string;
  [key: string]: unknown;
}

// CDP Event Supporting Interfaces
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

// Page Navigation Interfaces
export interface PageNavigatedWithinDocumentPayload {
  frameId: string;
  url: string;
  navigationType: 'fragment' | 'historyApi' | 'other';
}

// Console Message Interfaces
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
  timestamp: string; // ISO string format
  url?: string;
  lineNumber?: number;
}

// Network Error Interfaces
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

// Network Request Tracking Interface
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

// CDP Event Handler Type
type CDPEventHandler =
  | ((params: LogEntryAddedPayload) => void)
  | ((params: ConsoleAPICalledPayload) => void)
  | ((params: ExceptionThrownPayload) => void)
  | ((params: NetworkRequestPayload) => void)
  | ((params: NetworkFailedPayload) => void)
  | ((params: NetworkResponsePayload) => void);

// CDP Event Payload Interfaces
interface LogEntry {
  level?: 'verbose' | 'info' | 'warning' | 'error';
  text?: string;
  timestamp?: number;
  url?: string;
  lineNumber?: number;
  stackTrace?: StackTrace;
}

interface LogEntryAddedPayload {
  entry: LogEntry;
}

interface ConsoleAPICalledPayload {
  type?: string;
  args?: RemoteObject[];
  timestamp?: number;
  stackTrace?: StackTrace;
}

interface ExceptionDetails {
  exception?: {
    description?: string;
  };
  text?: string;
  timestamp?: number;
  url?: string;
  lineNumber?: number;
  stackTrace?: StackTrace;
}

interface ExceptionThrownPayload {
  exceptionDetails: ExceptionDetails;
}

export class ChromeBrowser {
  private readonly headless: boolean;
  public debugPort: number | null = null;
  private chromeProcess: ChildProcess | null = null;
  public client: CDPClient | null = null;
  private consoleMessages: ConsoleMessage[] = [];
  private networkErrors: NetworkError[] = [];
  private readonly MAX_CONSOLE_MESSAGES = TIMING.MAP_CACHE_TTL / 600; // 1000 messages (10min / 600ms)
  private readonly MAX_NETWORK_ERRORS = TIMING.MAP_CACHE_TTL / 600; // 1000 errors
  private pendingRequests: Map<string, { url: string; timestamp: number; processed: boolean }> = new Map();
  private readonly REQUEST_TIMEOUT = TIMING.DAEMON_IDLE_TIMEOUT / 30; // ~60 seconds
  private cleanupInterval: NodeJS.Timeout | null = null;
  private eventListeners: Map<string, CDPEventHandler> = new Map();

  constructor(headless = false) {
    this.headless = headless;
    // Debug port will be loaded from shared config in launch/connect methods
  }

  /**
   * Add console message with size limit to prevent memory issues.
   */
  private addConsoleMessage(message: ConsoleMessage): void {
    this.consoleMessages.push(message);

    // Keep only the most recent messages
    if (this.consoleMessages.length > this.MAX_CONSOLE_MESSAGES) {
      this.consoleMessages = this.consoleMessages.slice(-this.MAX_CONSOLE_MESSAGES);
    }
  }

  /**
   * Add network error with size limit to prevent memory issues.
   */
  private addNetworkError(error: NetworkError): void {
    this.networkErrors.push(error);

    // Keep only the most recent errors
    if (this.networkErrors.length > this.MAX_NETWORK_ERRORS) {
      this.networkErrors = this.networkErrors.slice(-this.MAX_NETWORK_ERRORS);
    }
  }

  /**
   * Clean up stale pending requests to prevent memory leak.
   */
  private cleanupStaleRequests(): void {
    const now = Date.now();
    for (const [requestId, request] of this.pendingRequests.entries()) {
      if (request.processed || (now - request.timestamp > this.REQUEST_TIMEOUT)) {
        this.pendingRequests.delete(requestId);
      }
    }
  }

  /**
   * Find Chrome executable path.
   */
  private getChromePath(): string {
    const system = platform();
    let paths: string[] = [];

    if (system === 'win32') {
      paths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        join(homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'Application', 'chrome.exe')
      ];
    } else if (system === 'darwin') {
      paths = [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
      ];
    } else {
      paths = [
        '/usr/bin/google-chrome',
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium'
      ];
    }

    for (const path of paths) {
      if (existsSync(path)) {
        return path;
      }
    }

    throw new Error('Chrome not found. Please install Google Chrome.');
  }

  /**
   * Connect to already running Chrome instance.
   */
  async connect(): Promise<void> {
    // Get project port from shared config
    const port = await getProjectPort();

    // Check if the port is in use (browser running)
    const portAvailable = await isPortAvailable(port);

    if (!portAvailable) {
      // Port is in use, browser is running
      this.debugPort = port;
      logger.info(`Connecting to existing Chrome on port ${this.debugPort}...`);
      await this.connectToPage();
      updateProjectLastUsed();
      return;
    }

    // No running browser found
    throw new Error(`No running browser found on port ${port}`);
  }

  /**
   * Launch Chrome in debugging mode.
   * @param initialUrl - Optional initial URL to open (defaults to about:blank)
   */
  async launch(initialUrl?: string): Promise<void> {
    // Get project port from shared config (auto-creates if not exists)
    this.debugPort = await getProjectPort();

    const chromePath = this.getChromePath();
    const args = [
      `--remote-debugging-port=${this.debugPort}`,
      '--remote-allow-origins=*',
      '--no-first-run',
      '--no-default-browser-check',
      `--user-data-dir=${join(homedir(), `.cdp_browser_profile_${this.debugPort}`)}`
    ];

    if (this.headless) {
      args.push('--headless=new', '--disable-gpu');
    }

    // Add initial URL or default to blank page
    if (initialUrl) {
      args.push(initialUrl);
      logger.info(`Launching Chrome with initial URL: ${initialUrl}`);
    } else {
      args.push('about:blank');
    }

    logger.info(`Launching Chrome on port ${this.debugPort} (headless: ${this.headless})...`);

    this.chromeProcess = spawn(chromePath, args, {
      stdio: 'ignore',
      detached: true
    });

    // Detach the process so it continues running when Node exits
    this.chromeProcess.unref();

    // Update last used timestamp
    updateProjectLastUsed();

    // Wait for Chrome to be ready by polling the JSON endpoint
    let attempts = 0;
    const maxAttempts = 20; // 10 seconds (20 * 500ms)
    let connected = false;

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`http://${CDP.LOCALHOST}:${this.debugPort}/json/version`);
        if (response.ok) {
          connected = true;
          break;
        }
      } catch (_error) {
        // Connection may be refused while browser is starting up
      }
      attempts++;
      await this.sleep(TIMING.NETWORK_IDLE_TIMEOUT);
    }

    if (!connected) {
      throw new Error(`Failed to connect to Chrome within the timeout period (${maxAttempts * TIMING.NETWORK_IDLE_TIMEOUT / TIMING.ACTION_DELAY_NAVIGATION} seconds).`);
    }

    // Connect to page target
    await this.connectToPage();
  }

  /**
   * Connect to a Chrome page target.
   */
  private async connectToPage(): Promise<void> {
    try {
      // Get list of targets
      const url = `http://${CDP.LOCALHOST}:${this.debugPort}/json`;
      const response = await fetch(url);
      const targets = await response.json() as Target[];

      // Find or create a page target
      let pageTarget = targets.find(t => t.type === 'page');

      if (!pageTarget) {
        // Create new target
        const newUrl = `http://${CDP.LOCALHOST}:${this.debugPort}/json/new`;
        const newResponse = await fetch(newUrl);
        pageTarget = await newResponse.json() as Target;
      }

      const wsUrl = pageTarget.webSocketDebuggerUrl;

      logger.info(`Connecting to: ${wsUrl}`);
      this.client = new CDPClient(wsUrl);
      await this.client.connect();
      logger.info('Connected to Chrome DevTools Protocol');

      // Enable Log domain to receive console messages
      await this.client.sendCommand('Log.enable');
      await this.client.sendCommand('Runtime.enable');
      // Enable Network domain to track network errors
      await this.client.sendCommand('Network.enable');

      // Set up event listeners with references for cleanup
      const logEntryHandler = (params: LogEntryAddedPayload) => {
        const entry = params.entry;
        this.addConsoleMessage({
          level: entry.level || 'log',
          text: entry.text || '',
          timestamp: entry.timestamp || Date.now(),
          url: entry.url,
          lineNumber: entry.lineNumber,
          stackTrace: entry.stackTrace
        });
      };

      const consoleApiHandler = (params: ConsoleAPICalledPayload) => {
        const args = params.args || [];
        const text = args.map((arg: RemoteObject) => arg.value || arg.description || '').join(' ');

        this.addConsoleMessage({
          level: params.type || 'log',
          text: text,
          timestamp: params.timestamp || Date.now(),
          url: params.stackTrace?.callFrames?.[0]?.url,
          lineNumber: params.stackTrace?.callFrames?.[0]?.lineNumber
        });
      };

      const exceptionHandler = (params: ExceptionThrownPayload) => {
        const exception = params.exceptionDetails;
        const text = exception.exception?.description || exception.text || 'Unknown error';

        this.addConsoleMessage({
          level: 'error',
          text: text,
          timestamp: exception.timestamp || Date.now(),
          url: exception.url,
          lineNumber: exception.lineNumber,
          stackTrace: exception.stackTrace
        });
      };

      const requestWillBeSentHandler = (params: NetworkRequestPayload) => {
        this.pendingRequests.set(params.requestId, {
          url: params.request.url,
          timestamp: params.timestamp !== undefined ? params.timestamp * TIMING.ACTION_DELAY_NAVIGATION : Date.now(),
          processed: false
        });
      };

      const loadingFailedHandler = (params: NetworkFailedPayload) => {
        const request = this.pendingRequests.get(params.requestId);
        if (request && !request.processed && !params.canceled) {
          this.addNetworkError({
            url: request.url,
            errorText: params.errorText,
            timestamp: params.timestamp !== undefined ? params.timestamp * TIMING.ACTION_DELAY_NAVIGATION : Date.now(),
            requestId: params.requestId
          });
          request.processed = true;
        }
      };

      const responseReceivedHandler = (params: NetworkResponsePayload) => {
        const { requestId, response } = params;
        const request = this.pendingRequests.get(requestId);

        if (request && !request.processed && response.status >= 400) {
          this.addNetworkError({
            url: response.url,
            errorText: `HTTP ${response.status} ${response.statusText}`,
            timestamp: Date.now(),
            statusCode: response.status,
            requestId: requestId
          });
          request.processed = true;
        }
      };

      // Register event listeners
      this.client.on('Log.entryAdded', logEntryHandler);
      this.eventListeners.set('Log.entryAdded', logEntryHandler);

      this.client.on('Runtime.consoleAPICalled', consoleApiHandler);
      this.eventListeners.set('Runtime.consoleAPICalled', consoleApiHandler);

      this.client.on('Runtime.exceptionThrown', exceptionHandler);
      this.eventListeners.set('Runtime.exceptionThrown', exceptionHandler);

      this.client.on('Network.requestWillBeSent', requestWillBeSentHandler);
      this.eventListeners.set('Network.requestWillBeSent', requestWillBeSentHandler);

      this.client.on('Network.loadingFailed', loadingFailedHandler);
      this.eventListeners.set('Network.loadingFailed', loadingFailedHandler);

      this.client.on('Network.responseReceived', responseReceivedHandler);
      this.eventListeners.set('Network.responseReceived', responseReceivedHandler);

      // Start periodic cleanup of stale requests
      this.cleanupInterval = setInterval(() => this.cleanupStaleRequests(), TIMING.POLLING_INTERVAL_SLOW * 10);

    } catch (error) {
      throw new Error(`Failed to connect to Chrome: ${error}`);
    }
  }

  /**
   * Send CDP command.
   */
  async sendCommand<T = Record<string, unknown>>(
    method: string,
    params?: unknown
  ): Promise<T> {
    if (!this.client) {
      throw new Error('Not connected to Chrome');
    }
    return this.client.sendCommand<T>(method, params);
  }

  /**
   * Get collected console messages.
   */
  getConsoleMessages(): ConsoleMessage[] {
    return [...this.consoleMessages];
  }

  /**
   * Clear console messages buffer.
   */
  clearConsoleMessages(): void {
    this.consoleMessages = [];
  }

  /**
   * Get collected network errors.
   */
  getNetworkErrors(): NetworkError[] {
    return [...this.networkErrors];
  }

  /**
   * Clear network errors buffer.
   */
  clearNetworkErrors(): void {
    this.networkErrors = [];
  }

  /**
   * Close browser and cleanup.
   */
  async close(): Promise<void> {
    logger.info('Closing browser...');

    // Stop cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    // Remove all event listeners
    for (const [event, handler] of this.eventListeners.entries()) {
      this.client?.off(event, handler);
    }
    this.eventListeners.clear();

    if (this.client) {
      try {
        // Send Browser.close command to gracefully close the browser
        await this.client.sendCommand('Browser.close');
        logger.info('Browser closed via CDP command');
      } catch (_error) {
        logger.info('Could not close browser via CDP, it may already be closed');
      }

      // Close WebSocket connection
      this.client.close();
    }

    // Force kill Chrome process if it's still running
    if (this.chromeProcess) {
      try {
        // Check if process is still alive
        if (!this.chromeProcess.killed) {
          this.chromeProcess.kill('SIGTERM');
          logger.info('Chrome process terminated (SIGTERM)');

          // Wait a bit for graceful shutdown
          await this.sleep(1000);

          // Force kill if still alive
          if (!this.chromeProcess.killed) {
            this.chromeProcess.kill('SIGKILL');
            logger.info('Chrome process force-killed (SIGKILL)');
          }
        }
      } catch (error) {
        logger.warn(`Failed to kill Chrome process: ${error instanceof Error ? error.message : String(error)}`);
      }
      this.chromeProcess = null;
    }

    // Clear pending requests
    this.pendingRequests.clear();

    // Clean up project config if autoCleanup is enabled
    cleanupProjectIfNeeded();
  }

  /**
   * Sleep for specified milliseconds.
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
