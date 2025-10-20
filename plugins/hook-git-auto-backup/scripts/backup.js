#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get the project root directory (where the plugin is being used)
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
    showLogs: false,  
    requireGitRepo: true,
    commitOnlyIfChanges: true,
    includeTimestamp: true
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
  // Check if requireGitRepo is enabled
  if (config.requireGitRepo !== false && !isGitRepo()) {
    if (config.showLogs === true) {
      console.log(JSON.stringify({
        systemMessage: 'ℹ️ Git Auto-Backup: Not a git repository, skipping backup',
        continue: true
      }));
    }
    return;
  }

  // Check if commitOnlyIfChanges is enabled
  if (config.commitOnlyIfChanges !== false && !hasChanges()) {
    if (config.showLogs === true) {
      console.log(JSON.stringify({
        systemMessage: '✓ Git Auto-Backup: No changes to commit',
        continue: true
      }));
    }
    return;
  }

  try {
    // Get current timestamp (only if includeTimestamp is enabled)
    const timestamp = config.includeTimestamp !== false
      ? new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
      : '';

    // Add all changes
    execSync('git add -A', { cwd: projectRoot, stdio: 'pipe' });

    // Create commit message
    const commitMessage = timestamp
      ? `Auto-backup: ${timestamp}\n\n🤖 Generated with Claude Code Auto-Backup Plugin`
      : `Auto-backup\n\n🤖 Generated with Claude Code Auto-Backup Plugin`;

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
    if (config.showLogs === true) {
      console.log(JSON.stringify({
        systemMessage: `✓ Git Auto-Backup: Changes committed successfully (${commitHash})`,
        continue: true
      }));
    }

  } catch (error) {
    // Output error (only if showLogs is true)
    if (config.showLogs === true) {
      console.log(JSON.stringify({
        systemMessage: `⚠️ Git Auto-Backup failed: ${error.message}`,
        continue: true
      }));
    }
  }
}

// Run backup
backup();
process.exit(0);
