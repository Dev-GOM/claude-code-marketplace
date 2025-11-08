/**
 * Browser Pilot Daemon Server
 * Maintains persistent CDP connection and handles IPC requests from CLI
 */

import { createServer, Server, Socket } from 'net';
import { join, basename } from 'path';
import { existsSync, unlinkSync, writeFileSync, readFileSync } from 'fs';
import { ChromeBrowser } from '../cdp/browser';
import { getOutputDir, loadSharedConfig } from '../cdp/config';
import { RuntimeEvaluateResult } from '../cdp/actions/helpers';
import { waitForDomStable } from '../cdp/actions/wait';
import {
  IPCRequest,
  IPCResponse,
  IPCError,
  IPCErrorCodes,
  SOCKET_PATH_PREFIX,
  PID_FILENAME,
  IDLE_SHUTDOWN_TIMEOUT,
  getProjectSocketName
} from './protocol';
import { MapManager } from './map-manager';
import { logger } from '../utils/logger';
import { TIME_CONVERSION } from '../constants';
import * as handlers from './handlers';
import { loadLastUrl } from './handlers/navigation-handlers';

export class DaemonServer {
  private server: Server | null = null;
  private browser: ChromeBrowser | null = null;
  private socketPath: string;
  private pidPath: string;
  private outputDir: string;
  private idleTimeout: NodeJS.Timeout | null = null;
  private lastActivity: number = Date.now();
  private startTime: number = Date.now();
  private isShuttingDown: boolean = false;
  private shutdownPromise: Promise<void> | null = null;
  private mapManager: MapManager | null = null;
  private pendingNetworkRequests: Set<string> = new Set();
  private mapGenerationInProgress: boolean = false;
  private activeSockets: Set<Socket> = new Set();
  private initialUrl: string | undefined;
  private readonly MAX_MESSAGE_SIZE = 10 * 1024 * 1024; // 10MB

  constructor() {
    this.outputDir = getOutputDir();
    this.socketPath = this.getSocketPath();
    this.pidPath = join(this.outputDir, PID_FILENAME);
    this.mapManager = new MapManager(this.outputDir);
  }

  /**
   * Get socket path (platform-specific, project-unique)
   */
  private getSocketPath(): string {
    if (process.platform === 'win32') {
      // Windows: project-specific named pipe
      const socketName = getProjectSocketName();
      return `\\\\.\\pipe\\${socketName}`;
    } else {
      // Unix domain socket (already project-specific via outputDir)
      return join(this.outputDir, `${SOCKET_PATH_PREFIX}.sock`);
    }
  }

  /**
   * Start daemon server
   */
  async start(): Promise<void> {
    // Enable file logging for daemon
    const logFile = join(this.outputDir, 'daemon.log');
    logger.enableFileLogging(logFile);
    logger.info('🚀 Browser Pilot Daemon starting...');
    logger.info(`Log file: ${logFile}`);

    // Store initial URL from environment
    this.initialUrl = process.env.BP_INITIAL_URL;

    // Check if already running
    if (this.isAlreadyRunning()) {
      throw new IPCError('Daemon already running', IPCErrorCodes.DAEMON_ALREADY_RUNNING);
    }

    // Clean up stale socket file (Unix only)
    if (process.platform !== 'win32' && existsSync(this.socketPath)) {
      unlinkSync(this.socketPath);
    }

    // Initialize browser connection
    logger.info('Starting Browser Pilot Daemon...');
    this.browser = new ChromeBrowser(false);

    try {
      // Try to connect to existing browser first
      await this.browser.connect();
      logger.info('Connected to existing Chrome instance');
    } catch (_error) {
      // If no browser running, launch new one
      if (this.initialUrl) {
        logger.info(`Launching new Chrome instance with initial URL: ${this.initialUrl}`);
        await this.browser.launch(this.initialUrl);
        this.initialUrl = undefined; // Clear after use
      } else {
        logger.info('Launching new Chrome instance...');
        await this.browser.launch();
      }
      logger.info('Chrome launched successfully');
    }

    // Set up Page domain for navigation events
    await this.setupPageDomain();

    // Set up Network tracking for auto-wait
    await this.setupNetworkTracking();

    // Auto-restore last visited URL if enabled
    await this.autoRestoreUrl();

    // Create IPC server
    this.server = createServer((socket) => this.handleConnection(socket));

    // Start listening
    this.server.listen(this.socketPath, () => {
      logger.info(`IPC server listening on ${this.socketPath}`);
      this.writePidFile();
      this.startIdleTimer();
      logger.info('Browser Pilot Daemon is ready');
    });

    // Handle server errors
    this.server.on('error', (error) => {
      logger.error('Server error', error);

      // For EADDRINUSE, exit immediately to allow DaemonManager retry logic
      if ('code' in error && error.code === 'EADDRINUSE') {
        logger.error('Address already in use. Exiting for retry...');
        process.exit(1);
      }

      this.shutdown();
    });

    // Setup graceful shutdown
    // Use async wrapper to properly await shutdown completion
    process.on('SIGINT', () => {
      this.shutdown().catch((error) => {
        logger.error('Error during SIGINT shutdown', error);
        process.exit(1);
      });
    });
    process.on('SIGTERM', () => {
      this.shutdown().catch((error) => {
        logger.error('Error during SIGTERM shutdown', error);
        process.exit(1);
      });
    });
  }

