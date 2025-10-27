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
    // Fall through to default config
  }

  // Default config if file doesn't exist or is invalid
  return {
    autoOpen: {
      enabled: true,
      focus: false,
      openLocation: 1,  // 0 = first column, 1 = second column
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
      filePath = path.join(process.cwd(), filePath);
    }

    processFile(filePath, config);
  } catch (error) {
    // Silent fail - don't interrupt the workflow
    process.exit(0);
  }
});

function processFile(absolutePath, config) {
  try {
    // Check if file exists
    if (!fs.existsSync(absolutePath)) {
      process.exit(0);
    }

    // Write to communication file for VSCode extension
    const stateDir = path.join(process.cwd(), '.claude-dev-helper');
    const openFilesPath = path.join(stateDir, 'open-files.json');

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

    // Add new file to queue with timestamp, focus, and openLocation settings
    queue.push({
      filePath: absolutePath,
      timestamp: Date.now(),
      focus: config.autoOpen.focus,
      openLocation: config.autoOpen.openLocation ?? 1  // Use ?? to handle 0 value
    });

    // Keep only last N files based on config to prevent memory leak
    const maxQueueSize = config.autoOpen.maxQueueSize || 10;
    if (queue.length > maxQueueSize) {
      queue = queue.slice(-maxQueueSize);
    }

    // Write back to file
    fs.writeFileSync(openFilesPath, JSON.stringify(queue, null, 2), 'utf8');
  } catch (error) {
    // Silent fail - don't interrupt the workflow
  }

  process.exit(0);
}
