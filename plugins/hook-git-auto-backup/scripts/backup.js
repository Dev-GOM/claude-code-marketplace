#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

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
  console.error('[Git Auto-Backup] Checking for changes...');

  if (!isGitRepo()) {
    const result = {
      systemMessage: 'ℹ️ Git Auto-Backup: Not a git repository, skipping backup',
      continue: true
    };
    console.log(JSON.stringify(result));
    return;
  }

  if (!hasChanges()) {
    const result = {
      systemMessage: '✓ Git Auto-Backup: No changes to commit',
      continue: true
    };
    console.log(JSON.stringify(result));
    return;
  }

  try {
    // Get current timestamp
    const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

    // Add all changes
    execSync('git add -A', { cwd: projectRoot, stdio: 'pipe' });
    console.error('[Git Auto-Backup] Added all changes.');

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

    console.error(`[Git Auto-Backup] ✓ Backup committed successfully at ${timestamp}`);
    console.error(`[Git Auto-Backup] Commit hash: ${commitHash}`);

    // Output JSON for Claude Code
    const result = {
      systemMessage: `✓ Git Auto-Backup: Changes committed successfully (${commitHash})`,
      continue: true
    };
    console.log(JSON.stringify(result));

  } catch (error) {
    console.error('[Git Auto-Backup] Error during backup:', error.message);

    // Output error to Claude Code
    const result = {
      systemMessage: `⚠️ Git Auto-Backup failed: ${error.message}`,
      continue: true
    };
    console.log(JSON.stringify(result));
  }
}

// Run backup
backup();
