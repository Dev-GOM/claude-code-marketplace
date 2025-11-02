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
export declare function findProjectRoot(): string;
//# sourceMappingURL=utils.d.ts.map