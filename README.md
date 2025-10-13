# Claude Code Developer Utilities

> **Language**: [English](README.md) | [한국어](README.ko.md)

A collection of powerful productivity plugins for Claude Code to automate common development workflows.

## Included Plugins

### 1. Git Auto-Backup
Automatically creates git commits after each Claude Code session to prevent work loss.

**Features:**
- Auto-commits all changes when session ends
- Timestamped commit messages
- Only commits when there are actual changes
- Safe and non-intrusive

**Hook:** `stop`

### 2. TODO Collector
Scans your entire project and collects all TODO, FIXME, HACK, XXX, NOTE, and BUG comments.

**Features:**
- Supports multiple programming languages
- Generates detailed markdown report
- Groups by comment type and file
- Creates both `.todos-report.md` and `.todos.txt`
- Excludes `node_modules` and build directories

**Hook:** `stop`

### 3. Code Complexity Monitor
Monitors code complexity metrics and warns when thresholds are exceeded.

**Features:**
- Calculates cyclomatic complexity
- Checks function and file length
- Monitors nesting depth
- Logs issues to `.complexity-log.txt`
- Real-time feedback after code changes

**Thresholds:**
- Cyclomatic Complexity: 10
- Function Length: 50 lines
- File Length: 500 lines
- Nesting Depth: 4 levels

**Hook:** `postToolUse` (Edit|Write)

### 4. Auto Documentation Updater
Automatically updates project documentation based on code changes.

**Features:**
- Updates README.md with project info
- Maintains CHANGELOG.md
- Tracks dependencies and scripts
- Generates documentation summary
- Auto-generated sections clearly marked

**Hook:** `stop`

## Installation

### Method 1: Local Installation (Recommended for Development)

1. Copy the `.claude-plugin` directory to your project root:
   ```bash
   # From your project directory
   cp -r /path/to/this/.claude-plugin ./
   ```

2. Install the marketplace in Claude Code:
   ```bash
   # In Claude Code
   /plugin marketplace add developer-utilities ./.claude-plugin/marketplace.json
   ```

3. Install individual plugins:
   ```bash
   /plugin install git-auto-backup@developer-utilities
   /plugin install todo-collector@developer-utilities
   /plugin install complexity-monitor@developer-utilities
   /plugin install auto-docs@developer-utilities
   ```

### Method 2: GitHub Installation

1. Push this repository to GitHub

2. Add the marketplace:
   ```bash
   /plugin marketplace add developer-utilities https://github.com/YOUR_USERNAME/YOUR_REPO
   ```

3. Install plugins as shown above

## Usage

Once installed, the plugins work automatically:

- **Git Auto-Backup**: Commits after each Claude session ends
- **TODO Collector**: Scans and reports TODOs when session ends
- **Complexity Monitor**: Checks code after Edit/Write operations
- **Auto-Docs**: Updates documentation when session ends

## Configuration

### Customize Complexity Thresholds

Edit `.claude-plugin/plugins/complexity-monitor/check-complexity.js`:

```javascript
const THRESHOLDS = {
  cyclomaticComplexity: 15,  // Your custom value
  functionLength: 100,       // Your custom value
  fileLength: 1000,         // Your custom value
  nesting: 5                // Your custom value
};
```

### Customize TODO Patterns

Edit `.claude-plugin/plugins/todo-collector/collect-todos.js`:

```javascript
const TODO_PATTERNS = [
  // Add your custom patterns
  /\/\/\s*(IMPORTANT|REVIEW)[\s:]+(.+)/gi,
];
```

### Disable Specific Plugins

```bash
/plugin uninstall git-auto-backup@developer-utilities
```

## Output Files

The plugins generate the following files in your project root:

- `.todos-report.md` - Detailed TODO report
- `.todos.txt` - Simple TODO list
- `.complexity-log.txt` - Complexity issues log
- `.docs-summary.md` - Documentation update summary
- `CHANGELOG.md` - Project changelog (created if missing)

**Tip:** Add these to `.gitignore` if you don't want to commit them:

```gitignore
.todos-report.md
.todos.txt
.complexity-log.txt
.docs-summary.md
```

## Requirements

- Claude Code CLI
- Node.js (for running plugin scripts)
- Git (for git-auto-backup plugin)

## Troubleshooting

### Plugins not running?

1. Check plugin installation:
   ```bash
   /plugin list
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
