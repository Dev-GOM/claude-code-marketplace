# Unity Editor Toolkit - Connection & Status Commands

Complete reference for connection and status commands.

**Last Updated**: 2025-01-13

---

## cd <unity-project-root> && node .unity-websocket/uw status

Check Unity WebSocket connection status.

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw status
```

**Options:**
```
-p, --port <number>    Unity WebSocket port (default: auto-detect from status file)
-v, --verbose          Enable verbose logging
-h, --help             Display help for command
```

**Example:**
```bash
# Check default connection
cd <unity-project-root> && node .unity-websocket/uw status

# Check specific port
cd <unity-project-root> && node .unity-websocket/uw --port 9500 status
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
cd <unity-project-root> && node .unity-websocket/uw --verbose status

# Use specific port
cd <unity-project-root> && node .unity-websocket/uw --port 9501 status
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
cd <unity-project-root> && node .unity-websocket/uw status --timeout 60000
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
