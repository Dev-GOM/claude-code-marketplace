#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load configuration from .plugin-config (project root)
function loadPluginConfig() {
  const projectRoot = process.cwd();
  const configPath = path.join(projectRoot, '.plugin-config', 'ai-pair-programming.json');

  try {
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (error) {
    // Fall through to default config
  }

  // Default config
  return {
    showLogs: false
  };
}

const config = loadPluginConfig();

// Parse JSON input from stdin
let inputData = '';

process.stdin.on('data', (chunk) => {
  inputData += chunk;
});

process.stdin.on('end', () => {
  try {
    const input = JSON.parse(inputData);

    // Only process Write and Edit operations
    const toolName = input.tool_name;
    if (toolName !== 'Write' && toolName !== 'Edit') {
      process.exit(0);
    }

    const toolInput = input.tool_input || {};
    const filePath = toolInput.file_path;

    if (!filePath) {
      process.exit(0);
    }

    // Check if file is a code file
    const codeExtensions = [
      '.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.cs',
      '.go', '.rs', '.rb', '.php', '.swift', '.kt', '.scala', '.r',
      '.m', '.h', '.hpp', '.sql', '.sh', '.bash', '.ps1'
    ];

    const ext = path.extname(filePath).toLowerCase();
    if (!codeExtensions.includes(ext)) {
      process.exit(0);
    }

    // Read state file to track review frequency
    const projectRoot = process.cwd();
    const PROJECT_NAME = path.basename(projectRoot);
    const stateDir = path.join(__dirname, '..', '.state');
    const stateFile = path.join(stateDir, `${PROJECT_NAME}-review-state.json`);

    let state = { fileChanges: 0, lastReviewTime: 0 };

    if (fs.existsSync(stateFile)) {
      try {
        state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
      } catch (err) {
        // Ignore parse errors, use default state
      }
    }

    state.fileChanges = (state.fileChanges || 0) + 1;
    const now = Date.now();
    const timeSinceLastReview = now - (state.lastReviewTime || 0);
    const fiveMinutes = 5 * 60 * 1000;

    // Create state directory if it doesn't exist
    if (!fs.existsSync(stateDir)) {
      fs.mkdirSync(stateDir, { recursive: true });
    }

    // Trigger review if:
    // 1. More than 5 files changed since last review
    // 2. Or more than 5 minutes passed since last review
    const shouldReview = state.fileChanges >= 5 || timeSinceLastReview >= fiveMinutes;

    if (shouldReview) {
      // Reset counters
      state.fileChanges = 0;
      state.lastReviewTime = now;
      fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));

      // Output suggestion to trigger review (only if showLogs is true)
      if (config.showLogs !== false) {
        const output = {
          systemMessage: [
            '',
            '💡 **AI Pair Programming Tip:**',
            '',
            `You've made significant changes to your code. Consider running \`/review\` to get`,
            `feedback from the @code-reviewer agent on your recent work.`,
            '',
            'This helps catch potential issues early! 🚀',
            ''
          ].join('\n')
        };

        console.log(JSON.stringify(output));
      }
    } else {
      // Just update the counter
      fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
    }

  } catch (err) {
    // Silent fail - don't interrupt the workflow
    console.error(JSON.stringify({ error: err.message }));
    process.exit(0);
  }
});
