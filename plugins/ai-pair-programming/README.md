# AI Pair Programming Suite

> **Transform your coding workflow with intelligent AI assistance**

An advanced Claude Code plugin that brings together slash commands, specialized agents, and intelligent hooks to create a comprehensive AI pair programming experience.

## 🌟 Features

This plugin integrates three powerful Claude Code features:

### 📝 Slash Commands
Quick access to AI programming assistance:
- `/pair` - Start an interactive pair programming session
- `/review` - Get comprehensive code reviews
- `/suggest` - Receive intelligent improvement suggestions
- `/fix` - Automatically detect and fix bugs
- `/explain` - Get detailed code explanations

### 🤖 Expert Agents
Specialized AI assistants for different aspects of development:
- `@code-reviewer` - Security, quality, and best practices expert
- `@bug-hunter` - Bug detection and fixing specialist
- `@architect` - Software architecture and design consultant
- `@performance-expert` - Performance optimization specialist

### 🔔 Intelligent Hooks
Automatic quality checks throughout your workflow:
- **PostToolUse**: Suggests code review after significant changes
- **PreToolUse**: Validates quality before git commits
- **SessionEnd**: Generates comprehensive session reports

## 🚀 Installation

### Quick Install

```bash
# Add the marketplace (if not already added)
/plugin marketplace add https://github.com/Dev-GOM/claude-code-marketplace.git

# Install the plugin
/plugin install ai-pair-programming@dev-gom-plugins

# Restart Claude Code
claude -r
```

### Verify Installation

```bash
/plugin
```

You should see "ai-pair-programming" in the enabled plugins list.

## 📖 Usage

### Starting a Pair Programming Session

```bash
/pair
```

This activates AI pair programming mode where Claude:
- Asks clarifying questions before implementing
- Explains reasoning and design decisions
- Suggests alternatives and trade-offs
- Catches potential mistakes early
- Shares knowledge and best practices

### Getting a Code Review

```bash
# Review recent changes
/review

# Review a specific file
/review src/components/auth.js
```

The `@code-reviewer` agent will analyze:
- **Security**: Authentication, input validation, vulnerabilities
- **Code Quality**: Readability, naming, organization
- **Performance**: Algorithm efficiency, optimization opportunities
- **Best Practices**: Design patterns, error handling, testing
- **Potential Bugs**: Edge cases, null checks, logic errors

### Requesting Improvement Suggestions

```bash
# Get suggestions for recent changes
/suggest

# Get suggestions for a specific file
/suggest src/utils/api.js
```

Provides:
- Refactoring opportunities
- Design improvements
- Performance optimizations
- Code modernization suggestions
- Maintainability enhancements

### Fixing Bugs

```bash
# Debug with error message
/fix "TypeError: Cannot read property 'length' of undefined"

# Debug a specific file
/fix src/services/payment.js
```

The `@bug-hunter` agent will:
1. Identify the problem from error messages
2. Perform root cause analysis
3. Propose multiple fix approaches
4. Implement the best solution
5. Suggest tests to prevent regression

### Getting Code Explanations

```bash
# Explain a file
/explain src/hooks/useAuth.ts

# Explain a concept
/explain "how does the authentication flow work"
```

Provides explanations with:
- Big picture overview
- Component breakdowns
- Execution flow walkthroughs
- Design patterns and best practices
- Concrete examples

### Using Expert Agents Directly

You can invoke agents directly in your conversation:

```
@code-reviewer please review the authentication logic in auth.ts

@bug-hunter there's a memory leak in the WebSocket connection

@architect how should I structure the microservices communication?

@performance-expert the dashboard is loading slowly, can you analyze it?
```

## 🔧 How It Works

### Intelligent Hook System

The plugin uses hooks to provide proactive assistance:

1. **After Writing Code** (PostToolUse)
   - Tracks file changes
   - Suggests review after 5 files or 5 minutes
   - Helps maintain consistent quality

2. **Before Git Commits** (PreToolUse)
   - Checks if code has been reviewed
   - Warns about unreviewed changes
   - Prevents committing problematic code

3. **Session End** (SessionEnd)
   - Generates summary report
   - Provides statistics
   - Recommends next actions

### State Tracking

The plugin maintains state in `.state/review-state.json`:
```json
{
  "fileChanges": 0,
  "lastReviewTime": 1634567890000
}
```

This helps track:
- Number of files changed since last review
- Time of last code review
- Session statistics

### Generated Reports

