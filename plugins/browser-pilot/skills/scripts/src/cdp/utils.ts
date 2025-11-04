/**
 * Utility functions for Browser Pilot
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

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
 */
function getSharedConfigPath(): string {
  // Get plugin skills directory (3 levels up from dist/cdp/)
  const skillsDir = join(__dirname, '..', '..', '..');
  return join(skillsDir, 'browser-pilot-config.json');
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
  } catch (error) {
    return { projects: {} };
  }
}

/**
 * Get project root directory.
 *
 * Strategy (in order of priority):
 * 1. CLAUDE_PROJECT_ROOT environment variable
 * 2. Shared config file (if running from scripts folder)
 * 3. process.cwd() (fallback)
 */
export function findProjectRoot(): string {
  // 1. Environment variable has highest priority
  if (process.env.CLAUDE_PROJECT_ROOT) {
    return process.env.CLAUDE_PROJECT_ROOT;
  }

  const cwd = process.cwd();

  // 2. If running from scripts folder, check shared config
  if (cwd.includes('browser-pilot') && cwd.includes('scripts')) {
    try {
      const config = loadSharedConfig();
      const projects = Object.values(config.projects);

      if (projects.length === 1) {
        // Only one project configured, use it
        return projects[0].rootPath;
      } else if (projects.length > 1) {
        // Multiple projects: use the most recently used one
        const sorted = projects.sort((a, b) => {
          const aTime = a.lastUsed ? new Date(a.lastUsed).getTime() : 0;
          const bTime = b.lastUsed ? new Date(b.lastUsed).getTime() : 0;
          return bTime - aTime;
        });
        return sorted[0].rootPath;
      }
    } catch (error) {
      // If config loading fails, fall through to cwd
    }
  }

  // 3. Fallback to current working directory
  return cwd;
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
