/**
 * Configuration management for browser debugging port and state.
 */
export interface BrowserPilotConfig {
    initialized: boolean;
    debugPort: number | null;
    lastUsed: string | null;
}
/**
 * Load configuration from config.json
 * Auto-creates default config if not exists
 */
export declare function loadConfig(): BrowserPilotConfig;
/**
 * Save configuration to config.json
 */
export declare function saveConfig(config: BrowserPilotConfig): void;
/**
 * Reset configuration to uninitialized state
 */
export declare function resetConfig(): void;
/**
 * Check if a port is available (not in use)
 */
export declare function isPortAvailable(port: number): Promise<boolean>;
/**
 * Find an available port starting from startPort
 */
export declare function findAvailablePort(startPort?: number, maxAttempts?: number): Promise<number>;
/**
 * Initialize configuration with an available port
 */
export declare function initializeConfig(): Promise<BrowserPilotConfig>;
//# sourceMappingURL=config.d.ts.map