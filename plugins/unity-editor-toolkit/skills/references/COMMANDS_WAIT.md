# Wait Commands Reference

Wait for various Unity conditions before proceeding.

## Command Format

```bash
cd <unity-project-root>
node .unity-websocket/uw.js wait <subcommand> [options]
```

## Subcommands

### wait compile

Wait for Unity compilation to complete.

**Usage:**
```bash
node .unity-websocket/uw.js wait compile [options]
```

**Options:**
- `--json` - Output in JSON format
- `--timeout <ms>` - Timeout in milliseconds (default: 300000 = 5 minutes)

**Examples:**
```bash
# Wait for compilation to complete
cd <unity-project-root> && node .unity-websocket/uw.js wait compile

# Custom timeout (30 seconds)
cd <unity-project-root> && node .unity-websocket/uw.js wait compile --timeout 30000
```

**Use Cases:**
- Wait after making code changes
- Ensure compilation is done before running tests
- Sequential automation workflows

---

### wait playmode

Wait for specific play mode state.

**Usage:**
```bash
node .unity-websocket/uw.js wait playmode <state> [options]
```

**Arguments:**
- `<state>` - Target state: `enter`, `exit`, or `pause`

**Options:**
- `--json` - Output in JSON format
- `--timeout <ms>` - Timeout in milliseconds (default: 300000 = 5 minutes)

**Examples:**
```bash
# Wait for play mode to start
cd <unity-project-root> && node .unity-websocket/uw.js wait playmode enter

# Wait for play mode to exit
cd <unity-project-root> && node .unity-websocket/uw.js wait playmode exit

# Wait for pause
cd <unity-project-root> && node .unity-websocket/uw.js wait playmode pause
```

**Use Cases:**
- Synchronize with play mode testing
- Wait for game to start before sending commands
- Automation workflows that require play mode

---

### wait sleep

Sleep for a specified duration.

**Usage:**
```bash
node .unity-websocket/uw.js wait sleep <seconds> [options]
```

**Arguments:**
- `<seconds>` - Duration in seconds (can be decimal, e.g., 0.5 for half a second)

**Options:**
- `--json` - Output in JSON format
- `--timeout <ms>` - Timeout in milliseconds (must be greater than sleep duration)

**Examples:**
```bash
# Sleep for 2 seconds
cd <unity-project-root> && node .unity-websocket/uw.js wait sleep 2

# Sleep for half a second
cd <unity-project-root> && node .unity-websocket/uw.js wait sleep 0.5

# Sleep with custom timeout
cd <unity-project-root> && node .unity-websocket/uw.js wait sleep 5 --timeout 10000
```

**Use Cases:**
- Add delays between commands
- Wait for UI animations
- Rate limiting in automation

---

### wait scene

Wait for scene to finish loading (play mode only).

**Usage:**
```bash
node .unity-websocket/uw.js wait scene [options]
```

**Options:**
- `--json` - Output in JSON format
- `--timeout <ms>` - Timeout in milliseconds (default: 300000 = 5 minutes)

**Examples:**
```bash
# Wait for scene to load
cd <unity-project-root> && node .unity-websocket/uw.js wait scene
```

**Requirements:**
- Unity must be in play mode
- Scene must be actively loading or just loaded

**Use Cases:**
- Wait after loading a new scene
- Ensure scene is ready before running tests
- Sequential scene loading workflows

---

## Important Notes

### Delayed Response Model

Wait commands use a **delayed response** model:
1. Command is sent to Unity
2. Unity registers the wait condition
3. Connection remains open
4. Unity monitors the condition every frame
5. Response is sent when condition is met or timeout occurs

### Timeout Behavior

- Default timeout: **300 seconds (5 minutes)**
- If condition is met before timeout: Success response
- If timeout occurs: Error response with timeout message
- Recommendation: Set timeout longer than expected wait time

### Domain Reload Handling

If Unity compiles scripts (domain reload) while waiting:
- All pending wait requests are **automatically cancelled**
- Clients receive error: "Script compilation started, request cancelled"
- This prevents orphaned wait requests

### Server Stop Handling

If Unity WebSocket server stops while waiting:
- All pending wait requests are **automatically cancelled**
- Clients receive error: "Server stopping"

---

## JSON Output Format

When using `--json` flag:

**Success:**
```json
{
  "success": true,
  "type": "sleep",
  "seconds": 2,
  "message": "Slept for 2 seconds"
}
```

**Error:**
```json
{
  "jsonrpc": "2.0",
  "id": "...",
  "error": {
    "code": -32000,
    "message": "Wait condition timed out after 300 seconds"
  }
}
```

---

## Common Workflows

### Wait for Compilation then Execute

```bash
# Wait for compilation, then refresh AssetDatabase
cd <unity-project-root>
node .unity-websocket/uw.js wait compile
node .unity-websocket/uw.js editor refresh
```

### Sequential Scene Loading

```bash
# Load scene, wait for it, then do something
cd <unity-project-root>
node .unity-websocket/uw.js scene load MainMenu
node .unity-websocket/uw.js wait scene
node .unity-websocket/uw.js gameobject find "StartButton"
```

### Rate-Limited Automation

```bash
# Do something, wait, repeat
cd <unity-project-root>
for i in {1..5}; do
  node .unity-websocket/uw.js console logs --limit 10
  node .unity-websocket/uw.js wait sleep 1
done
```
