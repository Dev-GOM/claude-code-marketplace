# Claude Dev Helper

> **Language**: [English](README.md) | [한국어](README.ko.md)

> ⚠️ **Experimental Feature**: This plugin is currently in experimental stage. Some features may be unstable or subject to change.

> Git diff review plugin for Claude Code with optional VSCode extension support.

## Features

- 📂 **Auto-Open Files** (v1.1.7+): Automatically opens files in VSCode when Claude creates/edits them
- 🎯 **Git Diff Review**: Review Claude's code changes with CodeLens buttons
- 🌐 **Browser Diff Editor**: Monaco-based diff viewer in your browser
- 🔄 **Auto-Staging** (Optional): Automatically stage modified files
- ⚙️ **Configurable Hooks**: Customize your workflow

## Installation

### Step 1: Install Plugin

```bash
/plugin install claude-dev-helper@dev-gom-plugins
```

### Step 2: Install VSCode Extension (Optional but Recommended)

For enhanced diff viewing with VSCode integration:

**Option A: VS Marketplace** (Recommended)
- Install from [VS Marketplace](https://marketplace.visualstudio.com/items?itemName=devGOM.claude-dev-helper)
- Or search "claude-dev-helper" in VSCode Extensions

**Option B: From GitHub Releases**
1. Download `.vsix` from [Releases](https://github.com/Dev-GOM/claude-code-marketplace/releases)
2. Install: `code --install-extension claude-dev-helper-{version}.vsix`

**Option C: Build from Source**
```bash
# Clone vscode-extension branch
git clone -b vscode-extension https://github.com/Dev-GOM/claude-code-marketplace.git
cd claude-code-marketplace/plugins/claude-dev-helper/vscode-extension
npm install
npm run package
code --install-extension claude-dev-helper-0.8.0.vsix
```

### Step 3: Reload VSCode

```
Ctrl+Shift+P → "Developer: Reload Window"
```

## Usage

### With VSCode Extension (Recommended)

1. **Claude modifies a file**
2. **CodeLens appears**: "Show Diff" button
3. **Click to view**: VSCode inline diff opens
   - 🔴 Red lines = deleted
   - 🟢 Green lines = added

### Browser Diff Editor (Alternative)

```
Ctrl+Shift+P → "Show Git Diff (Browser)"
```

- Opens Monaco diff editor in browser
- Review all changed files
- Accept/reject individual lines

## Configuration

### Auto-Open Files Settings

The plugin automatically creates `.plugin-config/claude-dev-helper.json` in your project root with default settings:

```json
{
  "autoOpen": {
    "enabled": true,
    "focus": false,
    "maxQueueSize": 10
  },
  "_pluginVersion": "1.1.0"
}
```

**Settings:**
- `enabled`: Enable/disable auto-open feature (default: true)
- `focus`: Whether to focus the opened file (default: false - opens in background)
- `maxQueueSize`: Maximum number of files to track (default: 10)

Edit `.plugin-config/claude-dev-helper.json` to customize the behavior.

### Enable Auto-Staging Hook

Edit `plugins/claude-dev-helper/hooks/hooks.json`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "enabled": true,  // Change to true
        "matcher": "Write|Edit"
      }
    ]
  }
}
```

### VSCode Settings (Auto-applied)

```json
{
  "diffEditor.renderSideBySide": false  // Inline diff view
}
```

## Quick Commands

| Command | Description |
|---------|-------------|
| `Show Git Diff` | Open VSCode inline diff (default) |
| `Show Git Diff (Browser)` | Open browser diff editor |
| `Enable Inline Diff Mode` | Force VSCode inline view mode |

## Requirements

- Git initialized in your project
- VSCode (for extension features)
- Node.js (for browser diff server)

## Architecture

```
Browser Diff Mode:
  Claude modifies file → Hook triggers → Browser opens → Review changes

VSCode Diff Mode:
  Claude modifies file → CodeLens appears → Click → VSCode diff opens
```

## Troubleshooting

**Q: CodeLens not showing?**
- Ensure VSCode extension is installed and enabled
- Reload window: `Ctrl+Shift+P` → Reload Window

**Q: Browser diff server not starting?**
- Check port 3456 is available
- Install dependencies: `cd diff-editor && npm install`

**Q: Diff showing side-by-side instead of inline?**
- Run command: "Enable Inline Diff Mode"
- Or set `diffEditor.renderSideBySide: false` in VSCode settings

## Development

See [`.claude/PLUGIN_WORKFLOW.md`](../../.claude/PLUGIN_WORKFLOW.md) for development and deployment workflow.

## License

MIT © Dev GOM

## Links

- **GitHub**: https://github.com/Dev-GOM/claude-code-marketplace
- **Issues**: https://github.com/Dev-GOM/claude-code-marketplace/issues
- **VSCode Extension Branch**: https://github.com/Dev-GOM/claude-code-marketplace/tree/vscode-extension
