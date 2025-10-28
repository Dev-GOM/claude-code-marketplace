#!/usr/bin/env node

/**
 * Initialization script for Claude Dev Helper plugin
 * Runs at session start to ensure user configuration file exists
 */

const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const configDir = path.join(projectRoot, '.plugin-config');
const configPath = path.join(configDir, 'claude-dev-helper.json');

/**
 * Read plugin version from plugin.json
 */
function getPluginVersion() {
  try {
    const pluginJsonPath = path.join(__dirname, '..', '.claude-plugin', 'plugin.json');
    const pluginJson = JSON.parse(fs.readFileSync(pluginJsonPath, 'utf8'));
    return pluginJson.version || '1.0.0';
  } catch (error) {
    return '1.0.0';
  }
}

const PLUGIN_VERSION = getPluginVersion();

// Default configuration
const defaultConfig = {
  autoOpen: {
    enabled: true,
    focus: false,
    openLocation: 0,  // 0 = first column (left), 1 = second column (right)
    maxQueueSize: 10
  }
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
          return;
        }

        // Migrate: merge existing config with new defaults
        const migratedConfig = {
          ...defaultConfig,
          autoOpen: {
            ...defaultConfig.autoOpen,
            ...existingConfig.autoOpen
          },
          _pluginVersion: PLUGIN_VERSION
        };

        fs.writeFileSync(configPath, JSON.stringify(migratedConfig, null, 2), 'utf8');
      } catch (error) {
        // If parse fails, create new config
        const newConfig = {
          ...defaultConfig,
          _pluginVersion: PLUGIN_VERSION
        };
        fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2), 'utf8');
      }
    } else {
      // Create new config file
      const newConfig = {
        ...defaultConfig,
        _pluginVersion: PLUGIN_VERSION
      };
      fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2), 'utf8');
    }
  } catch (error) {
    // Fail silently - don't block session start if config creation fails
  }
}

initializeConfig();
process.exit(0);
