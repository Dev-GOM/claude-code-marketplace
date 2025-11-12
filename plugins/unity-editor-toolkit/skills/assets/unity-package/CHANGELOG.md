# Changelog

All notable changes to Unity Editor Toolkit Unity Package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-11-11

### Added

#### Core Features
- WebSocket server with JSON-RPC 2.0 protocol
- Real-time Unity Editor control from external tools
- Support for Claude Code integration

#### Commands (17 total)
- **GameObject**: Find, Create, Destroy, SetActive (4 commands)
- **Transform**: GetPosition, SetPosition, GetRotation, SetRotation, GetScale, SetScale (6 commands)
- **Scene**: GetCurrent, GetAll, Load (3 commands)
- **Console**: GetLogs, Clear (2 commands)
- **Hierarchy**: Get (1 command)

#### Components
- `UnityEditorServer` MonoBehaviour component
- Editor window for server control (`Window → Unity Editor Toolkit → Server Control`)
- Automatic console log capture
- Configurable port (default: 9500)
- Auto-start option

#### Security
- Localhost-only connections (127.0.0.1)
- Editor-mode only (not available in builds)
- Full Unity Undo system integration
- Thread-safe operation

#### Developer Features
- Modular handler architecture
- Extensible command system
- JSON-RPC 2.0 error handling
- Comprehensive logging

### Dependencies
- Unity 2020.3 or later
- websocket-sharp (external, must be added manually)
- Newtonsoft.Json (included in Unity 2020.3+)

### Known Issues
- Requires manual installation of websocket-sharp DLL
- GameObject finding limited to active scene
- Console logs limited to 1000 recent entries
- Editor mode only (by design)

### Documentation
- Complete API reference in README.md
- Installation guide
- Troubleshooting section
- API examples with request/response samples

## [Unreleased]

### Planned for 0.2.0
- Component manipulation commands (20+)
- Material property editing
- Prefab instantiation and management
- Asset database queries
- NuGet package for automatic dependency resolution

### Planned for 0.3.0
- Animation control
- Physics simulation
- Lighting management
- Camera control

### Planned for 1.0.0
- 500+ commands across 25 categories
- Complete Unity Editor automation
- Performance optimizations
- Comprehensive test suite

---

**Full Command Roadmap**: See [COMMANDS.md](../COMMANDS.md) for details on all 500+ planned commands.
