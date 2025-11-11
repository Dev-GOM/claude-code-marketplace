# Unity Editor Toolkit - Quick Start Guide

Complete setup guide from installation to first command execution.

## Prerequisites

- Unity 2020.3 or later
- Claude Code installed
- Basic familiarity with Unity Editor

## Installation Steps

### 1. Install Claude Code Plugin

Open Claude Code settings and add:

```json
{
  "plugins": {
    "marketplaces": [
      {
        "name": "dev-gom-plugins",
        "url": "https://github.com/Dev-GOM/claude-code-marketplace"
      }
    ],
    "enabled": ["dev-gom-plugins:unity-editor-toolkit"]
  }
}
```

### 2. Install Unity Package (via Package Manager)

1. Open Unity Editor
2. Go to `Window → Package Manager`
3. Click `+` button (top-left) → `Add package from git URL`
4. Enter this URL:
   ```
   https://github.com/Dev-GOM/claude-code-marketplace.git?path=/plugins/unity-editor-toolkit/unity-package
   ```
5. Click `Add` and wait for installation

> **Alternative**: If you prefer to install in Assets folder (for easier customization), copy `plugins/unity-editor-toolkit/unity-package/` to `Assets/UnityEditorToolkit/`

### 3. Install websocket-sharp DLL

The package requires websocket-sharp DLL. Find the installation scripts in Package Manager:

1. In Package Manager, select "Unity Editor Toolkit"
2. Look for "Samples" section and import "Installation Scripts"
3. Or navigate manually to:
   ```
   Packages/com.devgom.unity-editor-toolkit/ThirdParty/websocket-sharp/
   ```

**Windows**: Double-click `install.bat`
**macOS/Linux**: Run `./install.sh` in terminal

**Manual Installation** (if automatic fails):
1. Download: https://github.com/sta/websocket-sharp/releases/download/1.0.3-rc11/websocket-sharp.dll
2. Place in: `Packages/com.devgom.unity-editor-toolkit/ThirdParty/websocket-sharp/websocket-sharp.dll`

### 4. Setup Unity Server

1. In Unity, create new GameObject:
   - Right-click in Hierarchy → `Create Empty`
   - Rename to "UnityEditorServer"

2. Add Server Component:
   - Select "UnityEditorServer" GameObject
   - In Inspector: `Add Component`
   - Search: "Unity Editor Server"
   - Click to add

3. Configure Settings:
   - **Port**: 9300 (default, can change if needed)
   - **Auto Start**: ✓ Checked

4. Enter Play Mode:
   - Click Play button (or Ctrl+P)
   - Check Console for: `✓ Unity Editor Server started on ws://127.0.0.1:9300`

## First Commands

Open your terminal in Claude Code and try these commands:

### 1. Check Connection Status

```bash
unity-editor status
```

Expected output:
```
✓ Connected to Unity Editor
WebSocket: ws://127.0.0.1:9300
Status: Running
```

### 2. Find a GameObject

```bash
unity-editor go find "Main Camera"
```

Expected output:
```
✓ GameObject found:
  Name: Main Camera
  Instance ID: 12345
  Path: /Main Camera
  Active: true
  Tag: MainCamera
  Layer: 0
```

### 3. Create New GameObject

```bash
unity-editor go create "TestCube"
```

Check Unity Hierarchy - you should see a new "TestCube" GameObject!

### 4. Set Position

```bash
unity-editor tf set-position "TestCube" "5,2,3"
```

In Unity Scene view, "TestCube" moves to position (5, 2, 3).

### 5. Get Scene Info

```bash
unity-editor scene current
```

Shows information about the currently active scene.

### 6. View Hierarchy

```bash
unity-editor hierarchy
```

Displays entire GameObject hierarchy in tree format.

### 7. Get Console Logs

```bash
unity-editor console logs --count 10
```

Shows last 10 console log entries.

## Verification Checklist

- [ ] Claude Code plugin installed and enabled
- [ ] Unity package imported successfully
- [ ] websocket-sharp.dll in correct location
- [ ] UnityEditorServer GameObject created
- [ ] Server component configured (port 9300, auto-start)
- [ ] Play Mode active
- [ ] Console shows "✓ Unity Editor Server started"
- [ ] `unity-editor status` command works
- [ ] Can create/find GameObjects
- [ ] Can modify transforms
- [ ] No errors in Unity Console

## Troubleshooting

### "Server not found" or "Connection refused"

**Check:**
1. Unity is in Play Mode
2. Console shows server started message
3. Port 9300 is not blocked by firewall
4. UnityEditorServer component is on a GameObject

**Fix:**
```bash
# Try different port
unity-editor --port 9301 status
```

In Unity, change Server component port to 9301.

### "Assembly 'websocket-sharp' not found"

**Fix:**
1. Verify DLL location: `ThirdParty/websocket-sharp/websocket-sharp.dll`
2. Restart Unity Editor
3. Check Console for import errors
4. Try reimporting: Right-click package → Reimport

### Commands timeout or fail

**Check:**
1. GameObject names are correct (case-sensitive)
2. Scene is loaded
3. Unity didn't enter Error state
4. Server is still running (check Console)

**Fix:**
```bash
# Check server status first
unity-editor status

# Try simple command
unity-editor go find "Main Camera"
```

### Unity Console shows errors

**Common Issues:**

**"NullReferenceException"**
- GameObject name doesn't exist
- Scene not loaded
- Component not found

**"JsonException"**
- Malformed command parameters
- Check parameter format in docs

**"SocketException"**
- Port already in use
- Firewall blocking connection
- Try different port

## Next Steps

### Learn More Commands

See [COMMANDS.md](./COMMANDS.md) for complete 500+ command reference.

**Currently Available (17 commands):**
- GameObject: Find, Create, Destroy, SetActive
- Transform: Get/Set Position, Rotation, Scale
- Scene: GetCurrent, GetAll, Load
- Console: GetLogs, Clear
- Hierarchy: Get

### Advanced Usage

**Batch Operations:**
```bash
# Create multiple cubes
for i in {1..5}; do
  unity-editor go create "Cube_$i"
  unity-editor tf set-position "Cube_$i" "$i,0,0"
done
```

**Script Integration:**
```bash
# Save hierarchy to file
unity-editor hierarchy > hierarchy.json

# Monitor console in real-time
unity-editor console stream --filter error
```

### Editor Window

Access server control panel:

`Window → Unity Editor Toolkit → Server Control`

Features:
- Start/stop server
- Configure port
- View connection status
- Access documentation

## Support

**Issues:**
https://github.com/Dev-GOM/claude-code-marketplace/issues

**Documentation:**
- [Full README](./README.md)
- [Command Reference](./COMMANDS.md)
- [Unity Package Docs](./unity-package/README.md)

---

**Congratulations!** 🎉 You've successfully set up Unity Editor Toolkit. You can now control Unity Editor directly from Claude Code!
