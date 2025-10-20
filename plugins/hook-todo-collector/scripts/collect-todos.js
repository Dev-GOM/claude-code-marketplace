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
function loadPluginConfig() {
  const configPath = path.join(projectRoot, '.plugin-config', 'hook-todo-collector.json');

  try {
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (error) {
    // Fall through to return default config
  }

  // Full fallback config - init-config.js should have created this,
  // but provide complete defaults to ensure plugin works properly
  return {
    showLogs: false,
    outputDirectory: '.todos-report.md',
    outputFile: '',
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
      '.m', '.mm', '.css', '.scss', '.sass', '.less',
      '.html', '.vue', '.svelte', '.r', '.R', '.jl', '.coffee',
      '.sh', '.bash', '.ps1', '.toml', '.ini', '.yaml', '.yml'
    ],
    excludeExtensions: [],
    commentTypes: ['TODO', 'FIXME', 'HACK', 'BUG', 'XXX', 'NOTE']
  };
}

const config = loadPluginConfig();

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

// Project name for file naming (current directory name)
const PROJECT_NAME = path.basename(projectRoot);

// State files stored in plugin directory (not in project root)
const PLUGIN_STATE_DIR = path.join(__dirname, '..', '.state');
const TODO_STATE_FILE = path.join(PLUGIN_STATE_DIR, `${PROJECT_NAME}-todo-state.json`);
const CHANGED_FILES_FILE = path.join(PLUGIN_STATE_DIR, `${PROJECT_NAME}-todo-changed-files.json`);

// Ensure plugin state directory exists
if (!fs.existsSync(PLUGIN_STATE_DIR)) {
  fs.mkdirSync(PLUGIN_STATE_DIR, { recursive: true });
}

// Directories to include (empty array = include all)
const INCLUDED_DIRS = config.includeDirs || [];

// Directories to exclude from search
const EXCLUDED_DIRS = config.excludeDirs || [
  'node_modules', '.git', 'dist', 'build', 'coverage',
  '.next', '.nuxt', 'out', 'vendor', '.snapshots', '.claude-plugin'
];

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

// Comment types to search for
const COMMENT_TYPES = config.commentTypes || ['TODO', 'FIXME', 'HACK', 'XXX', 'NOTE', 'BUG'];
const commentTypesPattern = COMMENT_TYPES.join('|');

// Dynamically generate patterns based on comment types
const TODO_PATTERNS = [
  new RegExp(`\\/\\/\\s*(${commentTypesPattern})[\\s:]+(.+)`, 'gi'),
  new RegExp(`\\/\\*\\s*(${commentTypesPattern})[\\s:]+(.+?)\\*\\/`, 'gi'),
  new RegExp(`<!--\\s*(${commentTypesPattern})[\\s:]+(.+?)-->`, 'gi')
];

// Python/Shell style comments (excluding markdown headers)
const SCRIPT_TODO_PATTERN = new RegExp(`^[^#]*#\\s*(${commentTypesPattern})[\\s:]+(.+)`, 'gi');

function shouldExcludeDir(dirPath) {
  const dirName = path.basename(dirPath);
  return EXCLUDED_DIRS.includes(dirName) || dirName.startsWith('.');
}

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

function findTodosInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const todos = [];
    const ext = path.extname(filePath);
    const fileName = path.basename(filePath);

    // Languages that use # for comments (excluding markdown and text files)
    const hashCommentExtensions = [
      '.py',           // Python
      '.sh', '.bash',  // Shell
      '.rb',           // Ruby
      '.pl',           // Perl
      '.php',          // PHP (also supports # comments)
      '.r', '.R',      // R
      '.jl',           // Julia
      '.coffee',       // CoffeeScript
      '.ps1',          // PowerShell
      '.yaml', '.yml', // YAML
      '.toml',         // TOML
      '.ini'           // INI
    ];

    // Special files that use # for comments
    const hashCommentFiles = ['Makefile', 'Dockerfile', 'Rakefile', 'Gemfile', 'Vagrantfile'];

    const usesHashComments = hashCommentExtensions.includes(ext) || hashCommentFiles.includes(fileName);

    lines.forEach((line, index) => {
      // Apply common patterns (JS, CSS, HTML comments)
      TODO_PATTERNS.forEach(pattern => {
        const matches = [...line.matchAll(pattern)];
        matches.forEach(match => {
          todos.push({
            file: path.relative(projectRoot, filePath),
            line: index + 1,
            type: match[1].toUpperCase(),
            message: match[2].trim(),
            fullLine: line.trim()
          });
        });
      });

      // Apply # comment pattern only for languages that use it (not markdown)
      if (usesHashComments) {
        const scriptMatches = [...line.matchAll(SCRIPT_TODO_PATTERN)];
        scriptMatches.forEach(match => {
          todos.push({
            file: path.relative(projectRoot, filePath),
            line: index + 1,
            type: match[1].toUpperCase(),
            message: match[2].trim(),
            fullLine: line.trim()
          });
        });
      }
    });

    return todos;
  } catch (error) {
    return [];
  }
}

function walkDirectory(dir, todos = []) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (!shouldExcludeDir(fullPath)) {
          walkDirectory(fullPath, todos);
        }
      } else if (entry.isFile() && hasValidExtension(fullPath)) {
        const fileTodos = findTodosInFile(fullPath);
        todos.push(...fileTodos);
      }
    }
  } catch (error) {
    // Skip directories we can't read
  }

  return todos;
}

/**
 * Perform full project scan
 */
function performFullScan(reportPath) {
  const allTodos = [];

  // Determine which directories to scan
  const dirsToScan = INCLUDED_DIRS.length > 0
    ? INCLUDED_DIRS.map(dir => path.join(projectRoot, dir))
    : [projectRoot];

  // Scan each directory
  dirsToScan.forEach(dir => {
    if (fs.existsSync(dir)) {
      walkDirectory(dir, allTodos);
    }
  });

  // Generate report
  const report = generateReport(allTodos);

  // Save to file
  fs.writeFileSync(reportPath, report, 'utf8');

  // Save TODO state
  const newState = {};
  allTodos.forEach(todo => {
    if (!newState[todo.file]) {
      newState[todo.file] = [];
    }
    newState[todo.file].push({
      type: todo.type,
      line: todo.line,
      message: todo.message,
      fullLine: todo.fullLine || ''
    });
  });
  saveTodoState(newState);

  // Output message (if showLogs is enabled)
  if (config.showLogs !== false) {
    const message = `📋 TODO Collector: Full project scan completed. Found ${allTodos.length} TODO(s).`;
    console.log(JSON.stringify({
      systemMessage: message,
      continue: true
    }));
  }
}

function generateReport(todos) {
  const now = new Date();
  const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

  let report = `# TODO/FIXME Report
Generated: ${timestamp}
Total Items: ${todos.length}

`;

  if (todos.length === 0) {
    report += 'No TODO or FIXME comments found in the project.\n';
    return report;
  }

  // Group by type
  const grouped = todos.reduce((acc, todo) => {
    if (!acc[todo.type]) {
      acc[todo.type] = [];
    }
    acc[todo.type].push(todo);
    return acc;
  }, {});

  // Generate report for each type
  Object.keys(grouped).sort().forEach(type => {
    report += `## ${type} (${grouped[type].length})\n\n`;

    grouped[type].forEach(todo => {
      // Convert backslashes to forward slashes for cross-platform compatibility
      const fileLink = todo.file.replace(/\\/g, '/');
      report += `- **[${todo.file}:${todo.line}](${fileLink}#L${todo.line})**\n`;
      report += `  \`${todo.message}\`\n\n`;
    });
  });

  // Summary by file
  report += `\n## Summary by File\n\n`;
  const byFile = todos.reduce((acc, todo) => {
    if (!acc[todo.file]) {
      acc[todo.file] = 0;
    }
    acc[todo.file]++;
    return acc;
  }, {});

  Object.entries(byFile)
    .sort((a, b) => b[1] - a[1])
    .forEach(([file, count]) => {
      // Convert backslashes to forward slashes for cross-platform compatibility
      const fileLink = file.replace(/\\/g, '/');
      report += `- [${file}](${fileLink}): ${count} item(s)\n`;
    });

  return report;
}

