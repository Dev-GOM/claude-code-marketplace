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
  // Ensure thresholds is an object with numeric values
  if (!config.thresholds || typeof config.thresholds !== 'object') {
    config.thresholds = {
      cyclomaticComplexity: 10,
      functionLength: 50,
      fileLength: 500,
      nesting: 4
    };
  } else {
    if (typeof config.thresholds.cyclomaticComplexity !== 'number') {
      config.thresholds.cyclomaticComplexity = 10;
    }
    if (typeof config.thresholds.functionLength !== 'number') {
      config.thresholds.functionLength = 50;
    }
    if (typeof config.thresholds.fileLength !== 'number') {
      config.thresholds.fileLength = 500;
    }
    if (typeof config.thresholds.nesting !== 'number') {
      config.thresholds.nesting = 4;
    }
  }

  // Ensure severityLevels is an object
  if (!config.severityLevels || typeof config.severityLevels !== 'object') {
    config.severityLevels = {
      complexity: 'warning',
      nesting: 'warning',
      fileLength: 'warning',
      functionLength: 'info'
    };
  }

  // Ensure includeDirs and excludeDirs are arrays
  if (!Array.isArray(config.includeDirs)) {
    config.includeDirs = [];
  }
  if (!Array.isArray(config.excludeDirs)) {
    config.excludeDirs = ['node_modules', '.git'];
  }

  return config;
}

// Load configuration from .plugin-config (project root)
// init-config.js (SessionStart hook) should have created this file
function loadPluginConfig() {
  const configPath = path.join(projectRoot, '.plugin-config', 'hook-complexity-monitor.json');

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
    logFile: '.complexity-log.md',
    thresholds: {
      cyclomaticComplexity: 10,
      functionLength: 50,
      fileLength: 500,
      nesting: 4
    },
    severityLevels: {
      complexity: 'warning',
      nesting: 'warning',
      fileLength: 'warning',
      functionLength: 'info'
    },
    includeDirs: [],
    excludeDirs: [
      'node_modules', '.git', 'dist', 'build', 'coverage',
      '.next', '.nuxt', 'out', 'vendor', '.snapshots', '.claude-plugin'
    ],
    includeExtensions: [
      '.js', '.jsx', '.ts', '.tsx',
      '.py', '.java', '.go', '.rb', '.php',
      '.c', '.cpp', '.h', '.hpp', '.cs',
      '.kt', '.kts', '.swift', '.rs', '.scala', '.dart',
      '.m', '.mm'
    ],
    excludeExtensions: []
  };
}

const config = loadPluginConfig();

// Output directory (priority: config > plugin env > global env > default)
const OUTPUT_DIR = config.outputDirectory
  || process.env.COMPLEXITY_LOG_DIR
  || process.env.CLAUDE_PLUGIN_OUTPUT_DIR
  || '';

// Project name for file naming (current directory name)
const PROJECT_NAME = path.basename(projectRoot);

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

// Sanitize log file name to prevent path traversal
const rawLogFile = config.logFile || `.${PROJECT_NAME}-complexity-log.md`;
const LOG_FILE = sanitizeFilename(rawLogFile);

// Session file stored in plugin directory (not in project root)
const PLUGIN_STATE_DIR = path.join(__dirname, '..', '.state');
const SESSION_FILE = path.join(PLUGIN_STATE_DIR, `${PROJECT_NAME}-complexity-session.json`);

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

/**
 * Check if directory should be excluded
 */
function shouldExcludeDir(dirPath) {
  const dirName = path.basename(dirPath);
  return config.excludeDirs.includes(dirName) || dirName.startsWith('.');
}

/**
 * Check if file has valid extension
 */
function hasValidExtension(filePath) {
  const ext = path.extname(filePath);

  // First, check if file is in include list
  if (config.includeExtensions && config.includeExtensions.length > 0) {
    if (!config.includeExtensions.includes(ext)) {
      return false;
    }
  }

  // Then, check if file is in exclude list
  if (config.excludeExtensions && config.excludeExtensions.includes(ext)) {
    return false;
  }

  return true;
}

/**
 * Simple complexity analysis (without full AST parsing)
 */
