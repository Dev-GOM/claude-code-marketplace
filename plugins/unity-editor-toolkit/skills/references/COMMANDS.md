# Unity Editor Toolkit - Command Reference

Unity Editor를 제어할 수 있는 500+ 명령어 로드맵입니다.

**Current Status**: Phase 1 - 26 commands implemented

## Quick Reference

```bash
# Basic usage
cd <unity-project-root> && node .unity-websocket/uw <command> [options]

# Show all available commands
cd <unity-project-root> && node .unity-websocket/uw --help

# Show help for specific command
cd <unity-project-root> && node .unity-websocket/uw <command> --help
```

## 📖 Documentation by Category

### ✅ Implemented (Phase 1)

| Category | Commands | Documentation |
|----------|----------|---------------|
| **Connection & Status** | 1 command | [COMMANDS_CONNECTION_STATUS.md](./COMMANDS_CONNECTION_STATUS.md) |
| **GameObject & Hierarchy** | 8 commands | [COMMANDS_GAMEOBJECT_HIERARCHY.md](./COMMANDS_GAMEOBJECT_HIERARCHY.md) |
| **Transform** | 4 commands | [COMMANDS_TRANSFORM.md](./COMMANDS_TRANSFORM.md) |
| **Scene Management** | 3 commands | [COMMANDS_SCENE.md](./COMMANDS_SCENE.md) |
| **Asset Database & Editor** | 3 commands | [COMMANDS_EDITOR.md](./COMMANDS_EDITOR.md) |
| **Console & Logging** | 2 commands | [COMMANDS_CONSOLE.md](./COMMANDS_CONSOLE.md) |
| **EditorPrefs Management** | 6 commands | [COMMANDS_PREFS.md](./COMMANDS_PREFS.md) |
| **Wait Commands** | 4 commands | [COMMANDS_WAIT.md](./COMMANDS_WAIT.md) |
| **Chain Commands** | 2 commands | [COMMANDS_CHAIN.md](./COMMANDS_CHAIN.md) |
| **Menu Execution** | 2 commands | [COMMANDS_MENU.md](./COMMANDS_MENU.md) |
| **Asset Management (ScriptableObject)** | 9 commands | [COMMANDS_ASSET.md](./COMMANDS_ASSET.md) |

### 🔄 Coming Soon (Phase 2+)

| Category | Status |
|----------|--------|
| **Component** | 🔄 20+ commands planned |
| **Material & Rendering** | 🔄 25+ commands planned |
| **Prefab** | 🔄 15+ commands planned |
| **Animation** | 🔄 20+ commands planned |
| **Physics** | 🔄 20+ commands planned |
| **Lighting** | 🔄 15+ commands planned |
| **Camera** | 🔄 15+ commands planned |
| **Audio** | 🔄 15+ commands planned |
| **Navigation & AI** | 🔄 15+ commands planned |
| **Particle System** | 🔄 15+ commands planned |
| **Timeline** | 🔄 10+ commands planned |
| **Build & Player** | 🔄 15+ commands planned |
| **Project Settings** | 🔄 20+ commands planned |
| **Package Manager** | 🔄 10+ commands planned |
| **Version Control** | 🔄 10+ commands planned |
| **Profiler & Performance** | 🔄 15+ commands planned |
| **Test Runner** | 🔄 10+ commands planned |
| **Input System** | 🔄 10+ commands planned |
| **UI Toolkit** | 🔄 10+ commands planned |
| **Editor Window & UI** | 🔄 10+ commands planned |
| **Utility Commands** | 🔄 20+ commands planned |

---

## Quick Command Examples

### Connection & Status
```bash
cd <unity-project-root> && node .unity-websocket/uw status [--port <port>] [--json]
```

### GameObject & Hierarchy
```bash
# Find GameObject by name or path
cd <unity-project-root> && node .unity-websocket/uw go find <name> [--json]

# Create GameObject
cd <unity-project-root> && node .unity-websocket/uw go create <name> [--parent <parent>] [--json]

# Destroy GameObject
cd <unity-project-root> && node .unity-websocket/uw go destroy <name> [--json]

# Set active state
cd <unity-project-root> && node .unity-websocket/uw go set-active <name> <true|false> [--json]

# Set/remove parent
cd <unity-project-root> && node .unity-websocket/uw go set-parent <name> [parent] [--json]

# Get parent info
cd <unity-project-root> && node .unity-websocket/uw go get-parent <name> [--json]

# Get children
cd <unity-project-root> && node .unity-websocket/uw go get-children <name> [--recursive] [--json]

# View hierarchy tree
cd <unity-project-root> && node .unity-websocket/uw hierarchy [--root-only] [--include-inactive] [--json]
```

### Transform
```bash
# Get transform information
cd <unity-project-root> && node .unity-websocket/uw tf get <name> [--json]

# Set position (x,y,z)
cd <unity-project-root> && node .unity-websocket/uw tf set-position <name> <x,y,z> [--json]

# Set rotation (Euler angles in degrees)
cd <unity-project-root> && node .unity-websocket/uw tf set-rotation <name> <x,y,z> [--json]

# Set scale
cd <unity-project-root> && node .unity-websocket/uw tf set-scale <name> <x,y,z> [--json]
```

