#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();

/**
 * Validate and fix config values
 */
function validateConfig(config) {
  // Ensure trackedTools is an array
  if (config.trackedTools && !Array.isArray(config.trackedTools)) {
    config.trackedTools = [config.trackedTools];
  }

  return config;
}

// Load configuration from .plugin-config (project root)
// init-config.js (SessionStart hook) should have created this file
function loadPluginConfig() {
  const configPath = path.join(projectRoot, '.plugin-config', 'hook-session-summary.json');

  let config;
  try {
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return validateConfig(config);
    }
  } catch (error) {
    // Fall through to return minimal defaults
  }

  // Full fallback config - init-config.js should have created this,
  // but provide complete defaults to ensure plugin works properly
  return {
    showLogs: false,
    outputDirectory: '',
    outputFile: '.session-summary.md',
    includeTimestamp: true,
    trackedTools: ['Write', 'Edit', 'Read', 'NotebookEdit'],
    operationPriority: ['Created', 'Updated', 'Modified', 'Read'],
    treeVisualization: true,
    statistics: {
      totalFiles: true,
      byOperationType: true,
      byFileExtension: false
    }
  };
}

const config = loadPluginConfig();

// Project name for file naming (current directory name)
const PROJECT_NAME = path.basename(projectRoot);

// Session file stored in plugin directory (not in project root)
const PLUGIN_STATE_DIR = path.join(__dirname, '..', '.state');
const OPERATIONS_FILE = path.join(PLUGIN_STATE_DIR, `${PROJECT_NAME}-session-operations.json`);

// Ensure plugin state directory exists
if (!fs.existsSync(PLUGIN_STATE_DIR)) {
  fs.mkdirSync(PLUGIN_STATE_DIR, { recursive: true });
}

/**
 * Read Hook Input from stdin
 */
async function readHookInput() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.on('data', chunk => {
      data += chunk;
    });
    process.stdin.on('end', () => {
      try {
        resolve(JSON.parse(data));
      } catch (error) {
        resolve(null);
      }
    });
  });
}

/**
 * Load existing operations from file
 */
function loadOperations() {
  try {
    if (fs.existsSync(OPERATIONS_FILE)) {
      const data = fs.readFileSync(OPERATIONS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    // Return empty object if file doesn't exist or is corrupted
  }
  return {};
}

/**
 * Save operations to file
 */
function saveOperations(operations) {
  try {
    fs.writeFileSync(OPERATIONS_FILE, JSON.stringify(operations, null, 2), 'utf8');
  } catch (error) {
    // Fail silently
  }
}

/**
 * Extract file path and operation from Hook Input
 */
function extractFileOperation(hookInput, existingOperations) {
  if (!hookInput || !hookInput.tool_name || !hookInput.tool_input) {
    return null;
  }

  const toolName = hookInput.tool_name;
  const params = hookInput.tool_input;

  // Check if this tool should be tracked
  const trackedTools = config.trackedTools || ['Write', 'Edit', 'Read', 'NotebookEdit'];
  const normalizedToolName = toolName.charAt(0).toUpperCase() + toolName.slice(1).toLowerCase();

  if (!trackedTools.includes(normalizedToolName)) {
    return null; // Tool not in tracked list
  }

  let filePath = null;
  let operation = null;

  // Map tool names to operations
  if (toolName === 'Write' || toolName === 'write') {
    filePath = params.file_path;

    // Convert to absolute path to check if already tracked
    const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(projectRoot, filePath);

    // If file was already tracked in this session, it's an Update
    // Otherwise, it's a Create (first time Write in this session)
    if (existingOperations[absolutePath]) {
      operation = 'Updated';
    } else {
      operation = 'Created';
    }
  } else if (toolName === 'Edit' || toolName === 'edit') {
    filePath = params.file_path;
    operation = 'Modified';
  } else if (toolName === 'Read' || toolName === 'read') {
    filePath = params.file_path;
    operation = 'Read';
  } else if (toolName === 'NotebookEdit' || toolName === 'notebook_edit') {
    filePath = params.notebook_path;
    operation = 'Modified';
  }

  if (!filePath) {
    return null;
  }

  // Convert to absolute path if needed
  if (!path.isAbsolute(filePath)) {
    filePath = path.join(projectRoot, filePath);
  }

  return { filePath, operation };
}

/**
 * Main function
 */
async function main() {
  // Read Hook Input from stdin
  const hookInput = await readHookInput();

  // Load existing operations first
  const operations = loadOperations();

  // Extract file operation (needs existing operations to determine Created vs Updated)
  const fileOp = extractFileOperation(hookInput, operations);

  if (!fileOp) {
    // Not a file operation we track - just continue
    return;
  }

  // Add or update operation for this file
  if (!operations[fileOp.filePath]) {
    operations[fileOp.filePath] = new Set();
  } else if (Array.isArray(operations[fileOp.filePath])) {
    // Convert array to Set if needed
    operations[fileOp.filePath] = new Set(operations[fileOp.filePath]);
  } else {
    operations[fileOp.filePath] = new Set(operations[fileOp.filePath]);
  }

  operations[fileOp.filePath].add(fileOp.operation);

  // Convert Sets to Arrays for JSON serialization
  const serializable = {};
  Object.keys(operations).forEach(key => {
    serializable[key] = Array.from(operations[key]);
  });

  // Save updated operations
  saveOperations(serializable);
}

main();