function analyzeFileSimple(filePath) {
  try {
    const code = fs.readFileSync(filePath, 'utf8');
    const lines = code.split('\n');
    const fileLength = lines.length;
    const issues = [];

    // Check file length
    if (fileLength > config.thresholds.fileLength) {
      issues.push({
        message: `File has ${fileLength} lines (threshold: ${config.thresholds.fileLength})`,
        line: 1
      });
    }

    // Simple nesting check (count max indentation)
    let maxNesting = 0;
    let maxNestingLine = 1;
    lines.forEach((line, idx) => {
      const indent = line.search(/\S/);
      if (indent > -1) {
        const nestLevel = Math.floor(indent / 2);
        if (nestLevel > maxNesting) {
          maxNesting = nestLevel;
          maxNestingLine = idx + 1;
        }
      }
    });

    if (maxNesting > config.thresholds.nesting) {
      issues.push({
        message: `Max nesting depth is ${maxNesting} (threshold: ${config.thresholds.nesting})`,
        line: maxNestingLine
      });
    }

    return issues;
  } catch (error) {
    return [];
  }
}

/**
 * Walk directory and analyze files
 */
function walkDirectory(dir, results = {}) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (!shouldExcludeDir(fullPath)) {
          walkDirectory(fullPath, results);
        }
      } else if (entry.isFile() && hasValidExtension(fullPath)) {
        const issues = analyzeFileSimple(fullPath);
        if (issues.length > 0) {
          const relativePath = path.relative(projectRoot, fullPath);
          results[relativePath] = issues;
        }
      }
    }
  } catch (error) {
    // Skip directories we can't read
  }

  return results;
}

/**
 * Perform full project scan
 */
function performFullScan() {
  const allIssues = {};

  // Determine which directories to scan
  const dirsToScan = config.includeDirs && config.includeDirs.length > 0
    ? config.includeDirs.map(dir => path.join(projectRoot, dir))
    : [projectRoot];

  // Scan each directory
  dirsToScan.forEach(dir => {
    if (fs.existsSync(dir)) {
      walkDirectory(dir, allIssues);
    }
  });

  return { files: allIssues };
}

/**
 * Parse existing log file to extract file-based issues
 */
