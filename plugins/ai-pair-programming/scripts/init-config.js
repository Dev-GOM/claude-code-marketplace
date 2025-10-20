#!/usr/bin/env node

/**
 * Initialization script for AI Pair Programming plugin
 * Runs at session start to ensure user configuration file exists
 */

const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const configDir = path.join(projectRoot, '.plugin-config');
const configPath = path.join(configDir, 'ai-pair-programming.json');

/**
 * Read plugin version from plugin.json (cross-platform safe)
 */
function getPluginVersion() {
  try {
    const pluginJsonPath = path.join(__dirname, '..', '.claude-plugin', 'plugin.json');
    const pluginJson = JSON.parse(fs.readFileSync(pluginJsonPath, 'utf8'));
    return pluginJson.version || '1.0.0';
  } catch (error) {
    // Fallback version if plugin.json cannot be read
    return '1.0.0';
  }
}

const PLUGIN_VERSION = getPluginVersion();

// Default configuration with all available options
const defaultConfig = {
  showLogs: false
};

/**
 * Initialize or migrate configuration file
 */
function initializeConfig() {
  try {
    // Create .plugin-config directory if it doesn't exist
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    // Check if config file exists
    if (fs.existsSync(configPath)) {
      try {
        const existingConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

        // If version matches, no migration needed
        if (existingConfig._pluginVersion === PLUGIN_VERSION) {
          process.exit(0);
        }

        // Migrate: merge existing config with new defaults
        const migratedConfig = {
          ...defaultConfig,           // New fields with defaults
          ...existingConfig,          // Preserve existing user settings
          _pluginVersion: PLUGIN_VERSION
        };

        fs.writeFileSync(configPath, JSON.stringify(migratedConfig, null, 2), 'utf8');
      } catch (error) {
        // If parse fails, create new config
        fs.writeFileSync(configPath, JSON.stringify({
          ...defaultConfig,
          _pluginVersion: PLUGIN_VERSION
        }, null, 2), 'utf8');
      }
    } else {
      // Create new config file
      fs.writeFileSync(configPath, JSON.stringify({
        ...defaultConfig,
        _pluginVersion: PLUGIN_VERSION
      }, null, 2), 'utf8');
    }
  } catch (error) {
    // Fail silently - don't block session start if config creation fails
  }
}

initializeConfig();
process.exit(0);
