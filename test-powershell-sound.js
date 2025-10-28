#!/usr/bin/env node

/**
 * Test PowerShell sound playback as alternative to VBScript
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Test sound file path
const soundFile = path.join(
  process.env.USERPROFILE,
  '.claude',
  'plugins',
  'marketplaces',
  'dev-gom-plugins',
  'plugins',
  'hook-sound-notifications',
  'sounds',
  'notification.mp3'
);

console.log('Testing PowerShell sound playback...');
console.log('Sound file:', soundFile);
console.log('File exists:', fs.existsSync(soundFile));
console.log('Volume: 0.5 (50%)');
console.log('');

// Method 1: PowerShell with MediaPlayer (supports MP3 + volume control)
function testMediaPlayer() {
  console.log('=== Method 1: PowerShell MediaPlayer (MP3 + Volume) ===');

  const volume = 0.5; // 0.0 - 1.0
  const psCommand = `
    Add-Type -AssemblyName presentationCore
    $mediaPlayer = New-Object System.Windows.Media.MediaPlayer
    $mediaPlayer.Open([System.Uri]::new('${soundFile.replace(/\\/g, '\\\\')}'))
    $mediaPlayer.Volume = ${volume}

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

    Write-Host "MediaPlayer: Played for $duration ms"
  `.trim();

  console.log('Spawning PowerShell process...');

  const ps = spawn('powershell.exe', [
    '-NoProfile',
    '-NonInteractive',
    '-Command', psCommand
  ], {
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let stdout = '';
  let stderr = '';

  ps.stdout.on('data', (data) => {
    stdout += data.toString();
  });

  ps.stderr.on('data', (data) => {
    stderr += data.toString();
  });

  ps.on('exit', (code) => {
    console.log('Exit code:', code);
    if (stdout) console.log('Output:', stdout.trim());
    if (stderr) console.log('Error:', stderr.trim());
    console.log('');
    console.log('=== Test Complete ===');
    console.log('Did you hear the sound? (Should have played notification.mp3)');
  });

  ps.on('error', (err) => {
    console.error('Process error:', err.message);
    console.log('');
    console.log('=== Test Complete ===');
  });
}

// Start testing
testMediaPlayer();
