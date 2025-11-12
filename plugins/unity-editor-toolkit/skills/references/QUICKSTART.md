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
   https://github.com/Dev-GOM/claude-code-marketplace.git?path=/plugins/unity-editor-toolkit/skills/assets/unity-package
   ```
5. Click `Add` and wait for installation

> **Alternative**: If you prefer to install in Assets folder (for easier customization), copy `plugins/unity-editor-toolkit/skills/assets/unity-package/` to `Assets/UnityEditorToolkit/`

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

### 4. Setup WebSocket Server

1. Open Unity Editor Toolkit Server Window:
   - In Unity menu: `Tools > Unity Editor Toolkit > Server Window`
   - A new window will appear in the editor

2. Configure Plugin Scripts Path:
   - **Plugin Scripts Path**: Auto-detected from user home folder (`~/.claude/plugins/...`)
   - If not detected, click "Browse" to select manually
   - Path should point to: `unity-editor-toolkit/skills/scripts`

3. Install CLI (One-time Setup):
   - Click "Install CLI" button
   - This builds the WebSocket server and TypeScript CLI
   - Wait for installation to complete (may take 1-2 minutes)
   - Console shows: "✓ CLI installation completed"

4. Server Auto-Start:
   - Server starts automatically when Unity Editor opens
   - **Port**: Auto-assigned from range 9500-9600 (no manual configuration needed)
   - **Status file**: `{ProjectRoot}/.unity-websocket/server-status.json`
   - CLI automatically detects the correct port from this file
   - Check Console for: `✓ Unity Editor Server started on ws://127.0.0.1:XXXX`

## First Commands

Open your terminal in Claude Code and try these commands:

### 1. Check Connection Status

```bash
unity-editor status
```

Expected output:
```
✓ Connected to Unity Editor
WebSocket: ws://127.0.0.1:9500
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
- [ ] Unity Editor Toolkit Server Window opened (`Tools > Unity Editor Toolkit > Server Window`)
- [ ] Plugin scripts path configured correctly
- [ ] CLI installed successfully (click "Install CLI" button)
- [ ] Server started automatically (check Console for startup message)
- [ ] Status file created: `.unity-websocket/server-status.json`
- [ ] Console shows "✓ Unity Editor Server started on ws://127.0.0.1:XXXX"
- [ ] `unity-editor status` command works
- [ ] Can create/find GameObjects
- [ ] Can modify transforms
- [ ] No errors in Unity Console

## Troubleshooting

### "Server not found" or "Connection refused"

**Check:**
1. Unity Editor is open
2. Console shows server started message
3. Status file exists: `.unity-websocket/server-status.json` in project root
4. Port range 9500-9600 is not blocked by firewall
5. Server Window shows "Server Status: Running"

**Fix:**
```bash
# Check Unity project root for status file
ls -la .unity-websocket/

# Manually specify port if needed
unity-editor --port 9500 status
```

In Unity Server Window, check "Server Status" and restart if needed.

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

`Tools → Unity Editor Toolkit → Server Window`

Features:
- Install CLI (one-time setup)
- Configure plugin scripts path
- View server status (Running/Stopped)
- View connection info (port, status file location)
- Start/stop server manually
- Access documentation

## Support

**Issues:**
https://github.com/Dev-GOM/claude-code-marketplace/issues

**Documentation:**
- [Full README](./README.md)
- [Command Reference](./COMMANDS.md)
- [Unity Package Docs](../assets/unity-package/README.md)

---

**Congratulations!** 🎉 You've successfully set up Unity Editor Toolkit. You can now control Unity Editor directly from Claude Code!
