# TODO Collector

> **Language**: [English](README.md) | [한국어](README.ko.md)

Tracks TODO comments in modified files and detects changes during your Claude Code sessions.

## Features

- 🔍 **Full Project Scan**: Automatically scans entire project on first run
- 📊 **Multiple Comment Types**: Supports TODO, FIXME, HACK, BUG, XXX, NOTE
- 🌐 **Multi-Language Support**: Works with JS, TS, Python, Java, Go, C++, Rust, and more
- 📝 **Detailed Reports**: Generates markdown reports with clickable file links
- 📂 **Smart Grouping**: Groups by comment type and file
- 🔄 **Change Detection**: Tracks added and removed TODOs automatically
- ⚡ **Performance Optimized**: Only scans modified files after initial scan
- 🎯 **Customizable Filtering**: Configure included directories and file extensions
- 🚫 **Smart Exclusions**: Automatically excludes node_modules, dist, build, etc.

## How it Works

This plugin uses **three hooks** for intelligent TODO tracking:

### SessionStart Hook (`init-config.js`)
Runs at session start:
1. Reads plugin version from `plugin.json`
2. Checks if configuration file exists at `.plugin-config/hook-todo-collector.json`
3. If config exists, compares `_pluginVersion` with current plugin version
4. If versions match, exits immediately (fast!)
5. If versions differ, performs automatic migration:
   - Merges existing user settings with new default fields
   - Preserves all custom user configurations
   - Updates `_pluginVersion` to current version
6. If config doesn't exist, creates it with default settings

### PostToolUse Hook (`track-todos.js`)
Runs after Write, Edit, or NotebookEdit operations:
1. Captures the file path that was modified
2. Checks if file is in included directories (if specified)
3. Checks if file has valid extension for TODO scanning
4. Records it in a tracking file (`.state/todo-changed-files.json`)

### Stop Hook (`collect-todos.js`)
Runs when your Claude Code session ends:
1. Loads the list of files modified during the session
2. If no files were modified:
   - Checks if report file exists
   - If report doesn't exist: performs **full project scan**
   - If report exists: exits silently
3. If files were modified: scans only those files
4. Compares with previous TODO state to detect changes
5. Identifies which TODOs were added or removed
6. Updates the TODO state and generates report
7. Displays summary: "📋 TODO Collector: 3 added ✅, 1 removed ❌ in 2 file(s). Total: 15 TODO(s)"
8. Cleans up tracking files

## Installation

```bash
/plugin install hook-todo-collector@dev-gom-plugins
```

## Usage

Once installed, the plugin works automatically:

1. **During your session**: As you Write or Edit files, they're tracked automatically
2. **When session ends**: The plugin scans modified files and shows changes:

```
📋 TODO Collector: 3 added ✅, 1 removed ❌ in 2 file(s). Total: 15 TODO(s)
```

**Note**: If no files were modified or no TODO changes detected, the plugin exits silently.

## Supported Comment Formats

### JavaScript/TypeScript
```javascript
// TODO: Implement user authentication
// FIXME: Memory leak in event handler
// HACK: Temporary workaround for API bug
// BUG: Incorrect calculation in edge case
// XXX: This needs to be refactored
// NOTE: This is for backwards compatibility
```

### Python
```python
# TODO: Add error handling
# FIXME: Performance bottleneck
```

### Multi-line Comments
```javascript
/* TODO: This is a multi-line
   todo comment that spans
   multiple lines */
```

## Example Output

### .todos-report.md (Detailed Report)

```markdown
# TODO Report

**Total Items**: 12
- TODO: 5
- FIXME: 3
- BUG: 2
- HACK: 1
- NOTE: 1

---

## TODO (5)

### [src/auth.js:23](src/auth.js:23)
Implement user authentication

### [src/api.js:45](src/api.js:45)
Add rate limiting

...
```

### .todos.txt (Simple List)