  /**
   * Auto-restore last visited URL if enabled
   */
  private async autoRestoreUrl(): Promise<void> {
    if (!this.browser) return;

    try {
      // Load shared config
      const config = loadSharedConfig();
      const projectRoot = process.cwd();
      const projectName = basename(projectRoot);
      const projectConfig = config.projects[projectName];

      // Check if autoRestore is enabled (default: true)
      const autoRestore = projectConfig?.autoRestore !== false;

      if (!autoRestore) {
        logger.debug('Auto-restore disabled, skipping URL restoration');
        return;
      }

      // Load last visited URL
      const lastUrl = await loadLastUrl(this.outputDir);

      if (!lastUrl) {
        logger.debug('No last URL found, skipping restoration');
        return;
      }

      logger.info(`🔄 Auto-restoring last visited URL: ${lastUrl}`);

      // Navigate to last URL
      await this.browser.sendCommand('Page.navigate', { url: lastUrl });

      logger.info('✅ URL restored successfully');
    } catch (error) {
      logger.warn(`Failed to auto-restore URL: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Setup Page domain for navigation events
   */
  private async setupPageDomain(): Promise<void> {
    if (!this.browser) return;

    try {
      await this.browser.sendCommand('Page.enable');

      // Listen for frame navigation to auto-clear console
      this.browser.client?.on('Page.frameNavigated', (params: { frame: { id: string; parentId?: string; url: string } }) => {
        // Only process main frame navigation (no parent)
        if (!params.frame.parentId) {
          logger.info(`🔄 Main frame navigated to: ${params.frame.url}`);
          if (this.browser) {
            this.browser.clearConsoleMessages();
            this.browser.clearNetworkErrors();
          }
        }
      });

      // Listen for page load complete to ensure stable DOM
      this.browser.client?.on('Page.loadEventFired', async () => {
        logger.info('📄 Page load complete');
        await this.generateMapAfterStabilization();
      });

      // Listen for SPA navigation (History API usage)
      this.browser.client?.on('Page.navigatedWithinDocument', async (params: {
        frameId: string;
        url: string;
        navigationType: 'fragment' | 'historyApi' | 'other';
      }) => {
        // Ignore fragment navigation (same page anchor links)
        if (params.navigationType === 'fragment') {
          logger.debug(`🔗 Fragment navigation ignored: ${params.url}`);
          return;
        }

        // SPA routing detected (History API: pushState/replaceState)
        logger.info(`🔄 SPA navigation detected (${params.navigationType}): ${params.url}`);

        // Clear console/network errors for new route
        if (this.browser) {
          this.browser.clearConsoleMessages();
          this.browser.clearNetworkErrors();
        }

        // Generate map after DOM stabilization (skip loadEventFired for SPA)
        await this.generateMapAfterStabilization(true);
      });

      logger.info('Page navigation listeners enabled (full page + SPA)');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.warn(`Could not enable Page domain: ${errorMessage}`);
    }
  }

  /**
   * Setup network request tracking
   */
  private async setupNetworkTracking(): Promise<void> {
    if (!this.browser) return;

    try {
      await this.browser.sendCommand('Network.enable');

      this.browser.client?.on('Network.requestWillBeSent', (params: {
        requestId: string;
        type: string;
        request: { url: string };
      }) => {
        logger.debug(`📡 Network request: ${params.type} → ${params.request?.url || 'unknown'}`);

        if (params.type === 'XHR' || params.type === 'Fetch') {
          this.pendingNetworkRequests.add(params.requestId);
          logger.info(`📤 XHR/Fetch started: ${params.request?.url || 'unknown'} (${this.pendingNetworkRequests.size} pending)`);
        }
      });

      this.browser.client?.on('Network.responseReceived', (params: {
        requestId: string;
      }) => {
        if (this.pendingNetworkRequests.has(params.requestId)) {
          this.pendingNetworkRequests.delete(params.requestId);
          logger.info(`📥 XHR/Fetch completed (${this.pendingNetworkRequests.size} pending)`);
        }
      });

      this.browser.client?.on('Network.loadingFailed', (params: {
        requestId: string;
      }) => {
        if (this.pendingNetworkRequests.has(params.requestId)) {
          this.pendingNetworkRequests.delete(params.requestId);
          logger.info(`❌ XHR/Fetch failed (${this.pendingNetworkRequests.size} pending)`);
        }
      });

      logger.info('Network tracking enabled');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.warn(`Could not enable Network tracking: ${errorMessage}`);
    }
  }

  /**
   * Generate map after DOM stabilization
   * @param skipLoadEvent Skip waiting for Page.loadEventFired (for SPA navigation)
   */
  private async generateMapAfterStabilization(skipLoadEvent: boolean = false): Promise<void> {
    if (!this.mapManager || !this.browser) return;

    // Prevent concurrent map generation
    if (this.mapGenerationInProgress) {
      logger.debug(`⏭️  Skipping map generation (already in progress)`);
      return;
    }

    this.mapGenerationInProgress = true;

    try {
      logger.debug(`🔨 Map generation requested (skipLoadEvent: ${skipLoadEvent})`);

      // Mark map as not ready while generating (for chain commands)
      if (this.mapManager) {
        this.mapManager.setMapReady(false);
        logger.debug('📝 Map marked as not ready (generating...)');
      }

      // Wait for Page.loadEventFired only for full page loads
      if (!skipLoadEvent) {
        await new Promise<void>((resolve) => {
          const onLoad = () => {
            this.browser?.client?.off('Page.loadEventFired', onLoad);
            logger.debug('✓ Page load event fired');
            resolve();
          };

          // Add listener
          this.browser?.client?.once('Page.loadEventFired', onLoad);

          // Timeout fallback
          setTimeout(() => {
            this.browser?.client?.off('Page.loadEventFired', onLoad);
            logger.warn('⚠️  Page load event timeout, continuing anyway');
            resolve();
          }, 5000);
        });
      } else {
        logger.info('⏭️  Skipping Page.loadEventFired (SPA navigation)');
        // Wait for React/Vue to start making network requests after SPA navigation
        logger.info('⏳ Waiting for SPA to start network requests (100ms)...');
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Wait for network idle (all XHR/Fetch requests complete)
      logger.info('⏳ Waiting for network idle...');
      const networkIdleStart = Date.now();
      const networkIdleTimeout = 10000; // 10s max wait

      while (this.pendingNetworkRequests.size > 0) {
        if (Date.now() - networkIdleStart > networkIdleTimeout) {
          logger.warn(`⚠️  Network idle timeout (${this.pendingNetworkRequests.size} requests still pending)`);
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (this.pendingNetworkRequests.size === 0) {
        logger.info(`✓ Network idle (waited ${Date.now() - networkIdleStart}ms)`);
      }

      // Wait for browser to be idle (React/Vue rendering complete)
      logger.info('⏳ Waiting for browser idle (rendering complete)...');

      const idleScript = `
        new Promise((resolve) => {
          const startTime = Date.now();

          if (typeof requestIdleCallback !== 'undefined') {
            // Browser supports requestIdleCallback
            const idleId = requestIdleCallback(() => {
              resolve({ waited: Date.now() - startTime });
            }, { timeout: 2000 });

            // Safety timeout
            setTimeout(() => {
              cancelIdleCallback(idleId);
              resolve({ waited: Date.now() - startTime, timeout: true });
            }, 3000);
          } else {
            // Fallback for browsers without requestIdleCallback (Safari)
            setTimeout(() => {
              resolve({ waited: Date.now() - startTime, fallback: true });
            }, 0);
          }
        })
      `;

      try {
        const result = await this.browser.sendCommand<RuntimeEvaluateResult>('Runtime.evaluate', {
          expression: idleScript,
          awaitPromise: true,
          returnByValue: true
        });

        const data = result.result?.value as { waited: number; timeout?: boolean; fallback?: boolean };
        if (data.timeout) {
          logger.info(`✓ Browser idle timeout (waited ${data.waited}ms)`);
        } else if (data.fallback) {
          logger.info(`✓ Browser idle fallback (waited ${data.waited}ms)`);
        } else {
          logger.info(`✓ Browser idle (waited ${data.waited}ms)`);
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.warn(`⚠️  Browser idle check failed: ${errorMessage}`);
      }

      // Wait for DOM to stabilize (100ms of no mutations)
      await waitForDomStable(this.browser, 100, 10000, { verbose: false });
      logger.info('✓ DOM stabilized');

      // Check again for pending network requests (may have started during DOM stabilization)
      if (this.pendingNetworkRequests.size > 0) {
        logger.info(`⏳ Waiting for network requests triggered during DOM stabilization (${this.pendingNetworkRequests.size} pending)...`);
        const postDomNetworkStart = Date.now();
        const postDomNetworkTimeout = 10000;

        while (this.pendingNetworkRequests.size > 0) {
          if (Date.now() - postDomNetworkStart > postDomNetworkTimeout) {
            logger.warn(`⚠️  Post-DOM network idle timeout (${this.pendingNetworkRequests.size} requests still pending)`);
            break;
          }
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        if (this.pendingNetworkRequests.size === 0) {
          logger.info(`✓ Post-DOM network idle (waited ${Date.now() - postDomNetworkStart}ms)`);
        }
      }

      logger.info('✓ Generating interaction map...');

      // Generate map with debounce
      await this.mapManager.generateMapSerially(this.browser, false).catch((error: unknown) => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.warn(`⚠️  Auto map generation failed: ${errorMessage}`);
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.warn(`⚠️  DOM stabilization failed: ${errorMessage}`);
    } finally {
      // Release lock
      this.mapGenerationInProgress = false;
    }
  }

  /**
   * Check if daemon is already running
   */
  private isAlreadyRunning(): boolean {
    if (!existsSync(this.pidPath)) {
      return false;
    }

    try {
      const pidStr = readFileSync(this.pidPath, 'utf-8');
      const pid = parseInt(pidStr, 10);

      // Check if process with this PID exists
      process.kill(pid, 0); // Signal 0 checks existence without killing
      return true;
    } catch (_error) {
      // Process doesn't exist, clean up stale PID file
      unlinkSync(this.pidPath);
      return false;
    }
  }

  /**
   * Write PID file
   */
  private writePidFile(): void {
    writeFileSync(this.pidPath, String(process.pid), 'utf-8');
  }

  /**
   * Start idle timer for auto-shutdown
   */
  private startIdleTimer(): void {
    this.resetIdleTimer();
  }

  /**
   * Reset idle timer
   */
  private resetIdleTimer(): void {
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
    }

    this.idleTimeout = setTimeout(() => {
      const idleTime = Date.now() - this.lastActivity;
      const idleSeconds = Math.floor(idleTime / TIME_CONVERSION.MS_PER_SECOND);
      logger.info(`⏱️  Idle for ${idleSeconds}s, shutting down...`);
      this.shutdown();
    }, IDLE_SHUTDOWN_TIMEOUT);
  }

  /**
   * Handle client connection
   */
  private handleConnection(socket: Socket): void {
    logger.debug('🔗 Client connected');

    // Track active socket
    this.activeSockets.add(socket);

    let buffer = '';

    socket.on('data', async (data) => {
      buffer += data.toString();

      // Check buffer size to prevent memory exhaustion
      if (buffer.length > this.MAX_MESSAGE_SIZE) {
        logger.error('Message size exceeds limit, closing connection');
        socket.destroy();
        return;
      }

      // Process complete JSON messages (delimited by newline)
      const messages = buffer.split('\n');
      buffer = messages.pop() || ''; // Keep incomplete message in buffer

      for (const message of messages) {
        if (!message.trim()) continue;

        try {
          const request: IPCRequest = JSON.parse(message);

          // Validate request structure
          if (!request.id || !request.command) {
            throw new Error('Invalid request structure: missing id or command');
          }

          const response = await this.handleRequest(request);
          socket.write(JSON.stringify(response) + '\n');
        } catch (error) {
          const errorResponse: IPCResponse = {
            id: 'unknown',
            success: false,
            error: error instanceof Error ? error.message : String(error)
          };
          socket.write(JSON.stringify(errorResponse) + '\n');
        }
      }
    });

    socket.on('end', () => {
      logger.info('Client disconnected');
      this.activeSockets.delete(socket);
    });

    socket.on('error', (error) => {
      logger.error('Socket error', error);
      this.activeSockets.delete(socket);
    });
  }

  /**
   * Handle IPC request
   */
  private async handleRequest(request: IPCRequest): Promise<IPCResponse> {
    this.lastActivity = Date.now();
    this.resetIdleTimer();

    logger.debug(`📨 Received command: ${request.command}`);

    if (!this.browser) {
      return {
        id: request.id,
        success: false,
        error: 'Browser not connected'
      };
    }

    try {
      let result: unknown;

      // Create handler context
      const context: handlers.HandlerContext = {
        browser: this.browser,
        mapManager: this.mapManager || undefined,
        outputDir: this.outputDir
      };

      switch (request.command) {
        // Navigation commands
        case 'navigate':
          result = await handlers.handleNavigate(context, request.params);
          break;
        case 'back':
          result = await handlers.handleBack(context, request.params);
          break;
        case 'forward':
          result = await handlers.handleForward(context, request.params);
          break;
        case 'reload':
          result = await handlers.handleReload(context, request.params);
          break;

        // Interaction commands
        case 'click':
          result = await handlers.handleClick(context, request.params);
          break;
        case 'fill':
          result = await handlers.handleFill(context, request.params);
          break;
        case 'hover':
          result = await handlers.handleHover(context, request.params);
          break;
        case 'press':
          result = await handlers.handlePress(context, request.params);
          break;
        case 'type':
          result = await handlers.handleType(context, request.params);
          break;

        // Capture commands
        case 'screenshot':
          result = await handlers.handleScreenshot(context, request.params);
          break;
        case 'pdf':
          result = await handlers.handlePdf(context, request.params);
          break;
        case 'set-viewport':
          result = await handlers.handleSetViewport(context, request.params);
          break;
        case 'get-viewport':
          result = await handlers.handleGetViewport(context, request.params);
          break;
        case 'get-screen-info':
          result = await handlers.handleGetScreenInfo(context, request.params);
          break;

        // Data commands
        case 'extract':
          result = await handlers.handleExtract(context, request.params);
          break;
        case 'content':
          result = await handlers.handleContent(context, request.params);
          break;
        case 'find':
          result = await handlers.handleFind(context, request.params);
          break;
        case 'eval':
          result = await handlers.handleEval(context, request.params);
          break;

        // Map commands
        case 'query-map':
          result = await handlers.handleQueryMap(context, request.params);
          break;
        case 'generate-map':
          result = await handlers.handleGenerateMap(context, request.params);
          break;
        case 'get-map-status':
          result = await handlers.handleGetMapStatus(context, request.params);
          break;

        // Utility commands
        case 'scroll':
          result = await handlers.handleScroll(context, request.params);
          break;
        case 'wait':
          result = await handlers.handleWait(context, request.params);
          break;
        case 'console':
          result = await handlers.handleConsole(context, request.params);
          break;
        case 'status':
          result = await handlers.handleStatus(context, request.params, this.startTime, this.lastActivity);
          break;

        // Daemon management
        case 'shutdown':
          setImmediate(() => this.shutdown());
          result = { message: 'Daemon shutting down...' };
          break;

        default:
          throw new IPCError(`Unknown command: ${request.command}`, IPCErrorCodes.INVALID_REQUEST);
      }

      return {
        id: request.id,
        success: true,
        data: result
      };

    } catch (error) {
      logger.error(`Command failed: ${request.command}`, error);
      return {
        id: request.id,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }


  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    // Return existing shutdown promise if already shutting down
    if (this.shutdownPromise) {
      return this.shutdownPromise;
    }

    this.shutdownPromise = this._doShutdown();
    return this.shutdownPromise;
  }

  /**
   * Internal shutdown implementation
   */
  private async _doShutdown(): Promise<void> {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;

    logger.info('Shutting down Browser Pilot Daemon...');

    // Stop idle timer
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
    }

    // Remove process signal listeners
    process.removeAllListeners('SIGINT');
    process.removeAllListeners('SIGTERM');

    // Close browser first
    if (this.browser) {
      try {
        await this.browser.close();
        logger.info('Browser closed');
      } catch (error) {
        logger.error('Error closing browser', error);
      }
    }

    // Force close all active socket connections
    if (this.activeSockets.size > 0) {
      logger.info(`Closing ${this.activeSockets.size} active socket connection(s)...`);
      for (const socket of this.activeSockets) {
        try {
          socket.destroy();
        } catch (error) {
          logger.error('Error destroying socket', error);
        }
      }
      this.activeSockets.clear();
      logger.info('All socket connections closed');
    }

    // Close IPC server (wait for all connections to close with timeout)
    if (this.server) {
      const server = this.server;
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          logger.warn('IPC server close timed out after 2 seconds. Continuing shutdown.');
          resolve();
        }, 2000);

        server.close((err?: Error) => {
          clearTimeout(timeout);
          if (err) {
            logger.error('Error closing IPC server', err);
          } else {
            logger.info('IPC server closed');
          }
          resolve();
        });
      });
    }

    // Clean up socket file (Unix only) - safe after server.close() completes
    if (process.platform !== 'win32' && existsSync(this.socketPath)) {
      try {
        unlinkSync(this.socketPath);
        logger.info('Socket file removed');
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.warn(`Failed to remove socket file: ${errorMsg}`);
      }
    }

    // Remove PID file
    if (existsSync(this.pidPath)) {
      unlinkSync(this.pidPath);
      logger.info('PID file removed');
    }

    // Remove interaction map cache files
    const mapPath = join(this.outputDir, 'interaction-map.json');
    const mapCachePath = join(this.outputDir, 'map-cache.json');

    if (existsSync(mapPath)) {
      try {
        unlinkSync(mapPath);
        logger.info('Interaction map cache removed');
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.warn(`Failed to remove interaction map: ${errorMsg}`);
      }
    }

    if (existsSync(mapCachePath)) {
      try {
        unlinkSync(mapCachePath);
        logger.info('Map cache metadata removed');
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.warn(`Failed to remove map cache metadata: ${errorMsg}`);
      }
    }

    // Remove shutdown request flag (if exists from SessionEnd)
    // This flag is created by SessionEnd (cleanup-config.js) to track daemon shutdown
    const shutdownFlagPath = join(this.outputDir, 'daemon-to-stop.pid');
    if (existsSync(shutdownFlagPath)) {
      try {
        unlinkSync(shutdownFlagPath);
        logger.info('Shutdown request flag removed');
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.warn(`Failed to remove shutdown flag: ${errorMsg}`);

        // Fallback: Mark as COMPLETED so next SessionStart knows shutdown succeeded
        // Even if file can't be deleted (Windows file lock), marking it prevents force-kill attempt
        try {
          writeFileSync(shutdownFlagPath, `COMPLETED:${process.pid}`, 'utf-8');
          logger.info('Marked shutdown flag as COMPLETED (deletion failed due to file lock)');
        } catch (_writeError) {
          logger.error('Failed to mark shutdown flag as COMPLETED');
        }
      }
    }

    logger.info('Daemon shutdown complete');
    process.exit(0);
  }

  /**
   * Get current browser instance (for testing)
   */
  get currentBrowser(): ChromeBrowser | null {
    return this.browser;
  }

  /**
   * Expose client property for Page event listener
   */
  get client() {
    return this.browser?.client;
  }
}

// Start daemon if run directly
if (require.main === module) {
  const daemon = new DaemonServer();
  daemon.start().catch((error) => {
    logger.error('Failed to start daemon', error);
    process.exit(1);
  });
}
