/**
 * Helper functions for Browser Pilot actions.
 */

import { ChromeBrowser } from '../browser';
import { resolve, dirname } from 'path';
import { mkdirSync, existsSync } from 'fs';
import { getOutputDir } from '../config';

// ActionResult interface - will be exported from main actions.ts
interface ActionResult {
  success: boolean;
  [key: string]: any;
}

// Export for internal use within actions modules
export type { ActionResult };

/**
 * Action options interface
 */
export interface ActionOptions {
  verbose?: boolean; // Enable/disable logging (default: true)
}

/**
 * Default action options
 */
export const DEFAULT_OPTIONS: ActionOptions = {
  verbose: true
};

/**
 * Helper: Merge user options with defaults
 */
export function mergeOptions(options?: ActionOptions): Required<ActionOptions> {
  return {
    verbose: options?.verbose ?? DEFAULT_OPTIONS.verbose!
  };
}

/**
 * Helper: Sleep for specified milliseconds.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Helper: Check browser console for errors and warnings after an action.
 */
export function checkConsoleErrors(browser: ChromeBrowser): void {
  const messages = browser.getConsoleMessages();

  // Filter for errors and warnings from recent messages (last 5 seconds)
  const recentMessages = messages.filter(msg => {
    const age = Date.now() - msg.timestamp;
    return age < 5000; // Last 5 seconds
  });

  const errors = recentMessages.filter(msg => msg.level === 'error');
  const warnings = recentMessages.filter(msg => msg.level === 'warning');

  if (errors.length > 0) {
    console.error(`\n⚠️  ${errors.length} console error(s) detected:`);
    errors.forEach((err, idx) => {
      console.error(`   ${idx + 1}. ${err.text}`);
      if (err.url) {
        console.error(`      at ${err.url}:${err.lineNumber || 0}`);
      }
    });
  }

  if (warnings.length > 0) {
    console.warn(`\n⚠️  ${warnings.length} console warning(s) detected:`);
    warnings.forEach((warn, idx) => {
      console.warn(`   ${idx + 1}. ${warn.text}`);
    });
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
