# Unity Editor Toolkit

> **⚠️ Status**: 🧪 Experimental (v0.15.1) - **Unity 6+ Required**
>
> **This plugin is currently in experimental stage. APIs and features may change.**
> **Database features require Unity 6 or higher** (embedded SQLite, no installation required)

Complete Unity Editor control and automation toolkit for Claude Code with SQLite database integration. Command 500+ Unity Editor features across 25 categories - GameObjects, components, scenes, materials, physics, animation, and more through real-time WebSocket automation.

## Recent Updates

See [CHANGELOG.md](./CHANGELOG.md) for full release notes.

## Features

- **500+ Commands**: Comprehensive control across 25 Unity Editor categories
- **Real-time WebSocket**: Instant bidirectional communication (port 9500-9600)
- **SQLite Database Integration**: Real-time GameObject synchronization with GUID-based persistence
  - **GUID-based Identification**: Persistent GameObject tracking across Unity sessions
  - **Multi-scene Support**: Synchronize all loaded scenes simultaneously
  - **Command Pattern**: Undo/Redo support for database operations
  - **Auto Migration**: Automatic schema migration system
  - **Batch Operations**: Efficient bulk inserts, updates, and deletes (500 objects/batch)
- **GameObject & Hierarchy**: Create, destroy, manipulate, query hierarchies with tree visualization
- **Transform Control**: Precise Vector3 manipulation for position, rotation, scale
- **Component Management**: Add, remove, configure components with property access
- **Scene Management**: Load, save, merge multiple scenes with build settings control
- **Material & Rendering**: Materials, shaders, textures, renderer properties
- **Prefab System**: Instantiate, create, override, variant management
- **Asset Database**: Search, import, dependencies, labels, bundle assignment
- **Animation**: Play, Animator parameters, curves, events
- **Physics**: Rigidbody, Collider, Raycast, simulation control
- **Console Logging**: Real-time logs with filtering, export, streaming
- **Editor Automation**: Play mode, window focus, selection, scene view control
- **Build & Deploy**: Build pipeline, player settings, platform switching
- **Advanced Features**: Lighting, Camera, Audio, Navigation, Particles, Timeline, UI Toolkit
- **Security Hardened**: Defense against path traversal, command injection, JSON injection, SQL injection
- **Cross-Platform**: Full Windows, macOS, Linux support

## Installation

