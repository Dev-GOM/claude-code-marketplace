#!/usr/bin/env node

/**
 * Cross-platform sound hook executor
 * Detects OS and routes to appropriate sound player script
 * Replaces bash wrapper with Node.js for better Windows path handling
 *
 * @version 1.4.4
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

/**
 * Parse command line arguments
 * Expected format: -HookType <type> [-ConfigPath <path>]
 */
function parseArguments() {
  const args = process.argv.slice(2);
  const params = {
    hookType: null,
    configPath: null
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '-HookType' && i + 1 < args.length) {
      params.hookType = args[i + 1];
      i++;
    } else if (args[i] === '-ConfigPath' && i + 1 < args.length) {
      params.configPath = args[i + 1];
      i++;
    }
  }

  return params;
}

/**
 * Get plugin root directory
 * Uses CLAUDE_PLUGIN_ROOT env var if available, otherwise uses script location
 */
function getPluginRoot() {
  if (process.env.CLAUDE_PLUGIN_ROOT) {
    return path.resolve(process.env.CLAUDE_PLUGIN_ROOT);
  }
  // Fallback: script is in plugins/hook-sound-notifications/scripts/
  return path.resolve(__dirname, '..');
}

/**
 * Execute sound hook based on platform
 */
function executeSoundHook(hookType, configPath) {
  const pluginRoot = getPluginRoot();
  const platform = os.platform();

  let command, args, scriptPath;

  if (platform === 'win32') {
    // Windows - use PowerShell script
    scriptPath = path.join(pluginRoot, 'scripts', 'sound-hook.ps1');

    if (!fs.existsSync(scriptPath)) {
      // Script not found, exit silently
      process.exit(0);
    }

    command = 'powershell.exe';
    args = [
      '-NoProfile',
      '-ExecutionPolicy', 'Bypass',
      '-File', scriptPath,
      '-HookType', hookType
    ];

    if (configPath) {
      args.push('-ConfigPath', configPath);
    }

  } else {
    // macOS/Linux - use bash script
    scriptPath = path.join(pluginRoot, 'scripts', 'sound-hook.sh');

    if (!fs.existsSync(scriptPath)) {
      // Script not found, exit silently
      process.exit(0);
    }

    command = 'bash';
    args = [scriptPath, '-HookType', hookType];

    if (configPath) {
      args.push('-ConfigPath', configPath);
    }
  }

  // Spawn child process with detached mode (don't wait for completion)
  const child = spawn(command, args, {
    detached: true,
    stdio: 'ignore',
    cwd: process.cwd(),
    env: { ...process.env, CLAUDE_PLUGIN_ROOT: pluginRoot }
  });

  // Unreference to allow parent to exit
  child.unref();

  // Exit immediately (don't wait for sound playback to complete)
  process.exit(0);
}

// Main execution
const params = parseArguments();

if (!params.hookType) {
  // No hook type specified, exit silently
  process.exit(0);
}

executeSoundHook(params.hookType, params.configPath);
