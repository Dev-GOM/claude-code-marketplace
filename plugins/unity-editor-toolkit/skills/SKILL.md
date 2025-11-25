---
name: unity-editor-toolkit
description: |
  Unity Editor control and automation, WebSocket-based real-time communication. 유니티에디터제어및자동화, WebSocket기반실시간통신.

  Features/기능: GameObject control 게임오브젝트제어, Transform manipulation 트랜스폼조작, Component management 컴포넌트관리, Scene management 씬관리, SQLite database integration SQLite데이터베이스통합, GUID-based persistence GUID기반영구식별, Multi-scene synchronization 멀티씬동기화, Command Pattern with Undo/Redo 명령패턴실행취소재실행, Menu execution 메뉴실행, ScriptableObject management 스크립터블오브젝트관리, Array/List manipulation 배열리스트조작, All field types support 모든필드타입지원, Material/Rendering 머티리얼/렌더링, Prefab system 프리팹시스템, Asset Database 애셋데이터베이스, Animation 애니메이션, Physics 물리, Console logging 콘솔로깅, EditorPrefs management 에디터프리퍼런스관리, Editor automation 에디터자동화, Build pipeline 빌드파이프라인, Lighting 라이팅, Camera 카메라, Audio 오디오, Navigation 네비게이션, Particles 파티클, Timeline 타임라인, UI Toolkit, Profiler 프로파일러, Test Runner 테스트러너.

  Protocol 프로토콜: JSON-RPC 2.0 over WebSocket (port 9500-9600). 500+ commands 명령어, 25 categories 카테고리. Real-time bidirectional communication 실시간양방향통신.

  Security 보안: Defense-in-depth 심층방어 (path traversal protection 경로순회방지, command injection defense 명령어인젝션방어, JSON injection prevention JSON인젝션방지, SQL injection prevention SQL인젝션방지, transaction safety 트랜잭션안전성). Localhost-only connections 로컬호스트전용. Cross-platform 크로스플랫폼 (Windows, macOS, Linux).
---

## Purpose

Unity Editor Toolkit enables comprehensive Unity Editor automation and control from Claude Code. It provides:

- **Extensive Command Coverage**: 500+ commands spanning 25 Unity Editor categories
- **Real-time Communication**: Instant bidirectional WebSocket connection (JSON-RPC 2.0)
- **SQLite Database Integration**: Real-time GameObject synchronization with GUID-based persistence
  - **GUID-based Identification**: Persistent GameObject tracking across Unity sessions
  - **Multi-scene Support**: Synchronize all loaded scenes simultaneously (1s interval)
  - **Command Pattern**: Undo/Redo support for database operations
  - **Auto Migration**: Automatic schema migration system
  - **Batch Operations**: Efficient bulk inserts, updates, and deletes (500 objects/batch)
- **Menu Execution**: Run Unity Editor menu items programmatically (Window, Assets, Edit, GameObject menus)
- **ScriptableObject Management**: Complete CRUD operations with array/list support and all field types
  - **Array/List Operations**: Add, remove, get, clear elements with nested access (`items[0].name`)
  - **All Field Types**: Integer, Float, String, Boolean, Vector*, Color, Quaternion, Bounds, AnimationCurve, ObjectReference, and more
  - **Nested Property Traversal**: Access deeply nested fields with dot notation and array indices
- **Deep Editor Integration**: GameObject/hierarchy, transforms, components, scenes, materials, prefabs, animation, physics, lighting, build pipeline, and more
- **Security First**: Multi-layer defense against injection attacks (SQL, command, JSON, path traversal) and unauthorized access
- **Production Ready**: Cross-platform support with robust error handling and logging

**Always run scripts with `--help` first** to see usage. DO NOT read the source until you try running the script first and find that a customized solution is abslutely necessary. These scripts can be very large and thus pollute your context window. They exist to be called directly as black-box scripts rather than ingested into your context window.

---

## 📚 문서 우선 원칙 (필수)

**⚠️ CRITICAL**: Unity Editor Toolkit skill을 사용할 때는 **반드시 다음 순서를 따르세요:**

