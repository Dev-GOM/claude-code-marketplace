# Session File Tracker

> **Language**: [English](README.md) | [한국어](README.ko.md)

> Tracks all file operations during a Claude Code session and generates a summary report.

## Features

- 📊 Tracks all Read/Write/Edit operations in real-time
- 📁 Generates directory tree visualization
- ✓ Classifies files by operation type (Created, Modified, Read)
- 🔍 Two-stage tracking for maximum reliability
- 📝 Creates `.session-summary.md` report
- 🚀 Silent tracking (no interruptions during work)

## How it Works

This plugin uses a **three-stage tracking approach** for maximum reliability:

### Stage 0: Configuration Initialization (SessionStart Hook)
- Runs at session start
- Reads plugin version from `plugin.json`
- Checks if configuration file exists at `.plugin-config/hook-session-summary.json`
- Performs automatic migration if versions differ
- Creates configuration with default settings if doesn't exist

### Stage 1: Real-time Tracking (PostToolUse Hook)
- Runs after every `Write`, `Edit`, `Read`, `NotebookEdit` operation
- Records file path and operation type
- Accumulates operations in `.session-operations.json`

### Stage 2: Summary Generation (Stop Hook)
- Runs when Claude Code session ends
- Reads accumulated operations from `.session-operations.json`
- Classifies files by operation type:
  - **Write** → Created/Updated ✓
  - **Edit** → Modified ✓
  - **Read** → Read 📖
- Converts to directory tree structure
- Saves summary to `.session-summary.md`
- Cleans up tracking file for next session

## Installation

```bash
/plugin install hook-session-summary@dev-gom-plugins
```

## Usage

This plugin runs automatically. Each time you end a session, a `.session-summary.md` file will be created in the project root.

When your session ends:

```
📊 Session Summary: 9 files tracked (2 created/updated, 5 modified, 2 read). Saved to .session-summary.md
```

## Example Output

### .session-summary.md (Detailed Report)

```markdown
# Session Summary

**Total Files**: 9
- Created/Updated: 2
- Modified: 5
- Read: 2

## Files Modified

claude-code-marketplace/
├── plugins/
│   ├── hook-todo-collector/scripts/collect-todos.js [Modified ✓]
│   ├── hook-complexity-monitor/scripts/check-complexity.js [Modified ✓]
│   ├── hook-git-auto-backup/scripts/backup.js [Modified ✓]
│   └── hook-auto-docs/scripts/update-docs.js [Modified ✓]
├── test/
│   ├── hook-test.js [Modified ✓]
│   ├── test.js [Created/Updated ✓]
│   └── test.py [Created/Updated ✓]
├── HOOK_OUTPUT_BEHAVIOR.md [Created/Updated ✓]
└── README.md [Modified ✓]

*Generated: 2025-10-14 12:34:56*
```

## Hook Input/Output

### PostToolUse Hook Input

Receives tool usage information after each file operation:

```json
{
  "tool_name": "Write",
  "tool_input": {
    "file_path": "/path/to/file.js",
    "content": "..."
  },
  "hook_event_name": "PostToolUse"
}
```

The `track-operation.js` script:
1. Extracts file path and operation type
2. Appends to `.session-operations.json`
3. Returns silently (no user message)

### Stop Hook

The `session-summary.js` script:
1. Reads `.session-operations.json`
2. Generates directory tree summary
3. Saves to `.session-summary.md`
4. Deletes tracking file for next session
5. Shows completion message to user

### Supported Tools

- `Write` - Creates new file or overwrites entire file
- `Edit` - Modifies part of existing file
- `Read` - Reads file (no modifications)
- `NotebookEdit` - Edits Jupyter notebook cells

## Configuration

The plugin automatically creates a configuration file at `.plugin-config/hook-session-summary.json` on first run.

### Automatic Configuration Migration

When you update the plugin, your settings are automatically migrated:
- ✅ **Preserves your custom settings**
- ✅ **Adds new configuration fields** with default values
- ✅ **Version tracked** via `_pluginVersion` field
- ✅ **Zero manual intervention** required

### Available Configuration Options

#### `showLogs`
- **Description**: Show session summary messages in console
- **Default**: `false`
- **Example**: `true` (show file tracking confirmations)

#### `outputDirectory`
- **Description**: Directory path to save summary file
- **Default**: `""` (project root)
- **Example**: `"docs/sessions"`, `".claude-sessions"`

#### `outputFile`
- **Description**: Session summary filename
- **Default**: `".session-summary.md"`
- **Example**: `"session-report.md"`

#### `trackedTools`
- **Description**: List of tools to track
- **Default**: `["Write", "Edit", "Read", "NotebookEdit"]`
- **Example**: `["Write", "Edit"]` (track only Write and Edit)

#### `operationPriority`
- **Description**: Priority for multiple operations on same file
- **Default**: `["Write", "Edit", "Read"]`
- **Description**: Write > Edit > Read priority order

#### `includeTimestamp`
- **Description**: Include timestamp in summary
- **Default**: `true`

#### `treeVisualization`
- **Description**: Display as directory tree
- **Default**: `true`

#### `statistics`
- **Description**: Statistics display options
- **Default**:
  ```json
  {
    "totalFiles": true,
    "byOperationType": true,
    "byFileExtension": false
  }
  ```

### How to Change Settings

