#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();

// Stop hook loop prevention - exit if already inside a stop hook
if (process.env.STOP_HOOK_ACTIVE === 'true') {
  process.exit(2);
}

// Timestamp-based duplicate execution prevention (Issue #9602 workaround)
// Prevents Claude Code v2.0.17 bug where Stop hooks fire 3-4+ times
const stateDir = path.join(__dirname, '..', '.state');
const lockFile = path.join(stateDir, '.stop-hook.lock');
const now = Date.now();

try {
  // Ensure state directory exists
  if (!fs.existsSync(stateDir)) {
    fs.mkdirSync(stateDir, { recursive: true });
  }

  // Check if hook ran recently (within 3 seconds)
  if (fs.existsSync(lockFile)) {
    const lastRun = parseInt(fs.readFileSync(lockFile, 'utf8'));
    if (!isNaN(lastRun) && (now - lastRun < 3000)) {
      // Hook ran too recently - likely a duplicate execution
      process.exit(0);
    }
  }

  // Update lock file with current timestamp
  fs.writeFileSync(lockFile, now.toString(), 'utf8');
} catch (error) {
  // If lock file handling fails, continue anyway
}

// Load configuration from .plugin-config (project root)
// init-config.js (SessionStart hook) should have created this file
function loadPluginConfig() {
  const configPath = path.join(projectRoot, '.plugin-config', 'hook-auto-docs.json');

  try {
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (error) {
    // Fall through to return minimal defaults
  }

  // Full fallback config - init-config.js should have created this,
  // but provide complete defaults to ensure plugin works properly
  return {
    showLogs: false,
    outputDirectory: '',
    outputFile: '',
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

// Project name for file naming (current directory name)
const PROJECT_NAME = path.basename(projectRoot);

// State files stored in plugin directory (not in project root)
const PLUGIN_STATE_DIR = path.join(__dirname, '..', '.state');
const STATE_FILE = path.join(PLUGIN_STATE_DIR, `${PROJECT_NAME}-structure-state.json`);
const CHANGES_FILE = path.join(PLUGIN_STATE_DIR, `${PROJECT_NAME}-structure-changes.json`);

// Ensure plugin state directory exists
if (!fs.existsSync(PLUGIN_STATE_DIR)) {
  fs.mkdirSync(PLUGIN_STATE_DIR, { recursive: true });
}

/**
 * Sanitize filename to prevent path traversal and absolute paths
 */
function sanitizeFilename(filename) {
  if (!filename) return '';

  // If absolute path, extract basename only
  if (path.isAbsolute(filename)) {
    return path.basename(filename);
  }

  // Normalize and check for path traversal
  const normalized = path.normalize(filename);
  if (normalized.includes('..')) {
    return path.basename(filename);
  }

  // Return just the filename (no directories)
  return path.basename(filename);
}

// Output file goes to configured output directory (sanitize to prevent path traversal)
const rawOutputFile = config.outputFile || `.${PROJECT_NAME}-project-structure.md`;
const OUTPUT_FILE = getOutputPath(sanitizeFilename(rawOutputFile));

// Directories to include (if specified, only these will be scanned)
const INCLUDED_DIRS = config.includeDirs && config.includeDirs.length > 0
  ? config.includeDirs
  : null;

// Directories to exclude from scanning
const EXCLUDED_DIRS = config.excludeDirs || [
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '.next',
  'out',
  '.nuxt',
  'vendor',
  '.vscode',
  '.idea'
];

// File extensions to include (if specified, only these will be included)
const INCLUDED_EXTENSIONS = config.includeExtensions && config.includeExtensions.length > 0
  ? config.includeExtensions.map(ext => ext.startsWith('.') ? ext : `.${ext}`)
  : null;

// File extensions to exclude from scanning
const EXCLUDED_EXTENSIONS = config.excludeExtensions
  ? config.excludeExtensions.map(ext => ext.startsWith('.') ? ext : `.${ext}`)
  : [];

// Include empty directories (default: true)
const INCLUDE_EMPTY_DIRS = config.includeEmptyDirs !== false;

/**
 * Check if directory should be excluded
 */
function shouldExcludeDir(dirPath) {
  const dirName = path.basename(dirPath);
  return EXCLUDED_DIRS.includes(dirName) || dirName.startsWith('.');
}

/**
 * Check if file should be excluded based on extension
 */
function shouldExcludeFile(filePath) {
  const ext = path.extname(filePath);

  // First, check if file is in include list (if specified)
  if (INCLUDED_EXTENSIONS && INCLUDED_EXTENSIONS.length > 0) {
    if (!INCLUDED_EXTENSIONS.includes(ext)) {
      return true; // Not in include list - exclude
    }
  }

  // Then, check if file is in exclude list
  if (EXCLUDED_EXTENSIONS.includes(ext)) {
    return true; // In exclude list - exclude
  }

  return false; // Include the file
}

/**
 * Scan directory structure
 */
function scanDirectory(dir, prefix = '', isLast = true, basePath = null) {
  const entries = [];

  try {
    const items = fs.readdirSync(dir);
    const filtered = items.filter(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        return !shouldExcludeDir(fullPath);
      }
      return true;
    });

    filtered.forEach((item, index) => {
      const fullPath = path.join(dir, item);
      const isLastItem = index === filtered.length - 1;
      const connector = isLastItem ? '└── ' : '├── ';
      const extension = isLastItem ? '    ' : '│   ';

      const stat = fs.statSync(fullPath);
      const relativePath = path.relative(projectRoot, fullPath).replace(/\\/g, '/');

      if (stat.isDirectory()) {
        const subEntries = scanDirectory(fullPath, prefix + extension, isLastItem, basePath);

        // Only include directory if:
        // 1. includeEmptyDirs is true, OR
        // 2. Directory has content (subEntries.length > 0)
        if (INCLUDE_EMPTY_DIRS || subEntries.length > 0) {
          entries.push({
            line: `${prefix}${connector}${item}/`,
            path: relativePath,
            type: 'directory',
            basePath: basePath
          });
          entries.push(...subEntries);
        }
      } else {
        // Check if file should be excluded based on extension
        if (!shouldExcludeFile(fullPath)) {
          entries.push({
            line: `${prefix}${connector}[${item}](${relativePath})`,
            path: relativePath,
            type: 'file',
            basePath: basePath
          });
        }
      }
    });
  } catch (error) {
    // Skip directories we can't read
  }

  return entries;
}

/**
 * Load previous state
 */
function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const data = fs.readFileSync(STATE_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    // Return null if file doesn't exist or is corrupted
  }
  return null;
}

