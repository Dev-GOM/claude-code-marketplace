#!/usr/bin/env node

/**
 * Cleanup Blender Toolkit project configuration at session end.
 * Currently just logs the session end event.
 * Future: Could implement WebSocket server shutdown if needed.
 */

const fs = require('fs');
const path = require('path');
const { createLogger } = require('./logger');

// Get project name early for logging
let projectName = 'unknown';
if (process.env.CLAUDE_PROJECT_DIR) {
  projectName = path.basename(process.env.CLAUDE_PROJECT_DIR);
}

const logger = createLogger('cleanup-log.txt', 'Blender Toolkit Cleanup Log', projectName);

/**
 * Read hook input from stdin
 */
async function readHookInput() {
  return new Promise((resolve) => {
    let data = '';

    process.stdin.on('data', chunk => {
      data += chunk;
    });

    process.stdin.on('end', () => {
      try {
        const input = JSON.parse(data);
        resolve(input);
      } catch (error) {
        resolve({});
      }
    });

    setTimeout(() => {
      process.stdin.removeAllListeners();
      resolve({});
    }, 100);
  });
}

// Main execution
(async () => {
  try {
    const hookInput = await readHookInput();
    logger.log('Blender Toolkit: Session end');
    logger.log('Hook input: ' + JSON.stringify(hookInput));
    logger.log('✅ Cleanup completed');
    logger.close();
    process.exit(0);
  } catch (error) {
    logger.error('Error during cleanup: ' + error.message);
    logger.close();
    process.exit(1);
  }
})();