Edit the `plugins/hook-session-summary/hooks/hooks.json` file:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit|Read|NotebookEdit",
        "hooks": [
          {
            "command": "node ${CLAUDE_PLUGIN_ROOT}/scripts/track-operation.js",
            "timeout": 5000
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "command": "node ${CLAUDE_PLUGIN_ROOT}/scripts/session-summary.js",
            "timeout": 10000
          }
        ]
      }
    ]
  },
  "configuration": {
    "outputDirectory": ".claude-sessions",
    "outputFile": ".session-summary.md",
    "trackedTools": ["Write", "Edit", "Read", "NotebookEdit"],
    "operationPriority": ["Write", "Edit", "Read"],
    "includeTimestamp": true,
    "treeVisualization": true,
    "statistics": {
      "totalFiles": true,
      "byOperationType": true,
      "byFileExtension": false
    }
  }
}
```

### Configuration Priority

The `outputDirectory` is determined in this order:
1. `configuration.outputDirectory` in `hooks.json`
2. Environment variable `SESSION_SUMMARY_DIR`
3. Environment variable `CLAUDE_PLUGIN_OUTPUT_DIR`
4. Default (project root)

## File Operation Classification

The plugin classifies file operations as follows:

| Tool | Operation Type | Icon |
|------|----------------|------|
| Write | Created/Updated | ✓ |
| Edit | Modified | ✓ |
| Read | Read | 📖 |
| NotebookEdit | Modified | ✓ |

## Performance

- **Real-time tracking**: Minimal overhead per file operation (< 50ms)
- **In-memory accumulation**: Uses JSON file for persistence
- **Fast summary generation**: < 1 second even for large sessions
- **Handles large sessions**: Processes hundreds of file operations efficiently

## Best Practices

### Add to .gitignore

```gitignore
.session-summary.md
.session-operations.json
```

### Session Review

Use session summary to review your work:
- Verify only intended files were modified
- Catch accidentally modified files
- Document scope of work

### Use with Git Commit Messages

Reference session summary for better commit messages:

```bash
# Review session summary
cat .session-summary.md

# Use it to write commit message
git commit -m "Update hook plugins output format

- Modified 4 hook scripts to use single JSON output
- Created HOOK_OUTPUT_BEHAVIOR.md documentation
- Updated README with development guidelines
"
```

## Limitations

- **Tracks Claude Code tools only**: Files modified via Bash commands are not tracked
- **Priority**: When multiple operations on same file, priority is Write > Edit > Read
- **Session-based tracking**: Tracking file is cleared at end of each session

## Troubleshooting

### Plugin not generating summary?

1. **Check PostToolUse hook**:
   Ensure `track-operation.js` is running after file operations

2. **Verify tracking file**:
   Check if `.session-operations.json` exists during session

3. **Check file permissions**:
   Ensure plugin can write to project root

### Some file operations missing?

This plugin only tracks operations recorded by Claude Code:
- ✅ Read, Write, Edit, NotebookEdit tools
- ❌ Files modified via Bash commands
- ❌ Files modified by external editors

### Debugging

Check `.session-operations.json` during your session to see what's being tracked:

```bash
cat .session-operations.json
```

This file accumulates operations in real-time and should contain entries like:

```json
{
  "/path/to/file.js": ["Write", "Edit"],
  "/path/to/other.py": ["Read"]
}
```

## Related Plugins

- **Git Auto-Backup** - Auto-commit at session end
- **TODO Collector** - Collect TODO comments
- **Complexity Monitor** - Monitor code complexity

## Technical Details

### Script Locations
- `~/.claude/plugins/marketplaces/dev-gom-plugins/plugins/hook-session-summary/scripts/init-config.js` - Configuration initialization
- `~/.claude/plugins/marketplaces/dev-gom-plugins/plugins/hook-session-summary/scripts/track-operation.js` - Real-time tracking
- `~/.claude/plugins/marketplaces/dev-gom-plugins/plugins/hook-session-summary/scripts/session-summary.js` - Summary generation

### Hook Types
- **SessionStart** - Initializes configuration on session start
- **PostToolUse** - Tracks file operations in real-time
- **Stop** - Generates summary when session ends

### Dependencies
- Node.js

### Timeouts
- PostToolUse: 5 seconds
- Stop: 10 seconds

### Temporary Files
- `.session-operations.json` - Accumulates operations during session (deleted at end)

## Future Improvements

Ideas for contributions:
- Session time tracking
- Code change statistics (lines added/removed)
- Trend analysis across multiple sessions
- HTML report generation
- Automatic commit message suggestions

## Version

**Current Version**: 1.1.1

## Changelog

### v1.1.1 (2025-10-20)
- 🔄 **Auto Migration**: Plugin version-based configuration migration
- 📦 **Smart Updates**: Preserves user settings while adding new fields
- 🏷️ **Project Scoping**: Output files now use project name to prevent conflicts
- 🎯 **SessionStart Hook**: Auto-creates configuration file on session start
- ⚡ **Performance**: SessionStart hook exits immediately if config is up-to-date
- 🌍 **Cross-Platform**: Enhanced path handling for Windows/macOS/Linux compatibility

### v1.0.0
- Initial release

## Contributing

Pull requests welcome! See [CONTRIBUTING.md](../../CONTRIBUTING.md)

## License

MIT License - See [LICENSE](../../LICENSE) for details

## Credits

Part of the [Claude Code Developer Utilities](../../README.md) collection.
