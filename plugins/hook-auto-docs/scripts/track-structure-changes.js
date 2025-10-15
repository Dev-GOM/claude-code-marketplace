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
  || process.env.AUTO_DOCS_DIR
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

// State files stored in plugin directory (not in project root)
const PLUGIN_STATE_DIR = path.join(__dirname, '..', '.state');
const CHANGES_FILE = path.join(PLUGIN_STATE_DIR, 'structure-changes.json');

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
 * Extract file path and operation from Hook Input
 */
function getFileOperation(hookInput) {
  if (!hookInput || !hookInput.tool_name || !hookInput.tool_input) {
    return null;
  }

  const toolName = hookInput.tool_name;
  const params = hookInput.tool_input;

  let filePath = null;
  let operation = null;

  if (toolName === 'Write' || toolName === 'write') {
    filePath = params.file_path;
    operation = 'write';
  } else if (toolName === 'Edit' || toolName === 'edit') {
    filePath = params.file_path;
    operation = 'edit';
  }

  if (!filePath) {
    return null;
  }

  // Convert to absolute path
  if (!path.isAbsolute(filePath)) {
    filePath = path.join(projectRoot, filePath);
  }

  return { filePath, operation };
}

/**
 * Load changes from tracking file
 */
function loadChanges() {
  try {
    if (fs.existsSync(CHANGES_FILE)) {
      const data = fs.readFileSync(CHANGES_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    // Return empty object if file doesn't exist or is corrupted
  }
  return { files: [] };
}

/**
 * Save changes
 */
function saveChanges(changes) {
  try {
    fs.writeFileSync(CHANGES_FILE, JSON.stringify(changes, null, 2), 'utf8');
  } catch (error) {
    // Fail silently
  }
}

/**
 * Main function
 */
async function main() {
  // Read Hook Input from stdin
  const hookInput = await readHookInput();

  // Extract file operation
  const fileOp = getFileOperation(hookInput);

  if (!fileOp) {
    // Not a file operation we track
    return;
  }

  // Load existing changes
  const changes = loadChanges();

  // Add file to changes list (if not already there)
  const relativePath = path.relative(projectRoot, fileOp.filePath);

  if (!changes.files.includes(relativePath)) {
    changes.files.push(relativePath);
  }

  // Save updated changes
  saveChanges(changes);
}

main();
