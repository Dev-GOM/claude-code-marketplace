# Auto Release Manager

> Automate version updates and releases for any project type with intelligent detection and cross-platform support.

## Overview

Auto Release Manager is a Claude Code skill that streamlines the entire release workflow across different project types. It automatically detects your project type, updates version files in the appropriate format, generates CHANGELOG from commits, and handles git operations—all with cross-platform compatibility.

## Features

✨ **Universal Project Support**
- Node.js, Python, Rust, Go
- Unity, Unreal Engine, Godot
- Claude Code Plugins, VS Code Extensions
- Generic projects with VERSION files

🔍 **Intelligent Detection**
- Automatically identifies project type
- Finds all version files
- Detects current version

📝 **Smart Version Management**
- Updates multiple file formats (JSON, TOML, YAML, Unity assets)
- Supports semantic versioning (MAJOR.MINOR.PATCH)
- Unity dual-file sync (version.json ← → ProjectSettings.asset)

📋 **Auto CHANGELOG**
- Generates from git commit history
- Parses Conventional Commits
- Groups changes by type

🚀 **Git Automation**
- Cross-platform git operations
- Commit, tag, push workflows
- Error handling and validation

## Supported Project Types

| Project Type | Version File(s) | Format |
|--------------|----------------|--------|
| Node.js | `package.json` | JSON |
| Python | `pyproject.toml`, `setup.py` | TOML, Python |
| Rust | `Cargo.toml` | TOML |
| Go | `VERSION` | Plain text |
| Unity | `version.json` + `ProjectSettings.asset` | JSON + YAML |
| Unreal | `*.uproject` | JSON |
| Claude Plugin | `.claude-plugin/plugin.json` | JSON |
| VS Code Extension | `package.json` | JSON |
| Browser Extension | `manifest.json` | JSON |
| Generic | `VERSION` | Plain text |

## Requirements

- **Python 3.11+** (for TOML parsing with built-in `tomllib`)
- Git (for version control operations)
- Claude Code CLI

## Installation

```bash
# Install from marketplace
claude-code plugins:marketplace:add https://github.com/Dev-GOM/claude-code-marketplace
claude-code plugins:install auto-release-manager

# Or install directly
claude-code plugins:add https://github.com/Dev-GOM/claude-code-marketplace/tree/main/plugins/auto-release-manager
```

## Usage

### Basic Usage

Simply ask Claude to handle your release:

```
"Bump patch version and create release"
"Update to v1.0.2"
"Create Unity release with version 1.5.0"
```

Claude will:
1. Detect your project type
2. Calculate or use the specified version
3. Update all relevant version files
4. Optionally generate CHANGELOG
5. Handle git operations (commit, tag, push)

### Example Workflows

**Node.js Project:**
```
User: "Bump minor version to 1.3.0 and push"

Claude:
✓ Detected: Node.js project (package.json)
✓ Updated package.json: 1.2.5 → 1.3.0
✓ Generated CHANGELOG entry
✓ Committed changes
✓ Created tag v1.3.0
✓ Pushed to origin
```

**Unity Project:**
```
User: "Update Unity version to 2.0.0"

Claude:
✓ Detected: Unity project
✓ Updated version.json: 1.5.3 → 2.0.0
✓ Synced to ProjectSettings.asset
✓ Committed both files
✓ Created tag v2.0.0
```

**Python Project:**
```
User: "Patch version bump"

Claude:
✓ Detected: Python project (pyproject.toml)
✓ Updated: 0.3.2 → 0.3.3
✓ Updated CHANGELOG.md
✓ Committed and tagged
```

### Unity-Specific Workflow

Unity projects use a dual-file approach:

1. **`version.json`** - Primary source of truth (easy to edit)
2. **`ProjectSettings/ProjectSettings.asset`** - Auto-synced (used by builds)

The skill automatically:
- Updates version.json
- Syncs to ProjectSettings.asset
- Commits both files together

See [Unity Guide](./skills/references/unity-guide.md) for details.

### Unreal-Specific Workflow

Unreal projects use `.uproject` file:

- Updates `Version` field in .uproject
- Optionally syncs to Config/DefaultGame.ini
- Handles JSON formatting

See [Unreal Guide](./skills/references/unreal-guide.md) for details.

## Scripts

All scripts work cross-platform (Windows, macOS, Linux):

- **detect_project.py**: Auto-detect project type and version files
- **update_version.py**: Universal version updater for any file format
- **sync_unity_version.py**: Unity version.json → ProjectSettings.asset sync
- **git_operations.py**: Git workflow automation (commit, tag, push)
- **changelog_generator.py**: CHANGELOG generation from commits

Scripts can be run independently:

```bash
# Detect project
python -X utf8 scripts/detect_project.py .

# Update version
python -X utf8 scripts/update_version.py package.json 1.3.0

# Sync Unity
python -X utf8 scripts/sync_unity_version.py

# Git operations
python -X utf8 scripts/git_operations.py commit "Release v1.3.0"
python -X utf8 scripts/git_operations.py tag v1.3.0
python -X utf8 scripts/git_operations.py push

# Generate CHANGELOG
python -X utf8 scripts/changelog_generator.py 1.3.0 v1.2.0
```

## Requirements

- Python 3.11+ (scripts use only stdlib, no external dependencies)
- Git (for git operations)
- GitHub CLI (optional, for GitHub releases)

## Version History

### 1.0.0 - 2025-01-20

Initial release

#### Added
- Universal project type detection (Node.js, Python, Rust, Go, Unity, Unreal, etc.)
- Cross-platform version update scripts
- Unity dual-file sync (version.json ← → ProjectSettings.asset)
- Unreal Engine .uproject support
- CHANGELOG auto-generation from Conventional Commits
- Git workflow automation
- Comprehensive documentation and guides

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](../../LICENSE) for details.

## Author

**Dev GOM**
- GitHub: [@Dev-GOM](https://github.com/Dev-GOM)
- Marketplace: [claude-code-marketplace](https://github.com/Dev-GOM/claude-code-marketplace)

## See Also

- [Project Types Reference](./skills/references/project-types.md)
- [Unity Guide](./skills/references/unity-guide.md)
- [Unreal Guide](./skills/references/unreal-guide.md)
