/**
 * Configuration management for browser debugging port and state.
 * Uses a shared config file in the plugin folder for multi-project support.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, basename } from 'path';
import { createServer } from 'net';
import { findProjectRoot } from './utils';

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
 * Get shared config file path in plugin skills folder
 * Config is stored in: {plugin-folder}/browser-pilot/skills/browser-pilot-config.json
 */
function getSharedConfigPath(): string {
  // Get plugin skills directory (3 levels up from dist/cdp/)
  const skillsDir = join(__dirname, '..', '..', '..');
  return join(skillsDir, 'browser-pilot-config.json');
}

/**
 * Get project name from root folder name
 */
function getProjectName(projectRoot: string): string {
  return basename(projectRoot);
}

/**
 * Get output directory for the current project
 * Creates .browser-pilot folder in project root
 */
export function getOutputDir(): string {
  const projectRoot = findProjectRoot();
  const outputDir = join(projectRoot, '.browser-pilot');

  // Ensure .browser-pilot directory exists
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

  return outputDir;
}

/**
 * Load shared configuration from plugin folder
 * Auto-creates default config if not exists
 */
export function loadSharedConfig(): SharedBrowserPilotConfig {
  const configPath = getSharedConfigPath();

  if (!existsSync(configPath)) {
    // Auto-create default config
    const defaultConfig: SharedBrowserPilotConfig = {
      projects: {}
    };
    saveSharedConfig(defaultConfig);
    return defaultConfig;
  }

  try {
    const data = readFileSync(configPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load shared config:', error);
    return {
      projects: {}
    };
  }
}

/**
 * Save shared configuration to plugin folder
 */
export function saveSharedConfig(config: SharedBrowserPilotConfig): void {
  const configPath = getSharedConfigPath();

  try {
    writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save shared config:', error);
  }
}

/**
 * Get configuration for current project
 * Auto-creates with available port if not exists
 */
export async function getProjectConfig(): Promise<ProjectConfig> {
  const projectRoot = findProjectRoot();
  const projectName = getProjectName(projectRoot);
  const sharedConfig = loadSharedConfig();

  // Find existing config by rootPath (in case name changed)
  const existingEntry = Object.entries(sharedConfig.projects).find(
    ([_, config]) => config.rootPath === projectRoot
  );

  if (existingEntry) {
    const [existingName, config] = existingEntry;

    // If name changed, update key
    if (existingName !== projectName) {
      delete sharedConfig.projects[existingName];
      sharedConfig.projects[projectName] = config;
      saveSharedConfig(sharedConfig);
      console.log(`📝 Updated project name: ${existingName} → ${projectName}`);
    }

    return config;
  }

  // Check if name already exists (different path)
  if (sharedConfig.projects[projectName]) {
    console.warn(`⚠️  Project name "${projectName}" already exists with different path`);
    console.warn(`   Existing: ${sharedConfig.projects[projectName].rootPath}`);
    console.warn(`   Current:  ${projectRoot}`);
    throw new Error(`Project name conflict: "${projectName}"`);
  }

  // Create new project config with available port
  const basePort = parseInt(process.env.CDP_DEBUG_PORT || '9222');

  // Find next available port that's not used by any project
  const usedPorts = Object.values(sharedConfig.projects).map(p => p.port);
  let port = basePort;

  // Find first available port not in use by other projects
  while (usedPorts.includes(port) || !(await isPortAvailable(port))) {
    port++;
    if (port > basePort + 100) {
      throw new Error(`No available port found in range ${basePort}-${basePort + 100}`);
    }
  }

  const projectConfig: ProjectConfig = {
    rootPath: projectRoot,
    port,
    outputDir: '.browser-pilot',
    lastUsed: new Date().toISOString(),
    autoCleanup: false  // Default to false for safety
  };

  // Save new project config
  sharedConfig.projects[projectName] = projectConfig;
  saveSharedConfig(sharedConfig);

  console.log(`📝 Created config for project: ${projectName}`);
  console.log(`   Path: ${projectRoot}`);
  console.log(`   Port: ${port}`);

  return projectConfig;
}

/**
 * Update last used timestamp for current project
 */
export function updateProjectLastUsed(): void {
  const projectRoot = findProjectRoot();
  const projectName = getProjectName(projectRoot);
  const sharedConfig = loadSharedConfig();

  if (sharedConfig.projects[projectName]) {
    sharedConfig.projects[projectName].lastUsed = new Date().toISOString();
    saveSharedConfig(sharedConfig);
  }
}

/**
 * Get debug port for current project
 */
export async function getProjectPort(): Promise<number> {
  const config = await getProjectConfig();
  return config.port;
}

/**
 * Clean up project config if autoCleanup is enabled
 */
export function cleanupProjectIfNeeded(): void {
  const projectRoot = findProjectRoot();
  const projectName = getProjectName(projectRoot);
  const sharedConfig = loadSharedConfig();

  const projectConfig = sharedConfig.projects[projectName];
  if (projectConfig && projectConfig.autoCleanup) {
    delete sharedConfig.projects[projectName];
    saveSharedConfig(sharedConfig);
    console.log(`🗑️  Auto-cleaned config for project: ${projectName}`);
  }
}

/**
 * Set autoCleanup flag for current project
 */
export function setAutoCleanup(enabled: boolean): void {
  const projectRoot = findProjectRoot();
  const projectName = getProjectName(projectRoot);
  const sharedConfig = loadSharedConfig();

  if (sharedConfig.projects[projectName]) {
    sharedConfig.projects[projectName].autoCleanup = enabled;
    saveSharedConfig(sharedConfig);
    console.log(`${enabled ? '✅' : '❌'} Auto-cleanup ${enabled ? 'enabled' : 'disabled'} for: ${projectName}`);
  }
}

/**
 * Reset configuration for current project
 */
export function resetProjectConfig(): void {
  const projectRoot = findProjectRoot();
  const projectName = getProjectName(projectRoot);
  const sharedConfig = loadSharedConfig();

  delete sharedConfig.projects[projectName];
  saveSharedConfig(sharedConfig);

  console.log(`🗑️  Removed config for project: ${projectName}`);
}

/**
 * List all configured projects
 */
export function listProjects(): void {
  const sharedConfig = loadSharedConfig();
  const projects = Object.entries(sharedConfig.projects);

  if (projects.length === 0) {
    console.log('No projects configured yet.');
    return;
  }

  console.log(`\n📋 Configured Projects (${projects.length}):\n`);
  projects.forEach(([name, config]) => {
    console.log(`   ${name}`);
    console.log(`   ├─ Path: ${config.rootPath}`);
    console.log(`   ├─ Port: ${config.port}`);
    console.log(`   ├─ Output: ${config.outputDir}`);
    console.log(`   ├─ Auto-cleanup: ${config.autoCleanup ? 'Yes' : 'No'}`);
    console.log(`   └─ Last Used: ${config.lastUsed || 'Never'}\n`);
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