This plugin is part of the [Dev GOM Plugins](https://github.com/Dev-GOM/claude-code-marketplace) marketplace.

### Install from Marketplace (Recommended)

```bash
# Add marketplace
/plugin marketplace add https://github.com/Dev-GOM/claude-code-marketplace.git

# Install plugin
/plugin install unity-editor-toolkit@dev-gom-plugins
```

### Direct Installation

```bash
# Install directly from repository
/plugin add https://github.com/Dev-GOM/claude-code-marketplace/tree/main/plugins/unity-editor-toolkit
```

## Usage

### Unity Setup

1. **Install Unity Package**:

   Install dependency packages first, then install the main package:

   **Step 1: Install Dependencies**
   - Open Unity Editor
   - Window → Package Manager
   - Click `+` → Add package from git URL...
   - Add the following packages in order:

   ```
   https://github.com/Cysharp/UniTask.git?path=src/UniTask/Assets/Plugins/UniTask
   ```

   ```
   https://github.com/gilzoide/unity-sqlite-net.git#1.3.2
   ```

   **Step 2: Install Unity Editor Toolkit**
   - After both dependency packages are installed, add the main package:

   ```
   https://github.com/Dev-GOM/claude-code-marketplace.git?path=/plugins/unity-editor-toolkit/skills/assets/unity-package
   ```

   **Alternative Methods:**
   - Add Unity package from `skills/assets/unity-package` via Package Manager (Add package from disk)
   - Or copy the package folder directly into your project's `Packages` directory

2. **Setup WebSocket Server**:
   - Open `Unity Editor Toolkit Server` window from menu: `Tools > Unity Editor Toolkit > Server Window`
   - Configure plugin scripts path (default: auto-detected from user home folder)
   - Click "Install CLI" to build the WebSocket server (one-time setup)
   - Server starts automatically when Unity Editor opens

3. **Database Setup** (Optional):
   - In the Server window, switch to "Database" tab
   - Click "Connect" to initialize SQLite database
   - Database file location: `{ProjectRoot}/.unity-websocket/unity-editor.db`
   - Click "Start Sync" to enable real-time GameObject synchronization (1s interval)
   - **GUID Components**: GameObjects are automatically tagged with persistent GUIDs
   - **Multi-scene**: All loaded scenes are synchronized automatically
   - **Analytics**: View sync stats, database health, and Undo/Redo history

4. **Server Status**:
   - Port: Auto-assigned (9500-9600 range)
   - Status file: `{ProjectRoot}/.unity-websocket/server-status.json`
   - CLI automatically detects the correct port from this file

### Updating the Package

To update Unity Editor Toolkit to the latest version:

1. Open Unity Editor
2. Window → Package Manager
3. Click `+` → Add package from git URL...
4. Enter:

   ```
   https://github.com/Dev-GOM/claude-code-marketplace.git?path=/plugins/unity-editor-toolkit/skills/assets/unity-package
   ```

5. Click Add (this will update the existing package)

**Note:** Dependency packages (UniTask, unity-sqlite-net) typically don't need updating unless specified in release notes.

### CLI Commands

```bash
# Basic usage
cd <unity-project-root> && node .unity-websocket/uw <command> [options]

# Show all available commands
cd <unity-project-root> && node .unity-websocket/uw --help

# Show help for specific command
cd <unity-project-root> && node .unity-websocket/uw <command> --help
```

**Currently Implemented**: 86 commands across 15 categories

See [COMMANDS.md](./skills/references/COMMANDS.md) for complete command reference.

#### Command Categories

See [COMMANDS.md](./skills/references/COMMANDS.md) for full command reference including:

- **Component**: Add, remove, configure components with property access
- **Material**: Colors, textures, shaders, renderer settings
- **Prefab**: Instantiate, create, override management
- **Asset Database**: Search, import, dependencies
- **Animation**: Animator parameters, clips, curves
- **Physics**: Rigidbody, Collider, Raycast, simulation
- **Lighting**: Lights, lightmaps, reflection probes
- **Camera**: FOV, viewport, screenshots
- **Audio**: AudioSource, mixer, 3D audio
- **Navigation**: NavMesh, agents, obstacles
- **Particles**: Emission, modules, simulation
- **Timeline**: Playable director, tracks, clips
- **Build**: Build pipeline, player settings
- **Profiler**: Performance data, memory snapshots
- **Test Runner**: Unit tests, code coverage
- And 10+ more categories...

### Command Examples

**Create and configure GameObject:**
```bash
cd <unity-project-root> && node .unity-websocket/uw go create "Enemy" && \
cd <unity-project-root> && node .unity-websocket/uw tf set-position "Enemy" "10,0,5" && \
cd <unity-project-root> && node .unity-websocket/uw tf set-rotation "Enemy" "0,45,0"
```

**Instantiate Prefab and modify:**
```bash
cd <unity-project-root> && node .unity-websocket/uw prefab instantiate "Prefabs/Player" --position "0,1,0" && \
cd <unity-project-root> && node .unity-websocket/uw material set-color "Player" "_Color" "0,1,0,1"
```

**Load scene and activate GameObject:**
```bash
cd <unity-project-root> && node .unity-websocket/uw scene load "Level1" && \
cd <unity-project-root> && node .unity-websocket/uw go set-active "Boss" true
```

**Monitor console errors in real-time:**
```bash
cd <unity-project-root> && node .unity-websocket/uw console stream --filter error
```

**Batch GameObject creation:**
```bash
for i in {1..10}; do
  cd <unity-project-root> && node .unity-websocket/uw go create "Cube_$i" && \
  cd <unity-project-root> && node .unity-websocket/uw tf set-position "Cube_$i" "$i,0,0"
done
```

## Architecture

### Components

- **Unity C# Server**: WebSocket server with JSON-RPC 2.0 handler framework
- **Server Status Sync**: Automatic port discovery via `.unity-websocket/server-status.json`
- **WebSocket Client**: TypeScript implementation with auto-reconnect and timeout handling
- **CLI Framework**: Commander.js with modular command architecture
- **Security Layer**: Multi-layer input validation and injection defense

### Communication Protocol

JSON-RPC 2.0 over WebSocket:

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": "req_1",
  "method": "GameObject.Find",
  "params": { "name": "Player" }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": "req_1",
  "result": {
    "name": "Player",
    "instanceId": 12345,
    "path": "/Player",
    "active": true,
    "tag": "Player",
    "layer": 0
  }
}
```

### Port Allocation & Discovery

- **Range**: 9500-9600 (100 ports)
- **No Conflicts**: Avoids Browser Pilot (9222-9322) and Blender Toolkit (9400-9500)
- **Auto-detection**: Unity server writes port to `.unity-websocket/server-status.json`
- **CLI Discovery**: Automatically reads port from status file (no manual configuration)
- **Heartbeat**: Server updates status every 5 seconds for connection health monitoring

## Security

Defense-in-depth security implementation:

- **Path Traversal Protection**: `path.resolve()` validation with `..` detection
- **Command Injection Defense**: Sanitized npm execution and environment isolation
- **JSON Injection Prevention**: Runtime type validation for all structures
- **Log Injection Defense**: Message sanitization prevents log manipulation
- **SQL Injection Prevention**: Parameterized queries for all database operations
  - Individual DELETE statements for small batches (≤100 items)
  - Temporary table pattern for large batches (>100 items)
- **Transaction Safety**: Nested transaction detection and graceful fallback
- **WebSocket Security**: Localhost-only connections
- **Port Validation**: Enforced 9500-9600 range
- **Atomic Operations**: Race-condition-free lock acquisition (`{ flag: 'wx' }`)
- **Memory Safety**: Proper event listener cleanup and Domain Reload safety checks

## Development

### Project Structure

```
unity-editor-toolkit/
├── .claude-plugin/
│   └── plugin.json              # Plugin metadata
├── skills/
│   ├── SKILL.md                 # Skill documentation
│   ├── scripts/
│   │   ├── src/
│   │   │   ├── cli/
│   │   │   │   ├── cli.ts       # Main CLI entry point
│   │   │   │   └── commands/    # Command implementations
│   │   │   ├── constants/
│   │   │   │   └── index.ts     # Centralized constants
│   │   │   ├── unity/
│   │   │   │   ├── client.ts    # WebSocket client
│   │   │   │   └── protocol.ts  # JSON-RPC types
│   │   │   └── utils/
│   │   │       ├── config.ts    # Configuration management
│   │   │       └── logger.ts    # Logging utilities
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── references/              # Documentation
│   │   ├── QUICKSTART.md        # Quick setup guide
│   │   ├── QUICKSTART.ko.md     # Korean quick setup guide
│   │   ├── COMMANDS.md          # Complete command reference (500+)
│   │   ├── COMMANDS.ko.md       # Korean command reference
│   │   ├── API_COMPATIBILITY.md # Unity version compatibility
│   │   ├── TEST_GUIDE.md        # Testing guide
│   │   └── TEST_GUIDE.ko.md     # Korean testing guide
│   └── assets/                  # Unity packages
│       └── unity-package/       # Unity C# WebSocket server
│           ├── Runtime/         # Core handlers & protocol
│           ├── Editor/          # Editor window
│           ├── Tests/           # Unit tests (66 tests)
│           ├── ThirdParty/      # websocket-sharp
│           └── package.json     # Unity package manifest
├── README.md                    # This file
└── README.ko.md                 # Korean README
```

### Building

```bash
cd skills/scripts
npm install
npm run build
```

### Testing

Unity C# server implementation required for end-to-end testing. Unit tests coming soon.

## Development Roadmap

**Phase 2 (Current)**: 86 commands across 15 categories (GameObject, Transform, Component, Scene, Prefab, Material, Shader, Asset, etc.)
**Phase 3**: Animation, Physics, Lighting - 150+ commands
**Phase 4**: Build, Profiler, Test Runner - 100+ commands
**Phase 5**: Advanced features (Timeline, UI Toolkit, VCS) - 150+ commands

See [COMMANDS.md](./skills/references/COMMANDS.md) for detailed roadmap.

## Status

### Unity C# Server Package ✅
- [x] WebSocket server with websocket-sharp
- [x] JSON-RPC 2.0 handler framework
- [x] Command routing and execution
- [x] Unity Package Manager integration
- [x] Server status synchronization (`.unity-websocket/server-status.json`)
- [x] Automatic port discovery
- [x] Home folder-based plugin path detection
- [x] SQLite database integration with UniTask async/await
- [x] GUID-based GameObject identification (persistent across sessions)
- [x] Multi-scene synchronization support
- [x] Command Pattern with Undo/Redo support
- [x] Auto migration system
- [x] Batch operations (500 objects/batch)
- [x] SQL injection prevention (parameterized queries)
- [x] Transaction nesting prevention

### Commands (500+)
- [x] GameObject & Hierarchy (15 commands)
- [x] Transform (8 commands)
- [x] Scene Management (3 commands)
- [x] Console & Logging (2 commands)
- [x] EditorPrefs Management (6 commands)
- [x] Wait Commands (4 commands)
- [x] Chain Commands (2 commands)
- [ ] Component (20+ commands)
- [ ] Material & Rendering (25+ commands)
- [ ] Prefab (15+ commands)
- [ ] Asset Database (20+ commands)
- [ ] Animation (20+ commands)
- [ ] Physics (20+ commands)
- [ ] Lighting (15+ commands)
- [ ] Camera (15+ commands)
- [ ] Audio (15+ commands)
- [ ] Navigation & AI (15+ commands)
- [ ] Particle System (15+ commands)
- [ ] Timeline (10+ commands)
- [ ] Build & Player (15+ commands)
- [ ] Project Settings (20+ commands)
- [ ] Package Manager (10+ commands)
- [ ] Version Control (10+ commands)
- [ ] Profiler & Performance (15+ commands)
- [ ] Test Runner (10+ commands)
- [ ] Input System (10+ commands)
- [ ] UI Toolkit (10+ commands)
- [ ] Utility Commands (20+ commands)

## License

Apache License 2.0 - See [LICENSE](../../LICENSE) for details

## Related Plugins

- [Browser Pilot](../browser-pilot) - Browser automation via Chrome DevTools Protocol
- [Blender Toolkit](../blender-toolkit) - Blender 3D automation and scene management
- [Unity Dev Toolkit](../unity-dev-toolkit) - Unity development utilities and compile error fixing

## Documentation

- [COMMANDS.md](./skills/references/COMMANDS.md) - Complete command reference (500+ commands)
- [COMMANDS.ko.md](./skills/references/COMMANDS.ko.md) - Korean command reference
- [DATABASE_GUIDE.md](./skills/references/DATABASE_GUIDE.md) - Database usage guide

---

**Version**: 0.15.1
**Unity Version**: Unity 6+ (Database features require embedded SQLite support)
**Last Updated**: 2025-12-02
**Author**: Dev GOM
**Marketplace**: [dev-gom-plugins](https://github.com/Dev-GOM/claude-code-marketplace)
