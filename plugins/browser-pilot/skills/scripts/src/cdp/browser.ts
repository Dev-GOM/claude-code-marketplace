/**
 * Chrome browser launcher and connection manager.
 */

import { spawn, ChildProcess } from 'child_process';
import { homedir, platform } from 'os';
import { existsSync } from 'fs';
import { join } from 'path';
import { CDPClient } from './client';
import {
  loadConfig,
  saveConfig,
  resetConfig,
  initializeConfig,
  isPortAvailable
} from './config';

interface Target {
  type: string;
  webSocketDebuggerUrl: string;
  [key: string]: any;
}

// CDP Event Supporting Interfaces
interface StackTrace {
  callFrames?: Array<{
    url?: string;
    lineNumber?: number;
    columnNumber?: number;
    functionName?: string;
  }>;
}

interface RemoteObject {
  type?: string;
  value?: unknown;
  description?: string;
  [key: string]: unknown;
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
  public debugPort: number;
  private chromeProcess: ChildProcess | null = null;
  private client: CDPClient | null = null;
  private consoleMessages: ConsoleMessage[] = [];

  constructor(headless = false) {
    this.headless = headless;

    // Load debug port from config
    const config = loadConfig();
    this.debugPort = config.debugPort || 9222;
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
    const config = loadConfig();

    // Check if config is initialized and port exists
    if (config.initialized && config.debugPort) {
      // Check if the port is in use (browser running)
      const portAvailable = await isPortAvailable(config.debugPort);

      if (!portAvailable) {
        // Port is in use, browser is running
        this.debugPort = config.debugPort;
        console.log(`Connecting to existing Chrome on port ${this.debugPort}...`);
        await this.connectToPage();
        return;
      } else {
        // Port is available, browser died
        console.log('Previous browser session not found, resetting config...');
        resetConfig();
      }
    }

    // No running browser found
    throw new Error('No running browser found');
  }

  /**
   * Launch Chrome in debugging mode.
   */
  async launch(): Promise<void> {
    // Initialize config and get available port
    const config = loadConfig();

    if (!config.initialized) {
      console.log('Initializing browser configuration...');
      const newConfig = await initializeConfig();
      this.debugPort = newConfig.debugPort!;
    } else {
      this.debugPort = config.debugPort!;
    }

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

    console.log(`Launching Chrome on port ${this.debugPort} (headless: ${this.headless})...`);

    this.chromeProcess = spawn(chromePath, args, {
      stdio: 'ignore',
      detached: true
    });

    // Detach the process so it continues running when Node exits
    this.chromeProcess.unref();

    // Update config with initialization status
    saveConfig({
      initialized: true,
      debugPort: this.debugPort,
      lastUsed: new Date().toISOString()
    });

    // Wait for Chrome to be ready by polling the JSON endpoint
    let attempts = 0;
    const maxAttempts = 20; // 10 seconds (20 * 500ms)
    let connected = false;

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`http://localhost:${this.debugPort}/json/version`);
        if (response.ok) {
          connected = true;
          break;
        }
      } catch (error) {
        // Connection may be refused while browser is starting up
      }
      attempts++;
      await this.sleep(500);
    }

    if (!connected) {
      throw new Error('Failed to connect to Chrome within the timeout period (10 seconds).');
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
      const url = `http://localhost:${this.debugPort}/json`;
      const response = await fetch(url);
      const targets = await response.json() as Target[];

      // Find or create a page target
      let pageTarget = targets.find(t => t.type === 'page');

      if (!pageTarget) {
        // Create new target
        const newUrl = `http://localhost:${this.debugPort}/json/new`;
        const newResponse = await fetch(newUrl);
        pageTarget = await newResponse.json() as Target;
      }

      const wsUrl = pageTarget.webSocketDebuggerUrl;

      console.log(`Connecting to: ${wsUrl}`);
      this.client = new CDPClient(wsUrl);
      await this.client.connect();
      console.log('Connected to Chrome DevTools Protocol');

      // Enable Log domain to receive console messages
      await this.client.sendCommand('Log.enable');
      await this.client.sendCommand('Runtime.enable');

      // Set up console message listeners
      this.client.on('Log.entryAdded', (params: LogEntryAddedPayload) => {
        const entry = params.entry;
        this.consoleMessages.push({
          level: entry.level || 'log',
          text: entry.text || '',
          timestamp: entry.timestamp || Date.now(),
          url: entry.url,
          lineNumber: entry.lineNumber,
          stackTrace: entry.stackTrace
        });
      });

      // Also listen to Runtime.consoleAPICalled for console.log/warn/error
      this.client.on('Runtime.consoleAPICalled', (params: ConsoleAPICalledPayload) => {
        const args = params.args || [];
        const text = args.map((arg: RemoteObject) => arg.value || arg.description || '').join(' ');

        this.consoleMessages.push({
          level: params.type || 'log',
          text: text,
          timestamp: params.timestamp || Date.now(),
          url: params.stackTrace?.callFrames?.[0]?.url,
          lineNumber: params.stackTrace?.callFrames?.[0]?.lineNumber
        });
      });

      // Listen to Runtime.exceptionThrown for errors
      this.client.on('Runtime.exceptionThrown', (params: ExceptionThrownPayload) => {
        const exception = params.exceptionDetails;
        const text = exception.exception?.description || exception.text || 'Unknown error';

        this.consoleMessages.push({
          level: 'error',
          text: text,
          timestamp: exception.timestamp || Date.now(),
          url: exception.url,
          lineNumber: exception.lineNumber,
          stackTrace: exception.stackTrace
        });
      });

    } catch (error) {
      throw new Error(`Failed to connect to Chrome: ${error}`);
    }
  }

  /**
   * Send CDP command.
   */
  async sendCommand(
    method: string,
    params?: Record<string, any>
  ): Promise<Record<string, any>> {
    if (!this.client) {
      throw new Error('Not connected to Chrome');
    }
    return this.client.sendCommand(method, params);
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
   * Close browser and cleanup.
   */
  async close(): Promise<void> {
    console.log('Closing browser...');

    if (this.client) {
      try {
        // Send Browser.close command to gracefully close the browser
        await this.client.sendCommand('Browser.close');
        console.log('Browser closed via CDP command');
      } catch (error) {
        console.log('Could not close browser via CDP, it may already be closed');
      }

      // Close WebSocket connection
      this.client.close();
    }

    // Reset config to uninitialized state
    resetConfig();
    console.log('Browser configuration reset');
  }

  /**
   * Sleep for specified milliseconds.
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