/**
 * Save state
 */
function saveState(state) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (error) {
    // Fail silently
  }
}

/**
 * Load changes
 */
function loadChanges() {
  try {
    if (fs.existsSync(CHANGES_FILE)) {
      const data = fs.readFileSync(CHANGES_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    // Return empty object
  }
  return { files: [] };
}

/**
 * Get package.json info
 */
function getPackageInfo() {
  const packagePath = path.join(projectRoot, 'package.json');

  if (!fs.existsSync(packagePath)) {
    return null;
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    return {
      name: packageJson.name || 'Unnamed Project',
      version: packageJson.version || '0.0.0',
      description: packageJson.description || '',
      scripts: packageJson.scripts || {},
      dependencies: packageJson.dependencies || {},
      devDependencies: packageJson.devDependencies || {}
    };
  } catch (error) {
    return null;
  }
}

/**
 * Generate structure documentation
 */
function generateDocumentation(structure, packageInfo, includedDirs = null) {
  const now = new Date();
  const timestamp = now.toISOString().replace('T', ' ').slice(0, 19);

  let doc = `# Project Structure\n\n`;
  doc += `**Generated**: ${timestamp}\n\n`;

  // Show file extension filters if active
  if (INCLUDED_EXTENSIONS && INCLUDED_EXTENSIONS.length > 0) {
    doc += `**Included Extensions**: ${INCLUDED_EXTENSIONS.map(e => `\`${e}\``).join(', ')}\n\n`;
  }
  if (EXCLUDED_EXTENSIONS && EXCLUDED_EXTENSIONS.length > 0) {
    doc += `**Excluded Extensions**: ${EXCLUDED_EXTENSIONS.map(e => `\`${e}\``).join(', ')}\n\n`;
  }

  // Project info from package.json
  if (packageInfo) {
    doc += `## Project Information\n\n`;
    doc += `- **Name**: ${packageInfo.name}\n`;
    doc += `- **Version**: ${packageInfo.version}\n`;
    if (packageInfo.description) {
      doc += `- **Description**: ${packageInfo.description}\n`;
    }
    doc += `\n`;

    // Scripts
    const scripts = Object.keys(packageInfo.scripts);
    if (scripts.length > 0) {
      doc += `## Available Scripts\n\n`;
      scripts.forEach(script => {
        doc += `- \`npm run ${script}\`: ${packageInfo.scripts[script]}\n`;
      });
      doc += `\n`;
    }

    // Dependencies
    const deps = Object.keys(packageInfo.dependencies);
    const devDeps = Object.keys(packageInfo.devDependencies);

    if (deps.length > 0 || devDeps.length > 0) {
      doc += `## Dependencies\n\n`;

      if (deps.length > 0) {
        doc += `### Production (${deps.length})\n\n`;
        deps.forEach(dep => {
          doc += `- ${dep}: \`${packageInfo.dependencies[dep]}\`\n`;
        });
        doc += `\n`;
      }

      if (devDeps.length > 0) {
        doc += `### Development (${devDeps.length})\n\n`;
        devDeps.forEach(dep => {
          doc += `- ${dep}: \`${packageInfo.devDependencies[dep]}\`\n`;
        });
        doc += `\n`;
      }
    }
  }

  // Directory structure
  doc += `## Directory Structure\n\n`;

  if (includedDirs && includedDirs.length > 0) {
    doc += `**Included**: ${includedDirs.join(', ')}\n\n`;
  }

  // Show unified tree from project root
  doc += `${path.basename(projectRoot)}/\n`;

  if (includedDirs && includedDirs.length > 0) {
    // Group entries by top-level directory
    const groupedEntries = {};

    structure.forEach(entry => {
      const topLevel = entry.basePath || 'root';
      if (!groupedEntries[topLevel]) {
        groupedEntries[topLevel] = [];
      }
      groupedEntries[topLevel].push(entry);
    });

    // Output each directory group
    includedDirs.forEach((dirPath, dirIndex) => {
      const isLastDir = dirIndex === includedDirs.length - 1;
      const dirConnector = isLastDir ? '└── ' : '├── ';
      const dirExtension = isLastDir ? '    ' : '│   ';

      doc += `${dirConnector}${dirPath}/\n`;

      const dirEntries = groupedEntries[dirPath] || [];
      dirEntries.forEach(entry => {
        // Adjust indentation for unified tree
        const adjustedLine = entry.line.replace(/^/, dirExtension);
        doc += `${adjustedLine}\n`;
      });
    });
  } else {
    // Show full project structure
    structure.forEach(entry => {
      doc += `${entry.line}\n`;
    });
  }

  return doc;
}

