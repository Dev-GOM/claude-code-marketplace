#!/usr/bin/env node

/**
 * Auto Open File Hook Script
 * Automatically opens files in VS Code when they are created or modified
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();

/**
 * Load plugin configuration from .plugin-config (project root)
 */
function loadPluginConfig() {
  const configPath = path.join(projectRoot, '.plugin-config', 'hook-auto-open-file.json');

  try {
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (error) {
    // Fall through to default config
  }

  // Default config
  return {
    enabled: true,
    openInNewWindow: false,
    focusEditor: true,
    jumpToLine: true,
    codeExtensions: [
      '.js', '.ts', '.jsx', '.tsx',
      '.py', '.java', '.cpp', '.c', '.cs',
      '.go', '.rs', '.rb', '.php', '.swift',
      '.kt', '.scala', '.r', '.m', '.h', '.hpp',
      '.sql', '.sh', '.bash', '.ps1',
      '.html', '.css', '.scss', '.sass', '.less',
      '.json', '.yaml', '.yml', '.toml', '.xml',
      '.md', '.txt', '.env'
    ],
    excludeDirs: [
      'node_modules',
      '.git',
      'dist',
      'build',
      'coverage',
      '.next',
      'out',
      '.nuxt'
    ]
  };
}

const config = loadPluginConfig();

/**
 * Check if file extension is in the allowed list
 */
function isCodeFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return config.codeExtensions.includes(ext);
}

/**
 * Check if file is in an excluded directory
 */
function isInExcludedDir(filePath) {
  const relativePath = path.relative(projectRoot, filePath);
  const pathParts = relativePath.split(path.sep);

  return pathParts.some(part => config.excludeDirs.includes(part));
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
function openInVSCode(filePath) {
  // Normalize path for current OS
  const normalizedPath = normalizePathForOS(filePath);

  // Build VS Code command
  let command = 'code';

  // Add flags based on configuration
  if (!config.openInNewWindow) {
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
    // Check if plugin is enabled
    if (!config.enabled) {
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

    // Check if file should be opened based on configuration
    if (!isCodeFile(filePath)) {
      process.exit(0); // Not a code file
    }

    if (isInExcludedDir(filePath)) {
      process.exit(0); // File in excluded directory
    }

    // Open file in VS Code
    openInVSCode(filePath);

  } catch (err) {
    // Silent fail - don't interrupt the workflow
  }

  process.exit(0);
});
