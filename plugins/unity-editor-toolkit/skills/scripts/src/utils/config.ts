/**
 * Unity WebSocket Configuration Management
 *
 * Handles loading and saving shared configuration file.
 * Config file location: ${CLAUDE_PLUGIN_ROOT}/skills/unity-websocket-config.json
 */

import * as fs from 'fs';
import * as path from 'path';
import { FS, ENV } from '@/constants';
import * as logger from './logger';

/**
 * Project configuration interface
 */
export interface ProjectConfig {
  rootPath: string;
  port: number;
  outputDir: string;
  lastUsed: string;
  autoCleanup: boolean;
}

/**
 * Shared configuration interface
 */
export interface SharedConfig {
  projects: Record<string, ProjectConfig>;
}

/**
 * Validate ProjectConfig structure (runtime type checking)
 */
function isValidProjectConfig(obj: any): obj is ProjectConfig {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.rootPath === 'string' &&
    typeof obj.port === 'number' &&
    typeof obj.outputDir === 'string' &&
    typeof obj.lastUsed === 'string' &&
    typeof obj.autoCleanup === 'boolean'
  );
}

/**
 * Validate SharedConfig structure (runtime type checking)
 */
function isValidSharedConfig(obj: any): obj is SharedConfig {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }
  if (typeof obj.projects !== 'object' || obj.projects === null) {
    return false;
  }
  // Validate each project config
  for (const [key, value] of Object.entries(obj.projects)) {
    if (typeof key !== 'string') return false;
    if (!isValidProjectConfig(value)) return false;
  }
  return true;
}

/**
 * Validate path (prevents path traversal)
 */
function isValidPath(targetPath: string): boolean {
  const resolved = path.resolve(path.normalize(targetPath));

  // Check for path traversal patterns
  if (resolved.includes('..')) {
    return false;
  }

  // Ensure absolute path
  if (!path.isAbsolute(resolved)) {
    return false;
  }

  return true;
}

/**
 * Get shared config file path
 */
export function getSharedConfigPath(): string {
  const pluginRoot = process.env[ENV.PLUGIN_ROOT];
  if (!pluginRoot) {
    throw new Error(`${ENV.PLUGIN_ROOT} environment variable not set`);
  }

  return path.join(pluginRoot, 'skills', FS.CONFIG_FILE);
}

/**
 * Load shared configuration from file
 */
export function loadSharedConfig(): SharedConfig {
  const configPath = getSharedConfigPath();

  if (!fs.existsSync(configPath)) {
    logger.debug('Shared config not found, returning empty config');
    return { projects: {} };
  }

  try {
    const data = fs.readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(data);

    // Validate structure (runtime type checking)
    if (!isValidSharedConfig(parsed)) {
      logger.error('Invalid config structure, resetting to empty config');
      return { projects: {} };
    }

    return parsed;
  } catch (error) {
    logger.error('Failed to load shared config', error);
    return { projects: {} };
  }
}

/**
 * Save shared configuration to file
 */
export function saveSharedConfig(config: SharedConfig): void {
  const configPath = getSharedConfigPath();

  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
    logger.debug('Shared config saved successfully');
  } catch (error) {
    logger.error('Failed to save shared config', error);
    throw error;
  }
}

/**
 * Get project configuration by name
 */
export function getProjectConfig(projectName: string): ProjectConfig | null {
  const config = loadSharedConfig();
  return config.projects[projectName] || null;
}

/**
 * Find project configuration by root path
 */
export function findProjectByPath(rootPath: string): [string, ProjectConfig] | null {
  // Validate path (security: prevent path traversal)
  if (!isValidPath(rootPath)) {
    throw new Error('Invalid path detected: path traversal attempt');
  }

  const config = loadSharedConfig();
  const normalizedPath = path.resolve(path.normalize(rootPath));

  const entry = Object.entries(config.projects).find(
    ([_, projectConfig]) => {
      const projectPath = path.resolve(path.normalize(projectConfig.rootPath));
      return projectPath === normalizedPath;
    }
  );

  return entry || null;
}

/**
 * Get project root directory
 */
export function getProjectRoot(): string {
  const projectRoot = process.env[ENV.PROJECT_DIR];
  if (!projectRoot) {
    throw new Error(`${ENV.PROJECT_DIR} environment variable not set`);
  }
  return path.resolve(projectRoot);
}

/**
 * Get project name from root directory
 */
export function getProjectName(projectRoot?: string): string {
  const root = projectRoot || getProjectRoot();
  return path.basename(root);
}

/**
 * Check if current directory is a Unity project
 */
export function isUnityProject(projectRoot?: string): boolean {
  const root = projectRoot || getProjectRoot();
  const assetsDir = path.join(root, 'Assets');
  const projectSettingsDir = path.join(root, 'ProjectSettings');
  return fs.existsSync(assetsDir) && fs.existsSync(projectSettingsDir);
}

/**
 * Get Unity project output directory
 */
export function getOutputDir(projectRoot?: string): string {
  const root = projectRoot || getProjectRoot();
  return path.join(root, FS.OUTPUT_DIR);
}
