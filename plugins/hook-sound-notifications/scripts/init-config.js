#!/usr/bin/env node

/**
 * Initialization script for Sound Notifications plugin
 * Runs at session start to ensure user configuration file exists
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { preventDuplicateExecutionOrExit } = require('./utils/duplicate-prevention');

// Prevent duplicate execution
preventDuplicateExecutionOrExit('init-config');

const projectRoot = process.cwd();
const configDir = path.join(projectRoot, '.plugin-config');
const configPath = path.join(configDir, 'hook-sound-notifications.json');

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

/**
 * Get user home sounds folder path
 * Returns ~/.claude/sounds/hook-sound-notifications/
 * This folder is safe from plugin updates
 */
function getHomeSoundsFolder() {
  const homeDir = os.homedir();
  return path.join(homeDir, '.claude', 'sounds', 'hook-sound-notifications');
}

/**
 * Check if should migrate to home folder
 * Returns true if:
 * - No existing soundsFolder configured (new user)
 * - soundsFolder points to plugin default location (existing user with default)
 * Returns false if:
 * - soundsFolder points to custom location (user customization)
 */
function shouldMigrateToHomeFolder(existingConfig) {
  const currentSoundsFolder = existingConfig?.soundNotifications?.soundsFolder;

  // No existing config - migrate
  if (!currentSoundsFolder) {
    return true;
  }

  // Normalize paths for comparison
  const normalized = path.resolve(currentSoundsFolder);
  const pluginDefault = path.resolve(getPluginSoundsFolder());

  // Using plugin default - migrate
  if (normalized === pluginDefault) {
    return true;
  }

  // Custom location - keep as is
  return false;
}

/**
 * Copy sound files from plugin folder to home folder
 * Does not overwrite existing files (preserves user customization)
 */
function copySoundsToHomeFolder() {
  try {
    const pluginSoundsFolder = getPluginSoundsFolder();
    const homeSoundsFolder = getHomeSoundsFolder();

    // Create home sounds directory
    if (!fs.existsSync(homeSoundsFolder)) {
      fs.mkdirSync(homeSoundsFolder, { recursive: true });
    }

    // Dynamically read sound files from plugin sounds folder
    const soundFiles = fs.readdirSync(pluginSoundsFolder).filter(file => {
      // Skip hidden files and system files
      if (file.startsWith('.') || file === 'Thumbs.db' || file === 'desktop.ini') {
        return false;
      }

      try {
        const filePath = path.join(pluginSoundsFolder, file);
        const stat = fs.statSync(filePath);

        // Only include regular files (not directories or symlinks)
        if (!stat.isFile()) {
          return false;
        }

        // Only include audio files
        const ext = path.extname(file).toLowerCase();
        const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'];
        return audioExtensions.includes(ext);

      } catch (error) {
        // Skip files with permission/access errors
        return false;
      }
    });

    let copiedCount = 0;

    soundFiles.forEach(filename => {
      const sourcePath = path.join(pluginSoundsFolder, filename);
      const targetPath = path.join(homeSoundsFolder, filename);

      // Only copy if source exists and target doesn't exist
      if (fs.existsSync(sourcePath) && !fs.existsSync(targetPath)) {
        fs.copyFileSync(sourcePath, targetPath);
        copiedCount++;
      }
    });

    if (copiedCount > 0) {
      console.log(`\n🔊 Sound files migrated to home folder: ${homeSoundsFolder}`);
      console.log(`   ${copiedCount} files copied. Customize them safely - they won't be overwritten on plugin updates.\n`);
    }

    return true;
  } catch (error) {
    // Fail silently - don't block initialization
    return false;
  }
}

// Default configuration
const defaultConfig = {
  soundNotifications: {
    enabled: true,
    soundsFolder: getHomeSoundsFolder(),  // User home folder (safe from updates)
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
        enabled: false,  // Disabled by default - can cause instability
        soundFile: 'post-tool-use.mp3',
        volume: 0.3
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
      const soundHookArray = hooksJson.hooks[hookType];
      if (!Array.isArray(soundHookArray) || soundHookArray.length === 0) {
        return;
      }

      const soundHook = soundHookArray.find(hook =>
        hook.description && hook.description.toLowerCase().includes('sound')
      );

      if (!soundHook) {
        return;
      }

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
    let existingConfig = null;

    // Check if config file exists
    if (fs.existsSync(configPath)) {
      try {
        existingConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

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

          // Determine soundsFolder based on migration logic
          let soundsFolder;
          if (shouldMigrateToHomeFolder(existingConfig)) {
            // Migrate to home folder
            copySoundsToHomeFolder();
            soundsFolder = getHomeSoundsFolder();
          } else {
            // Keep existing custom path
            soundsFolder = existingConfig.soundNotifications.soundsFolder;
          }

          const migratedConfig = {
            ...defaultConfig,
            soundNotifications: {
              ...defaultConfig.soundNotifications,
              ...existingConfig.soundNotifications,
              soundsFolder: soundsFolder,
              hooks: mergedHooks
            },
            _pluginVersion: PLUGIN_VERSION
          };

          fs.writeFileSync(configPath, JSON.stringify(migratedConfig, null, 2), 'utf8');
          currentConfig = migratedConfig;
        }
      } catch (error) {
        // If parse fails, create new config
        // Copy sounds to home folder for new setup
        copySoundsToHomeFolder();

        const newConfig = {
          ...defaultConfig,
          _pluginVersion: PLUGIN_VERSION
        };
        fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2), 'utf8');
        currentConfig = newConfig;
      }
    } else {
      // New user - create config file and copy sounds
      copySoundsToHomeFolder();

      const newConfig = {
        ...defaultConfig,
        _pluginVersion: PLUGIN_VERSION
      };
      fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2), 'utf8');
      currentConfig = newConfig;
    }

    // Note: hooks.json is now updated at SessionEnd by update-hooks-config.js
    // This ensures settings are applied for the next session
  } catch (error) {
    // Fail silently - don't block session start if config creation fails
  }
}

initializeConfig();
process.exit(0);
