# Chain Commands Reference

Execute multiple Unity commands sequentially with error handling.

## Command Format

```bash
cd <unity-project-root>
node .unity-websocket/uw.js chain <subcommand> [options]
```

## Subcommands

### chain execute

Execute commands from a JSON file.

**Usage:**
```bash
node .unity-websocket/uw.js chain execute <file> [options]
```

**Arguments:**
- `<file>` - Path to JSON file containing commands

**Options:**
- `--json` - Output in JSON format
- `--stop-on-error` - Stop on first error (default: true)
- `--continue-on-error` - Continue execution even if a command fails
- `--timeout <ms>` - Timeout in milliseconds (default: 300000 = 5 minutes)

**JSON File Format:**
```json
[
  {
    "method": "Editor.Refresh",
    "parameters": null
  },
  {
    "method": "GameObject.Create",
    "parameters": {
      "name": "TestObject"
    }
  },
  {
    "method": "Console.Clear"
  }
]
```

Or with wrapper:
```json
{
  "commands": [
    { "method": "Editor.Refresh" },
    { "method": "Console.Clear" }
  ]
}
```

**Examples:**
```bash
# Execute commands from file
cd <unity-project-root> && node .unity-websocket/uw.js chain execute commands.json

# Continue on error
cd <unity-project-root> && node .unity-websocket/uw.js chain execute commands.json --continue-on-error

# JSON output
cd <unity-project-root> && node .unity-websocket/uw.js chain execute commands.json --json
```

---

### chain exec

Execute commands inline (without JSON file).

**Usage:**
```bash
node .unity-websocket/uw.js chain exec <commands...> [options]
```

**Arguments:**
- `<commands...>` - One or more commands in format: `method:param1=value1,param2=value2`

**Options:**
- `--json` - Output in JSON format
- `--stop-on-error` - Stop on first error (default: true)
- `--continue-on-error` - Continue execution even if a command fails
- `--timeout <ms>` - Timeout in milliseconds (default: 300000 = 5 minutes)

**Command Format:**
- Simple: `"Editor.Refresh"`
- With params: `"GameObject.Create:name=Test"`
- Multiple params: `"GameObject.SetActive:instanceId=123,active=true"`

**Parameter Parsing:**
- Strings: `name=MyObject`
- Numbers: `instanceId=123`
- Booleans: `active=true` or `active=false`

**Examples:**
```bash
# Simple commands
cd <unity-project-root> && node .unity-websocket/uw.js chain exec "Editor.Refresh" "Console.Clear"

# Commands with parameters
cd <unity-project-root> && node .unity-websocket/uw.js chain exec \
  "GameObject.Create:name=Player" \
  "GameObject.SetActive:instanceId=123,active=true"

# Continue on error
cd <unity-project-root> && node .unity-websocket/uw.js chain exec \
  "Editor.Refresh" \
  "GameObject.Find:path=InvalidPath" \
  "Console.Clear" \
  --continue-on-error
```

---

## Important Notes

### Supported Commands

Chain supports **immediate response** commands only. The following are **NOT supported**:

❌ **Wait commands** (delayed response):
- `wait compile`
- `wait playmode`
- `wait sleep`
- `wait scene`

✅ **All other commands** (immediate response):
- GameObject commands
- Transform commands
- Scene commands
- Console commands
- Editor commands
- Prefs commands

**Workaround for Wait:**
```bash
# Instead of chaining Wait commands:
cd <unity-project-root>
node .unity-websocket/uw.js wait compile
node .unity-websocket/uw.js chain exec "Editor.Refresh" "Console.Clear"
```

### Error Handling

**Stop on Error (default):**
```bash
# Stops at first failure
node .unity-websocket/uw.js chain exec "Editor.Refresh" "Invalid.Command" "Console.Clear"
# Result: Refresh succeeds, Invalid.Command fails, Console.Clear skipped
```

