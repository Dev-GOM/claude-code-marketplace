#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get the project root directory (where the plugin is being used)
const projectRoot = process.cwd();

// Load configuration from .plugin-config (project root)
function loadPluginConfig() {
  const configPath = path.join(projectRoot, '.plugin-config', 'hook-git-auto-backup.json');

  try {
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (error) {
    // Fall through to create default config
  }

  // Create default config if it doesn't exist
  const defaultConfig = {
    showLogs: false
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

const config = loadPluginConfig();

// Check if it's a git repository
function isGitRepo() {
  try {
    execSync('git rev-parse --is-inside-work-tree', {
      stdio: 'pipe',
      cwd: projectRoot
    });
    return true;
  } catch (error) {
    return false;
  }
}

// Check if there are changes to commit
function hasChanges() {
  try {
    const status = execSync('git status --porcelain', {
      encoding: 'utf8',
      cwd: projectRoot
    });
    return status.trim().length > 0;
  } catch (error) {
    return false;
  }
}

// Main backup function
function backup() {
  if (!isGitRepo()) {
    if (config.showLogs !== false) {
      console.log(JSON.stringify({
        systemMessage: 'ℹ️ Git Auto-Backup: Not a git repository, skipping backup',
        continue: true
      }));
    }
    return;
  }

  if (!hasChanges()) {
    if (config.showLogs !== false) {
      console.log(JSON.stringify({
        systemMessage: '✓ Git Auto-Backup: No changes to commit',
        continue: true
      }));
    }
    return;
  }

  try {
    // Get current timestamp
    const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

    // Add all changes
    execSync('git add -A', { cwd: projectRoot, stdio: 'pipe' });

    // Create commit
    const commitMessage = `Auto-backup: ${timestamp}

🤖 Generated with Claude Code Auto-Backup Plugin`;

    execSync(`git commit -m "${commitMessage}"`, {
      cwd: projectRoot,
      stdio: 'pipe'
    });

    // Get commit hash
    const commitHash = execSync('git rev-parse --short HEAD', {
      encoding: 'utf8',
      cwd: projectRoot
    }).trim();

    // Output success (only if showLogs is true)
    if (config.showLogs !== false) {
      console.log(JSON.stringify({
        systemMessage: `✓ Git Auto-Backup: Changes committed successfully (${commitHash})`,
        continue: true
      }));
    }

  } catch (error) {
    // Output error (only if showLogs is true)
    if (config.showLogs !== false) {
      console.log(JSON.stringify({
        systemMessage: `⚠️ Git Auto-Backup failed: ${error.message}`,
        continue: true
      }));
    }
  }
}

// Run backup
backup();
