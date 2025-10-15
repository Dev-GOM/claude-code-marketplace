#!/usr/bin/env node

const { execSync } = require('child_process');

// Get the project root directory (where the plugin is being used)
const projectRoot = process.cwd();

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
    console.log(JSON.stringify({
      systemMessage: 'ℹ️ Git Auto-Backup: Not a git repository, skipping backup',
      continue: true
    }));
    return;
  }

  if (!hasChanges()) {
    console.log(JSON.stringify({
      systemMessage: '✓ Git Auto-Backup: No changes to commit',
      continue: true
    }));
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

    // Output success (only this JSON will be displayed to user)
    console.log(JSON.stringify({
      systemMessage: `✓ Git Auto-Backup: Changes committed successfully (${commitHash})`,
      continue: true
    }));

  } catch (error) {
    // Output error (only this JSON will be displayed to user)
    console.log(JSON.stringify({
      systemMessage: `⚠️ Git Auto-Backup failed: ${error.message}`,
      continue: true
    }));
  }
}

// Run backup
backup();
