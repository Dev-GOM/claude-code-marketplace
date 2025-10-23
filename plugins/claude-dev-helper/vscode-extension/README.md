# Claude Dev Helper

A comprehensive development assistant for Claude Code users - providing inline code review tools and more!

## Overview

Claude Dev Helper is an extensible VS Code extension designed to enhance your development workflow when using Claude Code. Currently focused on git change review capabilities, this extension will evolve to include additional development assistance features in future releases.

## Features

### Current Features

- **Inline Accept/Reject Buttons**: See CodeLens buttons above each changed code block - just like Cursor!
- **Per-Change Control**: Accept or reject individual changes with precision
- **Bulk Actions**: Accept or reject all changes at once for faster workflows
- **Git Integration**: Uses native Git commands for reliable staging/discarding

### Coming Soon

- Additional development assistance tools
- Enhanced code review capabilities
- More productivity features for Claude Code users

## Usage

1. When Claude Code modifies a file, this extension automatically detects unstaged changes
2. CodeLens buttons appear above each change:
   - `✓ Accept` - Stage the change
   - `✗ Reject` - Discard the change
3. Click the buttons to accept or reject changes inline

## Requirements

- VS Code 1.80.0 or higher
- Git must be installed and initialized in your workspace
- Works best with [Claude Code](https://claude.com/code)

## Extension Settings

This extension contributes the following settings:

* `claudeDevHelper.enabled`: Enable/disable inline accept/reject buttons (default: `true`)
* `claudeDevHelper.autoShowDiff`: Automatically show diff view when files are modified (default: `true`)

## Known Limitations

- Currently, rejecting a change reverts the entire file (not just the specific lines)
- Line-level git operations are planned for future releases

## Release Notes

### 0.1.0

Initial release:
- Inline CodeLens for accept/reject
- Git integration for staging/discarding
- Basic change detection

## License

MIT

## Author

Dev GOM
