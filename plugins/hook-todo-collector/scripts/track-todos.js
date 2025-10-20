#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();

// Load configuration from .plugin-config (project root)
function loadPluginConfig() {
  const configPath = path.join(projectRoot, '.plugin-config', 'hook-todo-collector.json');

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
    outputFile: '',
    includeDirs: [],
    excludeDirs: [
      'node_modules', '.git', 'dist', 'build', 'coverage',
      '.next', '.nuxt', 'out', 'vendor', '.snapshots', '.claude-plugin'
    ],
    includeExtensions: [
      '.js', '.jsx', '.ts', '.tsx',
      '.py', '.java', '.go', '.rb', '.php',
      '.c', '.cpp', '.h', '.hpp',
      '.cs',
      '.kt', '.kts',
      '.swift',
      '.rs',
      '.scala',
      '.dart',
      '.m', '.mm',
      '.css', '.scss', '.sass', '.less',
      '.html', '.vue', '.svelte',
      '.r', '.R', '.jl', '.coffee',
      '.sh', '.bash', '.ps1',
      '.toml', '.ini', '.yaml', '.yml'
    ],
    excludeExtensions: [],
    commentTypes: ['TODO', 'FIXME', 'HACK', 'BUG', 'XXX', 'NOTE']
  };
}

const config = loadPluginConfig();

// Project name for file naming (current directory name)
const PROJECT_NAME = path.basename(projectRoot);

// State files stored in plugin directory (not in project root)
const PLUGIN_STATE_DIR = path.join(__dirname, '..', '.state');
const CHANGED_FILES_FILE = path.join(PLUGIN_STATE_DIR, `${PROJECT_NAME}-todo-changed-files.json`);

// Ensure plugin state directory exists
if (!fs.existsSync(PLUGIN_STATE_DIR)) {
  fs.mkdirSync(PLUGIN_STATE_DIR, { recursive: true });
}

// Directories to include (empty array = include all)
const INCLUDED_DIRS = config.includeDirs || [];

// File extensions to include (if specified, only these will be included)
const INCLUDE_EXTENSIONS = config.includeExtensions && config.includeExtensions.length > 0
  ? config.includeExtensions
  : [
      '.js', '.jsx', '.ts', '.tsx',
      '.py', '.java', '.go', '.rb', '.php',
      '.c', '.cpp', '.h', '.hpp', '.cs',
      '.kt', '.kts', '.swift', '.rs', '.scala', '.dart',
      '.m', '.mm', '.css', '.scss', '.sass', '.less',
      '.html', '.vue', '.svelte', '.r', '.R', '.jl', '.coffee',
      '.sh', '.bash', '.ps1', '.toml', '.ini', '.yaml', '.yml'
    ];

// File extensions to exclude from scanning
const EXCLUDE_EXTENSIONS = config.excludeExtensions || [];

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

  // First, check if file is in include list (same as auto-docs logic)
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

  // Check if file is in includeDirs (if specified)
  if (INCLUDED_DIRS.length > 0) {
    const relPath = path.relative(projectRoot, filePath);
    const isInIncludedDir = INCLUDED_DIRS.some(dir => {
      const normalizedDir = dir.replace(/\\/g, '/');
      const normalizedRelPath = relPath.replace(/\\/g, '/');
      return normalizedRelPath.startsWith(normalizedDir);
    });

    if (!isInIncludedDir) {
      return;
    }
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
