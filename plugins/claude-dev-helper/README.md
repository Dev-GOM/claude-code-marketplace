# Claude Dev Helper

> **Language**: [English](README.md) | [한국어](README.ko.md)

> ⚠️ **Experimental Feature**: This plugin is currently in experimental stage. Some features may be unstable or subject to change.

> Git diff review plugin for Claude Code with optional VSCode extension support.

## Features

- 📂 **Auto-Open Files** (v1.2.5+): Automatically opens files in VSCode when Claude creates/edits them
- 🔔 **Sound Notifications** (v1.2.0+): Audio feedback for all hook events (SessionStart, SessionEnd, PreToolUse, PostToolUse, Notification, UserPromptSubmit, Stop, SubagentStop, PreCompact)
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
- `openLocation`: Where to open files - `0` for first column (left), `1` for second column (right) (default: 1)
- `maxQueueSize`: Maximum number of files to track (default: 10)

Edit `.plugin-config/claude-dev-helper.json` to customize the behavior.

### Sound Notifications Settings

The plugin includes optional sound notifications for hook events. Configuration is in `.plugin-config/claude-dev-helper.json`:

```json
{
  "soundNotifications": {
    "enabled": false,
    "soundsFolder": ".plugin-config/sounds",
    "hooks": {
      "SessionStart": {
        "enabled": true,
        "soundFile": "session-start.mp3"
      },
      "SessionEnd": {
        "enabled": false,
        "soundFile": "session-end.mp3"
      },
      "PreToolUse": {
        "enabled": false,
        "soundFile": "pre-tool-use.mp3"
      },
      "PostToolUse": {
        "enabled": false,
        "soundFile": "post-tool-use.mp3"
      },
      "Notification": {
        "enabled": false,
        "soundFile": "notification.mp3"
      },
      "UserPromptSubmit": {
        "enabled": false,
        "soundFile": "user-prompt-submit.mp3"
      },
      "Stop": {
        "enabled": false,
        "soundFile": "stop.mp3"
      },
      "SubagentStop": {
        "enabled": false,
        "soundFile": "subagent-stop.mp3"
      },
      "PreCompact": {
        "enabled": false,
        "soundFile": "pre-compact.mp3"
      }
    }
  }
}
```

**Settings:**
- `enabled`: Global enable/disable for all sound notifications (default: false)
- `soundsFolder`: Path to sound files folder (relative or absolute)
- `hooks.[hookType].enabled`: Enable/disable specific hook sound
- `hooks.[hookType].soundFile`: Sound file name for the hook

**To enable sound notifications:**

1. **Set up sound files**:
   - Create `.plugin-config/sounds/` folder in your project root
   - Add sound files for the hooks you want to use (e.g., `session-start.mp3`, `post-tool-use.mp3`, `stop.mp3`, etc.)
   - Supported formats: MP3 (all platforms), WAV (all platforms)
   - You can find free sound effects at:
     - [Freesound](https://freesound.org/)
     - [Zapsplat](https://www.zapsplat.com/)
     - [Pixabay](https://pixabay.com/sound-effects/)
     - Or create your own short notification sounds

2. **Enable in configuration** (`.plugin-config/claude-dev-helper.json`):
   ```json
   {
     "soundNotifications": {
       "enabled": true,
       "hooks": {
         "SessionStart": { "enabled": true },
         "PostToolUse": { "enabled": true },
         "Stop": { "enabled": true }
       }
     }
   }
   ```

3. **Restart Claude Code** ⚠️ IMPORTANT
   - Configuration changes require Claude Code restart to take effect
   - On next session start, `hooks.json` will be automatically updated
   - You'll see a restart notice if changes were detected

**Note**: PostToolUse is disabled by default to avoid performance impact on every tool use.

**Customizing sound files:**

You can change sound files at any time by:
1. Replacing the sound files in `.plugin-config/sounds/` folder
2. Or updating the `soundFile` path in the configuration to point to different files
3. Restart Claude Code to apply changes

Example: Using different sounds for different hooks
```json
{
  "soundNotifications": {
    "enabled": true,
    "soundsFolder": ".plugin-config/sounds",
    "hooks": {
      "SessionStart": {
        "enabled": true,
        "soundFile": "my-custom-start.mp3"
      },
      "Stop": {
        "enabled": true,
        "soundFile": "my-custom-stop.wav"
      }
    }
  }
}
```

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

**Q: Sound notifications not playing?**
- Ensure `soundNotifications.enabled: true` in `.plugin-config/claude-dev-helper.json`
- Check sound files exist in configured `soundsFolder`
- Verify sound file format (MP3 or WAV)
- Restart Claude Code after configuration changes
- On Linux: Ensure `aplay` (for WAV) or `mpg123` (for MP3) is installed

## Development

See [`.claude/PLUGIN_WORKFLOW.md`](../../.claude/PLUGIN_WORKFLOW.md) for development and deployment workflow.

## License

MIT © Dev GOM

## Links

- **GitHub**: https://github.com/Dev-GOM/claude-code-marketplace
- **Issues**: https://github.com/Dev-GOM/claude-code-marketplace/issues
- **VSCode Extension Branch**: https://github.com/Dev-GOM/claude-code-marketplace/tree/vscode-extension
