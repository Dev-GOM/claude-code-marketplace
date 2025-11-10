/**
 * Daemon Process Manager
 * Handles starting, stopping, and checking status of the Blender Toolkit Daemon
 */

import { spawn } from 'child_process';
import { join } from 'path';
import { existsSync, readFileSync, unlinkSync } from 'fs';
import { getOutputDir } from '../blender/config';
import { IPCClient } from './client';
import { PID_FILENAME, DaemonState, DAEMON_COMMANDS } from './protocol';
import { DAEMON, TIMING } from '../constants';
import { logger } from '../utils/logger';

export class DaemonManager {
  private outputDir: string;
  private pidPath: string;

  constructor() {
    this.outputDir = getOutputDir();
    this.pidPath = join(this.outputDir, PID_FILENAME);
  }

  /**
   * Start daemon process
   */
  async start(options: { verbose?: boolean } = {}): Promise<void> {
    const { verbose = true } = options;

    // Check if already running
    if (await this.isRunning()) {
      if (verbose) {
        console.log(' Daemon is already running');
      }
      return;
    }

    if (verbose) {
      console.log('=€ Starting Blender Toolkit Daemon...');
    }

    // Get path to server.js (compiled output)
    const serverPath = join(__dirname, 'server.js');

    if (!existsSync(serverPath)) {
      throw new Error(`Daemon server not found at ${serverPath}. Did you run 'npm run build'?`);
    }

    // Spawn daemon as detached process
    const daemon = spawn(process.execPath, [serverPath], {
      detached: true,
      stdio: 'ignore',
      cwd: process.cwd(),
      env: process.env
    });

    // Detach the process so it continues running when parent exits
    daemon.unref();

    // Wait for daemon to start
    await this.waitForDaemon();

    if (verbose) {
      console.log(' Daemon started successfully');
    }
  }

  /**
   * Wait for daemon to be ready
   */
  private async waitForDaemon(): Promise<void> {
    const maxAttempts = 10;
    const delay = 500; // 500ms

    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, delay));

      if (await this.isRunning()) {
        return;
      }
    }

    throw new Error('Daemon failed to start');
  }

  /**
   * Stop daemon process
   */
  async stop(options: { verbose?: boolean; force?: boolean } = {}): Promise<void> {
    const { verbose = true, force = false } = options;

    if (!(await this.isRunning())) {
      if (verbose) {
        console.log('Daemon is not running');
      }
      return;
    }

    if (verbose) {
      console.log('=Ñ Stopping Blender Toolkit Daemon...');
    }

    if (force) {
      // Force kill via PID
      await this.forceKill();
    } else {
      // Graceful shutdown via IPC
      try {
        const client = new IPCClient();
        await client.sendRequest(DAEMON_COMMANDS.SHUTDOWN, {});
        client.close();

        // Wait for shutdown
        await this.waitForShutdown();
      } catch (error) {
        if (verbose) {
          console.log('   Graceful shutdown failed, force killing...');
        }
        await this.forceKill();
      }
    }

    if (verbose) {
      console.log(' Daemon stopped');
    }
  }

  /**
   * Force kill daemon process
   */
  private async forceKill(): Promise<void> {
    if (!existsSync(this.pidPath)) {
      return;
    }

    try {
      const pidStr = readFileSync(this.pidPath, 'utf-8').trim();
      const pid = parseInt(pidStr, 10);

      if (isNaN(pid) || pid <= 0) {
        logger.warn(`Invalid PID in ${this.pidPath}: ${pidStr}`);
        unlinkSync(this.pidPath);
        return;
      }

      // Kill process
      try {
        process.kill(pid, 'SIGTERM');
        await new Promise(resolve => setTimeout(resolve, 1000));

        // If still running, force kill
        if (this.isProcessRunning(pid)) {
          process.kill(pid, 'SIGKILL');
        }
      } catch (error) {
        // Process might already be dead
      }

      // Remove PID file
      if (existsSync(this.pidPath)) {
        unlinkSync(this.pidPath);
      }
    } catch (error) {
      logger.error('Force kill failed:', error);
    }
  }

  /**
   * Wait for daemon to shutdown
   */
  private async waitForShutdown(): Promise<void> {
    const maxAttempts = 10;
    const delay = 500; // 500ms

    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, delay));

      if (!(await this.isRunning())) {
        return;
      }
    }

    throw new Error('Daemon failed to shutdown gracefully');
  }

  /**
   * Restart daemon
   */
  async restart(options: { verbose?: boolean } = {}): Promise<void> {
    const { verbose = true } = options;

    if (verbose) {
      console.log('= Restarting Blender Toolkit Daemon...');
    }

    await this.stop({ verbose: false });
    await this.start({ verbose: false });

    if (verbose) {
      console.log(' Daemon restarted');
    }
  }

  /**
   * Get daemon status
   */
  async getStatus(options: { verbose?: boolean } = {}): Promise<DaemonState | null> {
    const { verbose = true } = options;

    if (!(await this.isRunning())) {
      if (verbose) {
        console.log('Daemon is not running');
      }
      return null;
    }

    try {
      const client = new IPCClient();
      const response = await client.sendRequest(DAEMON_COMMANDS.GET_STATUS, {});
      client.close();

      const state = response.data as DaemonState;

      if (verbose) {
        console.log('Daemon Status:');
        console.log(`  Connected to Blender: ${state.connected ? 'Yes' : 'No'}`);
        console.log(`  Blender Port: ${state.port}`);
        console.log(`  Uptime: ${Math.floor(state.uptime / 1000)}s`);
        console.log(`  Last Activity: ${Math.floor((Date.now() - state.lastActivity) / 1000)}s ago`);
      }

      return state;
    } catch (error) {
      if (verbose) {
        console.error('Failed to get status:', error);
      }
      return null;
    }
  }

  /**
   * Check if daemon is running
   */
  async isRunning(): Promise<boolean> {
    if (!existsSync(this.pidPath)) {
      return false;
    }

    try {
      const pidStr = readFileSync(this.pidPath, 'utf-8').trim();
      const pid = parseInt(pidStr, 10);

      if (isNaN(pid) || pid <= 0) {
        return false;
      }

      return this.isProcessRunning(pid);
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if process is running by PID
   */
  private isProcessRunning(pid: number): boolean {
    try {
      // Signal 0 checks if process exists without killing it
      process.kill(pid, 0);
      return true;
    } catch (error) {
      return false;
    }
  }
}
