#!/usr/bin/env node

/**
 * Initialization script for Browser Pilot plugin
 * Runs at session start to ensure .browser-pilot directory and config exist
 */

const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const configDir = path.join(projectRoot, '.plugin-config');
const configPath = path.join(configDir, 'browser-pilot.json');
const outputDir = path.join(projectRoot, '.browser-pilot');
const gitignorePath = path.join(outputDir, '.gitignore');

/**
 * Default configuration
 */
const defaultConfig = {
  initialized: false,
  debugPort: null,
  lastUsed: null
};

/**
 * Default .gitignore content
 */
const gitignoreContent = `# Browser Pilot generated files
*
`;

/**
 * Initialize .plugin-config and .browser-pilot directories
 */
function initializeConfig() {
  try {
    // Create .plugin-config directory if it doesn't exist
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    // Create browser-pilot.json if it doesn't exist
    if (!fs.existsSync(configPath)) {
      fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), 'utf8');
    }

    // Create .browser-pilot directory for output files
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Create .gitignore in .browser-pilot if it doesn't exist
    if (!fs.existsSync(gitignorePath)) {
      fs.writeFileSync(gitignorePath, gitignoreContent, 'utf8');
    }
  } catch (error) {
    // Fail silently - don't block session start if config creation fails
  }
}

initializeConfig();
process.exit(0);
