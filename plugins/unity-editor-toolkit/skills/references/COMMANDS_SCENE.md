# Unity Editor Toolkit - Scene Management Commands

Complete reference for scene management commands.

**Last Updated**: 2025-01-25
**Commands**: 7 commands

---

## cd <unity-project-root> && node .unity-websocket/uw scene current

Get current active scene information.

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw scene current [options]
```

**Options:**
```
--json                 Output in JSON format
--timeout <ms>         Connection timeout in milliseconds (default: 30000)
-h, --help             Display help for command
```

**Examples:**
```bash
# Get current scene info
cd <unity-project-root> && node .unity-websocket/uw scene current

# Get JSON output
cd <unity-project-root> && node .unity-websocket/uw scene current --json
```

---

## cd <unity-project-root> && node .unity-websocket/uw scene list

List all loaded scenes.

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw scene list [options]
```

**Options:**
```
--json                 Output in JSON format
--timeout <ms>         Connection timeout in milliseconds (default: 30000)
-h, --help             Display help for command
```

**Examples:**
```bash
# List all scenes
cd <unity-project-root> && node .unity-websocket/uw scene list

# Get JSON output
cd <unity-project-root> && node .unity-websocket/uw scene list --json
```

---

## cd <unity-project-root> && node .unity-websocket/uw scene load

Load scene by name or path.

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw scene load <name> [options]
```

**Arguments:**
```
<name>                 Scene name or path (without .unity extension)
```

**Options:**
```
-a, --additive         Load scene additively (don't unload current scenes)
--json                 Output in JSON format
--timeout <ms>         Connection timeout in milliseconds (default: 30000)
-h, --help             Display help for command
```

**Examples:**
```bash
# Load scene (replace current)
cd <unity-project-root> && node .unity-websocket/uw scene load "MainMenu"

# Load scene additively
cd <unity-project-root> && node .unity-websocket/uw scene load "UIOverlay" --additive

# Load scene by path
cd <unity-project-root> && node .unity-websocket/uw scene load "Assets/Scenes/Level1"
```

---

## cd <unity-project-root> && node .unity-websocket/uw scene new

Create a new scene.

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw scene new [options]
```

**Options:**
```
-e, --empty            Create empty scene (no default camera/light)
-a, --additive         Add new scene without replacing current scenes
--json                 Output in JSON format
--timeout <ms>         Connection timeout in milliseconds (default: 30000)
-h, --help             Display help for command
```

**Examples:**
```bash
# Create new scene with default objects (Main Camera, Directional Light)
cd <unity-project-root> && node .unity-websocket/uw scene new

# Create empty scene
cd <unity-project-root> && node .unity-websocket/uw scene new --empty

# Create new scene additively (keep current scenes)
cd <unity-project-root> && node .unity-websocket/uw scene new --additive

# Create empty scene additively
cd <unity-project-root> && node .unity-websocket/uw scene new -e -a
```

---

## cd <unity-project-root> && node .unity-websocket/uw scene save

Save scene to disk.

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw scene save [path] [options]
```

**Arguments:**
```
[path]                 Optional path for Save As (e.g., "Assets/Scenes/NewScene.unity")
```

**Options:**
```
-s, --scene <name>     Specific scene name to save (default: active scene)
--json                 Output in JSON format
--timeout <ms>         Connection timeout in milliseconds (default: 30000)
-h, --help             Display help for command
```

**Examples:**
```bash
# Save active scene
cd <unity-project-root> && node .unity-websocket/uw scene save

# Save As - save to new location
cd <unity-project-root> && node .unity-websocket/uw scene save "Assets/Scenes/Level2.unity"

# Save specific scene (multi-scene editing)
cd <unity-project-root> && node .unity-websocket/uw scene save --scene "UIScene"
```

---

## cd <unity-project-root> && node .unity-websocket/uw scene unload

Unload a scene from the editor.

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw scene unload <name> [options]
```

**Arguments:**
```
<name>                 Scene name or path to unload
```

**Options:**
```
-r, --remove           Remove scene completely (default: just unload/close)
--json                 Output in JSON format
--timeout <ms>         Connection timeout in milliseconds (default: 30000)
-h, --help             Display help for command
```

**Examples:**
```bash
# Unload scene by name
cd <unity-project-root> && node .unity-websocket/uw scene unload "UIOverlay"

# Unload scene by path
cd <unity-project-root> && node .unity-websocket/uw scene unload "Assets/Scenes/Level1.unity"

# Remove scene completely
cd <unity-project-root> && node .unity-websocket/uw scene unload "TempScene" --remove
```

**Note:** Cannot unload the last remaining scene. At least one scene must always be loaded.

---

## cd <unity-project-root> && node .unity-websocket/uw scene set-active

Set a scene as the active scene (for multi-scene editing).

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw scene set-active <name> [options]
```

**Arguments:**
```
<name>                 Scene name or path to set as active
```

**Options:**
```
--json                 Output in JSON format
--timeout <ms>         Connection timeout in milliseconds (default: 30000)
-h, --help             Display help for command
```

**Examples:**
```bash
# Set active scene by name
cd <unity-project-root> && node .unity-websocket/uw scene set-active "MainScene"

# Set active scene by path
cd <unity-project-root> && node .unity-websocket/uw scene set-active "Assets/Scenes/Level1.unity"
```

**Note:** The target scene must be loaded before it can be set as active.

---

## Global Options

All commands support these global options:

```
-V, --version          Output the version number
-v, --verbose          Enable verbose logging
-p, --port <number>    Unity WebSocket port (overrides auto-detection)
-h, --help             Display help for command
```

**Examples:**
```bash
# Check CLI version
cd <unity-project-root> && node .unity-websocket/uw --version

# Enable verbose logging
cd <unity-project-root> && node .unity-websocket/uw --verbose scene current

# Use specific port
cd <unity-project-root> && node .unity-websocket/uw --port 9501 scene load "Level1"
```

---

## Notes

### Port Auto-Detection

Unity Editor Toolkit CLI automatically detects the Unity WebSocket server port by reading `.unity-websocket/server-status.json` in the Unity project directory. You only need to specify `--port` if:
- Running multiple Unity Editor instances
- Server is using non-default port range

### JSON Output

All commands support `--json` flag for machine-readable output. Useful for:
- CI/CD pipelines
- Automation scripts
- Integration with other tools

### Timeout Configuration

Default timeout is 30 seconds (30000ms). Increase for operations that may take longer:

```bash
# Longer timeout for complex operations
cd <unity-project-root> && node .unity-websocket/uw scene load "Level1" --timeout 60000
```

### Error Handling

Commands return appropriate exit codes:
- `0`: Success
- `1`: Error (connection failed, command failed, invalid parameters, etc.)

Check error messages for details on failures.

---

**See Also:**
- [QUICKSTART.md](../../QUICKSTART.md) - Quick setup and first commands
- [COMMANDS.md](./COMMANDS.md) - Complete command roadmap
- [API_COMPATIBILITY.md](../../API_COMPATIBILITY.md) - Unity version compatibility
- [TEST_GUIDE.md](../../TEST_GUIDE.md) - Unity C# server testing guide
