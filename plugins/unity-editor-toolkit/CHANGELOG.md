# Changelog

All notable changes to Unity Editor Toolkit will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.15.1] - 2025-12-02

### Added
- **Version Check Feature**: Check for updates from Unity Editor window
  - "Check for Updates" button to fetch latest version from GitHub
  - "Open GitHub Releases" button for quick access to releases page
  - Local vs latest version comparison with update status display
  - Real-time version check with async HTTP request to GitHub raw URL

### Changed
- **Documentation**: Updated Unity package installation guide
  - Added dependency package installation steps (UniTask, unity-sqlite-net)
  - Added package update instructions
  - Removed root CHANGELOG files (release notes now in GitHub Releases)

## [0.13.0] - 2025-12-02

### Added
- **Shader Commands** (7 new commands)
  - `shader list` - List all shaders in project
  - `shader find` - Find shader by name
  - `shader properties` - Get shader properties
  - `shader keywords` - List global/shader keywords
  - `shader keyword-enable` - Enable global shader keyword
  - `shader keyword-disable` - Disable global shader keyword
  - `shader keyword-status` - Check keyword enabled status
- **Documentation**
  - `COMMANDS_MATERIAL.md` - Material commands reference (9 commands)
  - `COMMANDS_SHADER.md` - Shader commands reference (7 commands)

### Fixed
- **Console Bug**: Warning logs now display by default (`includeWarnings` default changed to `true`)
- **Database History Deletion**: Command history now properly deleted from SQLite database when cleared
- **Project Database Isolation**: Each Unity project now uses its own database file in `Library/UnityEditorToolkit/` folder instead of shared persistent path

### Changed
- Total command count increased from 58 to 86 commands
- Updated documentation to reflect Phase 2 status

## [0.12.1] - 2025-12-01

### Fixed
- Logger class renamed to ToolkitLogger to avoid compilation conflicts

## [0.12.0] - 2025-11-30

### Added
- Material commands (9 commands)
- Animation commands
- Editor commands expansion

## [0.11.0] - 2025-11-28

### Added
- Prefab commands (12 commands)
- Asset management commands (9 commands)

## [0.10.0] - 2025-11-25

### Added
- Component commands (10 commands)
- Menu execution commands (2 commands)

## [0.9.0] - 2025-11-22

### Added
- SQLite database integration
- GUID-based GameObject persistence
- Multi-scene synchronization
- Command Pattern with Undo/Redo

## [0.8.0] - 2025-11-19

### Added
- Initial experimental release
- Core commands: GameObject, Transform, Scene, Console, Wait, Chain
- WebSocket server with JSON-RPC 2.0
- EditorPrefs management
