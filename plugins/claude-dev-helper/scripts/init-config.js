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

/**
 * Get plugin sounds folder path
 * Uses CLAUDE_PLUGIN_ROOT env var if available (when run from hooks),
 * otherwise falls back to relative path from script location
 */
function getPluginSoundsFolder() {
  const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT || path.join(__dirname, '..');
  return path.join(pluginRoot, 'sounds');
}

// Default configuration
const defaultConfig = {
  autoOpen: {
    enabled: true,
    focus: false,
    openLocation: 0,  // 0 = first column (left), 1 = second column (right)
    maxQueueSize: 10
  },
  soundNotifications: {
    enabled: true,
    soundsFolder: getPluginSoundsFolder(),  // Auto-detected plugin sounds folder
    volume: 0.5,  // Global volume (0.0 - 1.0), can be overridden per hook
    hooks: {
      SessionStart: {
        enabled: true,
        soundFile: 'session-start.mp3',
        volume: 0.5
      },
      SessionEnd: {
        enabled: true,
        soundFile: 'session-end.mp3',
        volume: 0.5
      },
      PreToolUse: {
        enabled: true,
        soundFile: 'pre-tool-use.mp3',
        volume: 0.3  // Lower volume for frequent events
      },
      PostToolUse: {
        enabled: true,
        soundFile: 'post-tool-use.mp3',
        volume: 0.3  // Lower volume for frequent events
      },
      Notification: {
        enabled: true,
        soundFile: 'notification.mp3',
        volume: 0.5
      },
      UserPromptSubmit: {
        enabled: true,
        soundFile: 'user-prompt-submit.mp3',
        volume: 0.5
      },
      Stop: {
        enabled: true,
        soundFile: 'stop.mp3',
        volume: 0.5
      },
      SubagentStop: {
        enabled: true,
        soundFile: 'subagent-stop.mp3',
        volume: 0.5
      },
      PreCompact: {
        enabled: true,
        soundFile: 'pre-compact.mp3',
        volume: 0.5
      }
    }
  }
};

/**
 * Update hooks.json based on sound notification settings
 * Returns true if changes were made
 */
function updateHooksJson(soundConfig) {
  try {
    const hooksJsonPath = path.join(__dirname, '..', 'hooks', 'hooks.json');

    if (!fs.existsSync(hooksJsonPath)) {
      return false;
    }

    const hooksJson = JSON.parse(fs.readFileSync(hooksJsonPath, 'utf8'));
    let hasChanges = false;

    // List of sound hook types
    const soundHookTypes = [
      'SessionStart',
      'SessionEnd',
      'PreToolUse',
      'PostToolUse',
      'Notification',
      'UserPromptSubmit',
      'Stop',
      'SubagentStop',
      'PreCompact'
    ];

    // Update each hook type
    soundHookTypes.forEach(hookType => {
      if (!hooksJson.hooks[hookType]) {
        return;
      }

      // Find the sound hook entry (description contains "sound")
      const soundHookIndex = hooksJson.hooks[hookType].findIndex(hook =>
        hook.description && hook.description.toLowerCase().includes('sound')
      );

      if (soundHookIndex === -1) {
        return;
      }

      const soundHook = hooksJson.hooks[hookType][soundHookIndex];

      // Determine if this hook should be enabled
      let shouldEnable = false;
      if (soundConfig.enabled) {
        // Global switch is on, check individual hook setting
        const hookConfig = soundConfig.hooks?.[hookType];
        shouldEnable = hookConfig?.enabled ?? false;
      }
      // else: Global switch is off, shouldEnable stays false

      // Update if different
      if (soundHook.enabled !== shouldEnable) {
        soundHook.enabled = shouldEnable;
        hasChanges = true;
      }
    });

    // Save hooks.json if there were changes
    if (hasChanges) {
      fs.writeFileSync(hooksJsonPath, JSON.stringify(hooksJson, null, 2), 'utf8');

      // Output restart notice
      console.log('\n⚠️  Sound notification settings have been updated in hooks.json');
      console.log('🔄 Please restart Claude Code for changes to take effect\n');
    }

    return hasChanges;
  } catch (error) {
    // Fail silently - don't block session start if hooks.json update fails
    return false;
  }
}

/**
 * Initialize or migrate configuration file
 */
function initializeConfig() {
  try {
    // Create .plugin-config directory if it doesn't exist
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    let currentConfig = null;

    // Check if config file exists
    if (fs.existsSync(configPath)) {
      try {
        const existingConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

        // If version matches, no migration needed but still update hooks.json
        if (existingConfig._pluginVersion === PLUGIN_VERSION) {
          currentConfig = existingConfig;
        } else {
          // Migrate: merge existing config with new defaults (deep merge for nested objects)

          // Deep merge hooks: merge each hook individually to preserve new fields
          const mergedHooks = {};
          const defaultHooks = defaultConfig.soundNotifications.hooks;
          const existingHooks = existingConfig.soundNotifications?.hooks || {};

          // Merge each hook individually
          Object.keys(defaultHooks).forEach(hookName => {
            mergedHooks[hookName] = {
              ...defaultHooks[hookName],
              ...(existingHooks[hookName] || {})
            };
          });

          const migratedConfig = {
            ...defaultConfig,
            autoOpen: {
              ...defaultConfig.autoOpen,
              ...existingConfig.autoOpen
            },
            soundNotifications: {
              ...defaultConfig.soundNotifications,
              ...existingConfig.soundNotifications,
              hooks: mergedHooks
            },
            _pluginVersion: PLUGIN_VERSION
          };

          fs.writeFileSync(configPath, JSON.stringify(migratedConfig, null, 2), 'utf8');
          currentConfig = migratedConfig;
        }
      } catch (error) {
        // If parse fails, create new config
        const newConfig = {
          ...defaultConfig,
          _pluginVersion: PLUGIN_VERSION
        };
        fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2), 'utf8');
        currentConfig = newConfig;
      }
    } else {
      // Create new config file
      const newConfig = {
        ...defaultConfig,
        _pluginVersion: PLUGIN_VERSION
      };
      fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2), 'utf8');
      currentConfig = newConfig;
    }

    // Update hooks.json based on current configuration
    if (currentConfig && currentConfig.soundNotifications) {
      updateHooksJson(currentConfig.soundNotifications);
    }
  } catch (error) {
    // Fail silently - don't block session start if config creation fails
  }
}

initializeConfig();
process.exit(0);
