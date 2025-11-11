# Workflow Guide

Detailed guide for animation retargeting workflows using Blender Toolkit.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Complete Retargeting Workflow](#complete-retargeting-workflow)
- [Mixamo Download Workflow](#mixamo-download-workflow)
- [Two-Phase Confirmation Workflow](#two-phase-confirmation-workflow)
- [Batch Processing Workflow](#batch-processing-workflow)
- [Multi-Project Workflow](#multi-project-workflow)
- [Advanced Workflows](#advanced-workflows)
- [Common Scenarios](#common-scenarios)
- [Troubleshooting](#troubleshooting)

---

## Overview

Blender Toolkit provides a complete workflow for retargeting Mixamo animations to custom character rigs in Blender.

**Core Workflow Steps:**
1. Prepare character rig in Blender
2. Download animation from Mixamo
3. Connect to Blender via WebSocket
4. Import and auto-map bones
5. Review mapping in Blender UI
6. Confirm and apply retargeting
7. Animation baked to NLA track

**Key Features:**
- WebSocket-based real-time control
- Two-phase confirmation workflow
- Automatic bone mapping with UI review
- Quality assessment
- Multi-project support
- Session hooks for auto-initialization

---

## Prerequisites

### 1. Blender Setup

**Install and Configure:**
```
1. Install Blender 4.0 or higher (2023+)
2. Install Python addon:
   Method 1 (Recommended): Install from ZIP
   - Edit → Preferences → Add-ons → Install
   - Select: .blender-toolkit/blender-toolkit-addon-v*.zip
   - Enable "Blender Toolkit WebSocket Server"

   Method 2: Install from Source
   - Edit → Preferences → Add-ons → Install
   - Select: plugins/blender-toolkit/skills/addon/__init__.py
   - Enable "Blender Toolkit WebSocket Server"
3. Start WebSocket server:
   - View3D → Sidebar (N key) → "Blender Toolkit" tab
   - Click "Start Server"
   - Default port: 9400
```

### 2. Character Rig Requirements

**Your Character Must Have:**
- ✅ Armature with properly set up bones
- ✅ Standard or Rigify-compatible bone naming (recommended)
- ✅ Proper parent-child bone hierarchy
- ✅ Character loaded in current Blender scene

**Supported Rig Types:**
- Rigify control rigs ⭐ (best support)
- Custom rigs with standard naming
- Game engine rigs (UE4/UE5, Unity)
- Any armature with clear bone hierarchy

### 3. Local Scripts

**Auto-Initialized by SessionStart Hook:**
- TypeScript source copied to `.blender-toolkit/skills/scripts/`
- Dependencies installed (`npm install`)
- Scripts built (`npm run build`)
- CLI wrapper created (`.blender-toolkit/bt.js`)

**Manual Check (if needed):**
```bash
# Verify scripts are built
ls .blender-toolkit/skills/scripts/dist

# Rebuild if necessary
cd .blender-toolkit/skills/scripts
npm install
npm run build
```

---

## Complete Retargeting Workflow

### Step 1: Prepare Character

**In Blender:**
```
1. Open your character model
2. Verify armature exists and is rigged
3. Note the exact armature name (case-sensitive)
4. Check bone structure (Edit Mode):
   - Proper hierarchy (Hips → Spine → etc.)
   - Standard naming (preferred)
5. Leave Blender open with character visible
```

**Tips:**
- Use descriptive armature name: "HeroRig", "PlayerModel"
- Avoid generic names: "Armature", "Armature.001"
- Ensure character is in rest pose

### Step 2: Download Mixamo Animation

**Option A: User Has FBX File**
- User provides path to downloaded FBX
- Skip to Step 3

**Option B: User Needs to Download**
```bash
# Show download instructions
blender-toolkit mixamo-help Walking
```

**Download Steps:**
1. Go to Mixamo.com
2. Search for animation (e.g., "Walking")
3. Configure settings:
   - Format: FBX (.fbx)
   - Skin: Without Skin
   - FPS: 30
   - Keyframe Reduction: None
4. Click "Download"
5. Note download path

**Recommended Settings:**
```
Format: FBX (.fbx)
Skin: Without Skin
Frame Rate: 30 fps
Keyframe Reduction: None
```

### Step 3: Verify Blender Connection

**Check WebSocket Server:**
```bash
blender-toolkit daemon-status
```

**If Not Running:**
```
1. Open Blender
2. Press N key in 3D View
3. Click "Blender Toolkit" tab
4. Click "Start Server"
```

**Expected Output:**
```
✅ Blender WebSocket server is running on port 9400
```

### Step 4: Execute Retargeting

**Basic Command:**
```bash
blender-toolkit retarget \
  --target "HeroRig" \
  --file "./downloads/Walking.fbx" \
  --name "Walking"
```

**What Happens:**
```
🎬 Starting animation retargeting workflow...

[1/6] Connecting to Blender...
✅ Connected to Blender on port 9400

[2/6] Importing animation FBX...
✅ Animation imported: 30 frames

[3/6] Analyzing bone structure...
✅ Source bones: 65 (Mixamo)
✅ Target bones: 52 (HeroRig)

[4/6] Auto-generating bone mapping...
✅ Mapped 48 bones
✅ Quality: Excellent (8/9 critical bones)

[5/6] Displaying mapping in Blender UI...
✅ Mapping displayed in "Bone Mapping Review" panel

⏸ Workflow paused for user review
👉 Please review the bone mapping in Blender
👉 Edit any incorrect mappings
👉 Click "Apply Retargeting" when ready
```

### Step 5: Review Mapping in Blender

**Open Mapping Panel:**
```
1. Press N key in 3D View
2. Go to "Blender Toolkit" tab
3. Find "Bone Mapping Review" panel
```

**Review Checklist:**
- [ ] Hips mapped correctly (root motion)
- [ ] Spine chain mapped in order
- [ ] Left/Right arms not swapped
- [ ] Left/Right legs not swapped
- [ ] Hands and feet mapped
- [ ] Head and neck mapped

**Edit If Needed:**
- Click dropdown next to incorrect mapping
- Select correct bone from list
- Repeat for all issues

### Step 6: Apply Retargeting

**In Blender:**
```
1. After reviewing mappings
2. Click "Apply Retargeting" button
3. Wait for processing
```

**Processing Steps:**
```
[6/6] Applying retargeting...
 - Creating constraint setup...
 - Baking animation to keyframes...
 - Adding to NLA track...
 - Cleaning up temporary objects...

✅ Animation retargeting completed successfully!
```

**Result:**
- Animation applied to your character
- Stored in NLA track named "Walking"
- Original rig unchanged
- Ready for editing or export

---

## Mixamo Download Workflow

Step-by-step guide for downloading animations from Mixamo.

### Get Download Instructions

**Show Popular Animations:**
```bash
blender-toolkit mixamo-help
```

**Output:**
```
📚 Popular Mixamo Animations:

Locomotion:
  • Walking
  • Running
  • Jogging
  • Sprinting
  • Crouching

Combat:
  • Punching
  • Kicking
  • Sword Slash
  • Rifle Aim
  • Pistol Fire

Idle:
  • Idle
  • Breathing Idle
  • Standing Idle
```

**Get Specific Instructions:**
```bash
blender-toolkit mixamo-help Walking
```

**Output:**
```
📥 Mixamo Download Instructions for "Walking"

1. Go to https://www.mixamo.com
2. Sign in or create account (free)
3. Search for "Walking" in the search bar
4. Select the animation you want
5. Click "Download" button
6. Configure download settings:
   ✅ Format: FBX (.fbx)
   ✅ Skin: Without Skin
   ✅ Frame Rate: 30 fps
   ✅ Keyframe Reduction: None
7. Click "Download"
8. Note the downloaded file path

⚙️  Recommended Settings:

  Format: FBX (.fbx)
  Skin: Without Skin
  Frame Rate: 30 fps
  Keyframe Reduction: None
```

### Why "Without Skin"

**Reasons:**
- We only need animation data, not mesh
- Reduces file size significantly
- Faster import into Blender
- Cleaner workflow (no extra objects to delete)

**What It Means:**
- FBX contains only skeleton and keyframes
- No mesh/geometry included
- Perfect for retargeting to existing characters

---

## Two-Phase Confirmation Workflow

The workflow pauses after mapping generation for user review.

### Phase 1: Generate and Display

**Automatic Steps:**
```
1. Import FBX              [Auto]
2. Extract bone structure  [Auto]
3. Generate mapping        [Auto]
4. Display in UI           [Auto]
5. Pause for review        [Manual]
```

**User Actions:**
- Review mapping quality
- Check critical bones
- Edit incorrect mappings
- Confirm readiness

### Phase 2: Apply and Bake

**Triggered by User:**
- User clicks "Apply Retargeting" in Blender

**Automatic Steps:**
```
6. Create constraints      [Auto]
7. Bake to keyframes       [Auto]
8. Add to NLA track        [Auto]
9. Cleanup                 [Auto]
10. Complete               [Auto]
```

### Skipping Confirmation

**For Trusted Mappings:**
```bash
blender-toolkit retarget \
  --target "HeroRig" \
  --file "./Walking.fbx" \
  --skip-confirmation
```

**When to Skip:**
- Excellent quality mapping (8-9 critical bones)
- Repeated animations on same character
- Using proven custom mapping
- Batch processing with known-good setup

**When NOT to Skip:**
- First animation on new character
- Unknown rig structure
- Fair or Poor quality mapping
- Complex or unusual animations

---

## Batch Processing Workflow

Process multiple animations efficiently.

### Step 1: Test Single Animation

**Verify Setup:**
```bash
# Test with one animation first
blender-toolkit retarget \
  --target "HeroRig" \
  --file "./Walking.fbx" \
  --name "Walking"
```

**Check Results:**
- Animation looks correct
- No twisted limbs
- Left/Right not swapped
- Quality is excellent

### Step 2: Extract Mapping

**Save Successful Mapping:**
```typescript
// After successful test, save the mapping
// Check Blender console or logs for generated mapping
const heroRigMapping = {
  "Hips": "root",
  "Spine": "spine_01",
  "Spine1": "spine_02",
  // ... complete mapping
};

// Save to file for reuse
fs.writeFileSync('./hero-mapping.json', JSON.stringify(heroRigMapping));
```

### Step 3: Batch Process

**Shell Script Example:**
```bash
#!/bin/bash
# batch-retarget.sh

ANIMATIONS=(
  "Walking"
  "Running"
  "Jumping"
  "Idle"
  "Punching"
)

for anim in "${ANIMATIONS[@]}"; do
  echo "Processing ${anim}..."
  blender-toolkit retarget \
    --target "HeroRig" \
    --file "./animations/${anim}.fbx" \
    --name "${anim}" \
    --skip-confirmation
  echo "✅ ${anim} completed"
done

echo "🎉 All animations processed!"
```

**TypeScript Example:**
```typescript
// batch-retarget.ts
const animations = [
  'Walking', 'Running', 'Jumping',
  'Idle', 'Punching'
];

const workflow = new AnimationRetargetingWorkflow();

for (const anim of animations) {
  await workflow.run({
    targetCharacterArmature: 'HeroRig',
    animationFilePath: `./animations/${anim}.fbx`,
    animationName: anim,
    boneMapping: heroRigMapping,  // Reuse saved mapping
    skipConfirmation: true
  });

  console.log(`✅ ${anim} completed`);
}
```

---

## Multi-Project Workflow

Work with multiple Blender projects simultaneously.

### Port Management

**Default Behavior:**
- First project: Port 9400
- Second project: Port 9401
- Third project: Port 9402
- Auto-increments for each project

**Configuration:**
```json
// ~/.claude/plugins/.../blender-config.json
{
  "projects": {
    "/path/to/project-a": {
      "port": 9400,
      "lastUsed": "2024-01-15T10:30:00Z"
    },
    "/path/to/project-b": {
      "port": 9401,
      "lastUsed": "2024-01-15T11:00:00Z"
    }
  }
}
```

### Workflow

**Project A:**
```bash
cd /path/to/project-a

# Start Blender with port 9400
# Run retargeting
blender-toolkit retarget \
  --target "CharacterA" \
  --file "./Walking.fbx" \
  --port 9400
```

**Project B (Simultaneously):**
```bash
cd /path/to/project-b

# Start Blender with port 9401
# Run retargeting
blender-toolkit retarget \
  --target "CharacterB" \
  --file "./Running.fbx" \
  --port 9401
```

**Benefits:**
- No port conflicts
- Simultaneous processing
- Independent configurations
- Separate log files

---

## Advanced Workflows

### Custom Bone Mapping Workflow

**For Non-Standard Rigs:**

**Step 1: Analyze Bones**
```bash
# List all bones in target rig
blender-toolkit list-objects --type ARMATURE
blender-toolkit get-bones --armature "MyRig"
```

**Step 2: Create Mapping**
```typescript
// custom-mapping.ts
export const myRigMapping = {
  // Core
  "Hips": "pelvis",
  "Spine": "spine_01",
  "Spine1": "spine_02",
  "Spine2": "chest",
  "Neck": "neck_01",
  "Head": "head",

  // Left Arm
  "LeftShoulder": "clavicle_L",
  "LeftArm": "upperarm_L",
  "LeftForeArm": "forearm_L",
  "LeftHand": "hand_L",

  // Right Arm
  "RightShoulder": "clavicle_R",
  "RightArm": "upperarm_R",
  "RightForeArm": "forearm_R",
  "RightHand": "hand_R",

  // Add remaining bones...
};
```

**Step 3: Use Custom Mapping**
```typescript
import { myRigMapping } from './custom-mapping';

await workflow.run({
  targetCharacterArmature: 'MyRig',
  animationFilePath: './Walking.fbx',
  boneMapping: myRigMapping,
  skipConfirmation: true
});
```

### Animation Library Workflow

**Organize Animation Library:**

**Directory Structure:**
```
animations/
├── locomotion/
│   ├── walking.fbx
│   ├── running.fbx
│   └── jumping.fbx
├── combat/
│   ├── punch.fbx
│   ├── kick.fbx
│   └── block.fbx
└── idle/
    ├── idle.fbx
    └── breathing.fbx
```

**Batch Import Script:**
```typescript
// import-library.ts
const library = {
  locomotion: ['walking', 'running', 'jumping'],
  combat: ['punch', 'kick', 'block'],
  idle: ['idle', 'breathing']
};

for (const [category, animations] of Object.entries(library)) {
  for (const anim of animations) {
    await workflow.run({
      targetCharacterArmature: 'Hero',
      animationFilePath: `./animations/${category}/${anim}.fbx`,
      animationName: `${category}_${anim}`,
      boneMapping: 'auto',
      skipConfirmation: false  // Review each category first
    });
  }
}
```

---

## Common Scenarios

### Scenario 1: First-Time User

**Goal:** Retarget first Mixamo animation to custom character

**Steps:**
1. Download animation from Mixamo
2. Start Blender with character
3. Enable and start WebSocket addon
4. Run retarget command
5. Review mapping in UI
6. Apply retargeting

**Commands:**
```bash
# Get download instructions
blender-toolkit mixamo-help Walking

# After downloading...
blender-toolkit retarget \
  --target "MyCharacter" \
  --file "./Walking.fbx"
```

### Scenario 2: Rigify User

**Goal:** Fast workflow for standard Rigify rig

**Steps:**
1. Download animation
2. Run with Rigify preset
3. Auto-apply (skip confirmation)

**Commands:**
```bash
blender-toolkit retarget \
  --target "MyRigifyCharacter" \
  --file "./Walking.fbx" \
  --mapping mixamo_to_rigify \
  --skip-confirmation
```

### Scenario 3: Game Developer

**Goal:** Import 50 animations for game character

**Steps:**
1. Test one animation
2. Save mapping configuration
3. Batch process all animations
4. Export to game engine

**Commands:**
```bash
# Test first
blender-toolkit retarget \
  --target "GameCharacter" \
  --file "./test.fbx"

# Batch process
./batch-import.sh
```

### Scenario 4: Studio Pipeline

**Goal:** Integrate into production pipeline

**Setup:**
- Custom wrapper scripts
- CI/CD integration
- Automated testing
- Quality validation

**Pipeline:**
```yaml
# .github/workflows/animation-pipeline.yml
jobs:
  retarget:
    runs-on: ubuntu-latest
    steps:
      - name: Setup Blender
        run: install-blender

      - name: Start WebSocket
        run: start-blender-daemon

      - name: Retarget Animations
        run: |
          for fbx in animations/*.fbx; do
            blender-toolkit retarget \
              --target "$CHARACTER" \
              --file "$fbx" \
              --skip-confirmation
          done
```

---

## Troubleshooting

### Connection Issues

**Problem:** "Failed to connect to Blender"

**Solutions:**
```bash
# 1. Check if Blender is running
ps aux | grep -i blender

# 2. Verify addon is enabled
# In Blender: Edit → Preferences → Add-ons → Search "Blender Toolkit"

# 3. Check server status
blender-toolkit daemon-status

# 4. Restart server
# In Blender: Click "Stop Server", then "Start Server"

# 5. Try different port
blender-toolkit retarget --port 9401 ...
```

### Import Issues

**Problem:** "Failed to import FBX file"

**Solutions:**
- Verify file path is correct
- Check FBX format (should be Binary, not ASCII)
- Ensure file is not corrupted
- Try re-downloading from Mixamo

### Mapping Issues

**Problem:** "Poor quality mapping"

**Solutions:**
1. Lower threshold:
   ```typescript
   // Custom workflow
   threshold: 0.5  // Default is 0.6
   ```

2. Use custom mapping for critical bones

3. Review bone names in Blender:
   - Edit Mode → Show bone names
   - Check for typos or unusual names

### Animation Issues

**Problem:** "Animation looks wrong"

**Solutions:**
- Check bone roll in Edit Mode
- Verify constraint influence
- Review mapping (especially left/right)
- Test with simple animation first

### Performance Issues

**Problem:** "Retargeting is slow"

**Solutions:**
- Close other Blender instances
- Reduce FBX complexity (remove unnecessary bones)
- Use SSD for faster file I/O
- Process in batches during off-hours
