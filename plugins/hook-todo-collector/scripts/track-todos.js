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
  || process.env.TODO_COLLECTOR_DIR
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
const CHANGED_FILES_FILE = path.join(PLUGIN_STATE_DIR, 'todo-changed-files.json');

// Ensure plugin state directory exists
if (!fs.existsSync(PLUGIN_STATE_DIR)) {
  fs.mkdirSync(PLUGIN_STATE_DIR, { recursive: true });
}

// File extensions to track (from config or defaults)
const EXTENSIONS = config.supportedExtensions || [
  '.js', '.jsx', '.ts', '.tsx',
  '.py', '.java', '.go', '.rb', '.php',
  '.c', '.cpp', '.h', '.hpp',
  '.cs', '.kt', '.kts', '.swift', '.rs',
  '.scala', '.dart', '.m', '.mm',
  '.css', '.scss', '.sass', '.less',
  '.html', '.vue', '.svelte',
  '.r', '.R', '.jl', '.coffee',
  '.sh', '.bash', '.ps1',
  '.toml', '.ini', '.yaml', '.yml'
];

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
 * Extract file path from Hook Input
 */
function getFileFromHookInput(hookInput) {
  if (!hookInput || !hookInput.tool_name || !hookInput.tool_input) {
    return null;
  }

  const toolName = hookInput.tool_name;
  const params = hookInput.tool_input;

  let filePath = null;

  if (toolName === 'Write' || toolName === 'write') {
    filePath = params.file_path;
  } else if (toolName === 'Edit' || toolName === 'edit') {
    filePath = params.file_path;
  } else if (toolName === 'NotebookEdit' || toolName === 'notebook_edit') {
    filePath = params.notebook_path;
  }

  if (!filePath) {
    return null;
  }

  // Convert to absolute path
  if (!path.isAbsolute(filePath)) {
    filePath = path.join(projectRoot, filePath);
  }

  return filePath;
}

/**
 * Check if file has valid extension for TODO scanning
 */
function hasValidExtension(filePath) {
  const ext = path.extname(filePath);
  const fileName = path.basename(filePath);

  // Check special files without extensions
  const specialFiles = ['Makefile', 'Dockerfile', 'Rakefile', 'Gemfile', 'Vagrantfile'];
  if (specialFiles.includes(fileName)) {
    return true;
  }

  return EXTENSIONS.includes(ext);
}

/**
 * Load changed files from previous tracking
 */
function loadChangedFiles() {
  try {
    if (fs.existsSync(CHANGED_FILES_FILE)) {
      const data = fs.readFileSync(CHANGED_FILES_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    // Return empty set if file doesn't exist or is corrupted
  }
  return [];
}

/**
 * Save changed files
 */
function saveChangedFiles(files) {
  try {
    fs.writeFileSync(CHANGED_FILES_FILE, JSON.stringify(files, null, 2), 'utf8');
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

  // Extract file path
  const filePath = getFileFromHookInput(hookInput);

  if (!filePath) {
    // Not a file operation we track - just continue
    return;
  }

  // Check if file has valid extension for TODO scanning
  if (!hasValidExtension(filePath)) {
    return;
  }

  // Load existing changed files
  let changedFiles = loadChangedFiles();

  // Add file to changed files list (if not already there)
  if (!changedFiles.includes(filePath)) {
    changedFiles.push(filePath);
  }

  // Save updated changed files
  saveChangedFiles(changedFiles);
}

main();
