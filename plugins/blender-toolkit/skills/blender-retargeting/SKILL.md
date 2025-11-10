---
name: blender-retargeting
description: |
  Blender animation retargeting with Mixamo integration. Mixamo 애니메이션을 Blender 캐릭터에 리타게팅.

  Features/기능: Mixamo search and download Mixamo검색다운로드, automatic bone mapping 자동본매핑 (Rigify/custom), FBX/Collada import 임포트, constraint-based retargeting 컨스트레인트기반리타게팅, NLA track management NLA트랙관리, multi-project support 멀티프로젝트지원, port management 포트관리 (9400-9500), real-time Blender control WebSocket기반실시간제어.

  Workflow 워크플로우: Connect to Blender WebSocket server 웹소켓서버연결 → Search Mixamo animation Mixamo검색 → Download/Import FBX FBX다운로드임포트 → Auto-map bones 자동본매핑 → Apply retargeting constraints 리타게팅적용 → Bake to keyframes 키프레임베이킹 → Add to NLA track NLA트랙추가.

  WebSocket-based architecture 웹소켓기반. Port range 포트범위 9400-9500. Auto bone mapping 자동본매핑. Rigify compatible Rigify호환. Session hooks 세션훅스 auto-initialization 자동초기화.
allowed-tools: Bash, Read, Write, Glob
---

# blender-retargeting

## Purpose

Automate the process of retargeting Mixamo animations to user-rigged characters in Blender. Uses WebSocket-based architecture for real-time Blender control, eliminating manual bone mapping and constraint setup.

## When to Use

Use blender-retargeting when tasks involve:
- Applying Mixamo animations to custom rigged characters
- Automatic bone mapping between Mixamo and Rigify/custom rigs
- Batch processing multiple animations for a single character
- Animation retargeting workflows that require precise bone correspondence
- Projects requiring Blender automation via WebSocket

## ⚠️ Important Guidelines

**When to Ask User:** Use AskUserQuestion tool if:
- Character armature name is unclear or not specified
- Multiple rigs exist in the scene and target is ambiguous
- Mixamo animation name is generic (e.g., "dance" - which specific dance?)
- Bone mapping fails and manual mapping required
- Blender WebSocket server connection fails

**DO NOT** guess character names or assume rig structures. Always clarify first.

## Prerequisites

### 1. Blender Installation & Addon

**Required steps:**
1. Install Blender 3.0 or higher
2. Install Python addon:
   - Open Blender → Edit → Preferences → Add-ons → Install
   - Select: \`plugins/blender-toolkit/skills/blender-retargeting/addon/__init__.py\`
   - Enable "Blender Toolkit WebSocket Server"
3. Start WebSocket server:
   - View3D → Sidebar (N key) → "Blender Toolkit" tab
   - Click "Start Server" button
   - Verify port (default: 9400)

### 2. Local Scripts Initialization

Local scripts initialize automatically on session start (no manual setup required). The SessionStart hook will:
- Copy TypeScript source files to \`.blender-toolkit/skills/scripts/\`
- Run \`npm install\` and \`npm run build\`
- Create CLI wrapper at \`.blender-toolkit/bt.js\`

### 3. Character Requirements

- **Rigged character**: Armature must be set up with bones
- **Standard bone names**: Recommended Rigify or Mixamo-compatible naming
- **Loaded in Blender**: Character must be in current scene

## Getting Help

All CLI commands will support \`--help\` for detailed options in future versions.

## Architecture

**WebSocket-based design:**

\`\`\`
┌─────────────────┐         ┌──────────────────┐    WebSocket    ┌─────────────────┐
│   Claude Code   │   IPC   │  TypeScript      │◄──────────────►│    Blender      │
│   (Skill)       │────────►│  Client          │   Port 9400+   │   (Python       │
│                 │         │                  │                │    Addon)       │
│  - User request │         │  - BlenderClient │                │  - WebSocket    │
│  - Parse intent │         │  - Retargeting   │                │    Server       │
│  - Execute flow │         │  - Mixamo API    │                │  - FBX Import   │
└─────────────────┘         └──────────────────┘                │  - Retargeting  │
                                     │                           │  - Bone Mapping │
                                     ▼                           └─────────────────┘
                            ┌──────────────────┐
                            │   Mixamo API     │
                            │   (Optional)     │
                            └──────────────────┘
\`\`\`

**Key components:**
- **WebSocket Server**: Blender Python addon listening on port 9400-9500
- **TypeScript Client**: Connects to Blender, sends commands via JSON-RPC protocol
- **Retargeting Controller**: Handles bone mapping and constraint application
- **Mixamo Integration**: Search, download, import animations (API or manual)
- **Auto Management**: Session hooks initialize scripts and manage project ports

## Core Workflow

### 1. Extract Required Information

From user's request, identify:
- **Target character**: Armature name in Blender (e.g., "MyCharacter", "Hero")
- **Animation name**: Mixamo animation to apply (e.g., "Walking", "Running")
- **Animation source**: Mixamo search term, ID, or manually downloaded FBX path
- **Bone mapping**: Auto (default), Rigify preset, or custom mapping

When information is missing or ambiguous, use AskUserQuestion tool.

### 2. Execute Retargeting

Basic retargeting example:
\`\`\`typescript
import { AnimationRetargetingWorkflow } from 'blender-retargeting';

const workflow = new AnimationRetargetingWorkflow();

await workflow.run({
  targetCharacterArmature: 'Hero',
  mixamoAnimation: 'Walking',
  boneMapping: 'auto',
});
\`\`\`

## Troubleshooting

### "Blender is not running"
- Verify Blender is open
- Check addon enabled
- Click "Start Server" in Blender Toolkit panel

### "Target armature not found"
- Check exact armature name (case-sensitive)
- Verify character is in current Blender scene

### "Bone mapping failed"
- Use custom bone mapping with exact bone names

### "Mixamo download failed"
- Download manually from Mixamo.com
- Use \`mixamoFilePath\` parameter

## Output Structure

\`\`\`
.blender-toolkit/
├── animations/              # Downloaded Mixamo FBX files
├── skills/scripts/          # Local TypeScript scripts
└── .gitignore

Shared config:
~/.claude/plugins/marketplaces/dev-gom-plugins/plugins/blender-toolkit/skills/blender-config.json
\`\`\`

## Notes

- **Port range**: 9400-9500 (Browser-Pilot uses 9222-9322)
- **File formats**: FBX recommended, Collada (.dae) supported
- **Blender version**: 3.0+ required
- **Python version**: Blender embedded Python 3.10+
