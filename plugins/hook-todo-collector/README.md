# TODO Collector

> **Language**: [English](README.md) | [한국어](README.ko.md)

Scans your entire project and collects all TODO, FIXME, HACK, XXX, NOTE, and BUG comments.

## Features

- 🔍 Scans all source files for TODO-style comments
- 📊 Supports multiple comment types: TODO, FIXME, HACK, BUG, XXX, NOTE
- 🌐 Works with multiple programming languages (JS, TS, Python, Java, Go, C++, etc.)
- 📝 Generates two report formats:
  - `.todos-report.md` - Detailed markdown report with clickable file links
  - `.todos.txt` - Simple text list
- 📂 Groups by comment type and file
- 🚫 Automatically excludes `node_modules`, `dist`, `build`, and other common directories
- ⚡ Only runs when there are changes

## How it Works

This plugin uses the **Stop hook** to run when your Claude Code session ends.

1. Check if there are uncommitted changes (`git status --porcelain`)
2. If no changes, skip scanning (performance optimization)
3. Walk through project directory recursively
4. Scan files for TODO-style comments using regex patterns
5. Extract comment text and location (file, line number)
6. Group and sort by type and file
7. Generate reports with clickable file links
8. Display summary in session

## Installation

```bash
/plugin install hook-todo-collector@dev-gom-plugins
```

## Usage

Once installed, the plugin works automatically. When your session ends:

```
📋 TODO Collector found 12 item(s) (TODO: 5, FIXME: 3, BUG: 2, HACK: 1, NOTE: 1). Report saved to .todos-report.md
```

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

The plugin is optimized for performance:
- **Skips scanning** if no changes detected
- **Excludes** common build/dependency directories
- **Streams files** instead of loading all into memory
- **Typical scan time**: < 2 seconds for projects with 1000+ files

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

1. **Check for changes**:
   ```bash
   git status
   ```
   The plugin only runs when there are changes.

2. **Verify plugin is installed**:
   ```bash
   /plugin
   ```

3. **Check file permissions**:
   Ensure the plugin can write to project root.

### Missing some TODOs?

1. **Check comment format**: Must match the regex patterns
2. **Check file extension**: File must be in `CODE_EXTENSIONS`
3. **Check directory**: File must not be in `SKIP_DIRS`

## Related Plugins

- **Git Auto-Backup** - Auto-commit changes
- **Complexity Monitor** - Track code complexity
- **Session File Tracker** - Summarize file operations

## Technical Details

### Script Location
`plugins/hook-todo-collector/scripts/collect-todos.js`

### Hook Type
`Stop` - Runs when session ends

### Dependencies
- Node.js
- Git (for change detection)

### Timeout
15 seconds

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
