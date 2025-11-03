#!/usr/bin/env node

/**
 * Clean up Browser Pilot project configuration at session end.
 * This script is called by the SessionEnd hook to remove the current project
 * from the shared configuration file.
 */

const fs = require('fs');
const path = require('path');

/**
 * Get project root from environment or current directory
 */
function getProjectRoot() {
  return process.env.CLAUDE_PROJECT_ROOT || process.cwd();
}

/**
 * Get project name from root folder name
 */
function getProjectName(projectRoot) {
  return path.basename(projectRoot);
}

/**
 * Get shared config file path
 */
function getSharedConfigPath() {
  // Plugin root is provided by hook environment variable
  const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT;
  if (!pluginRoot) {
    console.error('Error: CLAUDE_PLUGIN_ROOT not set');
    process.exit(1);
  }

  return path.join(pluginRoot, 'skills', 'browser-pilot-config.json');
}

/**
 * Load shared configuration
 */
function loadSharedConfig() {
  const configPath = getSharedConfigPath();

  if (!fs.existsSync(configPath)) {
    return { projects: {} };
  }

  try {
    const data = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading config:', error.message);
    return { projects: {} };
  }
}

/**
 * Save shared configuration
 */
function saveSharedConfig(config) {
  const configPath = getSharedConfigPath();

  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving config:', error.message);
    process.exit(1);
  }
}

/**
 * Clean up project configuration
 */
function cleanupProject() {
  try {
    const projectRoot = getProjectRoot();
    const projectName = getProjectName(projectRoot);
    const sharedConfig = loadSharedConfig();

    // Check if project exists
    if (!sharedConfig.projects[projectName]) {
      // Project not found, nothing to clean up
      return;
    }

    const projectConfig = sharedConfig.projects[projectName];

    // Check if rootPath matches (ensure we're cleaning up the right project)
    if (projectConfig.rootPath !== projectRoot) {
      console.warn(`�  Browser Pilot: Project name mismatch`);
      console.warn(`   Config path: ${projectConfig.rootPath}`);
      console.warn(`   Current path: ${projectRoot}`);
      return;
    }

    // Remove project from config
    delete sharedConfig.projects[projectName];
    saveSharedConfig(sharedConfig);

    console.log(`=�  Browser Pilot: Cleaned up project "${projectName}"`);
  } catch (error) {
    // Fail silently - don't block session end if cleanup fails
    console.error('Error during Browser Pilot cleanup:', error.message);
  }
}

// Run cleanup
cleanupProject();
process.exit(0);
