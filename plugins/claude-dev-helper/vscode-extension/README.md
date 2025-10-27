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

Claude Dev Helper enhances your development workflow when using Claude Code by automatically opening files and providing quick access to git diff views.

## Features

### Current Features

- **Auto-Open Files**: Files automatically open in VS Code when Claude creates or edits them
  - Opens in background without stealing focus (configurable)
  - Configurable via plugin's `config.json`

- **Quick Diff Review**: CodeLens "Show Diff Editor" button appears above changed code blocks
  - One-click access to VSCode's inline diff view
  - Compares working file with HEAD version
  - Automatic inline diff mode for better readability

- **Browser Diff Viewer**: Optional browser-based diff viewer for enhanced visualization
  - Standalone diff server
  - Side-by-side comparison view

### Coming Soon

- Inline accept/reject buttons for individual changes
- Per-line git operations
- Enhanced code review capabilities

## Usage

### Auto-Open Files
When Claude creates or modifies a file, it automatically opens in VS Code without interrupting your workflow.

### Diff Review
1. When Claude modifies a file, a CodeLens button appears: `$(diff) Show Diff Editor`
2. Click to open VSCode's inline diff view
3. Review changes between working file and HEAD version

## Requirements

- VS Code 1.80.0 or higher
- Git must be installed and initialized in your workspace
- Works best with [Claude Code](https://claude.com/code)

## Extension Settings

This extension contributes the following settings:

* `claudeDevHelper.enabled`: Enable/disable inline accept/reject buttons (default: `true`)
* `claudeDevHelper.enableCodeLens`: Enable/disable CodeLens buttons above changed lines (default: `true`)
* `claudeDevHelper.autoSetInlineDiffMode`: Automatically set VSCode diff editor to inline mode on first activation (default: `true`)

### Plugin Configuration

Configure auto-open behavior in `.claude-plugin/config.json`:

```json
{
  "autoOpen": {
    "enabled": true,
    "focus": false,
    "maxQueueSize": 10
  }
}
```

- `enabled`: Enable/disable auto-open feature
- `focus`: Whether to focus the opened file (default: false - opens in background)
- `maxQueueSize`: Maximum number of files to track (default: 10)

## Known Limitations

- No inline accept/reject buttons yet (planned for future releases)
- Diff view is read-only - use Git commands separately to stage/discard changes
- Auto-open requires both plugin and extension to be installed

## Release Notes

### 1.1.0

New features:
- **Auto-Open Files**: Automatically opens files in VS Code when Claude creates or edits them
- File watcher integration with `.claude-dev-helper/open-files.json`
- Configurable focus and queue size settings via plugin config
- Background opening support (opens without stealing focus)

### 1.0.2

Improvements:
- Enhanced diff editor integration
- Better CodeLens stability

### 1.0.0

Initial release:
- CodeLens "Show Diff Editor" button on changed lines
- VSCode inline diff view integration
- Browser-based diff viewer support
- Automatic inline diff mode configuration
- Git change detection

## License

MIT

## Author

Dev GOM
