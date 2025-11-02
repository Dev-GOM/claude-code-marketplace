/**
 * Utility functions for Browser Pilot
 */
/**
 * Get project root directory.
 *
 * Strategy (in order of priority):
 * 1. Git repository root (most reliable, works even after 'cd')
 * 2. INIT_CWD (npm's original working directory)
 * 3. process.cwd() (fallback)
 */
export declare function findProjectRoot(): string;
//# sourceMappingURL=utils.d.ts.map