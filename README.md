# Claude Code Plugins

> **Language**: [English](README.md) | [한국어](README.ko.md)

<details>
<summary><strong>📋 Changelog</strong> (Click to expand)</summary>

### Spec-Kit Integration

#### v1.6.0 (2025-10-18)
- 🤝 **Interactive User Prompts**: All commands now use AskUserQuestion for better user interaction
- 🔄 **Update Mode Selection**: specify, plan, and tasks commands prompt users to choose between Full Regeneration or Incremental Update
- ⚠️ **Smart Warnings**: implement command warns about Open Questions and offers to run clarify first
- 📋 **Issue Prioritization**: clarify command lets users select which ambiguous items to address first
- 🎯 **Improved UX**: Visual option cards with clear descriptions replace text-based prompts

#### v1.5.0 (2025-10-18)
- 📊 **Project Status Display**: When canceling re-initialization, displays current project structure and progress
- 🗺️ **Smart Navigation**: Analyzes existing files (constitution, specification, plan, tasks) and recommends next steps
- 🎯 **Context-Aware Guidance**: Shows completed stages and suggests appropriate next command
- 💡 **Workflow Clarity**: Helps users understand where they are in the SDD workflow

#### v1.4.0 (2025-10-18)
- 🔄 **Re-initialization Check**: `/spec-kit:init` now detects existing installations and asks user confirmation before re-initializing
- 📝 **Command Arguments Support**: All commands now accept `$ARGUMENTS` for user input
- 🏷️ **Argument Hints**: Added bilingual (English/Korean) argument hints to all commands for better UX
- 🌐 **Enhanced User Input**: Commands can now be invoked with inline arguments (e.g., `/spec-kit:specify Add user authentication`)

#### v1.3.0 (2025-10-18)
- 🔄 **Update Mode Selection**: All core commands now detect existing files and offer two update options
- 📋 **Full Regeneration**: Complete rewrite from scratch when requirements drastically change
- ✏️ **Incremental Update**: Merge-based updates for targeted changes
- 📖 **Iterative Workflow Documentation**: Comprehensive guide on when and how to update earlier stages
- 🎯 **Context Preservation**: Re-running commands maintains conversation history and change rationale
- ⚡ **Cascade Updates**: Clear guidance on updating downstream stages after changes

#### v1.2.0 (2025-10-18)
- ✨ **Smart Prerequisite Checks**: Automatic Open Questions detection in `/spec-kit:plan`, `/spec-kit:tasks`, and `/spec-kit:implement` commands
- 🎨 **Unified Commit Flow**: Single decision point with 3 clear options (quality gate + commit / direct commit / skip)
- 📋 **Better UX**: Context-appropriate guidance for each commit option
- 🛡️ **Error Prevention**: Warns about unclear requirements before proceeding
- 📖 **Documentation**: Added comprehensive "Smart Prerequisite Checks" section to READMEs

#### v1.1.0 (2025-10-17)
- ✨ **Token Efficiency**: Implemented two-layer architecture with draft files
- 🚀 **Performance**: Reduced token usage by using file paths instead of full content
- 📁 **Draft System**: All commands now create reusable draft files in `.specify/temp/`
- 📝 **Instructions**: Added precise instructions for each command to skip redundant steps
- 🌐 **Multi-language**: Enhanced system language detection for all commands

#### v1.0.0 (2025-10-16)
- 🎉 Initial release
- 📋 10 slash commands for complete SDD workflow
- 🔧 Integration with GitHub Spec-Kit CLI

---

### AI Pair Programming Suite

#### v1.0.0 (2025-10-15)
- 🎉 Initial release
- 💬 5 slash commands: `/pair`, `/review`, `/suggest`, `/fix`, `/explain`
- 🤖 4 expert agents: `@code-reviewer`, `@bug-hunter`, `@architect`, `@performance-expert`
- 🔔 3 intelligent hooks: Code review on Edit/Write, bug detection, session summary
- 🎨 Configuration system for all plugins

---

### TODO Collector

