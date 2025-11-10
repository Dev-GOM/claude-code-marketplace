---
name: blender-retargeting
description: |
  Blender animation retargeting with Mixamo integration. Mixamo 애니메이션을 Blender 캐릭터에 리타게팅.

  Features/기능: Manual Mixamo download support 수동다운로드지원, automatic bone mapping with UI review 자동본매핑UI리뷰 (Rigify/custom), FBX/Collada import 임포트, two-phase confirmation workflow 2단계확인워크플로우, constraint-based retargeting 컨스트레인트기반리타게팅, NLA track management NLA트랙관리, multi-project support 멀티프로젝트지원, port management 포트관리 (9400-9500), real-time Blender control WebSocket기반실시간제어.

  Workflow 워크플로우: Manual Mixamo download 수동다운로드 → Connect to Blender WebSocket 웹소켓연결 → Import FBX 임포트 → Auto-generate bone mapping 자동본매핑 → User review/edit in Blender UI 사용자확인수정 → User confirms 사용자확인 → Apply retargeting 리타게팅적용 → Bake to keyframes 베이킹 → Add to NLA track NLA트랙추가.

  WebSocket-based architecture 웹소켓기반. Port range 포트범위 9400-9500. Two-phase workflow 2단계워크플로우 with user confirmation 사용자확인. Auto bone mapping with UI review 자동본매핑UI리뷰. Rigify compatible Rigify호환. Session hooks auto-initialization 세션훅스자동초기화. Manual Mixamo download 수동다운로드 (no API 공식API없음).
allowed-tools: Bash, Read, Write, Glob
---

# blender-retargeting

## Purpose

Automate the process of retargeting Mixamo animations to user-rigged characters in Blender. Uses WebSocket-based architecture for real-time Blender control with a two-phase workflow that allows users to review and edit bone mappings before applying retargeting.

## When to Use

Use blender-retargeting when tasks involve:
- Applying manually downloaded Mixamo animations to custom rigged characters
- Automatic bone mapping between Mixamo and Rigify/custom rigs with user review
- Animation retargeting workflows that require precise bone correspondence
- User-confirmed bone mapping before applying retargeting
- Projects requiring Blender automation via WebSocket

**Note:** Mixamo does not provide an official API. Users must manually download FBX files from Mixamo.com.

## ⚠️ Important Guidelines

**When to Ask User:** Use AskUserQuestion tool if:
- Character armature name is unclear or not specified
- Multiple rigs exist in the scene and target is ambiguous
- Animation FBX file path is not provided
- After displaying bone mapping in Blender UI, ask user to confirm when ready (e.g., "Please review the bone mapping in Blender and type 'ready' when you've clicked 'Apply Retargeting'")
- Blender WebSocket server connection fails
- User needs guidance on downloading from Mixamo

**DO NOT** guess character names, file paths, or assume rig structures. Always clarify first.

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
│  - Execute flow │         │  - MixamoHelper  │                │  - FBX Import   │
└─────────────────┘         └──────────────────┘                │  - Retargeting  │
                                     │                           │  - Bone Mapping │
                                     │                           │  - UI Panel     │
                                     │                           └─────────────────┘
                                     ▼
                            ┌──────────────────┐
                            │   Mixamo.com     │
                            │ (Manual Download)│
                            └──────────────────┘