### 1️⃣ Reference 문서 확인 (필수)
명령어를 사용하기 전에 **반드시** `skills/references/` 폴더의 해당 문서를 읽으세요:
- **[COMMANDS.md](./references/COMMANDS.md)** - 모든 명령어의 카테고리 및 개요
- **Category-specific docs** - 사용할 명령어의 카테고리 문서:
  - [Component Commands](./references/COMMANDS_COMPONENT.md) - comp list/add/remove/enable/disable/get/set/inspect/move-up/move-down/copy
  - [GameObject Commands](./references/COMMANDS_GAMEOBJECT_HIERARCHY.md) - go find/create/destroy/set-active/set-parent/get-parent/get-children
  - [Transform Commands](./references/COMMANDS_TRANSFORM.md) - tf get/set-position/set-rotation/set-scale
  - [Scene Commands](./references/COMMANDS_SCENE.md) - scene current/list/load/new/save/unload/set-active
  - [Console Commands](./references/COMMANDS_CONSOLE.md) - console logs/clear
  - [EditorPrefs Commands](./references/COMMANDS_PREFS.md) - prefs get/set/delete/list/clear/import
  - [Other Categories](./references/COMMANDS.md) - 추가 명령어 카테고리

### 2️⃣ `--help` 실행
```bash
# 모든 명령어 확인
cd <unity-project-root> && node .unity-websocket/uw --help

# 특정 명령어의 옵션 확인
cd <unity-project-root> && node .unity-websocket/uw <command> --help
```

### 3️⃣ 예제 실행
reference 문서의 **Examples 섹션**을 참고하여 명령어를 실행하세요.

### 4️⃣ 소스 코드 읽기 (최후의 수단)
- reference 문서와 --help만으로는 해결 안 될 때만 소스 코드를 읽으세요
- 소스 코드는 컨텍스트 윈도우를 많이 차지하므로 가능하면 피하세요

**이 순서를 무시하면:**
- ❌ 명령어 사용법을 잘못 이해할 수 있음
- ❌ 옵션을 놓쳐서 원하지 않는 결과가 나올 수 있음
- ❌ 컨텍스트 윈도우를 낭비할 수 있음

---

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

4. **Menu and Editor Automation**
   - Execute Unity Editor menu items programmatically (`menu run "Window/General/Console"`)
   - Open editor windows and tools via command line
   - Automate asset refresh, reimport, and build operations
   - Query available menu items with wildcard filtering

5. **ScriptableObject Management**
   - Create and configure ScriptableObject assets programmatically
   - Read and modify all field types (Vector, Color, Quaternion, AnimationCurve, etc.)
   - Manipulate arrays/lists with full CRUD operations
   - Access nested properties with array index notation (`items[0].stats.health`)
   - Query ScriptableObject types and inspect asset metadata

6. **Database-Driven Workflows**
   - Persistent GameObject tracking across Unity sessions with GUID-based identification
   - Real-time synchronization of all loaded scenes to SQLite database
   - Analytics and querying of GameObject hierarchies and properties
   - Undo/Redo support for database operations via Command Pattern
   - Efficient batch operations (500 objects/batch) for large scene management

7. **CI/CD Integration**
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

3. **Database Setup** (Optional)
   - In the Server window, switch to "Database" tab
   - Click "Connect" to initialize SQLite database
   - Database file location: `{ProjectRoot}/.unity-websocket/unity-editor.db`
   - Click "Start Sync" to enable real-time GameObject synchronization (1s interval)
   - **GUID Components**: GameObjects are automatically tagged with persistent GUIDs
   - **Multi-scene**: All loaded scenes are synchronized automatically
   - **Analytics**: View sync stats, database health, and Undo/Redo history

4. **Server Status**
   - Port: Auto-assigned from range 9500-9600
   - Status file: `{ProjectRoot}/.unity-websocket/server-status.json`
   - CLI automatically detects correct port from this file

