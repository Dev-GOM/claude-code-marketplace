# Claude Code Developer Utilities

> **Language**: [English](README.md) | [한국어](README.ko.md)

![Claude Code Session Log](images/claude-code-session-log.png)

A collection of powerful productivity plugins for Claude Code to automate common development workflows.

## Included Plugins

### 1. 🔄 [Git Auto-Backup](plugins/hook-git-auto-backup/README.md)

Automatically creates git commits after each Claude Code session to prevent work loss.

**Quick Info:** Auto-commits all changes with timestamps when session ends | **Hook:** `Stop`

**[📖 Read Full Documentation →](plugins/hook-git-auto-backup/README.md)**

---

### 2. 📋 [TODO Collector](plugins/hook-todo-collector/README.md)

Scans your entire project and collects all TODO, FIXME, HACK, XXX, NOTE, and BUG comments into a detailed report.

**Quick Info:** Supports multiple languages, generates markdown report | **Hooks:** `PostToolUse` (Write|Edit|NotebookEdit), `Stop`

![TODO Report Example](images/todos-report.png)

**[📖 Read Full Documentation →](plugins/hook-todo-collector/README.md)**

---

### 3. 📊 [Code Complexity Monitor](plugins/hook-complexity-monitor/README.md)

Monitors code complexity metrics and warns when thresholds are exceeded.

**Quick Info:** Tracks cyclomatic complexity, function/file length, nesting depth | **Hook:** `PostToolUse` (Edit|Write)

![Complexity Log Example](images/complexity-log.png)

**[📖 Read Full Documentation →](plugins/hook-complexity-monitor/README.md)**

---

### 4. 📝 [Auto Documentation Updater](plugins/hook-auto-docs/README.md)

Automatically updates project documentation (README.md, CHANGELOG.md) based on code changes.

**Quick Info:** Updates README, maintains CHANGELOG, tracks dependencies | **Hooks:** `PostToolUse` (Write), `Stop`

![Project Structure Example](images/project-structure.png)

**[📖 Read Full Documentation →](plugins/hook-auto-docs/README.md)**

---

### 5. 📊 [Session File Tracker](plugins/hook-session-summary/README.md)

Tracks all file operations during a session and generates a summary report with directory tree visualization.

**Quick Info:** Classifies files by operation type (Created, Modified, Read) | **Hooks:** `PostToolUse` (Write|Edit|Read|NotebookEdit), `Stop`

![Session Summary Example](images/session-summary.png)

**[📖 Read Full Documentation →](plugins/hook-session-summary/README.md)**

## Installation

### Quick Start (Recommended)

1. Add the marketplace in Claude Code:
   ```bash
   /plugin marketplace add https://github.com/Dev-GOM/claude-code-marketplace.git
   ```

2. Install plugins:
   ```bash
   /plugin install hook-git-auto-backup@dev-gom-plugins
   /plugin install hook-todo-collector@dev-gom-plugins
   /plugin install hook-complexity-monitor@dev-gom-plugins
   /plugin install hook-auto-docs@dev-gom-plugins
   /plugin install hook-session-summary@dev-gom-plugins
   ```

3. Restart Claude Code to load the plugins:
   ```bash
   claude
   # or
   claude -r  # Resume last session
   # or
   claude -c  # Continue in current directory
   ```

4. Check plugin installation:
   ```bash
   /plugin
   ```

### Local Installation (For Development)

1. Clone this repository and navigate to it
2. Add the local marketplace:
   ```bash
   /plugin marketplace add dev-gom-plugins ./path/to/.claude-plugin/marketplace.json
   ```
3. Install plugins as shown above

## Usage

Once installed, the plugins work automatically:

- **Git Auto-Backup**: Commits after each Claude session ends
- **TODO Collector**: Scans and reports TODOs when session ends
- **Complexity Monitor**: Checks code after Edit/Write operations
- **Auto-Docs**: Updates documentation when session ends
- **Session File Tracker**: Summarizes file operations when session ends

## Configuration

Each plugin is fully customizable. For detailed configuration options:

- **[Git Auto-Backup Configuration →](plugins/hook-git-auto-backup/README.md#configuration)**
- **[TODO Collector Configuration →](plugins/hook-todo-collector/README.md#configuration)**
- **[Complexity Monitor Configuration →](plugins/hook-complexity-monitor/README.md#configuration)**
- **[Auto-Docs Configuration →](plugins/hook-auto-docs/README.md#configuration)**
- **[Session Tracker Configuration →](plugins/hook-session-summary/README.md#configuration)**

### Quick Examples

**Disable a specific plugin:**
```bash
/plugin uninstall hook-git-auto-backup@dev-gom-plugins
```

**Customize complexity thresholds:**
See [Complexity Monitor Configuration](plugins/hook-complexity-monitor/README.md#configuration)

**Add custom TODO patterns:**
See [TODO Collector Configuration](plugins/hook-todo-collector/README.md#configuration)

## Output Files

The plugins generate the following files in your project root:

- `.todos-report.md` - Detailed TODO report
- `.todos.txt` - Simple TODO list
- `.complexity-log.txt` - Complexity issues log
- `.docs-summary.md` - Documentation update summary
- `.session-summary.md` - Session file operations summary
- `CHANGELOG.md` - Project changelog (created if missing)

**Tip:** Add these to `.gitignore` if you don't want to commit them:

```gitignore
.todos-report.md
.todos.txt
.complexity-log.txt
.docs-summary.md
.session-summary.md
```

## Requirements

- Claude Code CLI
- Node.js (for running plugin scripts)
- Git (for git-auto-backup plugin)

## Troubleshooting

### Plugins not running?

1. Check plugin installation:
   ```bash
   /plugin
   ```

2. Verify hooks are enabled in settings

3. Check Node.js is in PATH:
   ```bash
   node --version
   ```

### Git commits not working?

1. Ensure you're in a git repository:
   ```bash
   git status
   ```

2. Check git is configured:
   ```bash
   git config user.name
   git config user.email
   ```

### Complexity monitor showing false positives?

Adjust thresholds in the plugin configuration file to match your project's needs.

## Development

### For Plugin Developers

Each plugin has detailed technical documentation in its README:
- [Git Auto-Backup Technical Details](plugins/hook-git-auto-backup/README.md#technical-details)
- [TODO Collector Technical Details](plugins/hook-todo-collector/README.md#technical-details)
- [Complexity Monitor Technical Details](plugins/hook-complexity-monitor/README.md#technical-details)
- [Auto-Docs Technical Details](plugins/hook-auto-docs/README.md#technical-details)
- [Session Tracker Technical Details](plugins/hook-session-summary/README.md#technical-details)

## Contributing

Feel free to customize these plugins for your needs:

1. Fork/copy the `.claude-plugin` directory
2. Modify plugin scripts in `plugins/[plugin-name]/`
3. Update `plugin.json` if changing hook behavior
4. Test with `/plugin validate .claude-plugin`

## License

MIT License - feel free to use and modify for your projects.

## Credits

Created for Claude Code to enhance developer productivity through automation.

---

**Happy Coding!** 🚀

For issues or suggestions, please open an issue on GitHub.
