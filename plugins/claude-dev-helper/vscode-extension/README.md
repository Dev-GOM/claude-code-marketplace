# Claude Dev Helper

A comprehensive development assistant for Claude Code users - providing inline code review tools and more!

---

## ⚠️ **IMPORTANT: Requires Claude Code Plugin**

**This VS Code Extension ONLY provides UI features (CodeLens buttons & keyboard shortcuts).**

**You MUST install the Claude Code plugin first:**

### Step 1: Add the Marketplace

```bash
/plugin marketplace add https://github.com/Dev-GOM/claude-code-marketplace.git
```

### Step 2: Install the Plugin

```bash
/plugin install claude-dev-helper@dev-gom-plugins
```

**Without the plugin, this extension will NOT work!**

- **Plugin**: Tracks Claude's changes and manages feedback
- **Extension**: Provides visual UI and shortcuts in VS Code

**📦 Plugin Repository**: [dev-gom-plugins](https://github.com/Dev-GOM/claude-code-marketplace)

---

## Overview

Claude Dev Helper is an extensible VS Code extension designed to enhance your development workflow when using Claude Code. Currently focused on git change review capabilities, this extension will evolve to include additional development assistance features in future releases.

## Features

### Current Features

- **Inline Accept/Reject Buttons**: See CodeLens buttons above each changed code block - just like Cursor!
- **Per-Change Control**: Accept or reject individual changes with precision
- **Bulk Actions**: Accept or reject all changes at once for faster workflows
- **Git Integration**: Uses native Git commands for reliable staging/discarding

### Coming Soon

- Additional development assistance tools
- Enhanced code review capabilities
- More productivity features for Claude Code users

## Usage

1. When Claude Code modifies a file, this extension automatically detects unstaged changes
2. CodeLens buttons appear above each change:
   - `✓ Accept` - Stage the change
   - `✗ Reject` - Discard the change
3. Click the buttons to accept or reject changes inline

## Requirements

- VS Code 1.80.0 or higher
- Git must be installed and initialized in your workspace
- Works best with [Claude Code](https://claude.com/code)

## Extension Settings

This extension contributes the following settings:

* `claudeDevHelper.enabled`: Enable/disable inline accept/reject buttons (default: `true`)
* `claudeDevHelper.autoShowDiff`: Automatically show diff view when files are modified (default: `true`)

## Known Limitations

- Currently, rejecting a change reverts the entire file (not just the specific lines)
- Line-level git operations are planned for future releases

## Release Notes

### 0.1.0

Initial release:
- Inline CodeLens for accept/reject
- Git integration for staging/discarding
- Basic change detection

## License

MIT

## Author

Dev GOM
