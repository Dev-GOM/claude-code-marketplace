# Unity Editor Toolkit - Console & Logging Commands

Complete reference for Unity console log retrieval and clearing commands.

**Last Updated**: 2025-01-13

---

## cd <unity-project-root> && node .unity-websocket/uw console logs

Get Unity console logs.

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw console logs [options]
```

**Options:**
```
-n, --limit <number>   Number of recent logs to fetch (default: 50)
-e, --errors-only      Show only errors and exceptions
-w, --warnings         Include warnings in output
-t, --type <type>      Filter by log type: error, warning, log, exception, assert
-f, --filter <text>    Filter logs by text (case-insensitive)
-v, --verbose          Show full stack traces (default: first 5 lines only)
--json                 Output in JSON format
--timeout <ms>         Connection timeout in milliseconds (default: 30000)
-h, --help             Display help for command
```

**Examples:**
```bash
# Get last 50 logs
cd <unity-project-root> && node .unity-websocket/uw console logs

# Get only errors
cd <unity-project-root> && node .unity-websocket/uw console logs --errors-only

# Get last 100 logs with warnings
cd <unity-project-root> && node .unity-websocket/uw console logs --limit 100 --warnings

# Filter logs by text
cd <unity-project-root> && node .unity-websocket/uw console logs --filter "player"

# Get specific log type
cd <unity-project-root> && node .unity-websocket/uw console logs --type error

# Get verbose output with full stack traces
cd <unity-project-root> && node .unity-websocket/uw console logs --verbose --errors-only

# Get JSON output
cd <unity-project-root> && node .unity-websocket/uw console logs --json
```

---

## cd <unity-project-root> && node .unity-websocket/uw console clear

Clear Unity console.

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw console clear [options]
```

**Options:**
```
--json                 Output in JSON format
--timeout <ms>         Connection timeout in milliseconds (default: 30000)
-h, --help             Display help for command
```

**Examples:**
```bash
# Clear console
cd <unity-project-root> && node .unity-websocket/uw console clear

# Get JSON output
cd <unity-project-root> && node .unity-websocket/uw console clear --json
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
cd <unity-project-root> && node .unity-websocket/uw --verbose console logs

# Use specific port
cd <unity-project-root> && node .unity-websocket/uw --port 9501 console logs
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
cd <unity-project-root> && node .unity-websocket/uw console logs --timeout 60000
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