```
TODO (src/auth.js:23): Implement user authentication
TODO (src/api.js:45): Add rate limiting
FIXME (src/handlers.js:67): Memory leak in event handler
...
```

## Configuration

The plugin automatically creates a configuration file at `.plugin-config/hook-todo-collector.json` on first run.

### Automatic Configuration Migration

When you update the plugin, your settings are automatically migrated:
- ✅ **Preserves your custom settings**
- ✅ **Adds new configuration fields** with default values
- ✅ **Version tracked** via `_pluginVersion` field
- ✅ **Zero manual intervention** required

### Available Configuration Options

#### `showLogs`
- **Description**: Show TODO collector messages in console
- **Default**: `true`
- **Example**: `false` (silent mode)

#### `outputDirectory`
- **Description**: Directory path to save report files
- **Default**: `""` (project root)
- **Example**: `"docs"`, `".claude-output"`

#### `outputFile`
- **Description**: Output filename for TODO report
- **Default**: `""` (uses `.{project-name}-todos-report.md`)
- **Example**: `"todo-report.md"`, `"todos.md"`

#### `includeDirs`
- **Description**: List of directories to scan (empty = scan all)
- **Default**: `[]` (scan entire project)
- **Example**: `["src", "lib", "components"]` (scan only these directories)

#### `excludeDirs`
- **Description**: List of directories to exclude from scanning
- **Default**: `["node_modules", "dist", "build", ".git", "coverage", ".next", ".nuxt", "out", "vendor", ".snapshots", ".claude-plugin"]`
- **Example**: Add more directories to exclude

#### `includeExtensions`
- **Description**: List of file extensions to scan
- **Default**: `[".js", ".jsx", ".ts", ".tsx", ".py", ".java", ".go", ".rb", ".php", ".c", ".cpp", ".h", ".hpp", ".cs", ".kt", ".kts", ".swift", ".rs", ".scala", ".dart", ".m", ".mm", ".css", ".scss", ".sass", ".less", ".html", ".vue", ".svelte", ".r", ".R", ".jl", ".coffee", ".sh", ".bash", ".ps1", ".toml", ".ini", ".yaml", ".yml"]`
- **Example**: `[".js", ".ts", ".py"]` (scan only these file types)

#### `excludeExtensions`
- **Description**: List of file extensions to exclude from scanning
- **Default**: `[]` (no exclusions)
- **Example**: `[".min.js", ".bundle.js", ".map"]` (exclude minified and map files)

#### `commentTypes`
- **Description**: List of comment types to search for
- **Default**: `["TODO", "FIXME", "HACK", "BUG", "XXX", "NOTE"]`
- **Example**: `["TODO", "FIXME", "IMPORTANT", "REVIEW"]`

### How to Change Settings

Edit `.plugin-config/hook-todo-collector.json` in your project root:

```json
{
  "showLogs": true,
  "outputDirectory": "",
  "includeDirs": ["src", "lib"],
  "excludeDirs": [
    "node_modules", "dist", "build", ".git",
    "coverage", ".next", "vendor", "target"
  ],
  "includeExtensions": [
    ".js", ".jsx", ".ts", ".tsx",
    ".py", ".java", ".go", ".rs"
  ],
  "excludeExtensions": [".min.js", ".bundle.js", ".map"],
  "commentTypes": ["TODO", "FIXME", "HACK", "BUG", "XXX", "NOTE"]
}
```

### Configuration Priority

The `outputDirectory` is determined in this order:
1. `outputDirectory` in `.plugin-config/hook-todo-collector.json`
2. Environment variable `TODO_COLLECTOR_DIR`
3. Environment variable `CLAUDE_PLUGIN_OUTPUT_DIR`
4. Default (project root)

## Hook Output

The plugin outputs a single JSON summary:

```javascript
console.log(JSON.stringify({
  systemMessage: '📋 TODO Collector found 12 item(s) (TODO: 5, FIXME: 3). Report saved to .todos-report.md',
  continue: true
}));
```

## Performance

