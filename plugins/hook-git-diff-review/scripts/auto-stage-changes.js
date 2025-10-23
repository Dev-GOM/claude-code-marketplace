#!/usr/bin/env node

/**
 * Auto Stage Changes Script
 * Automatically stages modified files to VS Code Source Control for diff review
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();

/**
 * Load plugin configuration from .plugin-config (project root)
 */
function loadPluginConfig() {
  const configPath = path.join(projectRoot, '.plugin-config', 'hook-git-diff-review.json');

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
    autoStage: true,
    showNotification: true,
    onlyTrackedFiles: false,
    excludePatterns: [
      '*.log',
      '*.tmp',
      '.DS_Store',
      'node_modules/**',
      '.git/**',
      'dist/**',
      'build/**'
    ],
    includeDirs: [],
    excludeDirs: [
      'node_modules',
      '.git',
      'dist',
      'build',
      'coverage',
      '.next',
      'out'
    ]
  };
}

const config = loadPluginConfig();

/**
 * Check if file matches exclude patterns
 */
function isExcluded(filePath) {
  const relativePath = path.relative(projectRoot, filePath);

  // Check exclude patterns
  for (const pattern of config.excludePatterns) {
    // Simple wildcard matching
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*');

    const regex = new RegExp(`^${regexPattern}$`);
    if (regex.test(relativePath)) {
      return true;
    }
  }

  // Check exclude directories
  const pathParts = relativePath.split(path.sep);
  for (const excludeDir of config.excludeDirs) {
    if (pathParts.includes(excludeDir)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if file is in an included directory
 */
function isInIncludedDir(filePath) {
  if (!config.includeDirs || config.includeDirs.length === 0) {
    return true; // No includeDirs specified - include all
  }

  const relativePath = path.relative(projectRoot, filePath);
  return config.includeDirs.some(includedDir => {
    const normalizedDir = includedDir.replace(/\\/g, '/');
    const normalizedRelPath = relativePath.replace(/\\/g, '/');
    return normalizedRelPath.startsWith(normalizedDir + '/') || normalizedRelPath.startsWith(normalizedDir);
  });
}

/**
 * Check if file is tracked by Git
 */
function isTrackedByGit(filePath, callback) {
  exec(`git ls-files --error-unmatch "${filePath}"`, { cwd: projectRoot }, (error) => {
    callback(!error); // If no error, file is tracked
  });
}

/**
 * Stage file with git add
 */
function stageFile(filePath) {
  return new Promise((resolve, reject) => {
    exec(`git add "${filePath}"`, { cwd: projectRoot }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Output notification to Claude Code
 */
function outputNotification(filePath) {
  const relativePath = path.relative(projectRoot, filePath);
  const output = {
    systemMessage: [
      '',
      '📋 **Git Diff Review**',
      '',
      `File staged for review: \`${relativePath}\``,
      '',
      '💡 Open **VS Code Source Control** panel to:',
      '  • View diff (click on file)',
      '  • Accept changes (✓ button or Stage)',
      '  • Reject changes (✗ button or Discard)',
      '  • Accept all (✓ Commit button)',
      '  • Reject all (↶ Discard All button)',
      ''
    ].join('\n')
  };

  console.log(JSON.stringify(output));
}

/**
 * Parse JSON input from stdin
 */
let inputData = '';

process.stdin.on('data', (chunk) => {
  inputData += chunk;
});

process.stdin.on('end', async () => {
  try {
    // Check if plugin is enabled
    if (!config.enabled || !config.autoStage) {
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

    // Check if file should be staged based on configuration
    if (isExcluded(filePath)) {
      process.exit(0); // File is excluded
    }

    if (!isInIncludedDir(filePath)) {
      process.exit(0); // File not in included directory
    }

    // Check if file is tracked by Git (if onlyTrackedFiles is true)
    if (config.onlyTrackedFiles) {
      isTrackedByGit(filePath, async (isTracked) => {
        if (!isTracked) {
          process.exit(0); // File not tracked
        }

        // Stage the file
        try {
          await stageFile(filePath);

          // Show notification
          if (config.showNotification) {
            outputNotification(filePath);
          }
        } catch (error) {
          // Silent fail - git might not be initialized
        }

        process.exit(0);
      });
    } else {
      // Stage the file without checking if tracked
      try {
        await stageFile(filePath);

        // Show notification
        if (config.showNotification) {
          outputNotification(filePath);
        }
      } catch (error) {
        // Silent fail - git might not be initialized
      }

      process.exit(0);
    }

  } catch (err) {
    // Silent fail - don't interrupt the workflow
    process.exit(0);
  }
});
