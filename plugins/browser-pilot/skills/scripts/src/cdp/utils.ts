/**
 * Utility functions for Browser Pilot
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';

/**
 * Get project root directory.
 *
 * Strategy (in order of priority):
 * 1. Git repository root (most reliable, works even after 'cd')
 * 2. INIT_CWD (npm's original working directory)
 * 3. process.cwd() (fallback)
 */
export function findProjectRoot(): string {
  // Strategy 1: Try to find Git repository root
  try {
    const gitRoot = execSync('git rev-parse --show-toplevel', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore']
    }).trim();

    // Convert Unix-style path to Windows path if needed
    if (gitRoot && existsSync(gitRoot)) {
      return gitRoot.replace(/\//g, '\\');
    }
  } catch (error) {
    // Git not available or not in a Git repository, try next strategy
  }

  // Strategy 2: Use INIT_CWD (set by npm)
  if (process.env.INIT_CWD) {
    return process.env.INIT_CWD;
  }

  // Strategy 3: Fallback to current working directory
  return process.cwd();
}
