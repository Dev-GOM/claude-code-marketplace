/**
 * Unity WebSocket Configuration Management
 *
 * Handles loading and saving shared configuration file.
 * Config file location: ${CLAUDE_PLUGIN_ROOT}/skills/unity-websocket-config.json
 */

import * as fs from 'fs';
import * as path from 'path';
import { FS, ENV } from '@/constants';
import * as logger from './logger';

/**
 * Constants
 */
const HEARTBEAT_STALE_SECONDS = 30;

/**
 * Server status interface (from .unity-websocket/server-status.json)
 */
export interface ServerStatus {
  version: string;
  port: number;
  isRunning: boolean;
  pid: number;
  editorVersion: string;
  startedAt: string;
  lastHeartbeat: string;
}

// Legacy shared config interfaces - deprecated, kept for reference only
// Server now uses .unity-websocket/server-status.json instead

// Legacy shared config functions removed - no longer needed
// Server status is now managed via .unity-websocket/server-status.json

/**
 * Get project root directory
 */
export function getProjectRoot(): string {
  const projectRoot = process.env[ENV.PROJECT_DIR];
  if (!projectRoot) {
    throw new Error(`${ENV.PROJECT_DIR} environment variable not set`);
  }
  return path.resolve(projectRoot);
}

/**
 * Get project name from root directory
 */
export function getProjectName(projectRoot?: string): string {
  const root = projectRoot || getProjectRoot();
  return path.basename(root);
}

/**
 * Check if current directory is a Unity project
 */
export function isUnityProject(projectRoot?: string): boolean {
  const root = projectRoot || getProjectRoot();
  const assetsDir = path.join(root, 'Assets');
  const projectSettingsDir = path.join(root, 'ProjectSettings');
  return fs.existsSync(assetsDir) && fs.existsSync(projectSettingsDir);
}

/**
 * Get Unity project output directory
 */
export function getOutputDir(projectRoot?: string): string {
  const root = projectRoot || getProjectRoot();
  return path.join(root, FS.OUTPUT_DIR);
}

/**
 * Get server status file path
 */
export function getServerStatusPath(projectRoot?: string): string {
  const root = projectRoot || getProjectRoot();
  return path.join(root, '.unity-websocket', 'server-status.json');
}

/**
 * Read server status from .unity-websocket/server-status.json
 */
export function readServerStatus(projectRoot?: string): ServerStatus | null {
  try {
    const statusPath = getServerStatusPath(projectRoot);

    if (!fs.existsSync(statusPath)) {
      logger.debug('Server status file not found');
      return null;
    }

    const data = fs.readFileSync(statusPath, 'utf-8');
    const status = JSON.parse(data) as ServerStatus;

    // Validate required fields
    if (
      typeof status.port !== 'number' ||
      typeof status.isRunning !== 'boolean' ||
      typeof status.lastHeartbeat !== 'string'
    ) {
      logger.warn('Invalid server status structure');
      return null;
    }

    return status;
  } catch (error) {
    logger.debug(`Failed to read server status: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

/**
 * Check if server status is stale (heartbeat > configured seconds old)
 */
export function isServerStatusStale(status: ServerStatus): boolean {
  try {
    if (!status.lastHeartbeat) {
      return true;
    }

    const lastBeat = new Date(status.lastHeartbeat);
    const now = new Date();
    const secondsSinceLastBeat = (now.getTime() - lastBeat.getTime()) / 1000;

    return secondsSinceLastBeat > HEARTBEAT_STALE_SECONDS;
  } catch (error) {
    logger.debug(`Failed to check heartbeat: ${error instanceof Error ? error.message : String(error)}`);
    return true;
  }
}

/**
 * Get Unity WebSocket server port
 *
 * Reads port from server-status.json written by Unity server.
 * Returns null if server is not running or status is stale.
 */
export function getUnityPort(projectRoot?: string): number | null {
  const root = projectRoot || getProjectRoot();

  // Read from server-status.json (current running server)
  const status = readServerStatus(root);
  if (status && status.isRunning && !isServerStatusStale(status)) {
    logger.debug(`Using port ${status.port} from server status`);
    return status.port;
  }

  logger.debug('No active Unity server detected');
  return null;
}
