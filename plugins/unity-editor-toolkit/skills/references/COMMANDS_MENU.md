# Menu Execution Commands

Unity Editor의 메뉴 항목을 프로그래밍 방식으로 실행하고 조회할 수 있는 명령어입니다.

## Available Commands

| Command | Description |
|---------|-------------|
| `menu run` | Execute a Unity Editor menu item by path |
| `menu list` | List available menu items with optional filtering |

---

## menu run

Unity Editor 메뉴 항목을 경로로 실행합니다.

### Usage

```bash
cd <unity-project-root> && node .unity-websocket/uw menu run <menuPath> [options]
```

### Parameters

- `<menuPath>` - Menu item path (e.g., "Window/General/Console", "Assets/Refresh")

### Options

- `--json` - Output in JSON format
- `--timeout <ms>` - WebSocket connection timeout in milliseconds (default: 30000)

### Examples

```bash
# Open Console window
cd <unity-project-root> && node .unity-websocket/uw menu run "Window/General/Console"

# Refresh AssetDatabase
cd <unity-project-root> && node .unity-websocket/uw menu run "Assets/Refresh"

# Open Project Settings
cd <unity-project-root> && node .unity-websocket/uw menu run "Edit/Project Settings..."

# JSON output
cd <unity-project-root> && node .unity-websocket/uw menu run "Window/General/Inspector" --json
```

### Response

**Success:**
```json
{
  "success": true,
  "menuPath": "Window/General/Console",
  "message": "Menu item 'Window/General/Console' executed successfully"
}
```

**Error:**
```json
{
  "error": "Menu item not found: Invalid/Menu/Path"
}
```

### Notes

- Menu path must match exactly (case-sensitive)
- Some menu items may require specific Unity Editor states
- Menu execution is synchronous - waits for completion
- Not all menu items can be executed programmatically

---

## menu list

사용 가능한 Unity Editor 메뉴 항목을 조회합니다.

### Usage

```bash
cd <unity-project-root> && node .unity-websocket/uw menu list [options]
```

### Options

- `--filter <pattern>` - Filter menu items by pattern (supports * wildcard)
- `--json` - Output in JSON format
- `--timeout <ms>` - WebSocket connection timeout in milliseconds (default: 30000)

### Examples

```bash
# List all known menu items
cd <unity-project-root> && node .unity-websocket/uw menu list

# Filter by pattern (wildcard)
cd <unity-project-root> && node .unity-websocket/uw menu list --filter "*Window*"
cd <unity-project-root> && node .unity-websocket/uw menu list --filter "Assets/*"
cd <unity-project-root> && node .unity-websocket/uw menu list --filter "*General*"

# JSON output
cd <unity-project-root> && node .unity-websocket/uw menu list --filter "*Console*" --json
```

### Response

**Success:**
```json
{
  "success": true,
  "menuItems": [
    "Window/General/Console",
    "Window/General/Inspector",
    "Window/General/Hierarchy",
    "Window/General/Project",
    "Assets/Refresh",
    "Edit/Project Settings..."
  ],
  "count": 6,
  "filter": "*General*"
}
```

### Filter Patterns

- `*pattern` - Ends with pattern
- `pattern*` - Starts with pattern
- `*pattern*` - Contains pattern
- `pattern` - Exact match or contains

### Notes

- Returns a predefined list of common Unity menu items
- Wildcard filtering is case-insensitive
- Some menu items may vary by Unity version
- Use exact menu paths with `menu run` command

---

## Common Menu Paths

### Window Menu
```
Window/General/Console
Window/General/Inspector
Window/General/Hierarchy
Window/General/Project
Window/General/Scene
Window/General/Game
Window/Analysis/Profiler
Window/Package Manager
```

### Assets Menu
```
Assets/Refresh
Assets/Reimport
Assets/Reimport All
Assets/Find References In Scene
```

### Edit Menu
```
Edit/Project Settings...
Edit/Preferences...
Edit/Play
Edit/Pause
Edit/Step
```

### GameObject Menu
```
GameObject/Create Empty
GameObject/Create Empty Child
GameObject/3D Object/Cube
GameObject/3D Object/Sphere
GameObject/Light/Directional Light
```

---

## Use Cases

### 1. Open Editor Windows
```bash
# Open Console for debugging
cd <unity-project-root> && node .unity-websocket/uw menu run "Window/General/Console"

# Open Profiler for performance analysis
cd <unity-project-root> && node .unity-websocket/uw menu run "Window/Analysis/Profiler"
```

### 2. Asset Management
```bash
# Refresh AssetDatabase after external changes
cd <unity-project-root> && node .unity-websocket/uw menu run "Assets/Refresh"

# Reimport all assets
cd <unity-project-root> && node .unity-websocket/uw menu run "Assets/Reimport All"
```

### 3. Editor Settings
```bash
# Open Project Settings
cd <unity-project-root> && node .unity-websocket/uw menu run "Edit/Project Settings..."

# Open Preferences
cd <unity-project-root> && node .unity-websocket/uw menu run "Edit/Preferences..."
```

### 4. Playmode Control
```bash
# Enter Play mode
cd <unity-project-root> && node .unity-websocket/uw menu run "Edit/Play"

# Pause
cd <unity-project-root> && node .unity-websocket/uw menu run "Edit/Pause"

# Step frame
cd <unity-project-root> && node .unity-websocket/uw menu run "Edit/Step"
```

---

## Error Handling

### Menu Not Found
```
Error: Menu item not found: Invalid/Path
```
**Solution**: Use `menu list` to find valid menu paths

### Menu Execution Failed
```
Error: Failed to execute menu: <reason>
```
**Solution**: Check Unity Editor state and menu item availability

### Connection Failed
```
Error: Unity server not running
```
**Solution**: Ensure Unity Editor WebSocket server is running

---

## Best Practices

1. **Verify Menu Paths**: Use `menu list` to verify correct paths
2. **Case Sensitivity**: Menu paths are case-sensitive
3. **Error Handling**: Always check response for success/error
4. **Timeout**: Increase timeout for slow menu operations
5. **JSON Output**: Use `--json` for programmatic parsing
