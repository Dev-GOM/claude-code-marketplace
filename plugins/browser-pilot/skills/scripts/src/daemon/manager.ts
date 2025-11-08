/**
 * Daemon Process Manager
 * Handles starting, stopping, and checking status of the Browser Pilot Daemon
 */

import { spawn, ChildProcess, execSync } from 'child_process';
import { join, basename } from 'path';
import { existsSync, unlinkSync } from 'fs';
import { readFile } from 'fs/promises';
import * as net from 'net';
import { getOutputDir, loadSharedConfig, saveSharedConfig } from '../cdp/config';
import { IPCClient } from './client';
import {
  PID_FILENAME,
  SOCKET_PATH_PREFIX,
  DaemonState,
  MapQueryParams,
  MapQueryResult,
  MapGenerateParams,
  MapGenerateResult,
  MapStatusResult,
  getProjectSocketName
} from './protocol';
import { logger } from '../utils/logger';
import { getLocalTimestamp } from '../utils/timestamp';
import { TIMING, DAEMON } from '../constants';

export class DaemonManager {
  private outputDir: string;
  private pidPath: string;
  private socketPath: string;
  private cachedPid: { pid: number | null; timestamp: number } | null = null;
  private readonly PID_CACHE_TTL = 1000; // 1 second

  constructor() {
    this.outputDir = getOutputDir();
    this.pidPath = join(this.outputDir, PID_FILENAME);
    this.socketPath = this.getSocketPath();
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
   * Start daemon process with retry and port fallback
   */
  async start(options: { verbose?: boolean; initialUrl?: string } = {}): Promise<void> {
    const { verbose = true, initialUrl } = options;

    // Check if already running
    if (await this.isRunning()) {
      if (verbose) {
        console.log('✓ Daemon is already running');
      }
      return;
    }

    if (verbose) {
      console.log('🚀 Starting Browser Pilot Daemon...');
    }

    // Get path to server.js (compiled output)
    const serverPath = join(__dirname, 'server.js');

    if (!existsSync(serverPath)) {
      throw new Error(`Daemon server not found at ${serverPath}. Did you run 'npm run build'?`);
    }

    // Try starting with retry logic
    const maxRetries = 2;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Prepare environment variables
        const env = { ...process.env };
        if (initialUrl) {
          env.BP_INITIAL_URL = initialUrl;
          if (verbose && attempt === 1) {
            logger.info(`Setting initial URL: ${initialUrl}`);
          }
        }

        // Spawn daemon as detached process
        const daemon: ChildProcess = spawn(process.execPath, [serverPath], {
          detached: true,
          stdio: 'ignore', // Don't inherit stdio
          cwd: process.cwd(),
          env // Pass environment variables
        });

        // Detach the process so it continues running when parent exits
        daemon.unref();

        // Wait a bit for daemon to start
        await this.waitForDaemon(DAEMON.IPC_TIMEOUT);

        if (verbose) {
          console.log('✓ Daemon started successfully');
        }
        return; // Success!
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (verbose) {
          console.log(`⚠️  Attempt ${attempt}/${maxRetries} failed: ${lastError.message}`);
        }

        // Stop any partially started daemon
        if (await this.isRunning()) {
          if (verbose) {
            console.log('🛑 Stopping partially started daemon...');
          }
          try {
            await this.stop({ verbose: false, force: true });
          } catch (stopError) {
            const errorMessage = stopError instanceof Error ? stopError.message : String(stopError);
            logger.warn(`Failed to stop partially started daemon: ${errorMessage}`);
            // Continue to next retry
          }
        }

        // On last retry, try changing port
        if (attempt === maxRetries) {
          if (verbose) {
            console.log('🔄 Attempting automatic port change...');
          }

          try {
            await this.changePortAutomatically(verbose);

            // One more attempt with new port
            if (verbose) {
              console.log('🚀 Retrying with new port...');
            }

            const env = { ...process.env };
            if (initialUrl) {
              env.BP_INITIAL_URL = initialUrl;
            }

            const daemon: ChildProcess = spawn(process.execPath, [serverPath], {
              detached: true,
              stdio: 'ignore',
              cwd: process.cwd(),
              env
            });

            daemon.unref();
            await this.waitForDaemon(DAEMON.IPC_TIMEOUT);

            if (verbose) {
              console.log('✓ Daemon started successfully with new port');
            }
            return; // Success with new port!
          } catch (portChangeError) {
            if (verbose) {
              console.log(`⚠️  Port change also failed: ${(portChangeError as Error).message}`);
            }
          }
        }

        // Wait a bit before retrying
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    // All retries failed
    throw new Error(`Failed to start daemon after ${maxRetries} attempts. Last error: ${lastError?.message || 'Unknown'}`);
  }

  /**
   * Change port automatically to find available port
   */
  private async changePortAutomatically(verbose: boolean): Promise<void> {
    const projectRoot = process.env.CLAUDE_PROJECT_DIR || process.cwd();
    const projectName = basename(projectRoot);
    const config = loadSharedConfig();
    const projectConfig = config.projects[projectName];

    if (!projectConfig) {
      throw new Error('Project configuration not found');
    }

    const oldPort = projectConfig.port;
    const newPort = await this.findAvailablePort(oldPort);

    if (verbose) {
      console.log(`📍 Changing port: ${oldPort} → ${newPort}`);
    }

    projectConfig.port = newPort;
    projectConfig.lastUsed = getLocalTimestamp();
    saveSharedConfig(config);
  }

  /**
   * Find available port starting from base + 1
   */
  private async findAvailablePort(basePort: number): Promise<number> {
    const MAX_PORTS = 100;
    const timeout = 10000; // 10 seconds total timeout
    const startTime = Date.now();

    for (let port = basePort + 1; port < basePort + MAX_PORTS; port++) {
      if (Date.now() - startTime > timeout) {
        throw new Error('Timeout while searching for available port');
      }

      if (await this.isPortAvailable(port)) {
        return port;
      }
    }
    throw new Error(`No available ports found in range ${basePort + 1}-${basePort + MAX_PORTS}`);
  }

  /**
   * Check if port is available
   */
  private async isPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = net.createServer();
      let resolved = false;

      const cleanup = () => {
        if (!resolved) {
          resolved = true;
          try {
            server.close();
          } catch (error) {
            // Ignore close errors
          }
        }
      };

      const timeout = setTimeout(() => {
        cleanup();
        resolve(false); // Timeout = not available
      }, 2000);

      server.once('error', () => {
        clearTimeout(timeout);
        cleanup();
        resolve(false);
      });

      server.once('listening', () => {
        clearTimeout(timeout);
        cleanup();
        resolve(true);
      });

      server.listen(port, '127.0.0.1');
    });
  }

  /**
   * Stop daemon process
   */
  async stop(options: { verbose?: boolean; force?: boolean } = {}): Promise<void> {
    const { verbose = true, force = false } = options;

    if (!(await this.isRunning())) {
      if (verbose) {
        console.log('⚠️  Daemon is not running');
      }
      return;
    }

    if (verbose) {
      console.log('🛑 Stopping Browser Pilot Daemon...');
    }

    try {
      // Try graceful shutdown via IPC first
      if (!force) {
        const client = new IPCClient();
        await client.sendRequest('shutdown', {}, DAEMON.IPC_TIMEOUT);
        client.close();

        // Wait for daemon to stop
        await this.waitForStop(DAEMON.IPC_TIMEOUT);

        if (verbose) {
          console.log('✓ Daemon stopped gracefully');
        }
        return;
      }
    } catch (_error) {
      if (verbose) {
        logger.warn('Graceful shutdown failed, forcing...');
      }
    }

    // Force kill if graceful shutdown failed
    const pid = await this.getPid();
    if (pid) {
      try {
        process.kill(pid, 'SIGTERM');

        // Wait a bit
        await new Promise(resolve => setTimeout(resolve, TIMING.POLLING_INTERVAL_SLOW));

        // Check if still running
        try {
          process.kill(pid, 0);
          // Still running, force kill
          process.kill(pid, 'SIGKILL');
        } catch (_error) {
          // Process is gone, good
        }

        if (verbose) {
          console.log('✓ Daemon stopped (forced)');
        }
      } catch (_error) {
        // Process already gone
        if (verbose) {
          console.log('✓ Daemon stopped');
        }
      }

      // Clean up PID file
      if (existsSync(this.pidPath)) {
        unlinkSync(this.pidPath);
      }

      // Clean up socket file (Unix only)
      if (process.platform !== 'win32' && existsSync(this.socketPath)) {
        unlinkSync(this.socketPath);
      }
    }
  }

  /**
   * Restart daemon
   */
  async restart(options: { verbose?: boolean } = {}): Promise<void> {
    await this.stop(options);
    await new Promise(resolve => setTimeout(resolve, TIMING.ACTION_DELAY_NAVIGATION)); // Wait a bit
    await this.start(options);
  }

  /**
   * Get daemon status
   */
  async getStatus(options: { verbose?: boolean } = {}): Promise<DaemonState | null> {
    const { verbose = true } = options;

    if (!(await this.isRunning())) {
      if (verbose) {
        console.log('❌ Daemon is not running');
      }
      return null;
    }

    try {
      const client = new IPCClient();
      const response = await client.sendRequest('status', {}, DAEMON.IPC_TIMEOUT);
      client.close();

      const state = response.data as DaemonState;

      if (verbose) {
        console.log('\n📊 Daemon Status:');
        console.log(`  Connected: ${state.connected ? '✓' : '✗'}`);
        console.log(`  Current URL: ${state.currentUrl || 'N/A'}`);
        console.log(`  Debug Port: ${state.debugPort || 'N/A'}`);
        console.log(`  Console Messages: ${state.consoleMessageCount}`);
        console.log(`  Network Errors: ${state.networkErrorCount}`);
        console.log(`  Uptime: ${Math.floor(state.uptime / TIMING.ACTION_DELAY_NAVIGATION)}s`);
        console.log(`  Last Activity: ${new Date(state.lastActivity).toLocaleTimeString()}`);
      }

      return state;
    } catch (error) {
      if (verbose) {
        logger.error('Failed to get daemon status', error);
      }
      return null;
    }
  }

  /**
   * Check if daemon is running
   */
  async isRunning(): Promise<boolean> {
    const pid = await this.getPid();
    if (!pid) {
      return false;
    }

    try {
      // Signal 0 checks if process exists without killing it
      process.kill(pid, 0);
      return true;
    } catch (_error) {
      // Process doesn't exist, clean up stale PID file and invalidate cache
      this.cachedPid = null;
      if (existsSync(this.pidPath)) {
        unlinkSync(this.pidPath);
      }
      return false;
    }
  }

  /**
   * Get daemon PID from PID file (with caching, async for non-blocking I/O)
   */
  private async getPid(): Promise<number | null> {
    // Use cached value if available and fresh
    if (this.cachedPid && Date.now() - this.cachedPid.timestamp < this.PID_CACHE_TTL) {
      return this.cachedPid.pid;
    }

    if (!existsSync(this.pidPath)) {
      this.cachedPid = { pid: null, timestamp: Date.now() };
      return null;
    }

    try {
      const pidStr = await readFile(this.pidPath, 'utf-8');
      const pid = parseInt(pidStr.trim(), 10);
      const result = isNaN(pid) ? null : pid;
      this.cachedPid = { pid: result, timestamp: Date.now() };
      return result;
    } catch (_error) {
      this.cachedPid = { pid: null, timestamp: Date.now() };
      return null;
    }
  }

  /**
   * Wait for daemon to start
   */
  private async waitForDaemon(timeout: number): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (await this.isRunning()) {
        // Also check if socket is available
        if (existsSync(this.socketPath) || process.platform === 'win32') {
          return;
        }
      }

      await new Promise(resolve => setTimeout(resolve, TIMING.POLLING_INTERVAL_FAST));
    }

    throw new Error('Daemon failed to start within timeout period');
  }

  /**
   * Wait for daemon to stop
   */
  private async waitForStop(timeout: number): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (!(await this.isRunning())) {
        return;
      }

      await new Promise(resolve => setTimeout(resolve, TIMING.POLLING_INTERVAL_FAST));
    }

    throw new Error('Daemon failed to stop within timeout period');
  }

  /**
   * Ensure daemon is running (auto-start if needed)
   */
  async ensureRunning(options: { verbose?: boolean; initialUrl?: string } = {}): Promise<void> {
    if (!(await this.isRunning())) {
      await this.start(options);
    }
  }

  /**
   * Query interaction map for elements
   */
  async queryMap(params: MapQueryParams, options: { verbose?: boolean } = {}): Promise<MapQueryResult> {
    const { verbose = true } = options;

    await this.ensureRunning({ verbose: false });

    try {
      const client = new IPCClient();
      const response = await client.sendRequest('query-map', params as Record<string, unknown>, TIMING.WAIT_FOR_LOAD_STATE);
      client.close();

      const result = response.data as MapQueryResult;

      if (verbose) {
        console.log('\n🔍 Map Query Result:');
        console.log(`  Total matches: ${result.count}`);
        if (result.count > 0) {
          const firstResult = result.results[0];
          console.log(`  Best Selector: ${firstResult.selector}`);
          console.log(`  Element: ${firstResult.element.tag} - "${firstResult.element.text || '(no text)'}"`);
          console.log(`  Position: (${firstResult.element.position.x}, ${firstResult.element.position.y})`);
          if (firstResult.alternatives.length > 0) {
            console.log(`  Alternatives: ${firstResult.alternatives.length} available`);
          }
        }
      }

      return result;
    } catch (error) {
      if (verbose) {
        logger.error('Map query failed', error);
      }
      throw error;
    }
  }

  /**
   * Generate interaction map for current page
   */
  async generateMap(params: MapGenerateParams, options: { verbose?: boolean } = {}): Promise<MapGenerateResult> {
    const { verbose = true } = options;

    await this.ensureRunning({ verbose: false });

    try {
      const client = new IPCClient();
      const response = await client.sendRequest('generate-map', params as Record<string, unknown>, TIMING.WAIT_FOR_LOAD_STATE + DAEMON.IPC_TIMEOUT);
      client.close();

      const result = response.data as MapGenerateResult;

      if (verbose) {
        console.log('\n🗺️  Interaction Map Generated:');
        console.log(`  URL: ${result.url}`);
        console.log(`  Elements: ${result.elementCount}`);
        console.log(`  Timestamp: ${result.timestamp}`);
        console.log(`  Cached: ${result.cached ? '✓' : '✗'}`);
      }

      return result;
    } catch (error) {
      if (verbose) {
        logger.error('Map generation failed', error);
      }
      throw error;
    }
  }

  /**
   * Get interaction map status
   */
  async getMapStatus(options: { verbose?: boolean } = {}): Promise<MapStatusResult> {
    const { verbose = true } = options;

    await this.ensureRunning({ verbose: false });

    try {
      const client = new IPCClient();
      const response = await client.sendRequest('get-map-status', {}, DAEMON.IPC_TIMEOUT);
      client.close();

      const result = response.data as MapStatusResult;

      if (verbose) {
        console.log('\n📊 Interaction Map Status:');
        console.log(`  Exists: ${result.exists ? '✓' : '✗'}`);
        if (result.exists) {
          console.log(`  URL: ${result.url || 'N/A'}`);
          console.log(`  Elements: ${result.elementCount}`);
          console.log(`  Timestamp: ${result.timestamp || 'N/A'}`);
          console.log(`  Cache Valid: ${result.cacheValid ? '✓' : '✗ (expired)'}`);
        }
      }

      return result;
    } catch (error) {
      if (verbose) {
        logger.error('Failed to get map status', error);
      }
      throw error;
    }
  }
}
