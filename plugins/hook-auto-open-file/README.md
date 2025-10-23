# Auto Open File in VS Code

> **Language**: [English](README.md) | [한국어](README.ko.md)

> Automatically opens files in VS Code when they are created or modified by Claude Code.

## Features

- 🚀 **Instant File Access**: Opens files in VS Code immediately after creation or modification
- 🎯 **Smart Filtering**: Only opens code files (configurable extensions)
- 🚫 **Auto-Exclusion**: Skips node_modules, .git, dist, and other build directories
- ⚙️ **Highly Configurable**: Customize file extensions, excluded directories, and window behavior
- 🔄 **Seamless Integration**: Works silently in the background without interrupting your workflow
- 💻 **Cross-Platform**: Works on Windows, macOS, and Linux

## How it Works

This plugin uses a **two-stage hook approach**:

### Stage 1: Configuration Initialization (SessionStart Hook)
- Runs at session start
- Creates configuration file at `.plugin-config/hook-auto-open-file.json` if it doesn't exist
- Loads user preferences for file extensions and excluded directories

### Stage 2: Auto-Open Files (PostToolUse Hook)
- Runs after every `Write` or `Edit` operation
- Extracts the file path from the tool input
- Checks if the file matches configured criteria (extension, directory)
- Opens the file in VS Code using the `code` CLI command
- Silent execution (no user interruption)

## Installation

```bash
/plugin install hook-auto-open-file@dev-gom-plugins
```

## Prerequisites

**VS Code CLI must be installed and available in PATH**

To verify:

```bash
code --version
```

If not installed, follow these steps:

### Windows
VS Code installer automatically adds `code` to PATH. If not working:
1. Open VS Code
2. Press `Ctrl+Shift+P`
3. Type "Shell Command: Install 'code' command in PATH"

### macOS
1. Open VS Code
2. Press `Cmd+Shift+P`
3. Type "Shell Command: Install 'code' command in PATH"

### Linux
Usually installed automatically. If not:

```bash
sudo ln -s /usr/share/code/bin/code /usr/local/bin/code
```

## Usage

Once installed, the plugin works automatically:

1. Claude Code creates or modifies a file
2. File is instantly opened in VS Code
3. You can start editing immediately

### Example Workflow

```
User: "Create a new React component called Button.tsx"
Claude: [Creates Button.tsx]
→ File automatically opens in VS Code ✨
```

## Configuration

Edit `.plugin-config/hook-auto-open-file.json` in your project root:

```json
{
  "enabled": true,
  "openInNewWindow": false,
  "focusEditor": true,
  "jumpToLine": true,
  "codeExtensions": [
    ".js", ".ts", ".jsx", ".tsx",
    ".py", ".java", ".cpp", ".c", ".cs",
    ".go", ".rs", ".rb", ".php", ".swift",
    ".kt", ".scala", ".r", ".m", ".h", ".hpp",
    ".sql", ".sh", ".bash", ".ps1",
    ".html", ".css", ".scss", ".sass", ".less",
    ".json", ".yaml", ".yml", ".toml", ".xml",
    ".md", ".txt", ".env"
  ],
  "excludeDirs": [
    "node_modules",
    ".git",
    "dist",
    "build",
    "coverage",
    ".next",
    "out",
    ".nuxt"
  ]
}
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | `true` | Enable/disable the plugin |
| `openInNewWindow` | boolean | `false` | Open files in a new VS Code window |
| `focusEditor` | boolean | `true` | Focus the editor after opening file |
| `jumpToLine` | boolean | `true` | Jump to specific line (if supported) |
| `codeExtensions` | string[] | (see above) | File extensions to auto-open |
| `excludeDirs` | string[] | (see above) | Directories to skip |

### Customization Examples

**Only open TypeScript files:**

```json
{
  "codeExtensions": [".ts", ".tsx"]
}
```

**Exclude specific project directories:**

```json
{
  "excludeDirs": [
    "node_modules",
    ".git",
    "vendor",
    "tmp"
  ]
}
```

**Disable the plugin temporarily:**

```json
{
  "enabled": false
}
```

## Troubleshooting

### Files Not Opening

**Problem**: Files are created but don't open in VS Code

**Solutions**:
1. Check if VS Code CLI is installed: `code --version`
2. Verify plugin is enabled in config
3. Check if file extension is in `codeExtensions` list
4. Ensure file is not in an excluded directory

### VS Code Opens New Windows

**Problem**: New VS Code window opens for each file

**Solution**: Set `openInNewWindow: false` in config

### Performance Impact

**Problem**: Worried about performance

**Answer**: The plugin is optimized for minimal impact:
- Runs in background (3 second timeout)
- Silent execution (no output)
- Fails gracefully if VS Code CLI unavailable
- Only processes `Write` and `Edit` operations

## Advanced Usage

### Open Files at Specific Line

While not currently supported in the default configuration, you can modify the plugin to support line numbers:

```javascript
// In auto-open-file.js
command += ` -g "${filePath}:${lineNumber}"`;
```

### Support for Other Editors

Modify `auto-open-file.js` to support other editors:

```javascript
// IntelliJ IDEA
exec(`idea "${filePath}"`);

// Sublime Text
exec(`subl "${filePath}"`);

// Vim
exec(`vim "${filePath}"`);
```

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
- 🚀 Auto-open files in VS Code on Write/Edit
- ⚙️ Configurable file extensions and excluded directories
- 💻 Cross-platform support (Windows, macOS, Linux)