function parseExistingLog(logPath) {
  const fileIssues = {};

  try {
    if (!fs.existsSync(logPath)) {
      return fileIssues;
    }

    const content = fs.readFileSync(logPath, 'utf8');
    const lines = content.split('\n');

    let currentFile = null;

    for (const line of lines) {
      // Match file header: ## [filename.js](path/to/file.js) - extract path from URL
      const linkMatch = line.match(/^## \[.+?\]\((.+?)\)$/);
      const plainMatch = line.match(/^## (.+)$/);

      if (linkMatch) {
        // Keep forward slashes for consistent keys (URLs always use /)
        currentFile = linkMatch[1].trim();
        if (!fileIssues[currentFile]) {
          fileIssues[currentFile] = [];
        }
        continue;
      } else if (plainMatch && !plainMatch[1].startsWith('[')) {
        // Keep forward slashes for consistent keys (URLs always use /)
        currentFile = plainMatch[1].trim();
        if (!fileIssues[currentFile]) {
          fileIssues[currentFile] = [];
        }
        continue;
      }

      // Match GitHub-style issue line with line number: - [filename](./path#L67) - Message
      const githubLineMatch = line.match(/^- \[.+?\]\(.+?#L(\d+)\) - (.+)$/);
      if (githubLineMatch && currentFile) {
        fileIssues[currentFile].push({
          message: githubLineMatch[2].trim(),
          line: parseInt(githubLineMatch[1])
        });
        continue;
      }

      // Match GitHub-style issue line without line number: - [filename](./path) - Message
      const githubNoLineMatch = line.match(/^- \[.+?\]\(.+?\) - (.+)$/);
      if (githubNoLineMatch && currentFile) {
        fileIssues[currentFile].push({
          message: githubNoLineMatch[1].trim(),
          line: 0
        });
        continue;
      }

      // Match old format issue line: - Issue description
      const issueMatch = line.match(/^- (.+)$/);
      if (issueMatch && currentFile) {
        fileIssues[currentFile].push({
          message: issueMatch[1].trim(),
          line: 0
        });
      }
    }
  } catch (error) {
    // Return empty object if parsing fails
  }

  return fileIssues;
}

/**
 * Merge session issues with existing log
 */
function mergeIssues(existingIssues, sessionIssues) {
  const merged = { ...existingIssues };

  // Update with session data
  Object.entries(sessionIssues).forEach(([filePath, issues]) => {
    // Normalize path: convert backslashes to forward slashes for consistent keys
    const normalizedPath = filePath.replace(/\\/g, '/');

    if (issues.length > 0) {
      // File has issues - update
      merged[normalizedPath] = issues;
    } else {
      // File has no issues - remove from log
      delete merged[normalizedPath];
    }
  });

  return merged;
}

/**
 * Generate markdown log from file-based issues
 */
function generateFileBasedLog(fileIssues) {
  if (Object.keys(fileIssues).length === 0) {
    return '# Code Complexity Log\n\nNo complexity issues found. Great job! 🎉\n';
  }

  const now = new Date();
  const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

  let log = `# Code Complexity Log\n\n`;
  log += `*Last Updated: ${timestamp}*\n\n`;
  log += `**Files with Issues**: ${Object.keys(fileIssues).length}\n\n`;
  log += `---\n\n`;

  // Sort files alphabetically
  const sortedFiles = Object.keys(fileIssues).sort();

  sortedFiles.forEach(filePath => {
    const issues = fileIssues[filePath];
    if (issues.length === 0) return; // Skip files with no issues

    // Convert backslashes to forward slashes for URLs
    const filePathUrl = filePath.replace(/\\/g, '/');

    // Extract filename only for display
    const fileName = path.basename(filePath);

    log += `## [${fileName}](${filePathUrl})\n\n`;

    issues.forEach(issue => {
      // issue can be string (old format) or object (new format)
      if (typeof issue === 'string') {
        log += `- ${issue}\n`;
      } else {
        // New format with GitHub-style links
        if (issue.line > 0) {
          // With line number: [filename.js](./path/to/file.js#L53) - Message
          log += `- [${fileName}](./${filePathUrl}#L${issue.line}) - ${issue.message}\n`;
        } else {
          // Without line number: [filename.js](./path/to/file.js) - Message
          log += `- [${fileName}](./${filePathUrl}) - ${issue.message}\n`;
        }
      }
    });

    log += '\n';
  });

  return log;
}

function main() {
  const logPath = getOutputPath(LOG_FILE);

  // Parse existing log file
  const existingIssues = parseExistingLog(logPath);

  // Read session data (if exists)
  let sessionData = { files: {} };
  if (fs.existsSync(SESSION_FILE)) {
    try {
      sessionData = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8'));
    } catch (error) {
      // Continue with empty session data
    }
  }

  // If log file doesn't exist, perform full scan (regardless of session data)
  if (!fs.existsSync(logPath)) {
    const fullScanData = performFullScan();
    // Merge full scan with session data (session data takes priority for more accurate analysis)
    sessionData.files = { ...fullScanData.files, ...(sessionData.files || {}) };
  }

  // Merge with session data (session files override log files)
  const mergedIssues = mergeIssues(existingIssues, sessionData.files || {});

  // Generate new log content
  const logContent = generateFileBasedLog(mergedIssues);

  // Write complete log file (overwrite, not append)
  fs.writeFileSync(logPath, logContent, 'utf8');

  // Clean up session file
  if (fs.existsSync(SESSION_FILE)) {
    try {
      fs.unlinkSync(SESSION_FILE);
    } catch (error) {
      // Fail silently
    }
  }

  // Calculate statistics
  const totalFiles = Object.keys(mergedIssues).length;
  const totalIssues = Object.values(mergedIssues).reduce((sum, issues) => sum + issues.length, 0);

  // Show logs only if showLogs is true
  if (config.showLogs !== false) {
    if (totalFiles > 0) {
      console.log(JSON.stringify({
        systemMessage: `📝 Complexity Monitor: ${totalFiles} file(s) with ${totalIssues} issue(s) tracked in ${LOG_FILE}`
      }));
    } else {
      console.log(JSON.stringify({
        systemMessage: `✅ Complexity Monitor: All complexity issues resolved!`
      }));
    }
  }
}

main();
process.exit(0);
