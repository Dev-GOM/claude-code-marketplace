---
name: unity-editor-toolkit
description: |
  Unity Editor control and automation, WebSocket-based real-time communication. 유니티에디터제어및자동화, WebSocket기반실시간통신.

  Features/기능: GameObject control 게임오브젝트제어, Transform manipulation 트랜스폼조작, Component management 컴포넌트관리, Scene management 씬관리, Material/Rendering 머티리얼/렌더링, Prefab system 프리팹시스템, Asset Database 애셋데이터베이스, Animation 애니메이션, Physics 물리, Console logging 콘솔로깅, Editor automation 에디터자동화, Build pipeline 빌드파이프라인, Lighting 라이팅, Camera 카메라, Audio 오디오, Navigation 네비게이션, Particles 파티클, Timeline 타임라인, UI Toolkit, Profiler 프로파일러, Test Runner 테스트러너.

  Protocol 프로토콜: JSON-RPC 2.0 over WebSocket (port 9500-9600). 500+ commands 명령어, 25 categories 카테고리. Real-time bidirectional communication 실시간양방향통신.

  Security 보안: Defense-in-depth 심층방어 (path traversal protection 경로순회방지, command injection defense 명령어인젝션방어, JSON injection prevention JSON인젝션방지). Localhost-only connections 로컬호스트전용. Cross-platform 크로스플랫폼 (Windows, macOS, Linux).
---

## Purpose

Unity Editor Toolkit enables comprehensive Unity Editor automation and control from Claude Code. It provides:

- **Extensive Command Coverage**: 500+ commands spanning 25 Unity Editor categories
- **Real-time Communication**: Instant bidirectional WebSocket connection (JSON-RPC 2.0)
- **Deep Editor Integration**: GameObject/hierarchy, transforms, components, scenes, materials, prefabs, animation, physics, lighting, build pipeline, and more
- **Security First**: Multi-layer defense against injection attacks and unauthorized access
- **Production Ready**: Cross-platform support with robust error handling and logging

**Always run scripts with `--help` first** to see usage. DO NOT read the source until you try running the script first and find that a customized solution is abslutely necessary. These scripts can be very large and thus pollute your context window. They exist to be called directly as black-box scripts rather than ingested into your context window.

## When to Use

Use Unity Editor Toolkit when you need to:

1. **Automate Unity Editor Tasks**
   - Create and manipulate GameObjects, components, and hierarchies
   - Configure scenes, materials, and rendering settings
   - Control animation, physics, and particle systems
   - Manage assets, prefabs, and build pipelines

2. **Real-time Unity Testing**
   - Monitor console logs and errors during development
   - Query GameObject states and component properties
   - Test scene configurations and gameplay logic
   - Debug rendering, physics, or animation issues

3. **Batch Operations**
   - Create multiple GameObjects with specific configurations
   - Apply material/shader changes across multiple objects
   - Setup scene hierarchies from specifications
   - Automate repetitive Editor tasks

4. **CI/CD Integration**
   - Automated builds with platform-specific settings
   - Test Runner integration for unit/integration tests
   - Asset validation and integrity checks
   - Build pipeline automation

## Prerequisites

### Unity Project Setup

1. **Install Unity Editor Toolkit Server Package**
   - Via Unity Package Manager (Git URL or local path)
   - Requires Unity 2020.3 or higher
   - Package location: `skills/assets/unity-package`

2. **Configure WebSocket Server**
   - Open Unity menu: `Tools > Unity Editor Toolkit > Server Window`
   - Plugin scripts path auto-detected from `~/.claude/plugins/...`
   - Click "Install CLI" to build WebSocket server (one-time setup)
   - Server starts automatically when Unity Editor opens

3. **Server Status**
   - Port: Auto-assigned from range 9500-9600
   - Status file: `{ProjectRoot}/.unity-websocket/server-status.json`
   - CLI automatically detects correct port from this file

