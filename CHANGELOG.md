# Changelog

All notable changes to the Dev GOM Plugins marketplace will be documented in this file.

> **Version**: 2.4.11 | **Last Updated**: 2025-10-27

---

## [2.4.11] - 2025-10-27

### Fixed
- 🔧 **Claude Dev Helper v1.1.6**: Config migration bug fix
  - Fixed deep merge logic in init-config.js to properly add new fields
  - `openLocation` field now correctly added to existing config files during migration
  - Version bump to 1.1.6 to trigger config re-migration for existing users
  - Users with v1.1.5 will automatically receive openLocation field on next session

---

## [2.4.10] - 2025-10-27

### Added
- 🎯 **Claude Dev Helper v1.1.5 + Extension v1.1.2**: Configurable file opening location
  - New `openLocation` config option: `'beside'` (split view) or `'current'` (current tab)
  - Default: `'beside'` (maintains existing behavior - opens in split view)
  - Set to `'current'` to open files in the current editor tab instead
  - Configurable via `.plugin-config/claude-dev-helper.json`
  - VSCode extension updated to support both opening modes

---

## [2.4.9] - 2025-10-27

### Fixed
- 🔧 **Claude Dev Helper v1.1.4**: Restored VSCode extension pattern for focus control
  - Reverted from direct `code` command to VSCode extension + file watcher pattern
  - Fixed focus issue: files now open in background without stealing focus
  - Restored `.claude-dev-helper/open-files.json` queue communication
  - VSCode extension with `preserveFocus: true` provides proper focus control
  - **Note**: VSCode extension installation required for auto-open feature

---

## [2.4.8] - 2025-10-27

### Changed
- 🔧 **Claude Dev Helper v1.1.3**: Simplified auto-open implementation
  - Replaced VSCode extension dependency with direct `code` command execution
  - Uses `exec` to run `code -r "filepath"` for background file opening
  - No longer requires `.claude-dev-helper/open-files.json` or file watcher
  - Simplified architecture: hook script → code CLI → VSCode
  - Cross-platform path normalization for Windows/Unix/Linux
  - Eliminates need to install VSCode extension separately

---

## [2.4.7] - 2025-10-27

### Fixed
- 🔧 **Claude Dev Helper v1.1.2**: Auto-open stdin parsing fix
  - Fixed stdin data structure parsing for PostToolUse hook
  - Corrected from `toolUse.parameters.file_path` to `input.tool_input.file_path`
  - Added `tool_name` validation for Write and Edit operations
  - Matches hook-auto-open-file plugin pattern
  - Removed unnecessary console logging for silent operation

---

## [2.4.6] - 2025-10-27

### Fixed
- 🔧 **Claude Dev Helper v1.1.1**: Plugin manifest validation fix
  - Removed unsupported `requirements` key from plugin.json
  - Fixes "Unrecognized key(s) in object: 'requirements'" validation error
  - Plugin now loads correctly without manifest errors

---

## [2.4.5] - 2025-10-27

### Added
- 🔧 **Claude Dev Helper v1.1.0**: Auto-open files feature
  - Automatically opens files in VSCode when Claude creates or edits them
  - Configurable via `.plugin-config/claude-dev-helper.json` (project root)
  - Settings: enabled (default: true), focus (default: false), maxQueueSize (default: 10)
  - SessionStart hook initializes config with default values
  - VSCode Extension v1.1.0 published to VS Marketplace
  - File watcher integration with `.claude-dev-helper/open-files.json`
  - Background opening support (no focus stealing)

---

## [2.4.4] - 2025-10-22

### Added
- 🧪 **Unity Dev Toolkit v1.4.0**: New test automation skill
  - Added `unity-test-runner` skill for automated Unity Test Framework execution and analysis
  - Cross-platform Unity Editor detection (Windows/macOS/Linux)
  - EditMode and PlayMode test execution via Unity CLI
  - NUnit XML results parsing with detailed failure analysis
  - Smart test pattern matching against 6 common failure categories
  - File:line references in failure reports for quick navigation
  - Node.js scripts for editor detection and test result parsing
  - Comprehensive test patterns database with NUnit assertions and Unity-specific patterns