/**
 * Load changed files from tracking
 */
function loadChangedFiles() {
  try {
    if (fs.existsSync(CHANGED_FILES_FILE)) {
      const data = fs.readFileSync(CHANGED_FILES_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    // Return empty array if file doesn't exist or is corrupted
  }
  return [];
}

/**
 * Load previous TODO state
 * Returns: { "file/path": [{ type, line, message }, ...], ... }
 */
function loadTodoState() {
  try {
    if (fs.existsSync(TODO_STATE_FILE)) {
      const data = fs.readFileSync(TODO_STATE_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    // Return empty object if file doesn't exist or is corrupted
  }
  return {};
}

/**
 * Save TODO state
 */
function saveTodoState(state) {
  try {
    fs.writeFileSync(TODO_STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (error) {
    // Fail silently
  }
}

/**
 * Compare previous and current TODOs to detect changes
 */
function detectChanges(previousTodos, currentTodos) {
  const added = [];
  const removed = [];

  // Find added TODOs
  currentTodos.forEach(todo => {
    const key = `${todo.file}:${todo.line}:${todo.type}:${todo.message}`;
    const exists = previousTodos.some(prev =>
      `${prev.file}:${prev.line}:${prev.type}:${prev.message}` === key
    );
    if (!exists) {
      added.push(todo);
    }
  });

  // Find removed TODOs
  previousTodos.forEach(todo => {
    const key = `${todo.file}:${todo.line}:${todo.type}:${todo.message}`;
    const exists = currentTodos.some(curr =>
      `${curr.file}:${curr.line}:${curr.type}:${curr.message}` === key
    );
    if (!exists) {
      removed.push(todo);
    }
  });

  return { added, removed };
}

/**
 * Generate report with change tracking
 */
function generateReportWithChanges(allTodos, changes, changedFiles) {
  const now = new Date();
  const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

  let report = `# TODO/FIXME Report
Generated: ${timestamp}
Total Items: ${allTodos.length}

`;

  // Session changes section (if any) - only show statistics
  if (changes.added.length > 0 || changes.removed.length > 0) {
    report += `## 📝 Session Changes\n\n`;
    report += `**Files Modified**: ${changedFiles.length}\n`;
    report += `- Added: ${changes.added.length} ✅\n`;
    report += `- Removed: ${changes.removed.length} ❌\n\n`;
    report += `---\n\n`;
  }

  if (allTodos.length === 0) {
    report += 'No TODO or FIXME comments found in the project.\n';
    return report;
  }

  // Group by type
  const grouped = allTodos.reduce((acc, todo) => {
    if (!acc[todo.type]) {
      acc[todo.type] = [];
    }
    acc[todo.type].push(todo);
    return acc;
  }, {});

  // Generate report for each type
  Object.keys(grouped).sort().forEach(type => {
    report += `## ${type} (${grouped[type].length})\n\n`;

    grouped[type].forEach(todo => {
      const fileLink = todo.file.replace(/\\/g, '/');
      report += `- **[${todo.file}:${todo.line}](${fileLink}#L${todo.line})**\n`;
      report += `  \`${todo.message}\`\n\n`;
    });
  });

  // Summary by file
  report += `\n## Summary by File\n\n`;
  const byFile = allTodos.reduce((acc, todo) => {
    if (!acc[todo.file]) {
      acc[todo.file] = 0;
    }
    acc[todo.file]++;
    return acc;
  }, {});

  Object.entries(byFile)
    .sort((a, b) => b[1] - a[1])
    .forEach(([file, count]) => {
      const fileLink = file.replace(/\\/g, '/');
      report += `- [${file}](${fileLink}): ${count} item(s)\n`;
    });

  return report;
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

function main() {
  // Determine output file path (sanitize to prevent path traversal)
  const rawOutputFile = config.outputFile || `.${PROJECT_NAME}-todos-report.md`;
  const OUTPUT_FILE = sanitizeFilename(rawOutputFile);
  const reportPath = getOutputPath(OUTPUT_FILE);

  // Load changed files from tracking
  const changedFiles = loadChangedFiles();

  // If report doesn't exist, perform full scan (regardless of changed files)
  if (!fs.existsSync(reportPath)) {
    performFullScan(reportPath);
    return;
  }

  // If no changes, exit
  if (changedFiles.length === 0) {
    return;
  }

  // Load previous TODO state
  const previousState = loadTodoState();

  // Scan changed files for TODOs
  const currentTodos = [];
  const changedFilesRelative = changedFiles.map(f => path.relative(projectRoot, f));

  changedFiles.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      const todos = findTodosInFile(filePath);
      currentTodos.push(...todos);
    }
  });

  // Collect previous TODOs from changed files
  const previousTodos = [];
  changedFilesRelative.forEach(relPath => {
    if (previousState[relPath]) {
      // Add file info to each TODO
      previousState[relPath].forEach(todo => {
        previousTodos.push({
          file: relPath,
          line: todo.line,
          type: todo.type,
          message: todo.message
        });
      });
    }
  });

  // Detect changes
  const changes = detectChanges(previousTodos, currentTodos);

  // If no changes detected, exit silently
  if (changes.added.length === 0 && changes.removed.length === 0) {
    // Clean up changed files tracking
    try {
      if (fs.existsSync(CHANGED_FILES_FILE)) {
        fs.unlinkSync(CHANGED_FILES_FILE);
      }
    } catch (error) {
      // Fail silently
    }
    return;
  }

  // Update TODO state: Remove old state for changed files, add new TODOs
  const newState = { ...previousState };

  // Clear changed files from state
  changedFilesRelative.forEach(relPath => {
    delete newState[relPath];
  });

  // Add current TODOs from changed files
  currentTodos.forEach(todo => {
    if (!newState[todo.file]) {
      newState[todo.file] = [];
    }
    newState[todo.file].push({
      type: todo.type,
      line: todo.line,
      message: todo.message
    });
  });

  // Convert state to flat array for report generation
  const allTodos = [];
  Object.entries(newState).forEach(([file, todos]) => {
    todos.forEach(todo => {
      allTodos.push({
        file,
        line: todo.line,
        type: todo.type,
        message: todo.message,
        fullLine: todo.fullLine || ''
      });
    });
  });

  // Generate report with change tracking
  const report = generateReportWithChanges(allTodos, changes, changedFilesRelative);

  // Save to file (use reportPath from function start)
  fs.writeFileSync(reportPath, report, 'utf8');

  // Save updated TODO state
  saveTodoState(newState);

  // Clean up changed files tracking
  try {
    if (fs.existsSync(CHANGED_FILES_FILE)) {
      fs.unlinkSync(CHANGED_FILES_FILE);
    }
  } catch (error) {
    // Fail silently
  }

  // Generate message for user (only when there are changes and showLogs is true)
  if (config.showLogs !== false) {
    const parts = [];
    if (changes.added.length > 0) parts.push(`${changes.added.length} added ✅`);
    if (changes.removed.length > 0) parts.push(`${changes.removed.length} removed ❌`);
    const message = `📋 TODO Collector: ${parts.join(', ')} in ${changedFilesRelative.length} file(s). Total: ${allTodos.length} TODO(s)`;

    console.log(JSON.stringify({
      systemMessage: message,
      continue: true
    }));
  }
}

main();
process.exit(0);
