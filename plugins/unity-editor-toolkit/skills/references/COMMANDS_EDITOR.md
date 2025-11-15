# Unity Editor Toolkit - Asset Database & Editor Utilities Commands

Complete reference for Asset Database refresh, recompilation, and asset reimport commands.

**Last Updated**: 2025-01-13

---

## cd <unity-project-root> && node .unity-websocket/uw editor refresh

Refresh Unity AssetDatabase (generates/updates meta files, triggers compilation).

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw editor refresh [options]
```

**Options:**
```
--json                 Output in JSON format
--timeout <ms>         Connection timeout in milliseconds (default: 30000)
-h, --help             Display help for command
```

**⚠️ Important Note:**
After running `refresh`, you should check Unity Editor for compilation status. Unity's incremental compilation will automatically compile changed assemblies.

**Examples:**
```bash
# Refresh AssetDatabase
cd <unity-project-root> && node .unity-websocket/uw editor refresh

# Get JSON output
cd <unity-project-root> && node .unity-websocket/uw editor refresh --json
```

---

## cd <unity-project-root> && node .unity-websocket/uw editor recompile

Request script recompilation.

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw editor recompile [options]
```

**Options:**
```
--json                 Output in JSON format
--timeout <ms>         Connection timeout in milliseconds (default: 30000)
-h, --help             Display help for command
```

**⚠️ Important Note:**
Unity's incremental compilation automatically recompiles changed assemblies. This command forces a recompilation check. Check Unity Editor for compilation status after running.

**Examples:**
```bash
# Request recompilation
cd <unity-project-root> && node .unity-websocket/uw editor recompile

# Get JSON output
cd <unity-project-root> && node .unity-websocket/uw editor recompile --json
```

---

## cd <unity-project-root> && node .unity-websocket/uw editor reimport

Reimport specific asset (triggers recompilation for that Assembly).

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw editor reimport <path> [options]
```

**Arguments:**
```
<path>                 Asset path relative to Assets folder (e.g., "XLua" or "Scripts/Player.cs")
```

**Options:**
```
--json                 Output in JSON format
--timeout <ms>         Connection timeout in milliseconds (default: 30000)
-h, --help             Display help for command
```

**⚠️ Important Note:**
After running `reimport`, check Unity Editor for reimport and compilation status.

**Examples:**
```bash
# Reimport folder
cd <unity-project-root> && node .unity-websocket/uw editor reimport "XLua"

# Reimport specific asset
cd <unity-project-root> && node .unity-websocket/uw editor reimport "Scripts/Player.cs"

# Reimport .asmdef (recompiles specific Assembly)
cd <unity-project-root> && node .unity-websocket/uw editor reimport "MyPlugin/Editor/MyPlugin.Editor.asmdef"
```

---

## cd <unity-project-root> && node .unity-websocket/uw editor execute

Execute a static method marked with `[ExecutableMethod]` attribute.

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw editor execute <commandName> [options]
```

**Arguments:**
```
<commandName>          Command name to execute (e.g., reinstall-cli)
```

**Options:**
```
--json                 Output in JSON format
--timeout <ms>         Connection timeout in milliseconds (default: 30000)
-h, --help             Display help for command
```

**Examples:**
```bash
# Reinstall CLI
cd <unity-project-root> && node .unity-websocket/uw editor execute reinstall-cli

# List available commands first
cd <unity-project-root> && node .unity-websocket/uw editor list

# Get JSON output
cd <unity-project-root> && node .unity-websocket/uw editor execute reinstall-cli --json
```

**Security:**
Only methods explicitly marked with `[ExecutableMethod]` attribute can be executed. This prevents arbitrary code execution.

---

## cd <unity-project-root> && node .unity-websocket/uw editor list

List all executable methods available via `editor execute` command.

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw editor list [options]
```

**Options:**
```
--json                 Output in JSON format
--timeout <ms>         Connection timeout in milliseconds (default: 30000)
-h, --help             Display help for command
```

**Examples:**
```bash
# List all executable methods
cd <unity-project-root> && node .unity-websocket/uw editor list

# Get JSON output
cd <unity-project-root> && node .unity-websocket/uw editor list --json
```

**Output Format:**
```
✓ Found 1 executable method(s):

  reinstall-cli
    Reinstall Unity Editor Toolkit CLI
    UnityEditorToolkit.Editor.EditorServerWindow.ReinstallCLI
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
cd <unity-project-root> && node .unity-websocket/uw --verbose editor refresh

# Use specific port
cd <unity-project-root> && node .unity-websocket/uw --port 9501 editor recompile
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
cd <unity-project-root> && node .unity-websocket/uw editor refresh --timeout 60000
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
