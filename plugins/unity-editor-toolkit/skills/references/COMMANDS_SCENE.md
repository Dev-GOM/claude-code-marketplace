# Unity Editor Toolkit - Scene Management Commands

Complete reference for scene management commands.

**Last Updated**: 2025-01-13

---

## cd <unity-project-root> node .unity-websocket/uw scene current

Get current active scene information.

**Usage:**
```bash
cd <unity-project-root> node .unity-websocket/uw scene current [options]
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
cd <unity-project-root> node .unity-websocket/uw scene current

# Get JSON output
cd <unity-project-root> node .unity-websocket/uw scene current --json
```

---

## cd <unity-project-root> node .unity-websocket/uw scene list

List all loaded scenes.

**Usage:**
```bash
cd <unity-project-root> node .unity-websocket/uw scene list [options]
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
cd <unity-project-root> node .unity-websocket/uw scene list

# Get JSON output
cd <unity-project-root> node .unity-websocket/uw scene list --json
```

---

## cd <unity-project-root> node .unity-websocket/uw scene load

Load scene by name or path.

**Usage:**
```bash
cd <unity-project-root> node .unity-websocket/uw scene load <name> [options]
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
cd <unity-project-root> node .unity-websocket/uw scene load "MainMenu"

# Load scene additively
cd <unity-project-root> node .unity-websocket/uw scene load "UIOverlay" --additive

# Load scene by path
cd <unity-project-root> node .unity-websocket/uw scene load "Assets/Scenes/Level1"
```

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
cd <unity-project-root> node .unity-websocket/uw --version

# Enable verbose logging
cd <unity-project-root> node .unity-websocket/uw --verbose scene current

# Use specific port
cd <unity-project-root> node .unity-websocket/uw --port 9501 scene load "Level1"
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
cd <unity-project-root> node .unity-websocket/uw scene load "Level1" --timeout 60000
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
