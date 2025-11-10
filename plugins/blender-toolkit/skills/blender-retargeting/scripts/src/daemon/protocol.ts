/**
 * IPC Protocol definitions for Blender Toolkit Daemon
 */

import { createHash } from 'crypto';
import { basename } from 'path';

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
  port: number | null;
  host: string;
  uptime: number;
  lastActivity: number;
  blenderVersion?: string;
}

/**
 * File names and paths
 */
export const PID_FILENAME = 'daemon.pid';
export const SOCKET_PATH_PREFIX = 'daemon';

/**
 * Get project-specific socket name for daemon IPC
 * Same logic as browser-pilot
 */
export function getProjectSocketName(projectRoot?: string): string {
  const root = projectRoot || process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const projectName = basename(root)
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .toLowerCase();

  // Add hash of full path to prevent collision
  const hash = createHash('sha256')
    .update(root)
    .digest('hex')
    .substring(0, 8);

  return `${SOCKET_PATH_PREFIX}-${projectName}-${hash}`;
}

/**
 * Daemon commands
 */
export const DAEMON_COMMANDS = {
  // Status commands
  PING: 'ping',
  GET_STATUS: 'get-status',
  SHUTDOWN: 'shutdown',

  // Blender commands (pass-through to Blender WebSocket)
  BLENDER_COMMAND: 'blender-command',
} as const;

export type DaemonCommand = typeof DAEMON_COMMANDS[keyof typeof DAEMON_COMMANDS];
