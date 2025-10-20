#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();

// Load configuration from .plugin-config (project root)
function loadPluginConfig() {
  const configPath = path.join(projectRoot, '.plugin-config', 'hook-auto-docs.json');

  try {
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (error) {
    // Fall through to return default config
  }

  // Return default config if file doesn't exist (init-config.js should create it)
  return {
    showLogs: false,
    outputDirectory: '',
    outputFile: '.project-structure.md',
    includeDirs: [],
    excludeDirs: [
      'node_modules', '.git', 'dist', 'build', 'coverage',
      '.next', 'out', '.nuxt', 'vendor', '.vscode', '.idea'
    ],
    includeExtensions: [],
    excludeExtensions: [],
    includeEmptyDirs: true
  };
}

const config = loadPluginConfig();

// Directories to include (empty array = include all)
const INCLUDED_DIRS = config.includeDirs || [];

// Directories to exclude from tracking
const EXCLUDED_DIRS = config.excludeDirs || [
  'node_modules', '.git', 'dist', 'build', 'coverage',
  '.next', 'out', '.nuxt', 'vendor', '.vscode', '.idea'
];

// File extensions to include (if specified, only these will be included)
const INCLUDE_EXTENSIONS = config.includeExtensions || [];

// File extensions to exclude from tracking
const EXCLUDE_EXTENSIONS = config.excludeExtensions || [];

// Project name for file naming (current directory name)
const PROJECT_NAME = path.basename(projectRoot);

// State files stored in plugin directory (not in project root)
const PLUGIN_STATE_DIR = path.join(__dirname, '..', '.state');
const CHANGES_FILE = path.join(PLUGIN_STATE_DIR, `${PROJECT_NAME}-structure-changes.json`);

// Ensure plugin state directory exists
if (!fs.existsSync(PLUGIN_STATE_DIR)) {
  fs.mkdirSync(PLUGIN_STATE_DIR, { recursive: true });
}

/**
 * Check if file is in an included directory
 */
function isInIncludedDir(filePath) {
  if (INCLUDED_DIRS.length === 0) {
    return true; // No includeDirs specified - include all
  }

  const relativePath = path.relative(projectRoot, filePath);
  return INCLUDED_DIRS.some(includedDir => {
    const normalizedDir = includedDir.replace(/\\/g, '/');
    const normalizedRelPath = relativePath.replace(/\\/g, '/');
    return normalizedRelPath.startsWith(normalizedDir + '/') || normalizedRelPath.startsWith(normalizedDir);
  });
}

/**
 * Check if file is in an excluded directory
 */
function isInExcludedDir(filePath) {
  const relativePath = path.relative(projectRoot, filePath);
  const pathParts = relativePath.split(path.sep);

  return pathParts.some(part => {
    return EXCLUDED_DIRS.includes(part) || part.startsWith('.');
  });
}

/**
 * Check if file has valid extension
 */
function hasValidExtension(filePath) {
  const ext = path.extname(filePath);

  // First, check if file is in include list
  if (INCLUDE_EXTENSIONS && INCLUDE_EXTENSIONS.length > 0) {
    if (!INCLUDE_EXTENSIONS.includes(ext)) {
      return false; // Not in include list - exclude
    }
  }

  // Then, check if file is in exclude list
  if (EXCLUDE_EXTENSIONS.includes(ext)) {
    return false; // In exclude list - exclude
  }

  return true; // Include the file
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

  // Apply filtering rules
  if (!hasValidExtension(fileOp.filePath)) {
    return; // File extension not tracked
  }

  if (isInExcludedDir(fileOp.filePath)) {
    return; // File in excluded directory
  }

  if (!isInIncludedDir(fileOp.filePath)) {
    return; // File not in included directory
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
