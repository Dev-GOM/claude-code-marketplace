/**
 * Configuration management for browser debugging port and state.
 * Uses a shared config file in the plugin folder for multi-project support.
 */
export interface ProjectConfig {
    rootPath: string;
    port: number;
    outputDir: string;
    lastUsed: string | null;
    autoCleanup: boolean;
}
export interface SharedBrowserPilotConfig {
    projects: {
        [projectName: string]: ProjectConfig;
    };
}
/**
 * Get output directory for the current project
 * Creates .browser-pilot folder in project root
 */
export declare function getOutputDir(): string;
/**
 * Load shared configuration from plugin folder
 * Auto-creates default config if not exists
 */
export declare function loadSharedConfig(): SharedBrowserPilotConfig;
/**
 * Save shared configuration to plugin folder
 */
export declare function saveSharedConfig(config: SharedBrowserPilotConfig): void;
/**
 * Get configuration for current project
 * Auto-creates with available port if not exists
 */
export declare function getProjectConfig(): Promise<ProjectConfig>;
/**
 * Update last used timestamp for current project
 */
export declare function updateProjectLastUsed(): void;
/**
 * Get debug port for current project
 */
export declare function getProjectPort(): Promise<number>;
/**
 * Clean up project config if autoCleanup is enabled
 */
export declare function cleanupProjectIfNeeded(): void;
/**
 * Set autoCleanup flag for current project
 */
export declare function setAutoCleanup(enabled: boolean): void;
/**
 * Reset configuration for current project
 */
export declare function resetProjectConfig(): void;
/**
 * List all configured projects
 */
export declare function listProjects(): void;
/**
 * Check if a port is available (not in use)
 */
export declare function isPortAvailable(port: number): Promise<boolean>;
/**
 * Find an available port starting from startPort
 */
export declare function findAvailablePort(startPort?: 9222, maxAttempts?: number): Promise<number>;
//# sourceMappingURL=config.d.ts.map