# Unity Editor Toolkit - GameObject & Hierarchy Commands

Complete reference for GameObject manipulation and hierarchy query commands.

**Last Updated**: 2025-01-13

---

## cd <unity-project-root> && node .unity-websocket/uw go find

Find GameObject by name or hierarchical path.

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw go find <name> [options]
```

**Arguments:**
```
<name>                 GameObject name or path (e.g., "Player" or "Environment/Trees/Oak")
```

**Options:**
```
-c, --with-components  Include component list in output
--with-children        Include children hierarchy
--full                 Include all details (components + children)
--json                 Output in JSON format
--timeout <ms>         Connection timeout in milliseconds (default: 30000)
-h, --help             Display help for command
```

**Examples:**
```bash
# Find GameObject by name
cd <unity-project-root> && node .unity-websocket/uw go find "Player"

# Find with full hierarchy path
cd <unity-project-root> && node .unity-websocket/uw go find "Environment/Terrain/Trees"

# Include component information
cd <unity-project-root> && node .unity-websocket/uw go find "Player" --with-components

# Get all details in JSON format
cd <unity-project-root> && node .unity-websocket/uw go find "Enemy" --full --json
```

---

## cd <unity-project-root> && node .unity-websocket/uw go create

Create new GameObject.

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw go create <name> [options]
```

**Arguments:**
```
<name>                 Name for the new GameObject
```

**Options:**
```
-p, --parent <parent>  Parent GameObject name or path
--primitive <type>     Create primitive: cube, sphere, cylinder, capsule, plane, quad
--json                 Output in JSON format
--timeout <ms>         Connection timeout in milliseconds (default: 30000)
-h, --help             Display help for command
```

**Examples:**
```bash
# Create empty GameObject
cd <unity-project-root> && node .unity-websocket/uw go create "NewObject"

# Create with parent
cd <unity-project-root> && node .unity-websocket/uw go create "Child" --parent "Parent"

# Create primitive
cd <unity-project-root> && node .unity-websocket/uw go create "MyCube" --primitive cube

# Create nested object
cd <unity-project-root> && node .unity-websocket/uw go create "Enemy" --parent "Enemies/Group1"
```

---

## cd <unity-project-root> && node .unity-websocket/uw go destroy

Destroy GameObject.

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw go destroy <name> [options]
```

**Arguments:**
```
<name>                 GameObject name or path to destroy
```

**Options:**
```
--json                 Output in JSON format
--timeout <ms>         Connection timeout in milliseconds (default: 30000)
-h, --help             Display help for command
```

**Examples:**
```bash
# Destroy GameObject
cd <unity-project-root> && node .unity-websocket/uw go destroy "OldObject"

# Destroy nested GameObject
cd <unity-project-root> && node .unity-websocket/uw go destroy "Enemies/Enemy1"

# Get JSON response
cd <unity-project-root> && node .unity-websocket/uw go destroy "Temp" --json
```

---

## cd <unity-project-root> && node .unity-websocket/uw go set-active

Set GameObject active state.

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw go set-active <name> <active> [options]
```

**Arguments:**
```
<name>                 GameObject name or path
<active>               Active state: true or false
```

**Options:**
```
--json                 Output in JSON format
--timeout <ms>         Connection timeout in milliseconds (default: 30000)
-h, --help             Display help for command
```

**Examples:**
```bash
# Activate GameObject
cd <unity-project-root> && node .unity-websocket/uw go set-active "Player" true

# Deactivate GameObject
cd <unity-project-root> && node .unity-websocket/uw go set-active "Enemy" false

# Set nested GameObject state
cd <unity-project-root> && node .unity-websocket/uw go set-active "UI/Menu/Settings" false
```

---

## cd <unity-project-root> && node .unity-websocket/uw go set-parent

