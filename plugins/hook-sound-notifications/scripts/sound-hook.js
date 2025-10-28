#!/usr/bin/env node

/**
 * Sound notification hook script
 * Called by hooks to play configured sound for specific hook events
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { preventDuplicateExecutionOrExit } = require('./utils/duplicate-prevention');

/**
 * Load plugin configuration from .plugin-config/hook-sound-notifications.json
 * @returns {Object|null} Configuration object or null if not found
 */
function loadConfig() {
  const projectRoot = process.cwd();
  const configPath = path.join(projectRoot, '.plugin-config', 'hook-sound-notifications.json');

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
  // Prevent duplicate execution (Claude Code bug where hooks fire multiple times)
  preventDuplicateExecutionOrExit(`sound-hook-${hookType}`);

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
  let soundsFolder = soundConfig.soundsFolder;

  if (!soundsFolder) {
    // Default: use plugin's sounds folder from CLAUDE_PLUGIN_ROOT or script location
    const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT || path.join(__dirname, '..');
    soundsFolder = path.join(pluginRoot, 'sounds');
  } else if (!path.isAbsolute(soundsFolder)) {
    // If relative path is provided, resolve from project root
    soundsFolder = path.join(process.cwd(), soundsFolder);
  }

  const soundFilePath = path.join(soundsFolder, hookConfig.soundFile);

  // Check if sound file exists before trying to play
  if (!fs.existsSync(soundFilePath)) {
    // Silent failure - sound file not found
    process.exit(0);
  }

  // Get volume (hook-specific volume overrides global volume)
  const volume = hookConfig.volume !== undefined
    ? hookConfig.volume
    : (soundConfig.volume !== undefined ? soundConfig.volume : 0.5);

  // Clamp volume to 0.0 - 1.0 range
  const clampedVolume = Math.max(0.0, Math.min(1.0, volume));

  // Cross-platform sound playback
  const platform = process.platform;

  if (platform === 'win32') {
    // Windows: Use PowerShell with MediaPlayer
    const psCommand = `
      Add-Type -AssemblyName presentationCore
      $mediaPlayer = New-Object System.Windows.Media.MediaPlayer
      $mediaPlayer.Open([System.Uri]::new('${soundFilePath.replace(/\\/g, '\\\\')}'))
      $mediaPlayer.Volume = ${clampedVolume}

      # Wait for media to load
      Start-Sleep -Milliseconds 500

      # Get duration
      while ($mediaPlayer.NaturalDuration.HasTimeSpan -eq $false) {
        Start-Sleep -Milliseconds 50
      }
      $duration = $mediaPlayer.NaturalDuration.TimeSpan.TotalMilliseconds

      # Play
      $mediaPlayer.Play()

      # Wait for playback to complete
      Start-Sleep -Milliseconds ($duration + 500)

      # Cleanup
      $mediaPlayer.Stop()
      $mediaPlayer.Close()
    `.trim();

    // Execute PowerShell
    spawn('powershell.exe', [
      '-NoProfile',
      '-NonInteractive',
      '-WindowStyle', 'Hidden',
      '-Command', psCommand
    ], {
      detached: true,
      stdio: 'ignore'
    }).unref();

  } else if (platform === 'darwin') {
    // macOS: Use afplay (no volume control support)
    spawn('afplay', [soundFilePath], {
      detached: true,
      stdio: 'ignore'
    }).unref();

  } else {
    // Linux: Use mpg123 or aplay
    const ext = path.extname(soundFilePath).toLowerCase();
    const volumeScale = clampedVolume;

    let command, args;
    if (ext === '.mp3') {
      // mpg123 with volume scale
      command = 'mpg123';
      args = ['-q', '--scale', volumeScale.toString(), soundFilePath];
    } else if (ext === '.wav') {
      // aplay (no simple volume control)
      command = 'aplay';
      args = ['-q', soundFilePath];
    } else {
      // Unsupported format
      process.exit(0);
    }

    spawn(command, args, {
      detached: true,
      stdio: 'ignore'
    }).unref();
  }

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
