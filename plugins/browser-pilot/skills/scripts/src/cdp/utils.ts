/**
 * Utility functions for Browser Pilot
 */

import { readFileSync, existsSync } from 'fs';
import { join, normalize, resolve } from 'path';
import { logger } from '../utils/logger';
import { TIMING } from '../constants';

interface ProjectConfig {
  rootPath: string;
  port: number;
  outputDir: string;
  lastUsed: string | null;
  autoCleanup: boolean;
}

interface SharedBrowserPilotConfig {
  projects: {
    [projectName: string]: ProjectConfig;
  };
}

/**
 * Get shared config file path in plugin skills folder
 * Uses hardcoded home directory path for reliability
 */
function getSharedConfigPath(): string {
  const { homedir } = require('os');
  const homeDir = homedir();
  return join(
    homeDir,
    '.claude',
    'plugins',
    'marketplaces',
    'dev-gom-plugins',
    'plugins',
    'browser-pilot',
    'skills',
    'browser-pilot-config.json'
  );
}

/**
 * Load shared configuration from plugin folder
 */
function loadSharedConfig(): SharedBrowserPilotConfig {
  const configPath = getSharedConfigPath();

  if (!existsSync(configPath)) {
    return { projects: {} };
  }

  try {
    const data = readFileSync(configPath, 'utf-8');
    return JSON.parse(data);
  } catch (_error) {
    return { projects: {} };
  }
}

/**
 * Compare two paths for equality (cross-platform, case-insensitive on Windows)
 */
function pathsEqual(path1: string, path2: string): boolean {
  return normalize(resolve(path1)).toLowerCase() ===
         normalize(resolve(path2)).toLowerCase();
}

/**
 * Get project root directory.
 *
 * Strategy (in order of priority):
 * 1. CLAUDE_PROJECT_DIR environment variable
 * 2. Shared config file (if running from scripts folder)
 *
 * No fallback to process.cwd() - requires explicit project configuration.
 */
export function findProjectRoot(): string {
  // 1. Environment variable has highest priority
  if (process.env.CLAUDE_PROJECT_DIR) {
    return process.env.CLAUDE_PROJECT_DIR;
  }

  const cwd = process.cwd();

  // 2. If running from scripts folder, check shared config
  // More robust check: compare exact path (cross-platform, case-insensitive)
  const scriptsDir = join(__dirname, '..', '..');
  if (pathsEqual(cwd, scriptsDir)) {
    try {
      const config = loadSharedConfig();
      const projects = Object.values(config.projects);

      if (projects.length === 1) {
        // Only one project configured, use it
        return projects[0].rootPath;
      } else if (projects.length > 1) {
        // Multiple projects: use the most recently used one
        const sorted = projects.sort((a, b) => {
          // Handle invalid dates: treat as 0 to ensure predictable sorting
          const aTime = new Date(a.lastUsed || 0).getTime();
          const bTime = new Date(b.lastUsed || 0).getTime();
          return (isNaN(bTime) ? 0 : bTime) - (isNaN(aTime) ? 0 : aTime);
        });
        return sorted[0].rootPath;
      }
    } catch (error) {
      logger.error(`Failed to load shared config: ${error}`);
      throw new Error('Could not determine project root: CLAUDE_PROJECT_DIR not set and no projects in shared config');
    }
  }

  // No fallback to process.cwd() - require explicit project configuration
  throw new Error('Could not determine project root: CLAUDE_PROJECT_DIR not set');
}

/**
 * Returns the findElement helper function as a JavaScript string
 * for injection into browser context.
 *
 * Supports:
 * - CSS selectors: 'button.primary'
 * - XPath selectors: '//button[@id="submit"]'
 * - XPath with indexing: '(//button[text()="Click"])[2]'
 */
export function getFindElementScript(): string {
  return `
    function findElement(sel) {
      if (sel.startsWith('//') || sel.startsWith('(//')) {
        // XPath selector - check for indexing pattern: (...)[N]
        const indexMatch = sel.match(/^\\((.*)\\)\\[(\\d+)\\]$/);

        if (indexMatch) {
          // Has indexing: (//xpath)[N]
          const xpath = indexMatch[1];
          const index = parseInt(indexMatch[2]) - 1; // XPath is 1-based, JS is 0-based

          const result = document.evaluate(
            xpath,
            document,
            null,
            XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
            null
          );

          return result.snapshotItem(index);
        } else {
          // No indexing - return first match
          const result = document.evaluate(
            sel,
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
          );
          return result.singleNodeValue;
        }
      } else {
        // CSS selector
        return document.querySelector(sel);
      }
    }
  `;
}

/**
 * Human-like random delay to avoid bot detection
 * @param minMs Minimum delay in milliseconds (default: ACTION_DELAY_MEDIUM * 3)
 * @param maxMs Maximum delay in milliseconds (default: ACTION_DELAY_LONG + ACTION_DELAY_MEDIUM * 3)
 * @returns Promise that resolves after the delay
 */
export function humanDelay(
  minMs: number = TIMING.ACTION_DELAY_MEDIUM * 3,
  maxMs: number = TIMING.ACTION_DELAY_LONG + TIMING.ACTION_DELAY_MEDIUM * 3
): Promise<void> {
  const delayMs = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise(resolve => setTimeout(resolve, delayMs));
}
