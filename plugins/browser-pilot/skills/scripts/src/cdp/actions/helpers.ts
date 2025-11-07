/**
 * Helper functions for Browser Pilot actions.
 */

import { ChromeBrowser } from '../browser';
import { resolve, dirname } from 'path';
import { mkdirSync, existsSync } from 'fs';
import { getOutputDir } from '../config';
import { waitForNetworkIdle } from './wait';
import { logger } from '../../utils/logger';
import { TIMING, FS } from '../../constants';

// ActionResult interface - will be exported from main actions.ts
interface ActionResult {
  success: boolean;
  [key: string]: unknown;
}

// Export for internal use within actions modules
export type { ActionResult };

/**
 * CDP Runtime.evaluate response type
 */
export interface RuntimeEvaluateResult {
  result?: {
    type?: string;
    value?: unknown;
    description?: string;
  };
  exceptionDetails?: {
    exception?: {
      description?: string;
    };
    text?: string;
    timestamp?: number;
    url?: string;
    lineNumber?: number;
  };
}

/**
 * Log level for error and warning reporting
 */
export type LogLevel = 'all' | 'errors-only' | 'none';

/**
 * Constants for error checking and timing
 */
const RECENT_MESSAGE_TIMEOUT_MS = TIMING.RECENT_MESSAGE_WINDOW;
const NAVIGATION_WAIT_DELAY_MS = TIMING.NETWORK_IDLE_TIMEOUT;

/**
 * Constants for selector retry logic
 */
export const SELECTOR_RETRY_CONFIG = {
  MAX_ATTEMPTS: 3,
  MAP_FILENAME: FS.INTERACTION_MAP_FILE,
  MAP_FOLDER: FS.OUTPUT_DIR
} as const;

/**
 * Action options interface
 */
export interface ActionOptions {
  verbose?: boolean; // Enable/disable logging (default: true)
  logLevel?: LogLevel; // Log level for errors/warnings (default: 'all')
  waitForNavigation?: boolean; // Wait for page navigation after action (default: false)
}

/**
 * Default action options
 */
export const DEFAULT_OPTIONS: ActionOptions = {
  verbose: true,
  logLevel: 'all',
  waitForNavigation: false
};

/**
 * Helper: Merge user options with defaults
 */
export function mergeOptions(options?: ActionOptions): Required<ActionOptions> {
  return {
    verbose: options?.verbose ?? (DEFAULT_OPTIONS.verbose as boolean),
    logLevel: options?.logLevel ?? (DEFAULT_OPTIONS.logLevel as LogLevel),
    waitForNavigation: options?.waitForNavigation ?? (DEFAULT_OPTIONS.waitForNavigation as boolean)
  };
}

/**
 * Helper: Sleep for specified milliseconds.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Helper: Check browser console and network for errors and warnings after an action.
 * @param browser - ChromeBrowser instance
 * @param logLevel - Log level ('all', 'errors-only', 'none')
 */
export function checkErrors(browser: ChromeBrowser, logLevel: LogLevel = 'all'): void {
  if (logLevel === 'none') {
    return; // Skip logging
  }

  const messages = browser.getConsoleMessages();
  const networkErrors = browser.getNetworkErrors();

  // Filter for errors and warnings from recent messages
  const recentMessages = messages.filter(msg => {
    const age = Date.now() - msg.timestamp;
    return age < RECENT_MESSAGE_TIMEOUT_MS;
  });

  const recentNetworkErrors = networkErrors.filter(err => {
    const age = Date.now() - err.timestamp;
    return age < RECENT_MESSAGE_TIMEOUT_MS;
  });

  const consoleErrors = recentMessages.filter(msg => msg.level === 'error');
  const consoleWarnings = recentMessages.filter(msg => msg.level === 'warning');

  // Console Errors
  if (consoleErrors.length > 0) {
    logger.error(`\n❌ ${consoleErrors.length} console error(s) detected:`);
    consoleErrors.forEach((err, idx) => {
      logger.error(`   ${idx + 1}. ${err.text}`);
      if (err.url) {
        logger.error(`      at ${err.url}:${err.lineNumber || 0}`);
      }
    });
  }

  // Console Warnings (only if logLevel is 'all')
  if (logLevel === 'all' && consoleWarnings.length > 0) {
    logger.warn(`\n⚠️  ${consoleWarnings.length} console warning(s) detected:`);
    consoleWarnings.forEach((warn, idx) => {
      logger.warn(`   ${idx + 1}. ${warn.text}`);
    });
  }

  // Network Errors
  if (recentNetworkErrors.length > 0) {
    logger.error(`\n🌐 ${recentNetworkErrors.length} network error(s) detected:`);
    recentNetworkErrors.forEach((err, idx) => {
      logger.error(`   ${idx + 1}. ${err.url}`);
      logger.error(`      ${err.errorText}`);
      if (err.statusCode) {
        logger.error(`      Status: ${err.statusCode}`);
      }
    });
  }
}

/**
 * @deprecated Use checkErrors instead
 */
export function checkConsoleErrors(browser: ChromeBrowser): void {
  checkErrors(browser, 'all');
}

/**
 * Helper: Wait for action completion (navigation + errors check).
 * Reduces code duplication across click, fill, and other interactive actions.
 */
export async function waitForActionComplete(
  browser: ChromeBrowser,
  opts: Required<ActionOptions>
): Promise<void> {
  if (opts.waitForNavigation) {
    if (opts.verbose) logger.info(`⏳ Waiting for page navigation...`);
    await waitForNetworkIdle(browser, TIMING.ACTION_DELAY_NAVIGATION, 0, { verbose: false });
    await sleep(NAVIGATION_WAIT_DELAY_MS); // Additional delay for errors to surface
  }

  checkErrors(browser, opts.logLevel);
}

/**
 * Helper: Log action error with consistent formatting
 * @param context - Error context (e.g., 'Get viewport failed')
 * @param error - Error object
 * @param verbose - Whether to log the error
 */
export function logActionError(context: string, error: unknown, verbose: boolean): void {
  if (!verbose) return;

  logger.error(`❌ ${context}`);
  if (error instanceof Error) {
    logger.error(`   Error: ${error.message}`);
  } else {
    logger.error(`   Error: ${String(error)}`);
  }
}

/**
 * Helper: Ensure output path (convert relative to .browser-pilot/).
 * Security: Prevents path traversal attacks and rejects absolute paths.
 * Uses getOutputDir() from config to get project-specific output directory.
 */
export function ensureOutputPath(path: string): string {
  // Reject absolute paths
  if (resolve(path) === path) {
    throw new Error('Absolute paths are not allowed. Use relative paths only.');
  }

  // Get output directory from project config (auto-creates .browser-pilot/)
  const outputDir = getOutputDir();
  const absolutePath = resolve(outputDir, path);

  // Prevent path traversal attacks
  if (!absolutePath.startsWith(outputDir)) {
    throw new Error('Path traversal detected. Files must be within .browser-pilot directory.');
  }

  // Ensure subdirectory exists (if path includes subdirectories)
  const dir = dirname(absolutePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  return absolutePath;
}