---

## [2.4.3] - 2025-10-22

### Added
- 🔧 **Unity Dev Toolkit v1.3.0**: New compile error resolution skill
  - Added `unity-compile-fixer` skill for automated C# compilation error detection and resolution
  - VSCode diagnostics integration (OmniSharp) for real-time error detection
  - Comprehensive Unity C# error patterns database (CS0246, CS0029, CS1061, etc.)
  - Smart context-aware fix suggestions based on error analysis
  - Unity .meta file conflict detection and version control integration
  - Node.js analysis script for processing VSCode diagnostics

---

## [2.4.2] - 2025-10-21

### Fixed
- 🔒 **Auto Release Manager v1.0.3**: Enhanced error handling
  - Added UnicodeDecodeError handling in detect_project.py and sync_unity_version.py
  - Prevents script crashes when encountering malformed or non-UTF-8 encoded files

---

## [2.4.1] - 2025-10-21

### Fixed
- 🔧 **Auto Release Manager v1.0.2**: Code quality and documentation improvements
  - Fixed Unreal Engine version detection priority
  - Improved exception handling with specific exception types
  - Updated Python version requirements to 3.11+ across all documentation
  - Fixed plugin.json skills array configuration

---

## [2.4.0] - 2025-10-21

### Added
- 🎉 **New Plugin**: Auto Release Manager - Automate version updates and releases for any project type
  - Universal project type detection (Node.js, Python, Rust, Go, Unity, Unreal, etc.)
  - Cross-platform version update scripts
  - Unity dual-file sync (version.json ← → ProjectSettings.asset)
  - Unreal Engine .uproject support
  - CHANGELOG auto-generation from Conventional Commits
  - Git workflow automation
  - Python 3.11+ with zero external dependencies

---

## Spec-Kit Integration

### [2.3.2] - 2025-10-21

#### Fixed
- AskUserQuestion tool not being called due to ambiguous instructions ("필요시", "선택적")
- Step 4.2 minimum options requirement violation (1 option → 2 options required)