The plugin is highly optimized for performance:
- **Only scans modified files** (not the entire project)
- **Skips scanning** if no files were modified during the session
- **Excludes** common build/dependency directories
- **State-based tracking** - only reports actual changes
- **Typical scan time**: < 100ms for a few modified files

## Best Practices

### Add to .gitignore

```gitignore
.todos-report.md
.todos.txt
```

### Regular Review

Schedule time to review and address TODOs:
- Review the report weekly
- Convert TODOs to GitHub issues
- Remove completed TODOs from code

### Naming Conventions

Use consistent TODO patterns:
- `TODO:` - Future work
- `FIXME:` - Known bugs that need fixing
- `HACK:` - Temporary workarounds
- `BUG:` - Confirmed bugs
- `XXX:` - Danger/warning markers
- `NOTE:` - Important information

## Troubleshooting

### Plugin not generating reports?

1. **Modify a file**: The plugin only scans files you've modified during the session
   - Use Write or Edit tools
   - Files must have valid extensions (`.js`, `.py`, etc.)

2. **Check for TODO changes**: If you modified files but didn't add/remove TODOs, the plugin exits silently

3. **Verify plugin is installed**:
   ```bash
   /plugin
   ```

4. **Check file permissions**: Ensure the plugin can write to project root

### Missing some TODOs?

1. **Check comment format**: Must match the regex patterns
2. **Check file extension**: File must be in `CODE_EXTENSIONS`
3. **Check directory**: File must not be in `SKIP_DIRS`

## Related Plugins

- **Git Auto-Backup** - Auto-commit changes
- **Complexity Monitor** - Track code complexity
- **Session File Tracker** - Summarize file operations

## Technical Details

### Script Locations
- `plugins/hook-todo-collector/scripts/track-todos.js` - Tracks file modifications
- `plugins/hook-todo-collector/scripts/collect-todos.js` - Scans and reports TODOs

### Hook Types
- **PostToolUse** (Write|Edit|NotebookEdit) - Tracks modified files
- **Stop** - Scans tracked files and generates report

### State Files
- `.state/${PROJECT_NAME}-todo-changed-files.json` - Tracks files modified during session
- `.state/${PROJECT_NAME}-todo-state.json` - Stores previous TODO state for change detection

**Note**: State files are project-scoped using the project directory name to prevent conflicts across multiple projects.

### Dependencies
- Node.js

### Timeout
- PostToolUse: 5 seconds
- Stop: 15 seconds

## Contributing

Contributions welcome! Ideas:
- Support for more languages
- Integration with issue trackers
- TODO priority levels
- Aging/staleness detection

## Version

**Current Version**: 1.2.0

## Changelog

### v1.2.0 (2025-10-20)
- 🐛 **Bug Fix**: Improved full scan logic - immediately scan when report file is missing
- 🔄 **Auto Migration**: Plugin version-based configuration migration
- 📦 **Smart Updates**: Preserves user settings while adding new fields
- 🏷️ **Project Scoping**: State files now use project name to prevent conflicts
- ⚡ **Performance**: SessionStart hook exits immediately if config is up-to-date
- 🌍 **Cross-Platform**: Enhanced path handling for Windows/macOS/Linux compatibility
- 🎯 **SessionStart Hook**: Auto-creates configuration file on session start
- ⚙️ **Custom Filtering**: Added `includeDirs` and `includeExtensions` settings
- 🔍 **Full Project Scan**: Automatically scans entire project on first run
- 🔧 **Configuration Refactor**: Moved settings to `.plugin-config/hook-todo-collector.json`

### v1.1.1 (2025-10-18)
- Fixed empty array handling for `outputFormats` configuration

### v1.1.0 (2025-10-18)
- Added project-scoped file naming using project directory name
- Prevents file collisions across multiple projects

### v1.0.0
- Initial release

## License

MIT License - See [LICENSE](../../LICENSE) for details

## Credits

Part of the [Claude Code Developer Utilities](../../README.md) collection.