\`\`\`

**Key components:**
- **WebSocket Server**: Blender Python addon listening on port 9400-9500
- **TypeScript Client**: Connects to Blender, sends commands via JSON-RPC protocol
- **Retargeting Controller**: Handles bone mapping and constraint application
- **Bone Mapping UI**: Blender panel for reviewing/editing auto-generated mappings
- **Two-Phase Workflow**: Auto-generate → User review → Apply retargeting
- **Mixamo Helper**: Provides download instructions (Mixamo has no official API)
- **Auto Management**: Session hooks initialize scripts and manage project ports

## Core Workflow

### 1. Extract Required Information

From user's request, identify:
- **Target character**: Armature name in Blender (e.g., "MyCharacter", "Hero")
- **Animation name**: Mixamo animation to apply (e.g., "Walking", "Running")
- **Animation file path**: Path to manually downloaded FBX file
- **Bone mapping**: Auto (default), Rigify preset, or custom mapping

When information is missing or ambiguous, use AskUserQuestion tool.

**If user doesn't have the FBX file yet:**
- Provide Mixamo download instructions using `getManualDownloadInstructions()`
- Guide user to download from Mixamo.com with recommended settings (FBX, Without Skin, 30 FPS)
- Wait for user to provide the downloaded file path

### 2. Execute Retargeting Workflow

**Two-Phase Workflow:**

**Phase 1: Auto-generate and display bone mapping**
\`\`\`typescript
import { AnimationRetargetingWorkflow } from 'blender-retargeting';

const workflow = new AnimationRetargetingWorkflow();

// If user doesn't have FBX file:
console.log(workflow.getManualDownloadInstructions('Walking'));
console.log('Recommended settings:', workflow.getRecommendedSettings());

// After user downloads the FBX:
await workflow.run({
  targetCharacterArmature: 'Hero',
  animationFilePath: './animations/Walking.fbx',  // User-provided path
  animationName: 'Walking',
  boneMapping: 'auto',
  skipConfirmation: false,  // Enable confirmation workflow
});
\`\`\`

**What happens during execution:**
1. Import FBX file into Blender
2. Auto-generate bone mapping
3. Display mapping in Blender UI panel (View3D > Sidebar > Blender Toolkit > Bone Mapping Review)
4. User reviews the mapping in Blender:
   - Check each bone correspondence
   - Edit incorrect mappings using dropdowns
   - Use "Auto Re-map" to regenerate if needed
5. User clicks "Apply Retargeting" in Blender when ready
6. Retargeting is applied and baked to keyframes

**Phase 2: User confirmation and application**
- The workflow pauses after displaying the bone mapping
- User has full control to review and edit in Blender UI
- Retargeting only proceeds when user confirms via "Apply Retargeting" button

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

### "Animation file not found"
- Ensure user has downloaded the FBX from Mixamo.com
- Verify the file path is correct and accessible
- Use absolute path if relative path fails

## Output Structure

\`\`\`
.blender-toolkit/
├── animations/              # Downloaded Mixamo FBX files
├── skills/scripts/          # Local TypeScript scripts
├── logs/                    # Log files (typescript.log, blender-addon.log, error.log)
└── .gitignore

Shared config:
~/.claude/plugins/marketplaces/dev-gom-plugins/plugins/blender-toolkit/skills/blender-config.json
\`\`\`

## Best Practices

1. **🌟 Use Auto Bone Mapping with UI Confirmation**: Most reliable workflow for unknown rigs
   - Recommended: \`boneMapping: 'auto', skipConfirmation: false\`
   - Review auto-generated mappings before applying
   - Edit incorrect mappings directly in Blender UI

2. **Check Mapping Quality**: Always review the quality report
   - Excellent (8-9 critical bones): Safe to proceed automatically
   - Good (6-7 critical bones): Quick review recommended
   - Fair (4-5 critical bones): Thorough review required
   - Poor (< 4 critical bones): Use custom mapping

3. **Start with Simple Animations**: Verify bone mapping works correctly
   - Test with: Idle, Walking, Running
   - Check root motion (Hips bone)
   - Verify left/right bones not swapped
   - Then proceed to complex animations

4. **Use Descriptive Armature Names**: Makes debugging easier
   - Good: \`MyCharacter\`, \`HeroRig\`, \`PlayerModel\`
   - Avoid: \`Armature\`, \`Armature.001\`, \`rig\`

5. **Download Correct Format from Mixamo**: Always use FBX without skin
   - Format: FBX (.fbx)
   - Skin: Without Skin (Animation only)
   - FPS: 30 fps
   - Keyframe Reduction: None

6. **Enable Logging for Troubleshooting**: Debug mode shows detailed information
   - Set \`DEBUG=1\` environment variable
   - Check logs in \`.blender-toolkit/logs/\`
   - TypeScript: \`typescript.log\`
   - Python: \`blender-addon.log\`
   - Errors: \`error.log\`

7. **Let System Manage Ports**: Project-specific ports prevent conflicts
   - Ports auto-assigned (9400-9500 range)
   - Configuration persists across sessions
   - Multiple projects can run simultaneously

8. **Review Critical Bones First**: Focus on essential bones for quality check
   - Hips (root motion)
   - Spine chain (posture)
   - Shoulders and arms (upper body)
   - Hips and legs (lower body)
   - Head (orientation)

9. **Save Custom Mappings for Reuse**: Non-standard rigs benefit from saved mappings
   - Export custom mapping to JSON
   - Reuse across multiple animations
   - Share mappings with team members

10. **Use Session Hooks**: Auto-initialization on session start
    - No manual daemon management
    - Scripts auto-installed and built
    - Configuration auto-saved

## References

Detailed documentation in \`references/\` folder (load as needed):

- **\`references/websocket-commands.md\`**: Complete WebSocket command list with all parameters, examples, and TypeScript client usage
- **\`references/bone-mapping-guide.md\`**: Bone mapping strategies, fuzzy matching algorithm, quality assessment, and troubleshooting
- **\`references/workflow-examples.md\`**: Complete workflow examples for common use cases including batch processing, error handling, and integration

Load references when user needs detailed information about specific features, advanced usage patterns, or troubleshooting guidance.

## Notes

- **Port range**: 9400-9500 (Browser-Pilot uses 9222-9322)
- **File formats**: FBX recommended, Collada (.dae) supported
- **Blender version**: 3.0+ required
- **Python version**: Blender embedded Python 3.10+