#### v1.0.0 (2025-10-14)
- 🎉 Initial release
- 🔗 Clickable file links in TODO reports
- 📝 Multiple comment types support (TODO, FIXME, HACK, XXX, NOTE, BUG)
- 📊 Detailed markdown reports with statistics
- 🎯 Skip markdown headers to avoid false positives
- 🌐 Multi-language support

---

### Hook Plugins (Git Auto-Backup, Complexity Monitor, Auto-Docs, Session Summary)

#### v1.1.0 (2025-10-18) - Complexity Monitor, Session Summary, TODO Collector
- 📛 **Project-Named Output Files**: All generated files now include project name to prevent conflicts across multiple projects
- 🏷️ **File Naming**: Changed from `.complexity-log.md` to `.{project-name}-complexity-log.md` (same for all hooks)
- 🔀 **Multi-Project Support**: Work on multiple projects simultaneously without file collisions
- 📁 **State Isolation**: Each project's tracking files are now separate in plugin `.state` directory

#### v1.0.0 (2025-10-14)
- 🎉 Initial release
- 🔄 **Git Auto-Backup**: Automatic git commits after sessions
- 📊 **Complexity Monitor**: Code complexity tracking with configurable thresholds
- 📝 **Auto-Docs**: Automatic project structure documentation
- 📋 **Session Summary**: Track all file operations during sessions
- ⚙️ Configurable via `.plugin-config/` files
- 🔇 Optional log suppression with `showLogs` setting

---

### Auto-Docs

#### v1.3.0 (2025-10-18)
- 📄 **File Extension Filtering**: Added `includeExtensions` and `excludeExtensions` configuration options
- 🎯 **Selective File Inclusion**: Include only specific file types (e.g., `.js`, `.ts`, `.json`)
- 🚫 **File Type Exclusion**: Exclude unwanted file types (e.g., `.meta`, `.log`, `.tmp`)
- 🔧 **Flexible Configuration**: Specify extensions with or without dot (`.meta` or `meta`)
- 📋 **AND Condition**: Both filters work together for fine-grained control (include first, then exclude)
- 💡 **Use Cases**: Focus on source code only, exclude build artifacts, hide metadata files

#### v1.2.0 (2025-10-18)
- 📛 **Project-Named Output Files**: Generated files now include project name (`.{project-name}-project-structure.md`)
- 🔀 **Multi-Project Support**: Work on multiple projects simultaneously without file collisions
- 📁 **State Isolation**: Project-specific state files in plugin directory

#### v1.1.0 (2025-10-18)
- 📁 **Selective Directory Scanning**: Added `includeDirs` configuration to scan only specific directories
- 🎯 **Focused Documentation**: Generate project structure for selected folders instead of entire project
- ⚙️ **Configuration Priority**: `includeDirs` takes precedence over `excludeDirs` when set
- 📚 **Large Project Support**: Useful for documenting specific parts of large codebases
- 🌐 **Multi-language Documentation**: Updated both English and Korean READMEs

---

### Unity Dev Toolkit

