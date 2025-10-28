#!/usr/bin/env node

/**
 * Update hooks.json based on current user configuration
 * Should be run at SessionEnd to apply settings for the next session
 */

const fs = require('fs');
const path = require('path');
const { preventDuplicateExecutionOrExit } = require('./utils/duplicate-prevention');

// Prevent duplicate execution
preventDuplicateExecutionOrExit('update-hooks-config');

const projectRoot = process.cwd();
const configPath = path.join(projectRoot, '.plugin-config', 'hook-sound-notifications.json');

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
    }

    return hasChanges;
  } catch (error) {
    // Fail silently - don't block session end
    return false;
  }
}

/**
 * Main execution
 */
function main() {
  try {
    // Check if config file exists
    if (!fs.existsSync(configPath)) {
      // No config file, nothing to update
      process.exit(0);
    }

    // Read current configuration
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    // Update hooks.json based on configuration
    if (config && config.soundNotifications) {
      updateHooksJson(config.soundNotifications);
    }
  } catch (error) {
    // Fail silently - don't block session end
  }
}

main();
process.exit(0);
