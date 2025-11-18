# Unity Editor Toolkit - Transform Commands

Complete reference for Transform manipulation commands.

**Last Updated**: 2025-01-13

---

## cd <unity-project-root> && node .unity-websocket/uw tf get

Get Transform information (position, rotation, scale).

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw tf get <name> [options]
```

**Arguments:**
```
<name>                 GameObject name or path
```

**Options:**
```
--json                 Output in JSON format
--timeout <ms>         Connection timeout in milliseconds (default: 30000)
-h, --help             Display help for command
```

**Examples:**
```bash
# Get Transform info
cd <unity-project-root> && node .unity-websocket/uw tf get "Player"

# Get nested GameObject Transform
cd <unity-project-root> && node .unity-websocket/uw tf get "Environment/Trees/Oak"

# Get JSON output
cd <unity-project-root> && node .unity-websocket/uw tf get "Enemy" --json
```

---

## cd <unity-project-root> && node .unity-websocket/uw tf set-position

Set Transform position.

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw tf set-position <name> <position> [options]
```

**Arguments:**
```
<name>                 GameObject name or path
<position>             Position as "x,y,z" (e.g., "0,5,10")
```

**Options:**
```
--json                 Output in JSON format
--timeout <ms>         Connection timeout in milliseconds (default: 30000)
-h, --help             Display help for command
```

**Examples:**
```bash
# Set position
cd <unity-project-root> && node .unity-websocket/uw tf set-position "Player" "0,5,10"

# Set position with negative values
cd <unity-project-root> && node .unity-websocket/uw tf set-position "Enemy" "-5.5,0,3.2"

# Set nested GameObject position
cd <unity-project-root> && node .unity-websocket/uw tf set-position "UI/Menu/Button" "100,50,0"
```

---

## cd <unity-project-root> && node .unity-websocket/uw tf set-rotation

Set Transform rotation using Euler angles.

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw tf set-rotation <name> <rotation> [options]
```

**Arguments:**
```
<name>                 GameObject name or path
<rotation>             Euler angles as "x,y,z" in degrees (e.g., "0,90,0")
```

**Options:**
```
--json                 Output in JSON format
--timeout <ms>         Connection timeout in milliseconds (default: 30000)
-h, --help             Display help for command
```

**Examples:**
```bash
# Rotate 90 degrees on Y axis
cd <unity-project-root> && node .unity-websocket/uw tf set-rotation "Player" "0,90,0"

# Set rotation with all axes
cd <unity-project-root> && node .unity-websocket/uw tf set-rotation "Camera" "30,45,0"

# Reset rotation
cd <unity-project-root> && node .unity-websocket/uw tf set-rotation "Enemy" "0,0,0"
```

---

## cd <unity-project-root> && node .unity-websocket/uw tf set-scale

Set Transform scale.

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw tf set-scale <name> <scale> [options]
```

**Arguments:**
```
<name>                 GameObject name or path
<scale>                Scale as "x,y,z" (e.g., "2,2,2")
```

**Options:**
```
--json                 Output in JSON format
--timeout <ms>         Connection timeout in milliseconds (default: 30000)
-h, --help             Display help for command
```

**Examples:**
```bash
# Double size
cd <unity-project-root> && node .unity-websocket/uw tf set-scale "Cube" "2,2,2"

# Scale only on Y axis
cd <unity-project-root> && node .unity-websocket/uw tf set-scale "Platform" "1,0.5,1"

# Non-uniform scaling
cd <unity-project-root> && node .unity-websocket/uw tf set-scale "Wall" "5,3,0.2"
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
cd <unity-project-root> && node .unity-websocket/uw --version

# Enable verbose logging
cd <unity-project-root> && node .unity-websocket/uw --verbose tf get "Player"

# Use specific port
cd <unity-project-root> && node .unity-websocket/uw --port 9501 tf set-position "Enemy" "0,0,0"
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
cd <unity-project-root> && node .unity-websocket/uw tf get "Player" --timeout 60000
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
