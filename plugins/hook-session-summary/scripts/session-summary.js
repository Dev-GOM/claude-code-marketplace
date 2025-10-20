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

/**
 * Validate and fix config values
 */
function validateConfig(config) {
  // Ensure trackedTools is an array
  if (config.trackedTools && !Array.isArray(config.trackedTools)) {
    config.trackedTools = [config.trackedTools];
  }

  // Ensure operationPriority is an array
  if (config.operationPriority && !Array.isArray(config.operationPriority)) {
    config.operationPriority = ['Created', 'Updated', 'Modified', 'Read'];
  }

  // Ensure statistics is an object
  if (config.statistics && typeof config.statistics !== 'object') {
    config.statistics = {
      totalFiles: true,
      byOperationType: true,
      byFileExtension: false
    };
  }

  // Ensure booleans are actual booleans
  if (typeof config.treeVisualization !== 'boolean') {
    config.treeVisualization = true;
  }
  if (typeof config.includeTimestamp !== 'boolean') {
    config.includeTimestamp = true;
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

// Project name for file naming (current directory name)
const PROJECT_NAME = path.basename(projectRoot);

// Session file stored in plugin directory (not in project root)
const PLUGIN_STATE_DIR = path.join(__dirname, '..', '.state');
const OPERATIONS_FILE = path.join(PLUGIN_STATE_DIR, `${PROJECT_NAME}-session-operations.json`);

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

// Output file path (from config or default, sanitized to prevent path traversal)
const rawOutputFile = config.outputFile || `.${PROJECT_NAME}-session-summary.md`;
const OUTPUT_FILE = sanitizeFilename(rawOutputFile);

/**
 * Load file operations from accumulated tracking file
 */
function loadFileOperations() {
  const fileOperations = new Map(); // Map<filePath, Set<operation>>

  try {
    if (!fs.existsSync(OPERATIONS_FILE)) {
      return fileOperations;
    }

    const data = fs.readFileSync(OPERATIONS_FILE, 'utf8');
    const operations = JSON.parse(data);

    // Convert plain object to Map with Sets
    Object.entries(operations).forEach(([filePath, ops]) => {
      fileOperations.set(filePath, new Set(ops));
    });

  } catch (error) {
    // Return empty map if file can't be read or is corrupted
  }

  return fileOperations;
}

/**
 * Classify file operation status - returns all operations as string
 */
function classifyOperation(operations) {
  const opsArray = Array.from(operations);

  // Priority order for display (from config or default)
  const priority = config.operationPriority || ['Created', 'Updated', 'Modified', 'Read'];

  // Sort operations by priority
  const sortedOps = opsArray.sort((a, b) => {
    return priority.indexOf(a) - priority.indexOf(b);
  });

  // Return formatted string with icons
  return sortedOps.map(op => {
    const icon = getStatusIcon(op);
    return `${op} ${icon}`;
  }).join(', ');
}

/**
 * Get primary operation for counting stats
 */
function getPrimaryOperation(operations) {
  // Priority: Created > Updated > Modified > Read
  if (operations.has('Created')) return 'Created';
  if (operations.has('Updated')) return 'Updated';
  if (operations.has('Modified')) return 'Modified';
  if (operations.has('Read')) return 'Read';
  return 'Unknown';
}

/**
 * Get status icon
 */
function getStatusIcon(status) {
  switch (status) {
    case 'Created': return '✓';
    case 'Updated': return '✓';
    case 'Modified': return '✓';
    case 'Read': return '📖';
    default: return '•';
  }
}

/**
 * Build directory tree structure
 */
function buildDirectoryTree(fileOperations) {
  const tree = {};

  fileOperations.forEach((operations, filePath) => {
    const relativePath = path.relative(projectRoot, filePath);
    const parts = relativePath.split(path.sep);
    const status = classifyOperation(operations);

    let current = tree;
    parts.forEach((part, index) => {
      if (index === parts.length - 1) {
        // File - store relative path for link generation
        current[part] = {
          isFile: true,
          status,
          operations: Array.from(operations),
          relativePath: relativePath.replace(/\\/g, '/') // Convert to forward slashes for URLs
        };
      } else {
        // Directory
        if (!current[part]) {
          current[part] = { isFile: false, children: {} };
        }
        current = current[part].children;
      }
    });
  });

  return tree;
}

/**
 * Generate tree string with optional clickable file links
 * @param {boolean} withLinks - If true, generates markdown links for files
 */
function generateTreeString(tree, prefix = '', isLast = true, withLinks = true) {
  let result = '';
  const entries = Object.entries(tree);

  entries.forEach(([name, node], index) => {
    const isLastEntry = index === entries.length - 1;
    const connector = isLastEntry ? '└── ' : '├── ';
    const extension = isLastEntry ? '    ' : '│   ';

    if (node.isFile) {
      if (withLinks) {
        // Create clickable markdown link for filename only
        result += `${prefix}${connector}[${name}](${node.relativePath}) [${node.status}]\n`;
      } else {
        // Plain text for systemMessage
        result += `${prefix}${connector}${name} [${node.status}]\n`;
      }
    } else {
      result += `${prefix}${connector}${name}/\n`;
      result += generateTreeString(node.children, prefix + extension, isLastEntry, withLinks);
    }
  });

  return result;
}

/**
 * Generate summary report
 */
function generateSummary(fileOperations) {
  if (fileOperations.size === 0) {
    return '# Session Summary\n\nNo files were modified during this session.\n';
  }

  const tree = buildDirectoryTree(fileOperations);

  // Count by status
  const stats = {
    'Created': 0,
    'Updated': 0,
    'Modified': 0,
    'Read': 0
  };

  fileOperations.forEach((operations) => {
    const status = getPrimaryOperation(operations);
    stats[status] = (stats[status] || 0) + 1;
  });

  let summary = '# Session Summary\n\n';

  // Statistics configuration
  const statisticsConfig = config.statistics || {
    totalFiles: true,
    byOperationType: true,
    byFileExtension: false
  };

  // Show total files if configured
  if (statisticsConfig.totalFiles !== false) {
    summary += `**Total Files**: ${fileOperations.size}\n`;
  }

  // Show statistics by operation type if configured
  if (statisticsConfig.byOperationType !== false) {
    summary += `- Created: ${stats['Created'] || 0}\n`;
    summary += `- Updated: ${stats['Updated'] || 0}\n`;
    summary += `- Modified: ${stats['Modified'] || 0}\n`;
    summary += `- Read: ${stats['Read'] || 0}\n`;
  }

  // Show statistics by file extension if configured
  if (statisticsConfig.byFileExtension === true) {
    const extStats = {};
    fileOperations.forEach((operations, filePath) => {
      const ext = path.extname(filePath) || '(no extension)';
      extStats[ext] = (extStats[ext] || 0) + 1;
    });

    summary += '\n**By File Extension**:\n';
    Object.entries(extStats)
      .sort(([, a], [, b]) => b - a)
      .forEach(([ext, count]) => {
        summary += `- ${ext}: ${count}\n`;
      });
  }

  summary += '\n';

  // Show tree visualization if configured
  const showTree = config.treeVisualization !== false;
  if (showTree) {
    summary += '## Files Modified\n\n';
    summary += `${path.basename(projectRoot)}/\n`;
    summary += generateTreeString(tree);
    summary += '\n';
  }

  // Add timestamp if configured
  if (config.includeTimestamp !== false) {
    summary += `*Generated: ${new Date().toISOString().replace('T', ' ').slice(0, 19)}*\n`;
  }

  return summary;
}

/**
 * Main function
 */
function main() {
  // Load accumulated file operations
  const fileOperations = loadFileOperations();

  if (fileOperations.size === 0) {
    return;
  }

  // Generate summary
  const summary = generateSummary(fileOperations);

  // Save to file (use config or default)
  const summaryPath = getOutputPath(OUTPUT_FILE);
  fs.writeFileSync(summaryPath, summary, 'utf8');

  // Build tree for message display
  const tree = buildDirectoryTree(fileOperations);

  // Count stats for message
  const stats = {
    created: 0,
    updated: 0,
    modified: 0,
    read: 0
  };

  fileOperations.forEach((operations) => {
    const status = getPrimaryOperation(operations);
    if (status === 'Created') stats.created++;
    else if (status === 'Updated') stats.updated++;
    else if (status === 'Modified') stats.modified++;
    else if (status === 'Read') stats.read++;
  });

  // Generate tree for message (without links)
  const treeStringPlain = generateTreeString(tree, '', true, false);

  const message = `📊 Session Summary: ${fileOperations.size} file${fileOperations.size > 1 ? 's' : ''} tracked (${stats.created} created, ${stats.updated} updated, ${stats.modified} modified, ${stats.read} read)\n\n  ${path.basename(projectRoot)}/\n${treeStringPlain.split('\n').map(line => line ? '  ' + line : '').join('\n')}\n  Saved to ${OUTPUT_FILE}`;

  // Clean up operations file for next session
  try {
    if (fs.existsSync(OPERATIONS_FILE)) {
      fs.unlinkSync(OPERATIONS_FILE);
    }
  } catch (error) {
    // Fail silently if cleanup fails
  }

  // Show logs only if showLogs is true
  if (config.showLogs !== false) {
    console.log(JSON.stringify({
      systemMessage: message,
      continue: true
    }));
  }
}

main();
process.exit(0);
