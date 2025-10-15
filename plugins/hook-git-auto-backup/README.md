# Git Auto-Backup

> **Language**: [English](README.md) | [한국어](README.ko.md)

Automatically creates git commits after each Claude Code session to prevent work loss.

## Features

- 🔄 Auto-commits all changes when session ends
- ⏰ Timestamped commit messages
- 🎯 Only commits when there are actual changes
- 🛡️ Safe and non-intrusive
- 📝 Clear commit attribution to Claude Code

## How it Works

This plugin uses the **Stop hook** to automatically run when your Claude Code session ends.

1. Check if the directory is a git repository
2. Check if there are uncommitted changes (`git status --porcelain`)
3. If changes exist:
   - Stage all changes (`git add -A`)
   - Create a commit with timestamp
   - Display commit hash in the session

## Installation

```bash
/plugin install hook-git-auto-backup@dev-gom-plugins
```

## Usage

Once installed, the plugin works automatically. No configuration needed!

When you end a Claude Code session, if there are changes, you'll see:

```
✓ Git Auto-Backup: Changes committed successfully (a1b2c3d)
```

## Example Commit Message

```
Auto-backup: 2025-10-14 12:34:56

🤖 Generated with Claude Code Auto-Backup Plugin
```

## Configuration

You can configure the plugin's behavior in the `configuration` section of `hooks/hooks.json`.

### Available Configuration Options

#### `requireGitRepo`
- **Description**: Only run if it's a Git repository
- **Default**: `true`
- **Recommended**: `true` (use only in Git projects)

#### `commitOnlyIfChanges`
- **Description**: Only create commits when there are changes
- **Default**: `true`
- **Recommended**: `true` (prevents empty commits)

#### `includeTimestamp`
- **Description**: Include timestamp in commit message
- **Default**: `true`
- **Recommended**: `true` (track session time)

### How to Change Settings

Edit the `plugins/hook-git-auto-backup/hooks/hooks.json` file:

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node ${CLAUDE_PLUGIN_ROOT}/scripts/backup.js",
            "timeout": 10000
          }
        ]
      }
    ]
  },
  "configuration": {
    "requireGitRepo": true,
    "commitOnlyIfChanges": true,
    "includeTimestamp": true
  }
}
```

### Customizing Commit Message

To change the commit message format, edit the `scripts/backup.js` file:

```javascript
const timestamp = config.includeTimestamp
  ? new Date().toISOString().replace('T', ' ').slice(0, 19)
  : '';

const commitMessage = `Auto-backup: ${timestamp}`;
```

## Hook Output

The plugin follows Claude Code Hook best practices by outputting a single JSON result:

```javascript
console.log(JSON.stringify({
  systemMessage: '✓ Git Auto-Backup: Changes committed successfully (abc1234)',
  continue: true
}));
```

## When the Plugin Runs

- ✅ Session ends normally
- ✅ Session interrupted by Stop hook
- ❌ Does NOT run if not a git repository
- ❌ Does NOT run if no changes detected

## Best Practices

### Recommended .gitignore

Add plugin-generated files to your `.gitignore`:

```gitignore
.todos-report.md
.complexity-log.txt
.docs-summary.md
.session-summary.md
```

### Working with Branches

The plugin commits to your **current branch**. Make sure you're on the correct branch before starting a session:

```bash
git checkout feature-branch
claude
```

### Reverting Auto-Commits

If you need to undo an auto-backup commit:

```bash
git reset --soft HEAD~1
```

## Troubleshooting

### Plugin not creating commits?

1. **Check if it's a git repository**:
   ```bash
   git status
   ```

2. **Verify git user is configured**:
   ```bash
   git config user.name
   git config user.email
   ```

3. **Check plugin is installed**:
   ```bash
   /plugin
   ```

### Commits are too frequent?

This plugin only commits once per session (when you exit). If you want more control, consider:
- Using manual commits during your session
- Squashing auto-backup commits later with `git rebase -i`

## Related Plugins

- **Session File Tracker** - Summarizes file operations
- **TODO Collector** - Tracks TODO comments
- **Complexity Monitor** - Checks code complexity

## Technical Details

### Script Location
`plugins/hook-git-auto-backup/scripts/backup.js`

### Hook Type
`Stop` - Runs when session ends

### Dependencies
- Node.js
- Git

### Timeout
15 seconds

## Contributing

Feel free to customize this plugin:

1. Edit `backup.js` to change commit message format
2. Modify `plugin.json` to change hook behavior
3. Test with `/plugin validate`

## License

MIT License - See [LICENSE](../../LICENSE) for details

## Credits

Part of the [Claude Code Developer Utilities](../../README.md) collection.
