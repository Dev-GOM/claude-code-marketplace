#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();

// Load configuration from hooks.json
function loadConfiguration() {
  try {
    const hooksConfigPath = path.join(__dirname, '../hooks/hooks.json');
    const hooksConfig = JSON.parse(fs.readFileSync(hooksConfigPath, 'utf8'));
    return hooksConfig.configuration || {};
  } catch (error) {
    return {};
  }
}

const config = loadConfiguration();

// Output directory (priority: config > plugin env > global env > default)
const OUTPUT_DIR = config.outputDirectory
  || process.env.SESSION_SUMMARY_DIR
  || process.env.CLAUDE_PLUGIN_OUTPUT_DIR
  || '';

// Helper to get full path with output directory
function getOutputPath(filename) {
  if (OUTPUT_DIR) {
    const fullDir = path.isAbsolute(OUTPUT_DIR)
      ? OUTPUT_DIR
      : path.join(projectRoot, OUTPUT_DIR);

    // Create directory if it doesn't exist
    if (!fs.existsSync(fullDir)) {
      fs.mkdirSync(fullDir, { recursive: true });
    }

    return path.join(fullDir, filename);
  }
  return path.join(projectRoot, filename);
}

// Session file stored in plugin directory (not in project root)
const PLUGIN_STATE_DIR = path.join(__dirname, '..', '.state');
const OPERATIONS_FILE = path.join(PLUGIN_STATE_DIR, 'session-operations.json');

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
