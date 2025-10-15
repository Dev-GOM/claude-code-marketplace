#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = process.cwd();

// Load configuration from hooks.json
function loadConfiguration() {
  try {
    const hooksConfigPath = path.join(__dirname, '../hooks/hooks.json');
    const hooksConfig = JSON.parse(fs.readFileSync(hooksConfigPath, 'utf8'));
    return hooksConfig.configuration || {};
  } catch (error) {
    // Fallback to defaults if config can't be loaded
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
const TODO_STATE_FILE = path.join(PLUGIN_STATE_DIR, 'todo-state.json');
const CHANGED_FILES_FILE = path.join(PLUGIN_STATE_DIR, 'todo-changed-files.json');

// Ensure plugin state directory exists
if (!fs.existsSync(PLUGIN_STATE_DIR)) {
  fs.mkdirSync(PLUGIN_STATE_DIR, { recursive: true });
}

// Directories to exclude from search (from config or defaults)
const EXCLUDED_DIRS = config.excludeDirs || [
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '.next',
  '.nuxt',
  'out',
  'vendor',
  '.snapshots',
  '.claude-plugin'
];

// File extensions to search (from config or defaults)
const EXTENSIONS = config.supportedExtensions || [
  '.js', '.jsx', '.ts', '.tsx',
  '.py', '.java', '.go', '.rb', '.php',
  '.c', '.cpp', '.h', '.hpp',
  '.cs',                              // C#
  '.kt', '.kts',                      // Kotlin
  '.swift',                           // Swift
  '.rs',                              // Rust
  '.scala',                           // Scala
  '.dart',                            // Dart
  '.m', '.mm',                        // Objective-C
  '.css', '.scss', '.sass', '.less',
  '.html', '.vue', '.svelte',
  '.r', '.R', '.jl', '.coffee',
  '.sh', '.bash', '.ps1',
  '.toml', '.ini', '.yaml', '.yml'
];

// Comment types to search for (from config or defaults)
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

  return EXTENSIONS.includes(ext);
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

function main() {
  // Load changed files from tracking
  const changedFiles = loadChangedFiles();

  if (changedFiles.length === 0) {
    // No file changes - exit silently
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

  // Save to file
  const outputFormats = config.outputFormats || ['.todos-report.md'];
  const outputPath = getOutputPath(outputFormats[0]);
  fs.writeFileSync(outputPath, report, 'utf8');

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

  // Generate message for user (only when there are changes)
  const parts = [];
  if (changes.added.length > 0) parts.push(`${changes.added.length} added ✅`);
  if (changes.removed.length > 0) parts.push(`${changes.removed.length} removed ❌`);
  const message = `📋 TODO Collector: ${parts.join(', ')} in ${changedFilesRelative.length} file(s). Total: ${allTodos.length} TODO(s)`;

  console.log(JSON.stringify({
    systemMessage: message,
    continue: true
  }));
}

main();