### Scene Management
```bash
# Get current scene info
cd <unity-project-root> && node .unity-websocket/uw scene current [--json]

# List all loaded scenes
cd <unity-project-root> && node .unity-websocket/uw scene list [--json]

# Load scene
cd <unity-project-root> && node .unity-websocket/uw scene load <name> [--additive] [--json]
```

### Asset Database & Editor
```bash
# Refresh AssetDatabase
cd <unity-project-root> && node .unity-websocket/uw editor refresh [--json]

# Recompile scripts
cd <unity-project-root> && node .unity-websocket/uw editor recompile [--json]

# Reimport assets
cd <unity-project-root> && node .unity-websocket/uw editor reimport <path> [--json]
```

### Console & Logging
```bash
# Get console logs
cd <unity-project-root> && node .unity-websocket/uw console logs [--count <n>] [--errors-only] [--warnings] [--json]

# Clear console
cd <unity-project-root> && node .unity-websocket/uw console clear [--json]
```

### EditorPrefs Management
```bash
# Get EditorPrefs value
cd <unity-project-root> && node .unity-websocket/uw prefs get <key> [-t <type>] [-d <default>] [--json]

# Set EditorPrefs value
cd <unity-project-root> && node .unity-websocket/uw prefs set <key> <value> [-t <type>] [--json]

# Delete EditorPrefs key
cd <unity-project-root> && node .unity-websocket/uw prefs delete <key> [--json]

# Check if key exists
cd <unity-project-root> && node .unity-websocket/uw prefs has <key> [--json]

# Delete all EditorPrefs keys
cd <unity-project-root> && node .unity-websocket/uw prefs delete-all [--json]

# List all EditorPrefs keys
cd <unity-project-root> && node .unity-websocket/uw prefs list [--json]
```

### Wait Commands
```bash
# Wait for compilation to complete
cd <unity-project-root> && node .unity-websocket/uw wait compile [--timeout <ms>] [--json]

# Wait for play mode changes
cd <unity-project-root> && node .unity-websocket/uw wait playmode <enter|exit|pause> [--timeout <ms>] [--json]

# Sleep for duration
cd <unity-project-root> && node .unity-websocket/uw wait sleep <seconds> [--timeout <ms>] [--json]

# Wait for scene to finish loading (play mode only)
cd <unity-project-root> && node .unity-websocket/uw wait scene [--timeout <ms>] [--json]
```

### Chain Commands
```bash
# Execute commands from JSON file
cd <unity-project-root> && node .unity-websocket/uw chain execute <file> [--continue-on-error] [--timeout <ms>] [--json]

# Execute commands inline
cd <unity-project-root> && node .unity-websocket/uw chain exec <commands...> [--continue-on-error] [--timeout <ms>] [--json]

# Example: inline commands with parameters
cd <unity-project-root> && node .unity-websocket/uw chain exec \
  "GameObject.Create:name=Player" \
  "GameObject.SetActive:instanceId=123,active=true" \
  --continue-on-error
```

---

## Development Roadmap

### Phase 1 (Current) - Core Foundation ✅
- **26 commands** across 8 categories
- GameObject manipulation, Transform control, Scene management
- Console logging, Editor utilities, EditorPrefs
- Wait conditions, Command chaining

### Phase 2 - Component & Material System 🔄
- **~140+ commands**
- Component management (Add, Remove, Configure)
- Material system (Colors, Textures, Shaders)
- Prefab system (Instantiate, Create, Override)
- Asset Database (Search, Import, Dependencies)

### Phase 3 - Animation & Physics 🔄
- **~170+ commands**
- Animation system (Animator, Curves, Events)
- Physics system (Rigidbody, Collider, Raycast)
- Lighting system (Lights, Lightmaps, Probes)
- Camera system (FOV, Viewport, Screenshots)

### Phase 4 - Advanced Features 🔄
- **~100+ commands**
- Audio system (AudioSource, Mixer, 3D Audio)
- Navigation & AI (NavMesh, Agents, Obstacles)
- Particle system (Emission, Modules, Simulation)
- Timeline (Playable Director, Tracks, Clips)

### Phase 5 - Build & Tools 🔄
- **~100+ commands**
- Build pipeline (Build, Player Settings, Platforms)
- Project Settings (Quality, Physics, Input, Graphics)
- Package Manager (Install, Update, Remove)
- Version Control (Git, Plastic SCM)
- Profiler & Performance (CPU, GPU, Memory)
- Test Runner (Unit Tests, Code Coverage)
- Input System (Actions, Bindings, Devices)
- UI Toolkit (Visual Elements, USS, UXML)

---

**Total Roadmap**: 500+ commands across 25 categories

For detailed command documentation with all options and examples, see the category-specific documentation files linked above.