/**
 * Main function
 */
function main() {
  const changes = loadChanges();
  const previousState = loadState();
  const isFirstRun = !previousState;

  // Check if we need to regenerate
  if (!isFirstRun && changes.files.length === 0) {
    // Check if output file exists
    if (fs.existsSync(OUTPUT_FILE)) {
      // File exists and no changes - exit
      return;
    }
    // File missing - continue to regenerate
  }

  // Scan directory structure
  let structure = [];

  if (INCLUDED_DIRS && INCLUDED_DIRS.length > 0) {
    // Scan only specified directories
    INCLUDED_DIRS.forEach(includedDir => {
      const fullPath = path.isAbsolute(includedDir)
        ? includedDir
        : path.join(projectRoot, includedDir);

      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
        const dirEntries = scanDirectory(fullPath, '', true, includedDir);
        structure.push(...dirEntries);
      }
    });
  } else {
    // Scan entire project
    structure = scanDirectory(projectRoot);
  }

  // Get package.json info
  const packageInfo = getPackageInfo();

  // Generate documentation
  const documentation = generateDocumentation(structure, packageInfo, INCLUDED_DIRS);

  // Save documentation
  fs.writeFileSync(OUTPUT_FILE, documentation, 'utf8');

  // Save new state (file list for future comparison)
  const newState = {
    files: structure.map(entry => entry.path),
    lastUpdated: new Date().toISOString()
  };
  saveState(newState);

  // Clean up changes file
  try {
    if (fs.existsSync(CHANGES_FILE)) {
      fs.unlinkSync(CHANGES_FILE);
    }
  } catch (error) {
    // Fail silently
  }

  // Generate message for user
  let message = '';
  if (INCLUDED_DIRS && INCLUDED_DIRS.length > 0) {
    const fileCount = structure.filter(e => e.type === 'file').length;
    message = `📚 Auto-Docs: Generated structure for ${INCLUDED_DIRS.length} director${INCLUDED_DIRS.length > 1 ? 'ies' : 'y'} (${fileCount} files)`;
  } else if (isFirstRun) {
    message = `📚 Auto-Docs: Generated project structure documentation (${structure.filter(e => e.type === 'file').length} files)`;
  } else {
    message = `📚 Auto-Docs: Updated project structure (${changes.files.length} file(s) changed)`;
  }

  // Show logs only if showLogs is true
  if (config.showLogs === true) {
    console.log(JSON.stringify({
      systemMessage: message,
      continue: true
    }));
  }
}

main();
process.exit(0);
