/**
 * Utility functions for Browser Pilot
 */

/**
 * Get project root directory.
 *
 * For plugin execution:
 * - Claude Code runs plugin hooks/skills from project root
 * - process.cwd() already points to project root
 *
 * For SKILL.md with 'cd' command or 'npm run --prefix':
 * - INIT_CWD preserves original working directory before 'npm run'
 *
 * Priority:
 * 1. INIT_CWD (set by npm when using 'npm run --prefix' or after 'cd')
 * 2. process.cwd() (default - already project root for plugins)
 */
export function findProjectRoot(): string {
  // npm sets INIT_CWD to the directory where 'npm run' was invoked
  if (process.env.INIT_CWD) {
    return process.env.INIT_CWD;
  }

  // Fallback to current working directory (project root for plugins)
  return process.cwd();
}
