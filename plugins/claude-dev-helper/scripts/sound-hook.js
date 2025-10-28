#!/usr/bin/env node

/**
 * Sound notification hook script
 * Called by hooks to play configured sound for specific hook events
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

/**
 * Load plugin configuration from .plugin-config/claude-dev-helper.json
 * @returns {Object|null} Configuration object or null if not found
 */
function loadConfig() {
  const projectRoot = process.cwd();
  const configPath = path.join(projectRoot, '.plugin-config', 'claude-dev-helper.json');

  try {
    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(configContent);
    }
  } catch (error) {
    // Silent failure - configuration file might be corrupted
  }

  return null;
}

/**
 * Play sound for the specified hook type
 * @param {string} hookType - Hook type (SessionStart, PostToolUse, Stop)
 */
function playSoundForHook(hookType) {
  // Load configuration
  const config = loadConfig();

  if (!config || !config.soundNotifications) {
    process.exit(0);
  }

  const soundConfig = config.soundNotifications;

  // Check if sound notifications are globally enabled
  if (!soundConfig.enabled) {
    process.exit(0);
  }

  // Check if the specific hook is configured and enabled
  const hookConfig = soundConfig.hooks?.[hookType];
  if (!hookConfig || !hookConfig.enabled || !hookConfig.soundFile) {
    process.exit(0);
  }

  // Calculate sound file path
  const soundsFolder = path.isAbsolute(soundConfig.soundsFolder)
    ? soundConfig.soundsFolder
    : path.join(process.cwd(), soundConfig.soundsFolder);

  const soundFilePath = path.join(soundsFolder, hookConfig.soundFile);

  // Check if sound file exists before trying to play
  if (!fs.existsSync(soundFilePath)) {
    // Silent failure - sound file not found
    process.exit(0);
  }

  // Use Python script for better cross-platform MP3 support (especially Windows)
  const playPythonScript = path.join(__dirname, 'play-sound.py');
  const playNodeScript = path.join(__dirname, 'play-sound.js');

  // Prefer Python for better Windows MP3 support, fallback to Node.js
  let command, args;
  if (fs.existsSync(playPythonScript)) {
    command = 'python';
    args = [playPythonScript, soundFilePath];
  } else {
    command = 'node';
    args = [playNodeScript, soundFilePath];
  }

  const player = spawn(command, args, {
    detached: true,
    stdio: 'ignore'
  });

  // Unref to allow parent process to exit independently
  player.unref();

  // Exit immediately (sound plays in background)
  process.exit(0);
}

// CLI usage
if (require.main === module) {
  const hookType = process.argv[2];

  if (!hookType) {
    console.error('Usage: sound-hook.js <SessionStart|PostToolUse|Stop>');
    process.exit(1);
  }

  // Validate hook type
  const validHooks = [
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
  if (!validHooks.includes(hookType)) {
    console.error(`Invalid hook type: ${hookType}. Must be one of: ${validHooks.join(', ')}`);
    process.exit(1);
  }

  playSoundForHook(hookType);
}

module.exports = { playSoundForHook };
