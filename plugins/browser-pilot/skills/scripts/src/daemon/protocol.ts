/**
 * IPC Protocol definitions for Browser Pilot Daemon
 */

// Type imports for protocol definitions (used by type definitions below)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ConsoleMessage, NetworkError, FormattedConsoleMessage } from '../cdp/browser';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { QueryOptions, QueryResult, InteractionMap, InteractionElement } from '../cdp/map/query-map';

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
  currentUrl: string | null;
  targetId: string | null;
  debugPort: number | null;
  consoleMessageCount: number;
  networkErrorCount: number;
  uptime: number;
  lastActivity: number;
}

/**
 * Command-specific parameter interfaces
 */

export interface NavigateParams {
  url: string;
  waitForLoad?: boolean;
  timeout?: number;
}

export interface ClickParams {
  selector: string;
  waitForSelector?: boolean;
  timeout?: number;
}

export interface FillParams {
  selector: string;
  value: string;
  clear?: boolean;
}

export interface ScrollParams {
  x: number;
  y: number;
}

export interface EvaluateParams {
  expression: string;
  returnByValue?: boolean;
}

export interface ScreenshotParams {
  filename?: string;
  fullPage?: boolean;
  quality?: number;
}

export interface ConsoleParams {
  errorsOnly?: boolean;
  clear?: boolean;
}

export interface WaitParams {
  selector?: string;
  timeout?: number;
  duration?: number;
}

/**
 * Map-related parameter interfaces
 */

export interface MapQueryParams extends QueryOptions {
  // Extends QueryOptions which already has: text, type, index, viewportOnly, id
}

export interface MapGenerateParams {
  force?: boolean;
  useCache?: boolean;
}

/**
 * Command result interfaces
 */

export interface ConsoleResult {
  messages: FormattedConsoleMessage[];
  count: number;
  errorCount: number;
  warningCount: number;
  logCount: number;
}

export interface NavigateResult {
  url: string;
  title?: string;
}

export interface ScreenshotResult {
  path: string;
  size: number;
}

/**
 * Map-related result interfaces
 */

export interface MapQueryResultItem {
  selector: string;
  alternatives: string[];
  element: {
    tag: string;
    text: string | undefined;
    position: { x: number; y: number };
  };
}

export interface MapQueryResult {
  count: number;
  results: MapQueryResultItem[];
  // Optional fields for list operations
  types?: Record<string, number>;  // For listTypes
  texts?: Array<{ text: string; type: string; count: number }>;  // For listTexts
  total?: number;  // Total count before pagination
}

export interface MapStatusResult {
  exists: boolean;
  url: string | null;
  timestamp: string | null;
  elementCount: number;
  cacheValid: boolean;
}

export interface MapGenerateResult {
  success: boolean;
  url: string;
  elementCount: number;
  timestamp: string;
  cached: boolean;
}

/**
 * Protocol constants
 */

export const SOCKET_PATH_PREFIX = 'daemon';
export const PID_FILENAME = 'daemon.pid';
export const STATE_FILENAME = 'daemon-state.json';
export const DEFAULT_TIMEOUT = 30000; // 30 seconds
export const IDLE_SHUTDOWN_TIMEOUT = 1800000; // 30 minutes

/**
 * Get project-specific socket name
 * Uses project folder name + path hash to create unique socket for each project
 */
export function getProjectSocketName(): string {
  const { basename } = require('path');
  const { findProjectRoot } = require('../cdp/utils');
  const { createHash } = require('crypto');

  const projectRoot = findProjectRoot();
  const projectName = basename(projectRoot)
    .replace(/[^a-zA-Z0-9_-]/g, '-')  // Replace special chars with hyphen
    .toLowerCase();

  // Add hash of full path to prevent collision
  const hash = createHash('sha256')
    .update(projectRoot)
    .digest('hex')
    .substring(0, 8); // Use first 8 chars for brevity

  return `${SOCKET_PATH_PREFIX}-${projectName}-${hash}`;
}

/**
 * Protocol errors
 */

export class IPCError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = 'IPCError';
  }
}

export const IPCErrorCodes = {
  TIMEOUT: 'TIMEOUT',
  DAEMON_NOT_RUNNING: 'DAEMON_NOT_RUNNING',
  DAEMON_ALREADY_RUNNING: 'DAEMON_ALREADY_RUNNING',
  BROWSER_NOT_CONNECTED: 'BROWSER_NOT_CONNECTED',
  COMMAND_FAILED: 'COMMAND_FAILED',
  INVALID_REQUEST: 'INVALID_REQUEST',
  CONNECTION_ERROR: 'CONNECTION_ERROR'
} as const;

/**
 * Daemon command constants
 */
export const DAEMON_COMMANDS = {
  // Navigation
  NAVIGATE: 'navigate',
  BACK: 'back',
  FORWARD: 'forward',
  RELOAD: 'reload',
  // Interaction
  CLICK: 'click',
  FILL: 'fill',
  HOVER: 'hover',
  PRESS: 'press',
  TYPE: 'type',
  // Capture
  SCREENSHOT: 'screenshot',
  PDF: 'pdf',
  // Data
  EXTRACT: 'extract',
  CONTENT: 'content',
  FIND: 'find',
  EVAL: 'eval',
  // Console
  CONSOLE: 'console',
  // Wait
  WAIT: 'wait',
  WAIT_IDLE: 'wait-idle',
  SLEEP: 'sleep',
  // Scroll
  SCROLL: 'scroll',
  // Daemon management
  DAEMON_STATUS: 'daemon-status',
  DAEMON_STOP: 'daemon-stop',
  // Map operations
  QUERY_MAP: 'query-map',
  GENERATE_MAP: 'generate-map',
  GET_MAP_STATUS: 'get-map-status'
} as const;

export type DaemonCommand = typeof DAEMON_COMMANDS[keyof typeof DAEMON_COMMANDS];
