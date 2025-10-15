#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Parse JSON input from stdin
let inputData = '';

process.stdin.on('data', (chunk) => {
  inputData += chunk;
});

process.stdin.on('end', () => {
  try {
    const input = JSON.parse(inputData);

    // Only intercept git commit commands
    const toolName = input.tool_name;
    if (toolName !== 'Bash') {
      process.exit(0);
    }

    const toolInput = input.tool_input || {};
    const command = toolInput.command || '';

    // Check if it's a git commit command
    if (!command.includes('git commit')) {
      process.exit(0);
    }

    // Check state to see if recent changes have been reviewed
    const stateDir = path.join(__dirname, '..', '.state');
    const stateFile = path.join(stateDir, 'review-state.json');

    let state = { fileChanges: 0, lastReviewTime: 0 };

    if (fs.existsSync(stateFile)) {
      try {
        state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
      } catch (err) {
        // Ignore parse errors
      }
    }

    const now = Date.now();
    const timeSinceLastReview = now - (state.lastReviewTime || 0);
    const tenMinutes = 10 * 60 * 1000;

    // Warn if significant changes haven't been reviewed
    if (state.fileChanges >= 3 || timeSinceLastReview >= tenMinutes) {
      const output = {
        systemMessage: [
          '',
          '⚠️ **Pre-Commit Check:**',
          '',
          `You're about to commit code that hasn't been recently reviewed.`,
          '',
          '**Recommendations:**',
          '1. Run `/review` to check for issues before committing',
          '2. Or use `@code-reviewer` to analyze specific files',
          '',
          'This helps maintain code quality! ✨',
          ''
        ].join('\n')
      };

      console.log(JSON.stringify(output));
    }

  } catch (err) {
    // Silent fail
    console.error(JSON.stringify({ error: err.message }));
    process.exit(0);
  }
});