#### Added
- Explicit AskUserQuestion Tool Usage Guidelines section with all constraints
- MUST directives for all user interaction points (Step 1-B, 1-C, Step 2, Step 4.2, What's Next)
- Tool constraint validation with checkmarks (✅) in all sections
- Clear documentation of "Other" option auto-addition by system

#### Changed
- Step 4.2 header changed from "(선택적)" to mandatory
- Added "요구사항 추가" option to meet 2-4 options requirement

### [2.3.1] - 2025-10-21

#### Changed
- Removed rigid AskUserQuestion JSON structures from tasks command
- Claude now autonomously decides what questions to ask based on context
- Improved user experience with more flexible conversation flow
- Enhanced flexibility in Step 1 (Git changes), Step 2 (Update mode), and What's Next sections

### v2.3.0 (2025-10-21)
- 🚀 **Token Efficiency Optimization**: Completely redesigned `/spec-kit:tasks` command workflow
  - Removed redundant information collection (Step 4-7) - CLI now auto-parses spec.md and plan.md directly
  - Eliminated draft file requirement - CLI reads source documents directly
  - Reduced code from 415 lines to ~270 lines (35% reduction)
  - Plugin now focuses only on pre-validation and collecting additional context
  - **Token savings**: ~50% reduction by eliminating duplicate questions
  - **User experience**: Minimal questions (only additional context if needed)
- 🎯 **CLI Auto-Generation**: Full utilization of GitHub Spec-Kit CLI's automatic parsing capabilities
  - CLI automatically extracts user stories, priorities, and acceptance criteria from spec.md
  - CLI automatically extracts tech stack, libraries, and implementation strategy from plan.md
  - Automatic task generation organized by user story phases (P1, P2, P3...)
  - Automatic dependency mapping and parallel execution identification
- ✨ **Optional Context Collection**: Users can now choose to:
  - Include specific additional tasks
  - Exclude certain tasks
  - Adjust priorities
  - Specify time constraints
  - Define test strategy preferences
  - Or simply auto-generate without additional input (recommended)

### v2.2.0 (2025-10-20)
- ✨ **SlashCommand Tool Integration**: Enhanced all 8 command files to explicitly use SlashCommand tool with critical warnings
- 🚀 **Git Setup Workflow**: Added comprehensive Git installation and GitHub setup to init command
  - Auto-detects and installs Git based on OS (Windows/macOS/Linux)
  - Configures Git user information interactively
  - GitHub CLI installation and authentication
  - Private repository creation with `gh repo create --private`
- 📝 **Phase-Based Draft Naming**: implement command now creates draft files with phase and task ID
  - Format: `[phase]-[task-id]-[slug]-draft.md` (e.g., `p2-t010-currency-draft.md`)
  - English-only slug generation for cross-platform compatibility
  - Better file organization and task tracking

### v2.0.4 (2025-10-19)
- 🐛 **Bug Fix**: Fixed SlashCommand format - merged command and INSTRUCTION into single line for all 8 command files
- 📝 **Improved Clarity**: Removed ambiguous newlines between `/speckit.*` commands and INSTRUCTION parameters
- 📝 **Documentation**: Clarified INSTRUCTION blocks - explicitly mention "AskUserQuestion tool" instead of ambiguous "Use if clarification needed"
- 🔄 **Workflow Enhancement**: Added Git status check before `/spec-kit:specify` to prompt for committing existing changes
- 🚀 **Better Git Integration**: `/speckit.specify` now asks about branch publishing (publish/local commit/decide later)
- ♻️ **Role Separation**: Removed PowerShell execution from plugin command for clearer workflow

### v2.0.3 (2025-10-19)
- 🐛 **Bug Fix**: Removed duplicate `CURRENT_BRANCH` declarations across all command files
- 📝 **Documentation**: Added command distinction warnings to prevent confusion between `/spec-kit:*` and `/speckit.*`

### v2.0.2 (2025-10-19)
- 📝 **Documentation**: Added AskUserQuestion tool instruction to all command INSTRUCTIONS

### v2.0.1 (2025-10-19)
- 🐛 **Bug Fix**: Fixed clarify command draft file paths to use branch-based structure

### v2.0.0 (2025-10-19)
- 🔄 **Branch-Based Workflow**: Complete restructuring to support per-branch feature specifications
- 📁 **Path Changes**: Migrated from `.specify/memory/` to `specs/[branch-name]/` structure for feature files
- ✨ **Workflow Selection**: `/spec-kit:specify` command now offers choice between creating new specs or rewriting existing ones
- 🔗 **PowerShell Integration**: Integrated with `create-new-feature.ps1` script for automated branch creation
- 🎯 **Branch Detection**: All commands now automatically detect current branch and work with correct spec files
- 📋 **Next Step Guidance**: Added AskUserQuestion prompts to all commands for workflow navigation
- ⚠️ **BREAKING CHANGE**: Existing v1.x users must migrate their specs to the new branch-based structure

### v1.7.0 (2025-10-19)
- 🔄 **Next Step Suggestions**: All commands now prompt users for next actions after completion using AskUserQuestion
- 🎯 **Workflow Guidance**: Each command suggests contextually relevant next steps (e.g., specify → clarify/plan, tasks → implement)
- 📋 **Smart Navigation**: Users can choose to continue workflow, review files, or complete session
- 💡 **Improved User Experience**: Clear visual option cards for next action selection
- 🚀 **Seamless Workflow**: Reduces friction by guiding users through the entire SDD process

### v1.6.0 (2025-10-18)
- 🤝 **Interactive User Prompts**: All commands now use AskUserQuestion for better user interaction
- 🔄 **Update Mode Selection**: specify, plan, and tasks commands prompt users to choose between Full Regeneration or Incremental Update
- ⚠️ **Smart Warnings**: implement command warns about Open Questions and offers to run clarify first
- 📋 **Issue Prioritization**: clarify command lets users select which ambiguous items to address first
- 🎯 **Improved UX**: Visual option cards with clear descriptions replace text-based prompts

### v1.5.0 (2025-10-18)
- 📊 **Project Status Display**: When canceling re-initialization, displays current project structure and progress
- 🗺️ **Smart Navigation**: Analyzes existing files (constitution, specification, plan, tasks) and recommends next steps
- 🎯 **Context-Aware Guidance**: Shows completed stages and suggests appropriate next command
- 💡 **Workflow Clarity**: Helps users understand where they are in the SDD workflow

### v1.4.0 (2025-10-18)
- 🔄 **Re-initialization Check**: `/spec-kit:init` now detects existing installations and asks user confirmation before re-initializing
- 📝 **Command Arguments Support**: All commands now accept `$ARGUMENTS` for user input
- 🏷️ **Argument Hints**: Added bilingual (English/Korean) argument hints to all commands for better UX
- 🌐 **Enhanced User Input**: Commands can now be invoked with inline arguments (e.g., `/spec-kit:specify Add user authentication`)

### v1.3.0 (2025-10-18)
- 🔄 **Update Mode Selection**: All core commands now detect existing files and offer two update options
- 📋 **Full Regeneration**: Complete rewrite from scratch when requirements drastically change
- ✏️ **Incremental Update**: Merge-based updates for targeted changes
- 📖 **Iterative Workflow Documentation**: Comprehensive guide on when and how to update earlier stages
- 🎯 **Context Preservation**: Re-running commands maintains conversation history and change rationale
- ⚡ **Cascade Updates**: Clear guidance on updating downstream stages after changes

### v1.2.0 (2025-10-18)
- ✨ **Smart Prerequisite Checks**: Automatic Open Questions detection in `/spec-kit:plan`, `/spec-kit:tasks`, and `/spec-kit:implement` commands
- 🎨 **Unified Commit Flow**: Single decision point with 3 clear options (quality gate + commit / direct commit / skip)
- 📋 **Better UX**: Context-appropriate guidance for each commit option
- 🛡️ **Error Prevention**: Warns about unclear requirements before proceeding
- 📖 **Documentation**: Added comprehensive "Smart Prerequisite Checks" section to READMEs

### v1.1.0 (2025-10-17)
- ✨ **Token Efficiency**: Implemented two-layer architecture with draft files
- 🚀 **Performance**: Reduced token usage by using file paths instead of full content
- 📁 **Draft System**: All commands now create reusable draft files in `.specify/temp/`
- 📝 **Instructions**: Added precise instructions for each command to skip redundant steps
- 🌐 **Multi-language**: Enhanced system language detection for all commands

### v1.0.0 (2025-10-16)
- 🎉 Initial release
- 📋 10 slash commands for complete SDD workflow
- 🔧 Integration with GitHub Spec-Kit CLI

---

## AI Pair Programming Suite

### v1.1.1 (2025-10-20)
- 🔄 **Auto Migration**: Plugin version-based configuration migration
- 📦 **Smart Updates**: Preserves user settings while adding new fields
- 🏷️ **Project Scoping**: State and output files now use project name to prevent conflicts
- 🎯 **SessionStart Hook**: Auto-creates configuration file on session start
- ⚡ **Performance**: SessionStart hook exits immediately if config is up-to-date
- 🌍 **Cross-Platform**: Enhanced path handling for Windows/macOS/Linux compatibility

### v1.0.0 (2025-10-15)
- 🎉 Initial release
- 💬 5 slash commands: `/pair`, `/review`, `/suggest`, `/fix`, `/explain`
- 🤖 4 expert agents: `@code-reviewer`, `@bug-hunter`, `@architect`, `@performance-expert`
- 🔔 3 intelligent hooks: Code review on Edit/Write, bug detection, session summary
- 🎨 Configuration system for all plugins

---

## TODO Collector

### v1.2.0 (2025-10-20)
- 🔄 **Auto Migration**: Plugin version-based configuration migration
- 📦 **Smart Updates**: Preserves user settings while adding new fields
- 🏷️ **Project Scoping**: State files now use project name to prevent conflicts
- ⚡ **Performance**: SessionStart hook exits immediately if config is up-to-date
- 🌍 **Cross-Platform**: Enhanced path handling for Windows/macOS/Linux compatibility
- 🎯 **SessionStart Hook**: Auto-creates configuration file on session start
- ⚙️ **Custom Filtering**: Added includeDirs and includeExtensions settings
- 🔍 **Full Project Scan**: Automatically scans entire project on first run
- 🔧 **Configuration Refactor**: Moved settings to `.plugin-config/hook-todo-collector.json`
- 📝 **Bug Fix**: Fixed issue where report wasn't generated when no files were modified
- 🐛 **Bug Fix**: Improved full scan logic - immediately scan when report file is missing

### v1.1.1 (2025-10-18)
- 🐛 **Bug Fix**: Fixed empty array handling for `outputFormats` configuration

### v1.1.0 (2025-10-18)
- 📛 **Project-Named Output Files**: All generated files now include project name to prevent conflicts across multiple projects

### v1.0.0 (2025-10-14)
- 🎉 Initial release
- 🔗 Clickable file links in TODO reports
- 📝 Multiple comment types support (TODO, FIXME, HACK, XXX, NOTE, BUG)
- 📊 Detailed markdown reports with statistics
- 🎯 Skip markdown headers to avoid false positives
- 🌐 Multi-language support

---

## Hook Plugins (All Hook Plugins)

### v1.1.1 (2025-10-20) - All Hook Plugins
- 🔄 **Auto Migration**: Plugin version-based configuration migration
- 📦 **Smart Updates**: Preserves user settings while adding new fields
- 🏷️ **Project Scoping**: State and output files now use project name to prevent conflicts
- 🎯 **SessionStart Hook**: Auto-creates configuration file on session start
- ⚡ **Performance**: SessionStart hook exits immediately if config is up-to-date
- 🌍 **Cross-Platform**: Enhanced path handling for Windows/macOS/Linux compatibility
- 🔍 **Complexity Monitor**: Added includeDirs, excludeDirs, includeExtensions, excludeExtensions settings for selective scanning
- 🐛 **Bug Fix - Complexity Monitor v1.1.1**: Full project scan when complexity log file doesn't exist

### v1.1.0 (2025-10-18) - Complexity Monitor, Session Summary, TODO Collector
- 📛 **Project-Named Output Files**: All generated files now include project name to prevent conflicts across multiple projects
- 🏷️ **File Naming**: Changed from `.complexity-log.md` to `.{project-name}-complexity-log.md` (same for all hooks)
- 🔀 **Multi-Project Support**: Work on multiple projects simultaneously without file collisions
- 📁 **State Isolation**: Each project's tracking files are now separate in plugin `.state` directory

### v1.0.0 (2025-10-14)
- 🎉 Initial release
- 🔄 **Git Auto-Backup**: Automatic git commits after sessions
- 📊 **Complexity Monitor**: Code complexity tracking with configurable thresholds
- 📝 **Auto-Docs**: Automatic project structure documentation
- 📋 **Session Summary**: Track all file operations during sessions
- ⚙️ Configurable via `.plugin-config/` files
- 🔇 Optional log suppression with `showLogs` setting

---

## Auto-Docs

### v1.4.1 (2025-10-20)
- ✨ **Improvement**: Unified tree structure when multiple directories are included
- 🐛 **Bug Fix**: Regenerate documentation when output file is deleted
- 🔄 **Auto Migration**: Plugin version-based configuration migration
- 📦 **Smart Updates**: Preserves user settings while adding new fields
- 🎯 **SessionStart Hook**: Auto-creates configuration file on session start
- ⚡ **Performance**: SessionStart hook exits immediately if config is up-to-date
- 🌍 **Cross-Platform**: Enhanced path handling for Windows/macOS/Linux compatibility

### v1.4.0 (2025-10-18)
- 📁 **Empty Directory Control**: Added `includeEmptyDirs` configuration option to control empty directory inclusion
- 🐛 **Bug Fix**: Fixed extension filter display to show both filters when both are active

### v1.3.0 (2025-10-18)
- 📄 **File Extension Filtering**: Added `includeExtensions` and `excludeExtensions` configuration options
- 🎯 **Selective File Inclusion**: Include only specific file types (e.g., `.js`, `.ts`, `.json`)
- 🚫 **File Type Exclusion**: Exclude unwanted file types (e.g., `.meta`, `.log`, `.tmp`)
- 🔧 **Flexible Configuration**: Specify extensions with or without dot (`.meta` or `meta`)
- 📋 **AND Condition**: Both filters work together for fine-grained control (include first, then exclude)
- 💡 **Use Cases**: Focus on source code only, exclude build artifacts, hide metadata files

### v1.2.0 (2025-10-18)
- 📛 **Project-Named Output Files**: Generated files now include project name (`.{project-name}-project-structure.md`)
- 🔀 **Multi-Project Support**: Work on multiple projects simultaneously without file collisions
- 📁 **State Isolation**: Project-specific state files in plugin directory

### v1.1.0 (2025-10-18)
- 📁 **Selective Directory Scanning**: Added `includeDirs` configuration to scan only specific directories
- 🎯 **Focused Documentation**: Generate project structure for selected folders instead of entire project
- ⚙️ **Configuration Priority**: `includeDirs` takes precedence over `excludeDirs` when set
- 📚 **Large Project Support**: Useful for documenting specific parts of large codebases
- 🌐 **Multi-language Documentation**: Updated both English and Korean READMEs

---

## Unity Dev Toolkit

### v1.3.0 (2025-10-22)
- 🔧 **New Skill**: Added `unity-compile-fixer` skill for automated C# compilation error detection and resolution
- 🔍 **VSCode Integration**: Leverages VSCode diagnostics (OmniSharp) for real-time error detection
- 📊 **Error Pattern Database**: Includes comprehensive Unity C# error patterns (CS0246, CS0029, CS1061, etc.)
- 💡 **Smart Solutions**: Proposes context-aware fixes based on error analysis
- ✅ **VCS Support**: Handles Unity .meta file conflicts and version control integration
- 📝 **Analysis Scripts**: Includes Node.js script for processing VSCode diagnostics

### v1.2.0 (2025-10-18)
- 🎨 **UI Toolkit Templates**: Added complete UI Toolkit templates for both Editor and Runtime (6 files total)
- 📝 **Editor Templates**: EditorWindow with UXML/USS (C#, UXML, USS)
- 🎮 **Runtime Templates**: UIDocument for game UI with UXML/USS (C#, UXML, USS)
- ⚡ **New Skill**: Added `unity-uitoolkit` skill for UI Toolkit development assistance
- 📚 **Template Count**: Increased from 7 to 10 production-ready templates
- 🔗 **Cross-References**: Updated Skills to reference new UI Toolkit capabilities

### v1.1.0 (2025-10-18)
- 🤖 **New Agent**: Added `@unity-refactor` agent for code refactoring and quality improvement
- 📝 **Skills Enhancement**: Added "When to Use vs Other Components" sections to all Skills
- 🔗 **Component Integration**: Clear guidance on when to use Skills vs Agents vs Commands
- 📚 **Documentation**: Improved cross-component references and usage patterns

### v1.0.1 (2025-10-18)
- 📝 **Skill Documentation Optimization**: Simplified SKILL.md files (834 → 197 lines, 76% reduction)
- 🎯 **Progressive Disclosure**: Applied best practices for concise skill documentation
- 🗑️ **Removed Redundancy**: Eliminated "When to Use This Skill" sections (skill activation is determined by description field)
- ⚡ **Token Efficiency**: Reduced context size for faster skill loading and activation

### v1.0.0 (2025-10-18)
- 🎉 Initial release
- 📝 3 slash commands: `/unity:new-script`, `/unity:optimize-scene`, `/unity:setup-test`
- 🤖 3 expert agents: `@unity-scripter`, `@unity-performance`, `@unity-architect` (expanded to 4 in v1.1.0)
- ⚡ 4 Agent Skills: `unity-script-validator`, `unity-scene-optimizer`, `unity-template-generator`, `unity-ui-selector` (expanded to 5 in v1.2.0)
- 📄 Production-ready templates for MonoBehaviour, ScriptableObject, Editor, and Test scripts

---

## Auto Release Manager

### v1.0.3 (2025-10-21)

#### Fixed
- 🔒 **Error Handling**: Added UnicodeDecodeError handling for better robustness
  - `detect_project.py`: Now handles UTF-8 decoding errors in Unreal Engine .uproject files
  - `sync_unity_version.py`: Now handles UTF-8 decoding errors in Unity files
  - Prevents script crashes when encountering malformed or non-UTF-8 encoded files

### v1.0.2 (2025-10-21)

#### Fixed
- 🔧 **Unreal Engine Version Priority**: Fixed version detection to prioritize `Version` over `EngineAssociation`
  - Now correctly reads project version instead of engine version
  - Aligned with documentation in unreal-guide.md
- 🐛 **Exception Handling**: Improved error handling with specific exceptions
  - Changed `except BaseException` to `except (json.JSONDecodeError, IOError)` in detect_project.py
  - Changed `except Exception` to `except (json.JSONDecodeError, IOError)` in sync_unity_version.py
- 📝 **Code Readability**: Replaced `chr(10)` with `'\n'` in git_operations.py
- 🔧 **Plugin Configuration**: Fixed skills array in plugin.json to use actual skill name

#### Documentation
- 📚 **Consistency**: Updated all Python version requirements from 3.8+ to 3.11+ across all documentation files

### v1.0.1 (2025-10-21)

#### Changed
- 📦 **Python 3.11+ Requirement**: Removed tomli dependency by requiring Python 3.11+
  - Now uses built-in `tomllib` for TOML parsing
  - Added Python version check with clear error message
  - Zero external dependencies for all scripts

#### Fixed
- 🔧 **Type Hints**: Fixed all type annotations across 5 Python scripts
  - Added type parameters to all Dict, List, Optional types
  - Fixed `subprocess.CompletedProcess[str]` type hints
  - Resolved all Pylance and mypy warnings
- 📏 **Code Quality**: Fixed all PEP 8 linter errors
  - Fixed E501 line length violations (79 character limit)
  - Improved code formatting consistency
  - Added type hints to all variables

#### Documentation
- 📝 **Requirements**: Added Python 3.11+ requirement to README.md and README.ko.md
- 📚 **Clarity**: Updated installation instructions with clear version requirements

### v1.0.0 (2025-01-20)
- 🎉 Initial release
- 🔍 Universal project type detection (Node.js, Python, Rust, Go, Unity, Unreal, etc.)
- 📝 Cross-platform version update scripts
- 🔄 Unity dual-file sync (version.json ← → ProjectSettings.asset)
- 🎮 Unreal Engine .uproject support
- 📋 CHANGELOG auto-generation from Conventional Commits
- 🚀 Git workflow automation
- 📚 Comprehensive documentation and guides
