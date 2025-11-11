# Unity Editor Toolkit

Complete Unity Editor control and automation toolkit for Claude Code. Command 500+ Unity Editor features across 25 categories - GameObjects, components, scenes, materials, physics, animation, and more through real-time WebSocket automation.

## Features

- **500+ Commands**: Comprehensive control across 25 Unity Editor categories
- **Real-time WebSocket**: Instant bidirectional communication (port 9300-9400)
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
- **Security Hardened**: Defense against path traversal, command injection, JSON injection
- **Cross-Platform**: Full Windows, macOS, Linux support

## Installation

This plugin is part of the [Dev GOM Plugins](https://github.com/Dev-GOM/claude-code-marketplace) marketplace.

### Install from Marketplace

Add the marketplace to your Claude Code settings:

```json
{
  "plugins": {
    "marketplaces": [
      {
        "name": "dev-gom-plugins",
        "url": "https://github.com/Dev-GOM/claude-code-marketplace"
      }
    ]
  }
}
```

Then enable the plugin:

```json
{
  "plugins": {
    "enabled": ["dev-gom-plugins:unity-editor-toolkit"]
  }
}
```

### Manual Installation

1. Clone this repository
2. Copy `plugins/unity-editor-toolkit` to your Claude Code plugins directory
3. Restart Claude Code

## Usage

### Unity Setup (Coming Soon)

The Unity C# WebSocket server package is under development. Once released:

1. Install Unity Editor Toolkit Server package via Package Manager
2. Add `UnityEditorServer` component to a GameObject
3. Server automatically starts on port 9300 (configurable)

### CLI Commands

See [COMMANDS.md](./skills/references/COMMANDS.md) for complete 500+ command reference.

#### Currently Implemented (15 commands)

**Hierarchy**
```bash
# View GameObject hierarchy with tree visualization
unity-editor hierarchy

# Show only root GameObjects
unity-editor hierarchy --root-only

# Include inactive GameObjects
unity-editor hierarchy --include-inactive
```

**GameObject**
```bash
# Find GameObject by name or path
unity-editor go find "Player"
unity-editor go find "Environment/Terrain"

# Create new GameObject
unity-editor go create "NewObject"
unity-editor go create "Child" --parent "Parent"

# Destroy GameObject
unity-editor go destroy "OldObject"

# Set active state
unity-editor go set-active "Player" true
unity-editor go set-active "Enemy" false
```

**Transform**
```bash
# Get Transform information
unity-editor tf get "Player"

# Set position (x,y,z)
unity-editor tf set-position "Player" "0,5,10"

# Set rotation (Euler angles in degrees)
unity-editor tf set-rotation "Player" "0,90,0"

# Set scale
unity-editor tf set-scale "Player" "2,2,2"
```

**Scene**
```bash
# Get current scene info
unity-editor scene current

# List all loaded scenes
unity-editor scene list

# Load scene by name
unity-editor scene load "GameScene"

# Load scene additively
unity-editor scene load "UIScene" --additive
```

**Console**
```bash
# Get recent console logs (default: 50)
unity-editor console logs

# Get specific number of logs
unity-editor console logs --count 100

# Show only errors and exceptions
unity-editor console logs --errors-only

# Include warnings
unity-editor console logs --warnings

# Clear console
unity-editor console clear
```

**Status**
```bash
# Check connection status
unity-editor status

# Use custom port
unity-editor --port 9301 status
```

#### Coming Soon (500+ commands)

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
unity-editor go create "Enemy" && \
unity-editor tf set-position "Enemy" "10,0,5" && \
unity-editor tf set-rotation "Enemy" "0,45,0"
```

**Instantiate Prefab and modify:**
```bash
unity-editor prefab instantiate "Prefabs/Player" --position "0,1,0" && \
unity-editor material set-color "Player" "_Color" "0,1,0,1"
```

**Load scene and activate GameObject:**
```bash
unity-editor scene load "Level1" && \
unity-editor go set-active "Boss" true
```

**Monitor console errors in real-time:**
```bash
unity-editor console stream --filter error
```

**Batch GameObject creation:**
```bash
for i in {1..10}; do
  unity-editor go create "Cube_$i" && \
  unity-editor tf set-position "Cube_$i" "$i,0,0"
done
```

## Architecture

### Components

- **SessionStart/SessionEnd Hooks**: Automatic project initialization and cleanup
- **WebSocket Client**: JSON-RPC 2.0 protocol with TypeScript implementation
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

### Port Allocation

- **Range**: 9300-9400 (100 ports)
- **No Conflicts**: Avoids Browser Pilot (9222-9322) and Blender Toolkit (9400-9500)
- **Auto-selection**: Finds available port on initialization

## Security

Defense-in-depth security implementation:

- **Path Traversal Protection**: `path.resolve()` validation with `..` detection
- **Command Injection Defense**: Sanitized npm execution and environment isolation
- **JSON Injection Prevention**: Runtime type validation for all structures
- **Log Injection Defense**: Message sanitization prevents log manipulation
- **WebSocket Security**: Localhost-only connections
- **Port Validation**: Enforced 9300-9400 range
- **Atomic Operations**: Race-condition-free lock acquisition (`{ flag: 'wx' }`)
- **Memory Safety**: Proper event listener cleanup

## Development

### Project Structure

```
unity-editor-toolkit/
├── .claude-plugin/
│   └── plugin.json              # Plugin metadata
├── hooks/
│   └── hooks.json               # SessionStart/SessionEnd hooks
├── scripts/
│   ├── shared/
│   │   └── hook-utils.js        # Security utilities
│   ├── init-config.js           # SessionStart hook
│   └── cleanup-config.js        # SessionEnd hook
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

**Phase 1 (Current)**: GameObject, Transform, Scene, Console - 15 commands
**Phase 2**: Component, Material, Prefab - 100+ commands
**Phase 3**: Animation, Physics, Lighting - 150+ commands
**Phase 4**: Build, Profiler, Test Runner - 100+ commands
**Phase 5**: Advanced features (Timeline, UI Toolkit, VCS) - 150+ commands

See [COMMANDS.md](./skills/references/COMMANDS.md) for detailed roadmap.

## Coming Soon

### Unity C# Server Package
- [ ] WebSocket server with websocket-sharp
- [ ] JSON-RPC 2.0 handler framework
- [ ] Command routing and execution
- [ ] Unity Package Manager integration

### Commands (500+)
- [x] GameObject & Hierarchy (15 commands)
- [x] Transform (8 commands)
- [x] Scene Management (3 commands)
- [x] Console & Logging (2 commands)
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

## Contributing

Contributions welcome! Please read [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## Documentation

- [COMMANDS.md](./skills/references/COMMANDS.md) - Complete command reference (500+ commands)
- [COMMANDS.ko.md](./skills/references/COMMANDS.ko.md) - Korean command reference

---

**Version**: 0.1.0
**Last Updated**: 2025-11-11
**Author**: Dev GOM
**Marketplace**: [dev-gom-plugins](https://github.com/Dev-GOM/claude-code-marketplace)