**Continue on Error:**
```bash
# Continues despite failures
node .unity-websocket/uw.js chain exec "Editor.Refresh" "Invalid.Command" "Console.Clear" --continue-on-error
# Result: Refresh succeeds, Invalid.Command fails, Console.Clear succeeds
```

### Timeout Behavior

- Default timeout: **300 seconds (5 minutes)** for entire chain
- Each command has its own execution time
- Total elapsed time is reported in response

---

## Output Format

### CLI Output

**Success:**
```
✓ Chain execution completed
  Total commands: 3
  Executed: 3
  Total time: 0.015s

  [1] ✓ Editor.Refresh (0.010s)
  [2] ✓ GameObject.Create (0.003s)
  [3] ✓ Console.Clear (0.002s)
```

**With Errors:**
```
✓ Chain execution completed
  Total commands: 3
  Executed: 2
  Total time: 0.012s

  [1] ✓ Editor.Refresh (0.010s)
  [2] ✗ GameObject.Find (0.002s)
      Error: GameObject not found: InvalidPath
```

### JSON Output

**Success:**
```json
{
  "success": true,
  "totalCommands": 3,
  "executedCommands": 3,
  "totalElapsed": 0.015,
  "results": [
    {
      "index": 0,
      "method": "Editor.Refresh",
      "success": true,
      "result": { "success": true, "message": "AssetDatabase refreshed" },
      "elapsed": 0.010
    },
    {
      "index": 1,
      "method": "GameObject.Create",
      "success": true,
      "result": { "instanceId": 12345, "name": "TestObject" },
      "elapsed": 0.003
    },
    {
      "index": 2,
      "method": "Console.Clear",
      "success": true,
      "result": { "success": true, "cleared": 10 },
      "elapsed": 0.002
    }
  ]
}
```

**With Errors:**
```json
{
  "success": true,
  "totalCommands": 3,
  "executedCommands": 2,
  "totalElapsed": 0.012,
  "results": [
    {
      "index": 0,
      "method": "Editor.Refresh",
      "success": true,
      "result": { "success": true, "message": "AssetDatabase refreshed" },
      "elapsed": 0.010
    },
    {
      "index": 1,
      "method": "GameObject.Find",
      "success": false,
      "error": "GameObject not found: InvalidPath",
      "elapsed": 0.002
    }
  ]
}
```

---

## Common Workflows

### Cleanup Workflow

```json
{
  "commands": [
    { "method": "Console.Clear" },
    { "method": "Editor.Refresh" },
    { "method": "Scene.Load", "parameters": { "name": "MainScene" } }
  ]
}
```

```bash
cd <unity-project-root> && node .unity-websocket/uw.js chain execute cleanup.json
```

### GameObject Batch Creation

```bash
cd <unity-project-root> && node .unity-websocket/uw.js chain exec \
  "GameObject.Create:name=Player" \
  "GameObject.Create:name=Enemy" \
  "GameObject.Create:name=Pickup" \
  "Console.Clear"
```

### Error-Tolerant Cleanup

```json
{
  "commands": [
    { "method": "GameObject.Destroy", "parameters": { "path": "OldObject1" } },
    { "method": "GameObject.Destroy", "parameters": { "path": "OldObject2" } },
    { "method": "GameObject.Destroy", "parameters": { "path": "OldObject3" } },
    { "method": "Console.Clear" }
  ]
}
```

```bash
# Continue even if some objects don't exist
cd <unity-project-root> && node .unity-websocket/uw.js chain execute cleanup.json --continue-on-error
```

### CI/CD Pipeline

```bash
#!/bin/bash
cd /path/to/unity/project

# Cleanup
node .unity-websocket/uw.js chain exec "Console.Clear" "Editor.Refresh"

# Wait for compilation
node .unity-websocket/uw.js wait compile

# Run tests (example)
node .unity-websocket/uw.js chain exec \
  "Scene.Load:name=TestScene" \
  "GameObject.Find:path=TestRunner" \
  "Console.Clear"
```