4. **Dependencies**
   - websocket-sharp (install via package installation scripts)
   - Newtonsoft.Json (Unity's built-in version)

### Claude Code Plugin

The Unity Editor Toolkit plugin provides CLI commands for Unity Editor control.

## Core Workflow

### 1. Connection

Unity Editor Toolkit CLI automatically:

- Detects Unity project via `.unity-websocket/server-status.json`
- Reads port information from status file (9500-9600 range)
- Connects to WebSocket server if Unity Editor is running

### 2. Execute Commands

Unity Editor Toolkit provides 18 commands across 6 categories. All commands run from the Unity project root:

```bash
cd <unity-project-root> node .unity-websocket/uw <command> [options]
```

**Available Categories** (Phase 1 - Currently Implemented):

1. **Connection & Status** - Check server connection and port status
2. **GameObject & Hierarchy** - Find, create, destroy, activate GameObjects and query hierarchy
3. **Transform** - Get/set position, rotation, scale
4. **Scene Management** - Query current scene, list scenes, load scenes
5. **Asset Database & Editor** - Refresh AssetDatabase, recompile scripts, reimport assets
6. **Console & Logging** - Get logs with filtering, clear console

**Quick Examples:**

```bash
# Check connection
cd <unity-project-root> node .unity-websocket/uw status

# View hierarchy
cd <unity-project-root> node .unity-websocket/uw hierarchy

# Find GameObject
cd <unity-project-root> node .unity-websocket/uw go find "Player"

# Set position
cd <unity-project-root> node .unity-websocket/uw tf set-position "Player" "0,5,10"

# Load scene
cd <unity-project-root> node .unity-websocket/uw scene load "Level1"

# Get console errors
cd <unity-project-root> node .unity-websocket/uw console logs --errors-only
```

**Detailed Documentation:**

For complete command reference with all options, see:
- [Connection & Status Commands](./references/COMMANDS_CONNECTION_STATUS.md)
- [GameObject & Hierarchy Commands](./references/COMMANDS_GAMEOBJECT_HIERARCHY.md)
- [Transform Commands](./references/COMMANDS_TRANSFORM.md)
- [Scene Management Commands](./references/COMMANDS_SCENE.md)
- [Asset Database & Editor Commands](./references/COMMANDS_EDITOR.md)
- [Console & Logging Commands](./references/COMMANDS_CONSOLE.md)

### 3. Check Connection Status

```bash
# Verify WebSocket connection
cd <unity-project-root> node .unity-websocket/uw status

# Use custom port
cd <unity-project-root> node .unity-websocket/uw --port 9301 status
```

### 4. Complex Workflows

**Create and configure GameObject:**
```bash
cd <unity-project-root> node .unity-websocket/uw go create "Enemy" && \
cd <unity-project-root> node .unity-websocket/uw tf set-position "Enemy" "10,0,5" && \
cd <unity-project-root> node .unity-websocket/uw tf set-rotation "Enemy" "0,45,0"
```

**Load scene and activate GameObject:**
```bash
cd <unity-project-root> node .unity-websocket/uw scene load "Level1" && \
cd <unity-project-root> node .unity-websocket/uw go set-active "Boss" true
```

**Batch GameObject creation:**
```bash
for i in {1..10}; do
  cd <unity-project-root> node .unity-websocket/uw go create "Cube_$i" && \
  cd <unity-project-root> node .unity-websocket/uw tf set-position "Cube_$i" "$i,0,0"
done
```

## Best Practices

1. **Always Verify Connection**
   - Run `cd <unity-project-root> node .unity-websocket/uw status` before executing commands
   - Ensure Unity Editor is running and server component is active

2. **Use Hierarchical Paths**
   - Prefer full paths for nested GameObjects: `"Environment/Terrain/Trees"`
   - Avoids ambiguity when multiple GameObjects share the same name

3. **Monitor Console Logs**
   - Use `cd <unity-project-root> node .unity-websocket/uw console logs --errors-only` to catch errors during automation
   - Clear console before running automation scripts for clean logs

4. **Batch Operations Carefully**
   - Add delays between commands if creating many GameObjects
   - Consider Unity Editor performance limitations

5. **Connection Management**
   - Unity Editor Toolkit uses localhost-only connections (127.0.0.1)
   - Port range limited to 9500-9600 to avoid conflicts with other tools

6. **Error Handling**
   - Commands return JSON-RPC error responses for invalid operations
   - Check exit codes and error messages in automation scripts

7. **Port Management**
   - Default port 9500 works for most projects
   - Use `--port` flag if running multiple Unity Editor instances
   - Plugin avoids conflicts with Browser Pilot (9222-9322) and Blender Toolkit (9400-9500)

8. **Development Roadmap Awareness**
   - **Phase 1 (Current)**: GameObject, Transform, Scene, Console - 15 commands
   - **Phase 2+**: Component, Material, Prefab, Animation, Physics, Build - 485+ commands coming soon
   - See full roadmap in [COMMANDS.md](./references/COMMANDS.md)

## References

Detailed documentation available in the `references/` folder:

- **[QUICKSTART.md](../QUICKSTART.md)** - Quick setup and first commands (English)
- **[QUICKSTART.ko.md](../QUICKSTART.ko.md)** - Quick setup guide (Korean)
- **[COMMANDS.md](./references/COMMANDS.md)** - Complete 500+ command roadmap (English)
- **Implemented Command Categories:**
  - [Connection & Status](./references/COMMANDS_CONNECTION_STATUS.md)
  - [GameObject & Hierarchy](./references/COMMANDS_GAMEOBJECT_HIERARCHY.md)
  - [Transform](./references/COMMANDS_TRANSFORM.md)
  - [Scene Management](./references/COMMANDS_SCENE.md)
  - [Asset Database & Editor](./references/COMMANDS_EDITOR.md)
  - [Console & Logging](./references/COMMANDS_CONSOLE.md)
- **[API_COMPATIBILITY.md](../API_COMPATIBILITY.md)** - Unity version compatibility (2020.3 - Unity 6)
- **[TEST_GUIDE.md](../TEST_GUIDE.md)** - Unity C# server testing guide (English)
- **[TEST_GUIDE.ko.md](../TEST_GUIDE.ko.md)** - Unity C# server testing guide (Korean)

Unity C# server package available in `assets/unity-package/` - install via Unity Package Manager once released.

---

**Status**: 🧪 Experimental - Phase 1 (15 commands implemented)
**Unity Version Support**: 2020.3 - Unity 6
**Protocol**: JSON-RPC 2.0 over WebSocket
**Port Range**: 9500-9600 (auto-assigned)
