# Unity Editor Toolkit - Unity Package

Real-time Unity Editor control via WebSocket for Claude Code integration.

## Installation

### Recommended: Unity Package Manager

1. Open Unity Editor
2. Window → Package Manager
3. Click `+` → Add package from git URL
4. Enter: `https://github.com/Dev-GOM/claude-code-marketplace.git?path=/plugins/unity-editor-toolkit/skills/assets/unity-package`
5. Click Add

### Alternative: Assets Folder

For easier customization, copy this folder to `Assets/UnityEditorToolkit/`

> **Note**: UPM installs to `Packages/` folder (read-only), while Assets allows direct modification.

## Quick Start

### 1. Open Server Window

1. Unity menu: `Tools > Unity Editor Toolkit > Server Window`
2. A new window will appear in the editor

### 2. Configure Plugin Scripts Path

1. **Plugin Scripts Path**: Auto-detected from user home folder (`~/.claude/plugins/...`)
2. If not detected, click "Browse" to select manually
3. Path should point to: `unity-editor-toolkit/skills/scripts`

### 3. Install CLI (One-time Setup)

1. Click "Install CLI" button
2. This builds the WebSocket server and TypeScript CLI
3. Wait for installation to complete (may take 1-2 minutes)
4. Console shows: "✓ CLI installation completed"

### 4. Server Auto-Start

1. Server starts automatically when Unity Editor opens
2. **Port**: Auto-assigned from range 9500-9600 (no manual configuration needed)
3. **Status file**: `{ProjectRoot}/.unity-websocket/server-status.json`
4. CLI automatically detects the correct port from this file

### 5. Connect from Claude Code

Install Unity Editor Toolkit plugin in Claude Code:

```bash
# Add marketplace
/plugin marketplace add https://github.com/Dev-GOM/claude-code-marketplace.git

# Install plugin
/plugin install unity-editor-toolkit@dev-gom-plugins
```

Use CLI commands:

```bash
# Find GameObject
cd <unity-project-root> node .unity-websocket/uw go find "Player"

# Set position
cd <unity-project-root> node .unity-websocket/uw tf set-position "Player" "0,5,10"

# Load scene
cd <unity-project-root> node .unity-websocket/uw scene load "GameScene"

# Get console logs
cd <unity-project-root> node .unity-websocket/uw console logs
```

## Requirements

### Unity Version
- **Unity 2020.3 or later**
- Fully compatible with **Unity 6+ (2023.x+)**

### Dependencies
- websocket-sharp library (see Dependencies section below)

### Test Framework (for running tests)
- **Unity 2019.2+**: Automatically included in all projects
- **Unity 6+ (2023.x+)**: Core Package (version locked to Editor) + new features

## Dependencies

### websocket-sharp

This package requires websocket-sharp for WebSocket communication.

**Installation:**

1. Download websocket-sharp from: https://github.com/sta/websocket-sharp/releases
2. Extract `websocket-sharp.dll`
3. Copy to `Packages/com.devgom.unity-editor-toolkit/ThirdParty/websocket-sharp/`
4. Unity will automatically import the DLL

**Alternative:**

Add via NuGet for Unity:
1. Install NuGet for Unity: https://github.com/GlitchEnzo/NuGetForUnity
2. Open NuGet window
3. Search "websocket-sharp"
4. Install

## Supported Commands

### GameObject (5 commands)
- `GameObject.Find` - Find GameObject by name
- `GameObject.Create` - Create new GameObject
- `GameObject.Destroy` - Destroy GameObject
- `GameObject.SetActive` - Set active state

### Transform (6 commands)
- `Transform.GetPosition` - Get world position
- `Transform.SetPosition` - Set world position
- `Transform.GetRotation` - Get rotation (Euler angles)
- `Transform.SetRotation` - Set rotation
- `Transform.GetScale` - Get local scale
- `Transform.SetScale` - Set local scale

### Scene (3 commands)
- `Scene.GetCurrent` - Get active scene info
- `Scene.GetAll` - Get all loaded scenes
- `Scene.Load` - Load scene (single or additive)

### Console (2 commands)
- `Console.GetLogs` - Get console logs with filtering
- `Console.Clear` - Clear console

### Hierarchy (1 command)
- `Hierarchy.Get` - Get GameObject hierarchy tree

## API Examples

### Find GameObject

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "GameObject.Find",
  "params": { "name": "Player" }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
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

### Set Position

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "Transform.SetPosition",
  "params": {
    "name": "Player",
    "position": { "x": 0, "y": 5, "z": 10 }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": { "success": true }
}
```

## Security

- **Localhost Only**: Server only accepts connections from 127.0.0.1
- **Editor Mode Only**: Server only runs in Editor, not in builds
- **Undo Support**: All operations support Unity's Undo system

## Troubleshooting

### Server Won't Start

1. Check Console for error messages
2. Verify port 9500 is not in use
3. Ensure websocket-sharp.dll is installed
4. Try different port number

### Cannot Connect

1. Verify server is running (check Console)
2. Confirm WebSocket URL: `ws://127.0.0.1:9500`
3. Check firewall settings
4. Ensure Unity Editor is open (Edit Mode or Play Mode)

### Commands Fail

1. Check Console for error details
2. Verify GameObject names are correct
3. Ensure scene is loaded
4. Check parameter format matches API

## Editor Window

Access server controls via Unity menu:

**Tools → Unity Editor Toolkit → Server Window**

Features:
- Server status monitoring
- Plugin scripts path configuration
- CLI installation and build
- Quick access to documentation

## Performance

- Minimal overhead: ~1-2ms per command
- Supports multiple concurrent clients
- Logs limited to 1000 entries
- Thread-safe operation

## Known Limitations

- Editor mode only (not available in builds)
- Single scene active command execution
- GameObject finding limited to active scene
- Console logs limited to 1000 recent entries

## Future Features

See [COMMANDS.md](../COMMANDS.md) for planned 500+ commands including:
- Component manipulation
- Material editing
- Prefab instantiation
- Asset database queries
- Animation control
- Physics simulation
- And much more...

## License

Apache License 2.0

## Links

- [GitHub Repository](https://github.com/Dev-GOM/claude-code-marketplace)
- [Plugin Documentation](../README.md)
- [Command Reference](../COMMANDS.md)
- [Issue Tracker](https://github.com/Dev-GOM/claude-code-marketplace/issues)

## Support

For issues, questions, or feature requests, please visit:
https://github.com/Dev-GOM/claude-code-marketplace/issues
