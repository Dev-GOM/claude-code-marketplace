# Git Diff Review

> **Language**: [English](README.md) | [한국어](README.ko.md)

> Automatically stage file changes for review in VS Code Source Control with Git-based diff workflow. Accept or reject changes line-by-line or all at once, just like Cursor!

## Features

- 🔄 **Auto-Staging**: Automatically stages modified files to VS Code Source Control
- 👀 **Visual Diff**: Review all changes in VS Code's built-in diff viewer
- ✅ **Line-by-Line Control**: Accept or reject individual lines
- 🎯 **Bulk Operations**: Accept all or reject all changes with one click
- 🎨 **Zero Configuration**: Works out of the box with sensible defaults
- ⚙️ **Highly Configurable**: Customize patterns, directories, and behavior

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

```bash
/plugin install hook-git-diff-review@dev-gom-plugins
```

## Prerequisites

- Git initialized in your project (`git init`)
- VS Code or any editor with Git integration

## Usage

Once installed, the plugin works automatically:

1. **Claude modifies a file** → File is auto-staged
2. **Open VS Code Source Control panel** (Ctrl+Shift+G)
3. **Click on file** to view diff
4. **Accept or reject changes**:
   - ✓ Line-by-line: Click "Stage Change" or "Discard Change"
   - ✓ File-level: Click "Stage" or "Discard" button
   - ✓ All changes: Click "Commit" or "Discard All"

### Example Workflow

```
User: "Create a new React component called Button.tsx"

Claude: [Creates Button.tsx]
  ↓
Plugin: [Automatically stages Button.tsx]
  ↓
VS Code: Shows notification "📋 File staged for review: Button.tsx"
  ↓
You: Open Source Control → Review diff → Accept/Reject
```

## Configuration

Edit `.plugin-config/hook-git-diff-review.json` in your project root:

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
| **Inline buttons** | ✅ In-editor | ✅ In Source Control |
| **Zero config** | ✅ | ✅ |
| **Works with any editor** | ❌ | ✅ (Git-based) |

**Location difference**:
- **Cursor**: Buttons appear inline in the editor
- **This plugin**: Buttons appear in VS Code Source Control panel

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
