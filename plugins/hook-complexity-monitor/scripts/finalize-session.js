#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();

// Load configuration from .plugin-config (project root)
function loadPluginConfig() {
  const configPath = path.join(projectRoot, '.plugin-config', 'hook-complexity-monitor.json');

  try {
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (error) {
    // Fall through to create default config
  }

  // Create default config if it doesn't exist
  const defaultConfig = {
    showLogs: false,
    outputDirectory: '',
    logFile: '.complexity-log.md'
  };

  try {
    const configDir = path.join(projectRoot, '.plugin-config');
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), 'utf8');
  } catch (error) {
    // Fail silently if we can't create the file
  }

  return defaultConfig;
}

// Load configuration from hooks.json
function loadHooksConfiguration() {
  try {
    const hooksConfigPath = path.join(__dirname, '../hooks/hooks.json');
    const hooksConfig = JSON.parse(fs.readFileSync(hooksConfigPath, 'utf8'));
    return hooksConfig.configuration || {};
  } catch (error) {
    return {};
  }
}

// Merge plugin config with hooks config (plugin config takes priority)
const pluginConfig = loadPluginConfig();
const hooksConfig = loadHooksConfiguration();
const config = { ...hooksConfig, ...pluginConfig };

// Output directory (priority: config > plugin env > global env > default)
const OUTPUT_DIR = config.outputDirectory
  || process.env.COMPLEXITY_LOG_DIR
  || process.env.CLAUDE_PLUGIN_OUTPUT_DIR
  || '';

const LOG_FILE = config.logFile || '.complexity-log.md';

// Session file stored in plugin directory (not in project root)
const PLUGIN_STATE_DIR = path.join(__dirname, '..', '.state');
const SESSION_FILE = path.join(PLUGIN_STATE_DIR, 'complexity-session.json');

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