At session end, creates `.pair-programming-session.md`:

```markdown
# AI Pair Programming Session Report

**Session End:** 2024-10-16 14:30:00

## Session Statistics
- **Files Modified:** 7
- **Last Code Review:** 2024-10-16 14:15:00

## Recommendations
✅ Code is relatively stable. Good time for a commit!
```

## 🎯 Workflow Example

Here's a typical workflow using this plugin:

```bash
# 1. Start pair programming
/pair
# Claude: "Let's build something great together! What would you like to work on?"

# 2. Implement feature with AI assistance
"Let's add user authentication"
# Claude helps design and implement...

# 3. After 5 files changed, automatic suggestion appears
# 💡 Tip: You've made significant changes. Consider running /review

# 4. Request code review
/review
# @code-reviewer provides detailed analysis

# 5. Fix any issues found
@bug-hunter please fix the JWT validation issue

# 6. Before committing, validation occurs
git commit -m "Add authentication"
# ⚠️ Pre-Commit Check: Run /review to ensure quality

# 7. Final review
/review

# 8. Commit the code
git commit -m "Add authentication"

# 9. End session - automatic report generated
# 🎯 Session Complete! Report saved to .pair-programming-session.md
```

## ⚙️ Configuration

### Plugin Configuration

The plugin uses `hooks/hooks.json` for configuration. Key settings:

```json
{
  "configuration": {
    "reviewThresholds": {
      "fileChangeCount": 5,           // Files before suggesting review
      "timeIntervalMinutes": 5,        // Minutes before suggesting review
      "preCommitWarningFiles": 3,      // Files to warn before commit
      "preCommitWarningMinutes": 10    // Minutes to warn before commit
    },
    "outputFiles": {
      "sessionReport": ".pair-programming-session.md",
      "reviewState": ".state/review-state.json"
    },
    "features": {
      "autoReviewSuggestion": true,    // Enable auto-review suggestions
      "preCommitValidation": true,     // Enable pre-commit warnings
      "sessionReporting": true         // Enable session reports
    }
  }
}
```

**Environment Variables:**
- `${CLAUDE_PLUGIN_ROOT}`: Automatically resolves to plugin root directory
- Used in hook commands to ensure correct script paths

### Customizing Agents

Agents are defined as Markdown files with YAML frontmatter in `agents/` directory.

Example (`agents/code-reviewer.md`):
```markdown
---
name: code-reviewer
description: Your custom description
tools: Read, Grep, Glob
model: sonnet
---

Your custom system prompt goes here...
```

**Agent Properties:**
- `name`: Unique identifier (use lowercase and hyphens)
- `description`: When to invoke this agent
- `tools`: Comma-separated list of allowed tools
- `model`: Model to use (sonnet, opus, haiku, or inherit)

### Disabling Specific Hooks

Edit `hooks/hooks.json` to disable hooks:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "enabled": false,  // Disable this hook
        ...
      }
    ]
  }
}
```

Or disable the entire plugin:
```bash
/plugin disable ai-pair-programming
```

## 📊 Output Files

The plugin generates these files:

- `.state/review-state.json` - Session state tracking
- `.pair-programming-session.md` - Session report

Add to `.gitignore` if desired:
```gitignore
.state/
.pair-programming-session.md
```

## 🐛 Troubleshooting

### Plugin Not Working

1. Check plugin installation:
   ```bash
   /plugin
   ```

2. Verify Node.js is available:
   ```bash
   node --version
   ```

3. Check for errors:
   ```bash
   claude --debug
   ```

### Hooks Not Triggering

1. Ensure hooks are enabled in settings
2. Check hook event names match
3. Verify script permissions (Unix):
   ```bash
   chmod +x plugins/ai-pair-programming/scripts/*.js
   ```

### Agents Not Responding

1. Verify agent Markdown files have valid YAML frontmatter
2. Check agent names match (use `@agent-name` format)
3. Ensure agents directory is properly configured
4. Confirm agent files use `.md` extension, not `.json`

## 🤝 Contributing

Feel free to customize this plugin:

1. Fork the repository
2. Modify agents, commands, or hooks
3. Test with `/plugin validate`
4. Share your improvements!

## 📄 License

MIT License - feel free to use and modify for your projects.

## 🙏 Credits

Created for the Claude Code community to enhance developer productivity through intelligent AI pair programming.

---

**Happy Coding with AI!** 🚀

For issues or suggestions, please open an issue on GitHub.