5. **Dependencies**
   - websocket-sharp (install via package installation scripts)
   - Newtonsoft.Json (Unity's built-in version)
   - Cysharp.UniTask (for async/await database operations)
   - SQLite-net (embedded SQLite database)

### Claude Code Plugin

The Unity Editor Toolkit plugin provides CLI commands for Unity Editor control.

## Core Workflow

### 1. Connection

Unity Editor Toolkit CLI automatically:

- Detects Unity project via `.unity-websocket/server-status.json`
- Reads port information from status file (9500-9600 range)
- Connects to WebSocket server if Unity Editor is running

### 2. Execute Commands

⚠️ **Before executing ANY command, check the reference documentation for your command category** (see "📚 문서 우선 원칙" section above).

Unity Editor Toolkit provides 40+ commands across 12+ categories. All commands run from the Unity project root:

```bash
cd <unity-project-root> && node .unity-websocket/uw <command> [options]
```

**Available Categories** (Implemented):

| # | Category | Commands | Reference |
|---|----------|----------|-----------|
| 1 | Connection & Status | 1 | [COMMANDS_CONNECTION_STATUS.md](./references/COMMANDS_CONNECTION_STATUS.md) |
| 2 | GameObject & Hierarchy | 8 | [COMMANDS_GAMEOBJECT_HIERARCHY.md](./references/COMMANDS_GAMEOBJECT_HIERARCHY.md) |
| 3 | Transform | 4 | [COMMANDS_TRANSFORM.md](./references/COMMANDS_TRANSFORM.md) |
| 4 | **Component** ✨ | 10 | [COMMANDS_COMPONENT.md](./references/COMMANDS_COMPONENT.md) |
| 5 | Scene Management | 7 | [COMMANDS_SCENE.md](./references/COMMANDS_SCENE.md) |
| 6 | Asset Database & Editor | 3 | [COMMANDS_EDITOR.md](./references/COMMANDS_EDITOR.md) |
| 7 | Console & Logging | 2 | [COMMANDS_CONSOLE.md](./references/COMMANDS_CONSOLE.md) |
| 8 | EditorPrefs Management | 6 | [COMMANDS_PREFS.md](./references/COMMANDS_PREFS.md) |
| 9 | Wait Commands | 4 | [COMMANDS_WAIT.md](./references/COMMANDS_WAIT.md) |
| 10 | Chain Commands | 2 | [COMMANDS_CHAIN.md](./references/COMMANDS_CHAIN.md) |
| 11 | Menu Execution | 2 | [COMMANDS_MENU.md](./references/COMMANDS_MENU.md) |
| 12 | Asset Management | 9 | [COMMANDS_ASSET.md](./references/COMMANDS_ASSET.md) |

**Usage:**

```bash
cd <unity-project-root> && node .unity-websocket/uw <command> [options]
```

**Required: Check Documentation**

```bash
# 1. 먼저 명령어 카테고리의 reference 문서를 읽으세요
# 예: Component 명령어 사용 → skills/references/COMMANDS_COMPONENT.md 읽기

# 2. --help로 명령어 옵션 확인
cd <unity-project-root> && node .unity-websocket/uw --help
cd <unity-project-root> && node .unity-websocket/uw <command> --help

# 3. reference 문서의 예제를 참고하여 실행
```

**📖 Complete Documentation by Category**

**Required Reading**: Before using any command, read the **Category-specific reference document**:
- 🔴 **MUST READ FIRST** - [COMMANDS.md](./references/COMMANDS.md) - Overview and command roadmap
- 🔴 **MUST READ** - Category-specific docs (links in the table above)
  - [Component Commands](./references/COMMANDS_COMPONENT.md) - **NEW**: comp list/add/remove/enable/disable/get/set/inspect/move-up/move-down/copy
  - [GameObject Commands](./references/COMMANDS_GAMEOBJECT_HIERARCHY.md) - go find/create/destroy/set-active/set-parent/get-parent/get-children
  - [Transform Commands](./references/COMMANDS_TRANSFORM.md) - tf get/set-position/set-rotation/set-scale
  - [Scene Commands](./references/COMMANDS_SCENE.md) - scene current/list/load/new/save/unload/set-active
  - [Console Commands](./references/COMMANDS_CONSOLE.md) - console logs/clear
  - [EditorPrefs Commands](./references/COMMANDS_PREFS.md) - prefs get/set/delete/list/clear/import
  - [Other Categories](./references/COMMANDS.md) - Full list with all categories

### 3. Check Connection Status

```bash
# Verify WebSocket connection
cd <unity-project-root> && node .unity-websocket/uw status

# Use custom port
cd <unity-project-root> && node .unity-websocket/uw --port 9301 status
```

### 4. Complex Workflows

**Create and configure GameObject:**
```bash
cd <unity-project-root> && node .unity-websocket/uw go create "Enemy" && \
cd <unity-project-root> && node .unity-websocket/uw tf set-position "Enemy" "10,0,5" && \
cd <unity-project-root> && node .unity-websocket/uw tf set-rotation "Enemy" "0,45,0"
```

**Load scene and activate GameObject:**
```bash
cd <unity-project-root> && node .unity-websocket/uw scene load "Level1" && \
cd <unity-project-root> && node .unity-websocket/uw go set-active "Boss" true
```

**Batch GameObject creation:**
```bash
for i in {1..10}; do
  cd <unity-project-root> && node .unity-websocket/uw go create "Cube_$i" && \
  cd <unity-project-root> && node .unity-websocket/uw tf set-position "Cube_$i" "$i,0,0"
done
```

**Wait for compilation then execute:**
```bash
# Make code changes, then wait for compilation to finish
cd <unity-project-root> && node .unity-websocket/uw wait compile && \
cd <unity-project-root> && node .unity-websocket/uw editor refresh
```

**Chain multiple commands sequentially:**
```bash
# Execute commands from JSON file
cd <unity-project-root> && node .unity-websocket/uw chain execute commands.json

# Execute commands inline
cd <unity-project-root> && node .unity-websocket/uw chain exec \
  "GameObject.Create:name=Player" \
  "GameObject.SetActive:instanceId=123,active=true"

# Continue execution even if some commands fail
cd <unity-project-root> && node .unity-websocket/uw chain exec \
  "Editor.Refresh" \
  "GameObject.Find:path=InvalidPath" \
  "Console.Clear" \
  --continue-on-error
```

**CI/CD Pipeline workflow:**
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

## Best Practices

1. **Always Verify Connection**
   - Run `cd <unity-project-root> && node .unity-websocket/uw status` before executing commands
   - Ensure Unity Editor is running and server component is active

2. **Use Hierarchical Paths**
   - Prefer full paths for nested GameObjects: `"Environment/Terrain/Trees"`
   - Avoids ambiguity when multiple GameObjects share the same name

3. **Monitor Console Logs**
   - Use `cd <unity-project-root> && node .unity-websocket/uw console logs --errors-only` to catch errors during automation
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

8. **Wait Commands Usage**
   - Use `wait compile` after making code changes to ensure compilation finishes
   - Use `wait playmode enter/exit` for play mode synchronization in automated tests
   - Use `wait sleep` to add delays between commands when needed
   - Note: Wait commands have delayed responses (default 5-minute timeout)
   - Domain reload automatically cancels all pending wait requests

9. **Chain Commands Best Practices**
   - Use chain for sequential command execution with automatic error handling
   - Default behavior: stop on first error (use `--continue-on-error` to override)
   - Wait commands are NOT supported in chain (use separate wait commands)
   - Use JSON files for complex multi-step workflows
   - Use inline exec for quick command sequences

10. **Development Roadmap Awareness**
   - **Phase 1 (Current)**: GameObject, Transform, Scene, Console, Wait, Chain - 26 commands
   - **Phase 2+**: Component, Material, Prefab, Animation, Physics, Build - 474+ commands coming soon
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
  - [EditorPrefs Management](./references/COMMANDS_PREFS.md)
  - [Wait Commands](./references/COMMANDS_WAIT.md)
  - [Chain Commands](./references/COMMANDS_CHAIN.md)
- **[API_COMPATIBILITY.md](../API_COMPATIBILITY.md)** - Unity version compatibility (2020.3 - Unity 6)
- **[TEST_GUIDE.md](../TEST_GUIDE.md)** - Unity C# server testing guide (English)
- **[TEST_GUIDE.ko.md](../TEST_GUIDE.ko.md)** - Unity C# server testing guide (Korean)

Unity C# server package available in `assets/unity-package/` - install via Unity Package Manager once released.

---

**Status**: 🧪 Experimental - Phase 1 (26 commands implemented)
**Unity Version Support**: 2020.3 - Unity 6
**Protocol**: JSON-RPC 2.0 over WebSocket
**Port Range**: 9500-9600 (auto-assigned)
