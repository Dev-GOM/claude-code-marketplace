# TODO Collector

> **Language**: [English](README.md) | [한국어](README.ko.md)

Tracks TODO comments in modified files and detects changes during your Claude Code sessions.

## Features

- 🔍 Tracks TODO-style comments in files you modify
- 📊 Supports multiple comment types: TODO, FIXME, HACK, BUG, XXX, NOTE
- 🌐 Works with multiple programming languages (JS, TS, Python, Java, Go, C++, etc.)
- 📝 Generates detailed markdown report: `.todos-report.md` with clickable file links
- 📂 Groups by comment type and file
- 🔄 Detects added and removed TODOs automatically
- ⚡ Only scans files you've modified (performance optimized)
- 🚫 Automatically excludes `node_modules`, `dist`, `build`, and other common directories

## How it Works

This plugin uses **two hooks** for intelligent TODO tracking:

### PostToolUse Hook (`track-todos.js`)
Runs after Write, Edit, or NotebookEdit operations:
1. Captures the file path that was modified
2. Records it in a tracking file (`.state/todo-changed-files.json`)
3. Only tracks files with valid extensions for TODO scanning

### Stop Hook (`collect-todos.js`)
Runs when your Claude Code session ends:
1. Loads the list of files modified during the session
2. If no files were modified, exits silently (no scan needed)
3. Scans only the modified files for TODO-style comments
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

You can configure the plugin's behavior in the `configuration` section of `hooks/hooks.json`.

### Available Configuration Options

#### `outputDirectory`
- **Description**: Directory path to save report files
- **Default**: `""` (project root)
- **Example**: `"docs"`, `".claude-output"`

#### `commentTypes`
- **Description**: List of comment types to search for
- **Default**: `["TODO", "FIXME", "HACK", "BUG", "XXX", "NOTE"]`
- **Example**: `["TODO", "FIXME", "IMPORTANT", "REVIEW"]`

#### `outputFormats`
- **Description**: List of report files to generate
- **Default**: `[".todos-report.md", ".todos.txt"]`
- **Example**: `[".todos-report.md"]` (markdown only)

#### `supportedExtensions`
- **Description**: List of file extensions to scan
- **Default**: `[".js", ".jsx", ".ts", ".tsx", ".py", ".java", ".go", ".c", ".cpp", ".rs", ".rb", ".php", ".swift"]`
- **Example**: Add/remove extensions from the array

#### `excludeDirs`
- **Description**: List of directories to exclude from scanning
- **Default**: `["node_modules", "dist", "build", ".git", "coverage", ".next"]`
- **Example**: Add directories to the array

### How to Change Settings

Edit the `plugins/hook-todo-collector/hooks/hooks.json` file:

```json
{
  "hooks": { ... },
  "configuration": {
    "outputDirectory": "",
    "commentTypes": ["TODO", "FIXME", "HACK", "BUG", "XXX", "NOTE", "IMPORTANT"],
    "outputFormats": [".todos-report.md", ".todos.txt"],
    "supportedExtensions": [
      ".js", ".jsx", ".ts", ".tsx",
      ".py", ".java", ".go", ".c", ".cpp",
      ".rs", ".rb", ".php", ".swift",
      ".kt", ".scala"
    ],
    "excludeDirs": [
      "node_modules", "dist", "build",
      ".git", "coverage", ".next",
      "vendor", "target"
    ]
  }
}
```

### Configuration Priority

The `outputDirectory` is determined in this order:
1. `configuration.outputDirectory` in `hooks.json`
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
- `.state/todo-changed-files.json` - Tracks files modified during session
- `.state/todo-state.json` - Stores previous TODO state for change detection

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

## License

MIT License - See [LICENSE](../../LICENSE) for details

## Credits

Part of the [Claude Code Developer Utilities](../../README.md) collection.
