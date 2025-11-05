/**
 * Browser Pilot Daemon Server
 * Maintains persistent CDP connection and handles IPC requests from CLI
 */

import { createServer, Server, Socket } from 'net';
import { join } from 'path';
import { existsSync, unlinkSync, writeFileSync } from 'fs';
import { ChromeBrowser } from '../cdp/browser';
import { getOutputDir } from '../cdp/config';
import * as actions from '../cdp/actions';
import { SELECTOR_RETRY_CONFIG, RuntimeEvaluateResult } from '../cdp/actions/helpers';
import { waitForDomStable } from '../cdp/actions/wait';
import {
  IPCRequest,
  IPCResponse,
  IPCError,
  IPCErrorCodes,
  SOCKET_PATH_PREFIX,
  PID_FILENAME,
  IDLE_SHUTDOWN_TIMEOUT,
  DaemonState,
  MapQueryParams,
  MapGenerateParams,
  MapQueryResult,
  MapStatusResult,
  MapGenerateResult
} from './protocol';
import { MapManager } from './map-manager';
import { queryMap, loadMap, listTypes, listTexts } from '../cdp/map/query-map';
import { logger } from '../utils/logger';
import { TIME_CONVERSION } from '../constants';

/**
 * Page change tracking for automatic waiting
 */
