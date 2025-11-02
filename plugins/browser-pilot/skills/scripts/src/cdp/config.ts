/**
 * Configuration management for browser debugging port and state.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { createServer } from 'net';
import { findProjectRoot } from './utils';

export interface BrowserPilotConfig {
  initialized: boolean;
  debugPort: number | null;
  lastUsed: string | null;
}

/**
 * Get config file path in user's project root
 * Config is stored in .plugin-config/browser-pilot.json
 * Output files (screenshots, PDFs) go to .browser-pilot/
 */
function getConfigPath(): string {
  const projectRoot = findProjectRoot();
  const configDir = join(projectRoot, '.plugin-config');
  const outputDir = join(projectRoot, '.browser-pilot');

  // Ensure .plugin-config directory exists
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }

  // Ensure .browser-pilot directory exists for output files
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  // Always ensure .gitignore exists in .browser-pilot
  const gitignorePath = join(outputDir, '.gitignore');
  if (!existsSync(gitignorePath)) {
    const gitignoreContent = `# Browser Pilot generated files
*
`;
    writeFileSync(gitignorePath, gitignoreContent, 'utf-8');
  }

  return join(configDir, 'browser-pilot.json');
}

/**
 * Load configuration from config.json
 * Auto-creates default config if not exists
 */
export function loadConfig(): BrowserPilotConfig {
  const configPath = getConfigPath();

  if (!existsSync(configPath)) {
    // Auto-create default config
    const defaultConfig: BrowserPilotConfig = {
      initialized: false,
      debugPort: null,
      lastUsed: null
    };
    saveConfig(defaultConfig);
    return defaultConfig;
  }

  try {
    const data = readFileSync(configPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load config:', error);
    return {
      initialized: false,
      debugPort: null,
      lastUsed: null
    };
  }
}

/**
 * Save configuration to config.json
 */
export function saveConfig(config: BrowserPilotConfig): void {
  const configPath = getConfigPath();

  try {
    writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save config:', error);
  }
}

/**
 * Reset configuration to uninitialized state
 */
export function resetConfig(): void {
  saveConfig({
    initialized: false,
    debugPort: null,
    lastUsed: null
  });
}

/**
 * Check if a port is available (not in use)
 */
export async function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();

    server.once('error', () => {
      resolve(false);
    });

    server.once('listening', () => {
      server.close();
      resolve(true);
    });

    // Listen on 127.0.0.1 specifically (same as Chrome)
    server.listen(port, '127.0.0.1');
  });
}

/**
 * Find an available port starting from startPort
 */
export async function findAvailablePort(startPort = 9222, maxAttempts = 10): Promise<number> {
  for (let port = startPort; port < startPort + maxAttempts; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }

  throw new Error(`No available port found in range ${startPort}-${startPort + maxAttempts - 1}`);
}

/**
 * Initialize configuration with an available port
 */
export async function initializeConfig(): Promise<BrowserPilotConfig> {
  const basePort = parseInt(process.env.CDP_DEBUG_PORT || '9222');
  const debugPort = await findAvailablePort(basePort);

  const config: BrowserPilotConfig = {
    initialized: true,
    debugPort,
    lastUsed: new Date().toISOString()
  };

  saveConfig(config);
  return config;
}
