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

The Unity C# WebSocket server package is under development. Once released:

1. **Install Unity Editor Toolkit Server Package**
   - Via Unity Package Manager (Git URL or local path)
   - Requires Unity 2020.3 or higher

2. **Add Server Component**
   - Add `UnityEditorServer` component to a GameObject in your scene
   - Server automatically starts on port 9500 (configurable: 9500-9600 range)
   - WebSocket connection available at `ws://localhost:9500`

3. **Dependencies**
   - websocket-sharp (automatically installed with package)
   - Newtonsoft.Json (Unity's built-in version)

### Claude Code Plugin

The Unity Editor Toolkit plugin is automatically initialized via SessionStart hook:

- Project-specific `.unity-editor/` configuration created
- CLI scripts and wrapper installed
- WebSocket connection established with Unity Editor

## Core Workflow

### 1. Initialize Connection

When you start a Claude Code session in a project, the Unity Editor Toolkit automatically:

- Creates `.unity-editor/` directory with CLI scripts
- Detects available port (9500-9600 range)
- Establishes WebSocket connection if Unity Editor is running

### 2. Execute Commands

Use the CLI to interact with Unity Editor:

**Hierarchy Management:**
```bash
# View GameObject hierarchy with tree visualization
unity-editor hierarchy

# Show only root GameObjects
unity-editor hierarchy --root-only
```

**GameObject Operations:**
```bash
# Find GameObject
unity-editor go find "Player"

# Create GameObject
unity-editor go create "Enemy" --parent "Enemies"

# Destroy GameObject
unity-editor go destroy "OldObject"

# Set active state
unity-editor go set-active "Player" true
```

**Transform Control:**
```bash
# Get Transform information
unity-editor tf get "Player"

# Set position (x,y,z)
unity-editor tf set-position "Player" "0,5,10"

# Set rotation (Euler angles in degrees)
unity-editor tf set-rotation "Player" "0,90,0"

# Set scale
unity-editor tf set-scale "Player" "2,2,2"
```

**Scene Management:**
```bash
# Get current scene info
unity-editor scene current

# List all loaded scenes
unity-editor scene list

# Load scene
unity-editor scene load "GameScene"

# Load scene additively
unity-editor scene load "UIScene" --additive
```

**Console Monitoring:**
```bash
# Get recent console logs
unity-editor console logs

# Show only errors
unity-editor console logs --errors-only

# Clear console
unity-editor console clear
```

### 3. Check Connection Status

```bash
# Verify WebSocket connection
unity-editor status

# Use custom port
unity-editor --port 9301 status
```

### 4. Complex Workflows

**Create and configure GameObject:**
```bash
unity-editor go create "Enemy" && \
unity-editor tf set-position "Enemy" "10,0,5" && \
unity-editor tf set-rotation "Enemy" "0,45,0"
```

**Load scene and activate GameObject:**
```bash
unity-editor scene load "Level1" && \
unity-editor go set-active "Boss" true
```

**Batch GameObject creation:**
```bash
for i in {1..10}; do
  unity-editor go create "Cube_$i" && \
  unity-editor tf set-position "Cube_$i" "$i,0,0"
done
```

## Best Practices

1. **Always Verify Connection**
   - Run `unity-editor status` before executing commands
   - Ensure Unity Editor is running and server component is active

2. **Use Hierarchical Paths**
   - Prefer full paths for nested GameObjects: `"Environment/Terrain/Trees"`
   - Avoids ambiguity when multiple GameObjects share the same name

3. **Monitor Console Logs**
   - Use `unity-editor console logs --errors-only` to catch errors during automation
   - Clear console before running automation scripts for clean logs

4. **Batch Operations Carefully**
   - Add delays between commands if creating many GameObjects
   - Consider Unity Editor performance limitations

5. **Security Considerations**
   - Unity Editor Toolkit uses localhost-only connections (127.0.0.1)
   - Port range limited to 9500-9600 to avoid conflicts
   - Input validation prevents path traversal and injection attacks

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

- **[QUICKSTART.md](./references/QUICKSTART.md)** - Quick setup and first commands (English)
- **[QUICKSTART.ko.md](./references/QUICKSTART.ko.md)** - Quick setup guide (Korean)
- **[COMMANDS.md](./references/COMMANDS.md)** - Complete 500+ command reference (English)
- **[COMMANDS.ko.md](./references/COMMANDS.ko.md)** - Complete command reference (Korean)
- **[API_COMPATIBILITY.md](./references/API_COMPATIBILITY.md)** - Unity version compatibility (2020.3 - Unity 6)
- **[TEST_GUIDE.md](./references/TEST_GUIDE.md)** - Unity C# server testing guide (English)
- **[TEST_GUIDE.ko.md](./references/TEST_GUIDE.ko.md)** - Unity C# server testing guide (Korean)

Unity C# server package available in `assets/unity-package/` - install via Unity Package Manager once released.

---

**Status**: 🧪 Experimental - Phase 1 (15 commands implemented)
**Version**: 0.2.1
**Unity Version Support**: 2020.3 - Unity 6
**Protocol**: JSON-RPC 2.0 over WebSocket
**Port Range**: 9500-9600