interface PageChangeTracker {
  urlBefore: string;
  urlAfter: string | null;
  navigationDetected: boolean;
  domChangeDetected: boolean;
  networkActive: boolean;
}

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
  private mapManager: MapManager | null = null;
  private pageChangeTracker: PageChangeTracker | null = null;
  private actionInProgress: boolean = false;
  private pendingNetworkRequests: Set<string> = new Set();
  private mapGenerationInProgress: boolean = false;

  constructor() {
    this.outputDir = getOutputDir();
    this.socketPath = this.getSocketPath();
    this.pidPath = join(this.outputDir, PID_FILENAME);
    this.mapManager = new MapManager(this.outputDir);
  }

  /**
   * Get socket path (platform-specific)
   */
  private getSocketPath(): string {
    if (process.platform === 'win32') {
      // Windows named pipe (no PID - must match client)
      return `\\\\.\\pipe\\${SOCKET_PATH_PREFIX}`;
    } else {
      // Unix domain socket
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
      logger.info('Launching new Chrome instance...');
      await this.browser.launch();
      logger.info('Chrome launched successfully');
    }

    // Set up Page domain for navigation events
    await this.setupPageDomain();

    // Set up Network tracking for auto-wait
    await this.setupNetworkTracking();

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
      this.shutdown();
    });

    // Setup graceful shutdown
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());
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
      await this.mapManager.generateMapDebounced(this.browser, false).catch((error: unknown) => {
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
      const pidStr = require('fs').readFileSync(this.pidPath, 'utf-8');
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

    let buffer = '';

    socket.on('data', async (data) => {
      buffer += data.toString();

      // Process complete JSON messages (delimited by newline)
      const messages = buffer.split('\n');
      buffer = messages.pop() || ''; // Keep incomplete message in buffer

      for (const message of messages) {
        if (!message.trim()) continue;

        try {
          const request: IPCRequest = JSON.parse(message);
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
    });

    socket.on('error', (error) => {
      logger.error('Socket error', error);
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

      switch (request.command) {
        case 'navigate':
          result = await this.handleNavigate(request.params);
          break;

        case 'back':
          result = await this.handleBack(request.params);
          break;

        case 'forward':
          result = await this.handleForward(request.params);
          break;

        case 'reload':
          result = await this.handleReload(request.params);
          break;

        case 'click':
          result = await this.handleClick(request.params);
          break;

        case 'fill':
          result = await this.handleFill(request.params);
          break;

        case 'scroll':
          result = await this.handleScroll(request.params);
          break;

        case 'eval':
          result = await this.handleEval(request.params);
          break;

        case 'screenshot':
          result = await this.handleScreenshot(request.params);
          break;

        case 'pdf':
          result = await this.handlePdf(request.params);
          break;

        case 'console':
          result = await this.handleConsole(request.params);
          break;

        case 'wait':
          result = await this.handleWait(request.params);
          break;

        case 'status':
          result = await this.handleStatus();
          break;

        case 'query-map':
          result = await this.handleQueryMap(request.params);
          break;

        case 'generate-map':
          result = await this.handleGenerateMap(request.params);
          break;

        case 'get-map-status':
          result = await this.handleGetMapStatus(request.params);
          break;

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
   * Helper methods for action tracking
   */

  /**
   * Get current URL from browser
   */
  private async getCurrentUrl(): Promise<string> {
    if (!this.browser) return 'unknown';
    try {
      const result = await this.browser.sendCommand<{ result: { value: string } }>(
        'Runtime.evaluate',
        { expression: 'window.location.href', returnByValue: true }
      );
      return result.result?.value || 'unknown';
    } catch {
      return 'unknown';
    }
  }

  /**
   * Execute action with automatic state tracking
   */
  private async executeActionWithTracking<T>(
    actionFn: () => Promise<T>
  ): Promise<{ result: T; tracker: PageChangeTracker }> {
    // Capture state before action
    const urlBefore = await this.getCurrentUrl();

    this.actionInProgress = true;
    this.pageChangeTracker = {
      urlBefore,
      urlAfter: null,
      navigationDetected: false,
      domChangeDetected: false,
      networkActive: false
    };

    try {
      // Execute action
      const result = await actionFn();

      // Capture state after action
      const urlAfter = await this.getCurrentUrl();
      this.pageChangeTracker.urlAfter = urlAfter;
      this.pageChangeTracker.navigationDetected = urlBefore !== urlAfter;

      return { result, tracker: this.pageChangeTracker };
    } finally {
      this.actionInProgress = false;
    }
  }

  /**
   * Wait for map to be ready for a specific URL
   */
  private async waitForMapReady(expectedUrl: string, _timeout: number): Promise<void> {
    logger.debug(`⏳ Waiting for map generation (URL: ${expectedUrl})...`);

    // 1. Check if map exists and has correct URL
    const mapStatus = await this.handleGetMapStatus({}) as MapStatusResult;

    if (!mapStatus.exists || mapStatus.url !== expectedUrl) {
      // Map doesn't exist or has wrong URL - generate new map
      logger.debug(`🔨 Generating new map for: ${expectedUrl}`);
      if (this.mapManager && this.browser) {
        await this.mapManager.generateMapDebounced(this.browser, false);
      }
      // Above await completes only when map generation is fully done
    }

    logger.debug(`✅ Map ready for: ${expectedUrl}`);
  }

  /**
   * Command handlers
   */

  private async handleNavigate(params: Record<string, unknown>): Promise<unknown> {
    if (!this.browser) throw new Error('Browser not connected');
    const url = params.url as string;
    const result = await actions.navigate(this.browser, url);

    // Navigation always changes URL, wait for map
    logger.info(`🔄 Navigating to: ${url}`);
    await this.waitForMapReady(url, 10000);

    return result;
  }

  private async handleBack(_params: Record<string, unknown>): Promise<unknown> {
    if (!this.browser) throw new Error('Browser not connected');
    const result = await actions.goBack(this.browser);

    // Get new URL after navigation
    const newUrl = await this.getCurrentUrl();
    logger.info(`🔄 Navigated back to: ${newUrl}`);
    await this.waitForMapReady(newUrl, 10000);

    return result;
  }

  private async handleForward(_params: Record<string, unknown>): Promise<unknown> {
    if (!this.browser) throw new Error('Browser not connected');
    const result = await actions.goForward(this.browser);

    // Get new URL after navigation
    const newUrl = await this.getCurrentUrl();
    logger.info(`🔄 Navigated forward to: ${newUrl}`);
    await this.waitForMapReady(newUrl, 10000);

    return result;
  }

  private async handleReload(params: Record<string, unknown>): Promise<unknown> {
    if (!this.browser) throw new Error('Browser not connected');
    const hard = params.hard as boolean | undefined;

    // Get current URL before reload
    const currentUrl = await this.getCurrentUrl();
    const result = await actions.reload(this.browser, hard || false);

    // Reload stays on same URL, wait for map
    logger.info(`🔄 Reloading page: ${currentUrl}`);
    await this.waitForMapReady(currentUrl, 10000);

    return result;
  }

  private async handleClick(params: Record<string, unknown>): Promise<unknown> {
    if (!this.browser) throw new Error('Browser not connected');
    let selector = params.selector as string | undefined;

    // Smart Mode: if text provided, query map
    if (params.text && !selector) {
      const { findSelector } = await import('../cdp/map/query-map');
      const { SELECTOR_RETRY_CONFIG } = await import('../cdp/actions/helpers');
      const { getOutputDir } = await import('../cdp/config');
      const path = await import('path');

      const mapPath = path.join(getOutputDir(), SELECTOR_RETRY_CONFIG.MAP_FILENAME);
      logger.debug(`🔍 Smart Mode: querying map at ${mapPath} for text="${params.text}"`);

      const foundSelector = findSelector(mapPath, {
        text: params.text as string,
        index: params.index as number | undefined,
        type: params.type as string | undefined,
        viewportOnly: params.viewportOnly as boolean | undefined
      });

      if (!foundSelector) {
        logger.error(`❌ findSelector returned null for text="${params.text}"`);
        throw new Error(`Element not found in map: "${params.text}"`);
      }

      logger.debug(`✓ Found selector: ${foundSelector}`);
      selector = foundSelector;
    }

    if (!selector) {
      throw new Error('No selector provided');
    }

    // Execute with tracking
    const browser = this.browser;
    const { result, tracker } = await this.executeActionWithTracking(
      () => actions.click(browser, selector)
    );

    // Always regenerate map after click (DOM may have changed, URL may or may not change)
    logger.debug(`🔄 Regenerating map after click (URL: ${tracker.urlBefore} → ${tracker.urlAfter})`);
    if (this.mapManager && this.browser) {
      await this.mapManager.generateMapDebounced(this.browser, false);
    }

    return result;
  }

  private async handleFill(params: Record<string, unknown>): Promise<unknown> {
    if (!this.browser) throw new Error('Browser not connected');
    const selector = params.selector as string;
    const value = params.value as string;

    // Execute with tracking
    const browser = this.browser;
    const { result, tracker } = await this.executeActionWithTracking(
      () => actions.fill(browser, selector, value)
    );

    // Always regenerate map after fill (DOM may have changed, URL may or may not change)
    logger.debug(`🔄 Regenerating map after fill (URL: ${tracker.urlBefore} → ${tracker.urlAfter})`);
    if (this.mapManager && this.browser) {
      await this.mapManager.generateMapDebounced(this.browser, false);
    }

    return result;
  }

  private async handleScroll(params: Record<string, unknown>): Promise<unknown> {
    if (!this.browser) throw new Error('Browser not connected');
    const x = params.x as number;
    const y = params.y as number;
    return actions.scroll(this.browser, { x, y });
  }

  private async handleEval(params: Record<string, unknown>): Promise<unknown> {
    if (!this.browser) throw new Error('Browser not connected');
    const expression = params.expression as string;
    return actions.evaluate(this.browser, expression);
  }

  private async handleScreenshot(params: Record<string, unknown>): Promise<unknown> {
    if (!this.browser) throw new Error('Browser not connected');
    const filename = params.filename as string | undefined;
    return actions.screenshot(this.browser, filename || 'screenshot.png');
  }

  private async handlePdf(params: Record<string, unknown>): Promise<unknown> {
    if (!this.browser) throw new Error('Browser not connected');
    const filename = params.filename as string | undefined;
    const landscape = params.landscape as boolean | undefined;
    return actions.generatePdf(this.browser, filename || 'page.pdf', landscape || false);
  }

  private async handleConsole(params: Record<string, unknown>): Promise<unknown> {
    if (!this.browser) throw new Error('Browser not connected');
    const errorsOnly = params.errorsOnly as boolean | undefined;
    const result = await actions.getConsoleMessages(this.browser, errorsOnly);

    if (params.clear) {
      this.browser.clearConsoleMessages();
    }

    return result;
  }

  private async handleWait(params: Record<string, unknown>): Promise<unknown> {
    if (!this.browser) throw new Error('Browser not connected');
    const duration = params.duration as number | undefined;
    if (duration) {
      // Simple sleep implementation
      await new Promise(resolve => setTimeout(resolve, duration));
      return { success: true, duration };
    } else {
      return actions.waitForLoad(this.browser);
    }
  }

  private async handleStatus(): Promise<DaemonState> {
    if (!this.browser) throw new Error('Browser not connected');
    const currentUrl = await this.browser.sendCommand<{ result: { value: string } }>('Runtime.evaluate', {
      expression: 'window.location.href',
      returnByValue: true
    });

    return {
      connected: true,
      currentUrl: currentUrl.result?.value || null,
      targetId: null, // CDP client doesn't expose targetId directly
      debugPort: this.browser.debugPort,
      consoleMessageCount: this.browser.getConsoleMessages().length,
      networkErrorCount: this.browser.getNetworkErrors().length,
      uptime: Date.now() - this.startTime,
      lastActivity: this.lastActivity
    };
  }

  private async handleQueryMap(params: Record<string, unknown>): Promise<MapQueryResult> {
    const queryParams = params as MapQueryParams;

    // Load map
    const mapPath = join(this.outputDir, SELECTOR_RETRY_CONFIG.MAP_FILENAME);
    const map = loadMap(mapPath);

    // Handle listTypes request
    if (queryParams.listTypes) {
      const types = listTypes(map);
      return {
        count: Object.keys(types).length,
        results: [],
        types,
        total: map.statistics.total
      };
    }

    // Handle listTexts request
    if (queryParams.listTexts) {
      const texts = listTexts(map, {
        type: queryParams.type,
        limit: queryParams.limit,
        offset: queryParams.offset
      });
      return {
        count: texts.length,
        results: [],
        texts,
        total: Object.keys(map.indexes.byText).length
      };
    }

    // Regular query
    const allResults = queryMap(map, { ...queryParams, limit: 0 }); // Get all for total count
    const results = queryMap(map, queryParams); // Get paginated results

    if (results.length === 0 && !queryParams.listTypes && !queryParams.listTexts) {
      throw new Error('No elements found matching query criteria');
    }

    // Return all results in MapQueryResult format
    return {
      count: results.length,
      results: results.map(result => ({
        selector: result.selector,
        alternatives: result.alternatives,
        element: {
          tag: result.element.tag,
          text: result.element.text,
          position: result.element.position
        }
      })),
      total: allResults.length
    };
  }

  private async handleGenerateMap(params: Record<string, unknown>): Promise<MapGenerateResult> {
    if (!this.browser) throw new Error('Browser not connected');
    if (!this.mapManager) throw new Error('MapManager not initialized');

    const generateParams = params as MapGenerateParams;
    const force = generateParams.force ?? false;

    // Get current URL before generation
    const urlResult = await this.browser.sendCommand<{ result: { value: string } }>('Runtime.evaluate', {
      expression: 'window.location.href',
      returnByValue: true
    });
    const currentUrl = urlResult.result?.value || 'unknown';

    // Check if we can use cache
    const cached = !force && this.mapManager.isCacheValid(currentUrl);

    // Generate map
    const map = await this.mapManager.generateMap(this.browser, force);

    return {
      success: true,
      url: map.url,
      elementCount: map.statistics.total,
      timestamp: map.timestamp,
      cached
    };
  }

  private async handleGetMapStatus(_params: Record<string, unknown>): Promise<MapStatusResult> {
    if (!this.browser) throw new Error('Browser not connected');
    if (!this.mapManager) throw new Error('MapManager not initialized');

    // Get current URL
    const urlResult = await this.browser.sendCommand<{ result: { value: string } }>('Runtime.evaluate', {
      expression: 'window.location.href',
      returnByValue: true
    });
    const currentUrl = urlResult.result?.value || 'unknown';

    // Get map status
    return this.mapManager.getMapStatus(currentUrl);
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;

    logger.info('Shutting down Browser Pilot Daemon...');

    // Stop idle timer
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
    }

    // Close IPC server
    if (this.server) {
      this.server.close(() => {
        logger.info('IPC server closed');
      });
    }

    // Close browser
    if (this.browser) {
      try {
        await this.browser.close();
        logger.info('Browser closed');
      } catch (error) {
        logger.error('Error closing browser', error);
      }
    }

    // Clean up socket file (Unix only)
    if (process.platform !== 'win32' && existsSync(this.socketPath)) {
      unlinkSync(this.socketPath);
      logger.info('Socket file removed');
    }

    // Remove PID file
    if (existsSync(this.pidPath)) {
      unlinkSync(this.pidPath);
      logger.info('PID file removed');
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
