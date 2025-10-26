# Claude Dev Helper

> **Language**: [English](README.md) | [한국어](README.ko.md)

> Git diff review integration for Claude Code with VSCode extension. Review Claude's changes with inline diff view or browser-based diff editor.

## ⚠️ Requirements

**VSCode Extension Required:**
- Install the companion VSCode extension for the best experience
- **VS Marketplace**: Search "claude-dev-helper" by devGOM (Coming soon)
- **Manual Install**: Download `.vsix` from [GitHub Releases](https://github.com/Dev-GOM/claude-code-marketplace/releases)

## Features

### 🎯 Two Diff Viewing Modes

**1. VSCode Inline Diff (Recommended)**
- 🚀 **Native VSCode Integration**: Uses VSCode's built-in diff editor
- 📊 **Inline View**: See additions and deletions in context
- ⚡ **Fast**: No server startup required
- 🎨 **Theme Support**: Respects your VSCode theme

**2. Browser Diff Editor (Alternative)**
- 🌐 **Monaco Editor**: Full-featured diff editor in browser
- 📂 **Multi-file View**: Review all changes in one page
- 🔄 **Accept/Reject Lines**: Granular control over changes
- 🖥️ **Separate Window**: Keep VSCode focused on code

### 🛠️ Additional Features

- 🔄 **Auto-Staging**: Automatically stages modified files (optional)
- 🎯 **CodeLens Buttons**: Quick access to diff commands
- ⚙️ **Configurable Hooks**: Customize your workflow
- 📦 **No Setup**: Works immediately after installation

## How it Works

This plugin creates a **Cursor-like review workflow** using Git and VS Code's native Source Control panel:

### Workflow

```
1. Claude Code modifies a file
   ↓
2. PostToolUse hook auto-stages the file (git add)
   ↓
3. VS Code Source Control panel shows changes
   ↓
4. You review the diff and choose:
   ✓ Accept (individual lines or all)
   ✗ Reject (individual lines or all)
```

### What You See

```
VS Code Source Control Panel:

📁 Changes (3 files)
  ├── Button.tsx              [View Diff] [Stage] [Discard]
  ├── Button.test.tsx         [View Diff] [Stage] [Discard]
  └── index.ts                [View Diff] [Stage] [Discard]

Top Buttons:
  ✓ Commit        (accept all staged changes)
  ↶ Discard All   (reject all changes)
  + Stage All     (stage all changes)
```

### Diff View

Click on a file to see the diff:

```typescript
function hello() {
  console.log("Hello");
- console.log("old line");     // ← Red (removed)
+ console.log("World");        // ← Green (added)
+ return "done";               // ← Green (added)
}

// Controls:
[Stage Change] [Discard Change]   // ← Per-line buttons
[Stage All]    [Discard All]      // ← File-level buttons
```

## Installation

### Step 1: Install Claude Code Plugin

```bash
/plugin install claude-dev-helper@dev-gom-plugins
```

### Step 2: Install VSCode Extension

**Option A: VS Marketplace (Coming Soon)**
1. Open VSCode Extensions (`Ctrl+Shift+X`)
2. Search "claude-dev-helper" by devGOM
3. Click Install

**Option B: Manual Install (.vsix)**
1. Download `.vsix` from [GitHub Releases](https://github.com/Dev-GOM/claude-code-marketplace/releases)
2. VSCode → Extensions → `...` → Install from VSIX...
3. Select downloaded file

**Option C: Command Line**
```bash
code --install-extension claude-dev-helper-0.8.0.vsix
```

### Step 3: Reload VSCode

```
Ctrl+Shift+P → "Developer: Reload Window"
```

## Usage

### Method 1: VSCode Inline Diff (Recommended)

1. **Claude modifies a file**
2. **CodeLens appears**: "Show Diff" button above changed lines
3. **Click "Show Diff"**
4. **VSCode diff view opens** with inline changes:
   - 🔴 Red lines = deleted
   - 🟢 Green lines = added

**Settings** (Auto-applied on first run):
```json
{
  "diffEditor.renderSideBySide": false  // Inline view
}
```

### Method 2: Browser Diff Editor

1. **Claude modifies a file**
2. **Open Command Palette** (`Ctrl+Shift+P`)
3. **Run**: "Show Git Diff (Browser)"
4. **Browser opens** with Monaco diff editor
5. **Review changes** and accept/reject lines

### Quick Access

**CodeLens Button:**
```typescript
// Changed file shows:
[Show Diff]  ← Click to open VSCode diff
```

**Command Palette:**
```
Ctrl+Shift+P →
  • "Show Git Diff" → VSCode inline diff
  • "Show Git Diff (Browser)" → Browser diff editor
```

## Example Workflow

```
You: "Add error handling to the API client"
  ↓
Claude: [Modifies api-client.ts]
  ↓
CodeLens: [Show Diff] button appears
  ↓
You: Click "Show Diff"
  ↓
VSCode: Opens inline diff view
  ↓
You: Review changes, accept/reject, commit
```

## Configuration

Edit `.plugin-config/claude-dev-helper.json` in your project root:

```json
{
  "enabled": true,
  "autoStage": true,
  "showNotification": true,
  "onlyTrackedFiles": false,
  "excludePatterns": [
    "*.log",
    "*.tmp",
    ".DS_Store",
    "node_modules/**",
    ".git/**",
    "dist/**",
    "build/**"
  ],
  "includeDirs": [],
  "excludeDirs": [
    "node_modules",
    ".git",
    "dist",
    "build",
    "coverage",
    ".next",
    "out"
  ]
}
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | `true` | Enable/disable the plugin |
| `autoStage` | boolean | `true` | Automatically stage modified files |
| `showNotification` | boolean | `true` | Show notification when files are staged |
| `onlyTrackedFiles` | boolean | `false` | Only stage files already tracked by Git |
| `excludePatterns` | string[] | (see above) | File patterns to exclude |
| `includeDirs` | string[] | `[]` | Only stage files in these directories (empty = all) |
| `excludeDirs` | string[] | (see above) | Directories to exclude |

### Customization Examples

**Disable notifications:**
```json
{
  "showNotification": false
}
```

**Only stage tracked files:**
```json
{
  "onlyTrackedFiles": true
}
```

**Custom exclude patterns:**
```json
{
  "excludePatterns": [
    "*.log",
    "*.tmp",
    "test/**",
    "docs/**"
  ]
}
```

**Only stage specific directories:**
```json
{
  "includeDirs": ["src", "lib"]
}
```

## VS Code Tips

### Keyboard Shortcuts

- `Ctrl+Shift+G` - Open Source Control panel
- `Enter` - View diff of selected file
- `Ctrl+Enter` - Stage selected file
- `Alt+Enter` - Discard selected file

### Split Diff View

1. Click on changed file in Source Control
2. Drag the diff editor to the side
3. View side-by-side comparison

### Line Staging

1. Open diff view
2. Hover over changed lines
3. Click `+` icon to stage individual lines
4. Click `-` icon to unstage

## Comparison with Cursor

| Feature | Cursor | This Plugin |
|---------|--------|-------------|
| **Auto-diff on change** | ✅ | ✅ |
| **Line-by-line accept/reject** | ✅ | ✅ |
| **Accept/reject all** | ✅ | ✅ |
| **Inline buttons** | ✅ In-editor | ✅ In Source Control / Extension |
| **Zero config** | ✅ | ✅ |
| **Works with any editor** | ❌ | ✅ (Git-based) |

**Location difference**:
- **Cursor**: Buttons appear inline in the editor
- **This plugin**: Buttons appear in VS Code Source Control panel (or via Extension)

**Why Source Control panel?**
- ✅ Native VS Code feature (no custom UI needed)
- ✅ Works with any Git-aware editor
- ✅ Familiar interface for developers
- ✅ Full Git integration

## Troubleshooting

### Files not being staged

**Problem**: Files are modified but don't appear in Source Control

**Solutions**:
1. Check if Git is initialized: `git status`
2. Verify plugin is enabled in config
3. Check if file matches `excludePatterns`
4. Ensure file is not in `excludeDirs`

### Too many notifications

**Problem**: Notification appears for every file change

**Solution**: Disable notifications in config:
```json
{
  "showNotification": false
}
```

### Only want to review certain files

**Problem**: All files are staged but you only care about some

**Solution**: Use `includeDirs` or `excludePatterns`:
```json
{
  "includeDirs": ["src", "lib"],
  "excludePatterns": ["*.test.ts", "*.spec.ts"]
}
```

## Advanced Usage

### Git Workflow Integration

This plugin integrates seamlessly with your existing Git workflow:

```bash
# 1. Claude modifies files → Auto-staged
# 2. Review in VS Code → Accept/reject changes
# 3. Commit accepted changes
git commit -m "feat: Add new feature"

# 4. Push to remote
git push
```

### Pre-commit Hooks

Combine with Git hooks for additional validation:

```bash
# .git/hooks/pre-commit
#!/bin/bash
npm test
npm run lint
```

### Branch Strategy

1. Work on feature branch
2. Let Claude make changes → Auto-staged
3. Review diffs → Accept/reject
4. Commit → Push → Create PR

## Roadmap

This plugin is designed to be an extensible development assistant. Future features planned:

- 🔍 Code quality analysis
- 📊 Project structure insights
- 🛠️ Automated refactoring suggestions
- 📝 Documentation generation
- 🧪 Test coverage analysis
- And more...

## License

MIT

## Author

**Dev GOM**
- GitHub: [@Dev-GOM](https://github.com/Dev-GOM)
- Marketplace: [dev-gom-plugins](https://github.com/Dev-GOM/claude-code-marketplace)

## Version

1.0.0 - Initial release

## Changelog

### 1.0.0 (2025-10-23)
- ✨ Initial release
- 🔄 Auto-staging on Write/Edit operations
- 👀 VS Code Source Control integration
- ✅ Line-by-line and bulk accept/reject
- ⚙️ Configurable patterns and directories
