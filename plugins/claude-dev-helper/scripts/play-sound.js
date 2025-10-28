#!/usr/bin/env node

/**
 * Cross-platform sound player utility
 * Plays audio files using native OS commands without external dependencies
 */

const fs = require('fs');
const { spawn } = require('child_process');
const path = require('path');

/**
 * Play a sound file using OS-native commands
 * @param {string} filePath - Absolute path to the sound file
 */
function playSound(filePath) {
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    // Silent failure - don't block the workflow
    process.exit(0);
  }

  const platform = process.platform;
  const ext = path.extname(filePath).toLowerCase();
  let command, args;

  if (platform === 'win32') {
    // Windows: Use PowerShell with Media.SoundPlayer
    // Supports WAV and other formats through Windows Media Player
    const psCommand = `(New-Object Media.SoundPlayer '${filePath.replace(/'/g, "''")}').PlaySync()`;
    command = 'powershell';
    args = ['-NoProfile', '-NonInteractive', '-Command', psCommand];
  } else if (platform === 'darwin') {
    // macOS: Use afplay (built-in, supports MP3, WAV, etc.)
    command = 'afplay';
    args = [filePath];
  } else {
    // Linux: Use aplay for WAV or mpg123 for MP3
    if (ext === '.wav') {
      command = 'aplay';
      args = ['-q', filePath]; // -q: quiet mode
    } else if (ext === '.mp3') {
      command = 'mpg123';
      args = ['-q', filePath]; // -q: quiet mode
    } else {
      // Unsupported format on Linux
      process.exit(0);
    }
  }

  // Spawn player process in detached mode (non-blocking)
  const player = spawn(command, args, {
    detached: true,
    stdio: 'ignore'
  });

  // Unref to allow parent process to exit independently
  player.unref();

  // Exit immediately (don't wait for sound to finish)
  process.exit(0);
}

// CLI usage
if (require.main === module) {
  const soundFile = process.argv[2];

  if (!soundFile) {
    console.error('Usage: play-sound.js <sound-file-path>');
    process.exit(1);
  }

  playSound(soundFile);
}

module.exports = { playSound };