#### v1.2.0 (2025-10-18)
- 🎨 **UI Toolkit Templates**: Added complete UI Toolkit templates for both Editor and Runtime (6 files total)
- 📝 **Editor Templates**: EditorWindow with UXML/USS (C#, UXML, USS)
- 🎮 **Runtime Templates**: UIDocument for game UI with UXML/USS (C#, UXML, USS)
- ⚡ **New Skill**: Added `unity-uitoolkit` skill for UI Toolkit development assistance
- 📚 **Template Count**: Increased from 7 to 10 production-ready templates
- 🔗 **Cross-References**: Updated Skills to reference new UI Toolkit capabilities

#### v1.1.0 (2025-10-18)
- 🤖 **New Agent**: Added `@unity-refactor` agent for code refactoring and quality improvement
- 📝 **Skills Enhancement**: Added "When to Use vs Other Components" sections to all Skills
- 🔗 **Component Integration**: Clear guidance on when to use Skills vs Agents vs Commands
- 📚 **Documentation**: Improved cross-component references and usage patterns

#### v1.0.1 (2025-10-18)
- 📝 **Skill Documentation Optimization**: Simplified SKILL.md files (834 → 197 lines, 76% reduction)
- 🎯 **Progressive Disclosure**: Applied best practices for concise skill documentation
- 🗑️ **Removed Redundancy**: Eliminated "When to Use This Skill" sections (skill activation is determined by description field)
- ⚡ **Token Efficiency**: Reduced context size for faster skill loading and activation

#### v1.0.0 (2025-10-18)
- 🎉 Initial release
- 📝 3 slash commands: `/unity:new-script`, `/unity:optimize-scene`, `/unity:setup-test`
- 🤖 3 expert agents: `@unity-scripter`, `@unity-performance`, `@unity-architect` (expanded to 4 in v1.1.0)
- ⚡ 4 Agent Skills: `unity-script-validator`, `unity-scene-optimizer`, `unity-template-generator`, `unity-ui-selector` (expanded to 5 in v1.2.0)
- 📄 Production-ready templates for MonoBehaviour, ScriptableObject, Editor, and Test scripts

</details>

> **⚠️ Important Notice (v2.0.17)**
> There is a known issue where hook logs stack in the chat window. Until this is resolved, PostToolUse hook outputs are hidden using `suppressOutput: true` in hooks.json. Stop hook messages can be controlled via `.plugin-config/[plugin-name].json` with `"showLogs": false` (default). Set to `true` to enable. See [Configuration](#configuration) for details.

A collection of powerful productivity plugins for Claude Code to automate common development workflows.

![Claude Code Session Log](images/claude-code-session-log.png)

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

### 4. 📝 [Auto Documentation Generator](plugins/hook-auto-docs/README.md)

Automatically scans and documents your project structure with directory tree, scripts, and dependencies.

**Quick Info:** Generates project structure documentation, tracks file changes, extracts package.json info | **Hooks:** `PostToolUse` (Write), `Stop`

![Project Structure Example](images/project-structure.png)

**[📖 Read Full Documentation →](plugins/hook-auto-docs/README.md)**

---

### 5. 📊 [Session File Tracker](plugins/hook-session-summary/README.md)

Tracks all file operations during a session and generates a summary report with directory tree visualization.

**Quick Info:** Classifies files by operation type (Created, Modified, Read) | **Hooks:** `PostToolUse` (Write|Edit|Read|NotebookEdit), `Stop`

![Session Summary Example](images/session-summary.png)

**[📖 Read Full Documentation →](plugins/hook-session-summary/README.md)**

---

### 6. 🤖 [AI Pair Programming Suite](plugins/ai-pair-programming/README.md)

Complete AI pair programming experience with slash commands, expert agents, and intelligent hooks integrated together.

**Quick Info:** 5 slash commands + 4 expert agents + 3 intelligent hooks | **Commands:** `/pair`, `/review`, `/suggest`, `/fix`, `/explain` | **Agents:** `@code-reviewer`, `@bug-hunter`, `@architect`, `@performance-expert`

**[📖 Read Full Documentation →](plugins/ai-pair-programming/README.md)**

---

### 7. 📋 [Spec-Kit Integration](plugins/spec-kit/README.md)

[GitHub Spec-Kit](https://github.com/github/spec-kit) integration for Specification-Driven Development (SDD). Define WHAT and HOW before coding.

**Quick Info:** 10 slash commands for structured development workflow | **Commands:** `/spec-kit:init`, `/spec-kit:constitution`, `/spec-kit:specify`, `/spec-kit:plan`, `/spec-kit:tasks`, `/spec-kit:implement` | **Workflow:** Constitution → Specification → Plan → Tasks → Implementation

**[📖 Read Full Documentation →](plugins/spec-kit/README.md)**

---

### 8. 🎮 [Unity Dev Toolkit](plugins/unity-dev-toolkit/README.md)

Comprehensive Unity game development toolkit with intelligent scripting assistance, code refactoring, performance optimization, and UI Toolkit support.

**Quick Info:** 4 expert agents + 5 Agent Skills + 3 slash commands + 10 production templates | **Commands:** `/unity:new-script`, `/unity:optimize-scene`, `/unity:setup-test` | **Agents:** `@unity-scripter`, `@unity-refactor`, `@unity-performance`, `@unity-architect` | **Features:** UI Toolkit templates (Editor + Runtime), automated code validation, scene optimization

**[📖 Read Full Documentation →](plugins/unity-dev-toolkit/README.md)**

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
   /plugin install ai-pair-programming@dev-gom-plugins
   /plugin install spec-kit@dev-gom-plugins
   /plugin install unity-dev-toolkit@dev-gom-plugins
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
- **AI Pair Programming Suite**: Provides intelligent assistance with commands, agents, and hooks
- **Spec-Kit Integration**: Use `/spec-kit:*` commands to guide specification-driven development workflow
- **Unity Dev Toolkit**: Use `/unity:*` commands, invoke expert agents with `@unity-*`, and get automatic script validation through Agent Skills

## Configuration

### Plugin-Specific Settings

Each plugin automatically creates a configuration file in `.plugin-config/[plugin-name].json` when first run. These files are preserved across plugin updates.

**Common settings:**
- `showLogs`: Control Stop hook log visibility (`false` by default to reduce chat clutter)

**Example** - Enable logs for TODO Collector:

Create or edit `.plugin-config/hook-todo-collector.json`:
```json
{
  "showLogs": true,
  "outputDirectory": "",
  "supportedExtensions": null,
  "excludeDirs": null,
  "commentTypes": null,
  "outputFormats": null
}
```

For detailed configuration options:

- **[Git Auto-Backup Configuration →](plugins/hook-git-auto-backup/README.md#configuration)**
- **[TODO Collector Configuration →](plugins/hook-todo-collector/README.md#configuration)**
- **[Complexity Monitor Configuration →](plugins/hook-complexity-monitor/README.md#configuration)**
- **[Auto-Docs Configuration →](plugins/hook-auto-docs/README.md#configuration)**
- **[Session Tracker Configuration →](plugins/hook-session-summary/README.md#configuration)**
- **[AI Pair Programming Configuration →](plugins/ai-pair-programming/README.md#configuration)**
- **[Spec-Kit Documentation →](plugins/spec-kit/README.md)**

### Quick Examples

**Disable a specific plugin:**
```bash
/plugin uninstall hook-git-auto-backup@dev-gom-plugins
```

**Enable hook logs for a specific plugin:**
Edit `.plugin-config/[plugin-name].json` and set `"showLogs": true`

**Customize complexity thresholds:**
See [Complexity Monitor Configuration](plugins/hook-complexity-monitor/README.md#configuration)

**Add custom TODO patterns:**
See [TODO Collector Configuration](plugins/hook-todo-collector/README.md#configuration)

## Output Files

The plugins generate the following files in your project root:

- `.todos-report.md` - Detailed TODO report
- `.todos.txt` - Simple TODO list
- `.complexity-log.txt` - Complexity issues log
- `.project-structure.md` - Project structure documentation
- `.session-summary.md` - Session file operations summary
- `.pair-programming-session.md` - AI pair programming session report

**Plugin configuration files** (auto-generated in project root):

- `.plugin-config/` - Plugin-specific configuration files (preserves settings across plugin updates)

**Tip:** Add output files to `.gitignore` if you don't want to commit them. Configuration files in `.plugin-config/` should be committed to share settings with your team:

```gitignore
# Plugin output files
.todos-report.md
.todos.txt
.complexity-log.txt
.project-structure.md
.structure-state.json
.structure-changes.json
.session-summary.md
.pair-programming-session.md
.state/

# Optional: Uncomment to exclude plugin configs (if you don't want to share settings)
# .plugin-config/
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
- [AI Pair Programming Technical Details](plugins/ai-pair-programming/README.md#how-it-works)
- [Spec-Kit Integration Guide](plugins/spec-kit/README.md)

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
