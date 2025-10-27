#!/usr/bin/env node

/**
 * Auto-open file in VSCode after Write/Edit operations
 *
 * This script is triggered by PostToolUse hook and opens files directly
 * in VSCode using the `code` command.
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();

/**
 * Load plugin configuration from .plugin-config (project root)
 */
function loadConfig() {
  const configPath = path.join(projectRoot, '.plugin-config', 'claude-dev-helper.json');

  try {
    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(configContent);
    }
  } catch (error) {
    // Fall through to default config
  }

  // Default config
  return {
    autoOpen: {
      enabled: true,
      focus: false,
      maxQueueSize: 10
    }
  };
}

/**
 * Normalize path for the current OS
 * Windows requires backslash paths (D:\path\to\file)
 * Unix/Linux/macOS use forward slashes (/path/to/file)
 */
function normalizePathForOS(filePath) {
  // On Windows, convert Unix-style paths to Windows-style
  if (process.platform === 'win32') {
    // Convert /d/Work/... to D:\Work\...
    const normalized = filePath.replace(/^\/([a-z])\//i, '$1:\\').replace(/\//g, '\\');
    return path.normalize(normalized);
  }
  return filePath;
}

/**
 * Open file in VS Code
 */
function openInVSCode(filePath, focus) {
  // Normalize path for current OS
  const normalizedPath = normalizePathForOS(filePath);

  // Build VS Code command
  let command = 'code';

  // If focus is false, reuse existing window without focusing
  if (!focus) {
    command += ' -r'; // Reuse existing window
  }

  // Add file path (properly quoted for cross-platform compatibility)
  command += ` "${normalizedPath}"`;

  // Execute command
  exec(command, (error, stdout, stderr) => {
    if (error) {
      // Silent fail - don't interrupt workflow
      // VS Code CLI might not be available on all systems
    }
  });
}

/**
 * Parse JSON input from stdin
 */
let inputData = '';

process.stdin.on('data', (chunk) => {
  inputData += chunk;
});

process.stdin.on('end', () => {
  try {
    const config = loadConfig();

    // Check if auto-open is enabled
    if (!config.autoOpen.enabled) {
      process.exit(0);
    }

    const input = JSON.parse(inputData);

    // Only process Write and Edit operations
    const toolName = input.tool_name;
    if (toolName !== 'Write' && toolName !== 'Edit') {
      process.exit(0);
    }

    // Extract file path from tool input
    const toolInput = input.tool_input || {};
    let filePath = toolInput.file_path;

    if (!filePath) {
      process.exit(0);
    }

    // Convert to absolute path if necessary
    if (!path.isAbsolute(filePath)) {
      filePath = path.join(projectRoot, filePath);
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      process.exit(0);
    }

    // Open file in VS Code
    openInVSCode(filePath, config.autoOpen.focus);

  } catch (error) {
    // Silent fail - don't interrupt the workflow
  }

  process.exit(0);
});