Set or remove parent of GameObject.

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw go set-parent <name> [parent] [options]
```

**Arguments:**
```
<name>                 GameObject name or path
[parent]               Parent GameObject name (omit to remove parent)
```

**Options:**
```
--world-position-stays <bool>  Keep world position (default: true)
--json                 Output in JSON format
--timeout <ms>         Connection timeout in milliseconds (default: 30000)
-h, --help             Display help for command
```

**Examples:**
```bash
# Set parent (attach "Weapon" to "Player")
cd <unity-project-root> && node .unity-websocket/uw go set-parent "Weapon" "Player"

# Remove parent (detach to root)
cd <unity-project-root> && node .unity-websocket/uw go set-parent "Weapon"

# Set parent without keeping world position
cd <unity-project-root> && node .unity-websocket/uw go set-parent "Child" "Parent" --world-position-stays false

# Reparent nested object
cd <unity-project-root> && node .unity-websocket/uw go set-parent "UI/Menu" "Canvas"
```

---

## cd <unity-project-root> && node .unity-websocket/uw go get-parent

Get parent information of GameObject.

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw go get-parent <name> [options]
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
# Get parent info
cd <unity-project-root> && node .unity-websocket/uw go get-parent "Weapon"

# Check if object has parent
cd <unity-project-root> && node .unity-websocket/uw go get-parent "Player" --json

# Get parent of nested object
cd <unity-project-root> && node .unity-websocket/uw go get-parent "Enemies/Enemy1"
```

---

## cd <unity-project-root> && node .unity-websocket/uw go get-children

Get children of GameObject.

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw go get-children <name> [options]
```

**Arguments:**
```
<name>                 GameObject name or path
```

**Options:**
```
-r, --recursive        Get all descendants (not just direct children)
--json                 Output in JSON format
--timeout <ms>         Connection timeout in milliseconds (default: 30000)
-h, --help             Display help for command
```

**Examples:**
```bash
# Get direct children
cd <unity-project-root> && node .unity-websocket/uw go get-children "Player"

# Get all descendants recursively
cd <unity-project-root> && node .unity-websocket/uw go get-children "Player" --recursive

# Get children with JSON output
cd <unity-project-root> && node .unity-websocket/uw go get-children "Canvas" --json

# Count nested objects
cd <unity-project-root> && node .unity-websocket/uw go get-children "Environment" --recursive --json
```

---

## cd <unity-project-root> && node .unity-websocket/uw hierarchy

Query Unity GameObject hierarchy with tree visualization.

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw hierarchy [options]
```

**Options:**
```
-r, --root-only        Show only root GameObjects (no children)
-i, --include-inactive Include inactive GameObjects in output
-a, --active-only      Show only active GameObjects (opposite of -i)
-d, --depth <n>        Limit hierarchy depth (e.g., 2 for 2 levels)
-f, --filter <name>    Filter GameObjects by name (case-insensitive)
-c, --with-components  Include component information for each GameObject
--json                 Output in JSON format
--timeout <ms>         Connection timeout in milliseconds (default: 30000)
-h, --help             Display help for command
```

**Examples:**
```bash
# View full hierarchy
cd <unity-project-root> && node .unity-websocket/uw hierarchy

# Show only root GameObjects
cd <unity-project-root> && node .unity-websocket/uw hierarchy --root-only

# Limit depth to 2 levels
cd <unity-project-root> && node .unity-websocket/uw hierarchy --depth 2

# Filter by name
cd <unity-project-root> && node .unity-websocket/uw hierarchy --filter "enemy"

# Show only active GameObjects with components
cd <unity-project-root> && node .unity-websocket/uw hierarchy --active-only --with-components

# Get JSON output
cd <unity-project-root> && node .unity-websocket/uw hierarchy --json
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
cd <unity-project-root> && node .unity-websocket/uw --verbose hierarchy

# Use specific port
cd <unity-project-root> && node .unity-websocket/uw --port 9501 go find "Player"
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
cd <unity-project-root> && node .unity-websocket/uw hierarchy --timeout 60000
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
