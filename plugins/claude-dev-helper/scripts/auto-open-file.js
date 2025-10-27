#!/usr/bin/env node

/**
 * Auto-open file in VSCode after Write/Edit operations
 *
 * This script is triggered by PostToolUse hook and notifies VSCode extension
 * to open the modified file without focusing it.
 */

const fs = require('fs');
const path = require('path');

// Load plugin configuration
function loadConfig() {
  const projectRoot = process.cwd();
  const configPath = path.join(projectRoot, '.plugin-config', 'claude-dev-helper.json');

  try {
    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(configContent);
    }
  } catch (error) {
    console.error(`[Auto-open] Failed to load config: ${error.message}`);
  }

  // Default config if file doesn't exist or is invalid
  return {
    autoOpen: {
      enabled: true,
      focus: false,
      maxQueueSize: 10
    }
  };
}

// Read tool use data from stdin
let inputData = '';
process.stdin.on('data', chunk => {
  inputData += chunk;
});

process.stdin.on('end', () => {
  try {
    // Load configuration
    const config = loadConfig();

    // Check if auto-open is enabled
    if (!config.autoOpen.enabled) {
      console.log('[Auto-open] Feature is disabled in config');
      process.exit(0);
    }

    const toolUse = JSON.parse(inputData);

    // Extract file path from tool parameters
    const filePath = toolUse.parameters?.file_path;

    if (!filePath) {
      console.error('[Auto-open] No file path in tool parameters');
      process.exit(0);
    }

    // Resolve to absolute path
    const absolutePath = path.resolve(process.cwd(), filePath);

    processFile(absolutePath, config);
  } catch (error) {
    console.error(`[Auto-open] Error parsing input: ${error.message}`);
    process.exit(0);
  }
});

function processFile(absolutePath, config) {
  // Check if file exists
  if (!fs.existsSync(absolutePath)) {
    console.error(`[Auto-open] File not found: ${absolutePath}`);
    process.exit(0);
  }

  // Write to communication file for VSCode extension
  const stateDir = path.join(process.cwd(), '.claude-dev-helper');
  const openFilesPath = path.join(stateDir, 'open-files.json');

  try {
    // Ensure state directory exists
    if (!fs.existsSync(stateDir)) {
      fs.mkdirSync(stateDir, { recursive: true });
    }

    // Read existing queue
    let queue = [];
    if (fs.existsSync(openFilesPath)) {
      try {
        const content = fs.readFileSync(openFilesPath, 'utf8');
        queue = JSON.parse(content);
      } catch (e) {
        // Invalid JSON, start fresh
        queue = [];
      }
    }

    // Add new file to queue with timestamp and focus setting
    queue.push({
      filePath: absolutePath,
      timestamp: Date.now(),
      focus: config.autoOpen.focus
    });

    // Keep only last N files based on config to prevent memory leak
    const maxQueueSize = config.autoOpen.maxQueueSize || 10;
    if (queue.length > maxQueueSize) {
      queue = queue.slice(-maxQueueSize);
    }

    // Write back to file
    fs.writeFileSync(openFilesPath, JSON.stringify(queue, null, 2), 'utf8');

    console.log(`[Auto-open] Queued file for opening: ${path.basename(absolutePath)}`);
  } catch (error) {
    console.error(`[Auto-open] Error: ${error.message}`);
    process.exit(0);
  }
}