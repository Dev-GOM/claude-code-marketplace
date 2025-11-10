# Bone Mapping Guide

Complete guide to the automatic bone matching system for animation retargeting.

## Table of Contents

- [Overview](#overview)
- [Bone Mapping Modes](#bone-mapping-modes)
- [Auto Bone Matching Algorithm](#auto-bone-matching-algorithm)
- [Two-Phase Workflow](#two-phase-workflow)
- [Quality Assessment](#quality-assessment)
- [Blender UI Panel](#blender-ui-panel)
- [Common Mapping Patterns](#common-mapping-patterns)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

---

## Overview

Bone mapping is the process of establishing correspondence between bones in the Mixamo animation skeleton and bones in your custom character rig. Accurate bone mapping is essential for successful animation retargeting.

**Why Bone Mapping Matters:**
- Mixamo uses standardized bone names (e.g., "mixamorig:Hips", "mixamorig:LeftArm")
- Custom rigs use various naming conventions (e.g., "Hips", "LeftArm", "left_arm", "arm.L")
- Without proper mapping, animations won't transfer correctly
- Incorrect mapping can result in twisted limbs, inverted rotations, or broken animations

**Core Features:**
- ✅ **Automatic Fuzzy Matching** - Intelligently matches bones by name similarity
- ✅ **UI Confirmation Workflow** - Review and edit mappings in Blender before applying
- ✅ **Quality Assessment** - Automatic evaluation of mapping quality
- ✅ **Rigify Presets** - Built-in support for Rigify rigs
- ✅ **Custom Mappings** - Support for non-standard rigs

---

## Bone Mapping Modes

Three modes are available for bone mapping:

### 1. Auto Mode (Recommended) ⭐

**When to Use:** Unknown or non-standard rigs

```bash
blender-toolkit retarget --target "Hero" --file "./Walking.fbx" --mapping auto
```

**How It Works:**
1. Analyzes both source (Mixamo) and target (your character) bone names
2. Uses fuzzy matching algorithm to find best matches
3. Generates mapping with similarity scores
4. Displays mapping in Blender UI for user review
5. User confirms or edits before application

**Advantages:**
- Works with any rig structure
- No manual configuration required
- Intelligent name matching handles various conventions
- User confirmation ensures accuracy

**Similarity Algorithm:**
- Base matching using SequenceMatcher
- Bonuses for substring matches
- Bonuses for common prefixes (left, right, upper, lower)
- Bonuses for common suffixes (.L, .R, _l, _r)
- Bonuses for number matching (Spine1, Spine2)
- Bonuses for anatomical keywords (arm, leg, hand, foot)

### 2. Rigify Mode

**When to Use:** Standard Rigify rigs

```bash
blender-toolkit retarget --target "Hero" --file "./Walking.fbx" --mapping mixamo_to_rigify
```

**How It Works:**
- Uses predefined Mixamo → Rigify bone mapping
- Optimized for standard Rigify control rig structure
- Instant mapping with high confidence

**Advantages:**
- Zero configuration for Rigify users
- Highest accuracy for Rigify rigs
- Immediate application (no UI review needed)

**Rigify Bone Naming:**
```
Mixamo              Rigify
--------            ------
Hips                hips
Spine               spine_fk
Spine1              spine_fk.001
Spine2              spine_fk.002
Neck                neck
Head                head
LeftShoulder        shoulder.L
LeftArm             upper_arm_fk.L
LeftForeArm         forearm_fk.L
LeftHand            hand_fk.L
```

### 3. Custom Mode

**When to Use:** Unique rig structures with known mappings

```typescript
// In your workflow code
const customMapping = {
  "Hips": "Root",
  "Spine": "Torso_01",
  "Spine1": "Torso_02",
  "LeftArm": "L_UpperArm",
  "RightArm": "R_UpperArm"
};

await workflow.run({
  targetCharacterArmature: 'MyCharacter',
  animationFilePath: './Walking.fbx',
  boneMapping: customMapping
});
```

**Advantages:**
- Full control over mapping
- Reusable across multiple animations
- No UI confirmation needed if mapping is trusted

---

## Auto Bone Matching Algorithm

The fuzzy matching algorithm intelligently pairs bones from Mixamo skeleton to your character rig.

### Phase 1: Normalization

All bone names are normalized before comparison:

```python
# Input variations
"Left_Arm"    → "left_arm"
"left-arm"    → "left_arm"
"LeftArm"     → "leftarm"
"Left Arm"    → "left_arm"
"left.arm"    → "left_arm"
```

**Normalization Steps:**
1. Convert to lowercase
2. Replace special characters with underscore
3. Remove consecutive underscores
4. Strip leading/trailing underscores

### Phase 2: Similarity Calculation

Calculates similarity score (0.0 - 1.0) between bone names:

```python
def calculate_similarity(name1: str, name2: str) -> float:
    # Base score from SequenceMatcher
    base_score = SequenceMatcher(None, norm1, norm2).ratio()

    # Bonus factors
    bonus = 0.0

    # Substring match: +0.15
    if norm1 in norm2 or norm2 in norm1:
        bonus += 0.15

    # Prefix match (left, right, etc): +0.1
    # Suffix match (.L, .R, etc): +0.1
    # Number match (Spine1, Spine2): +0.1
    # Keyword match (arm, leg, etc): +0.05

    return min(base_score + bonus, 1.0)
```

**Example Scores:**
```
"LeftArm" ↔ "left_arm"     = 0.95  (substring + prefix)
"LeftArm" ↔ "L_Arm"        = 0.78  (keyword + suffix)
"LeftArm" ↔ "RightArm"     = 0.65  (keyword only)
"LeftArm" ↔ "LeftLeg"      = 0.42  (prefix only)
"LeftArm" ↔ "Head"         = 0.15  (no match)
```

### Phase 3: Best Match Selection

Selects the best match for each source bone:

```python
def find_best_match(source_bone, target_bones, threshold=0.6):
    best_match = None
    best_score = 0.0

    for target_bone in target_bones:
        score = calculate_similarity(source_bone, target_bone)

        if score > best_score and score >= threshold:
            best_score = score
            best_match = target_bone

    return best_match
```

**Key Points:**
- Only matches above threshold (default: 0.6) are considered
- Each target bone can only be matched once (prevents double mapping)
- Returns `None` if no suitable match found

### Phase 4: Quality Assessment

Evaluates overall mapping quality based on critical bones:

```python
critical_bones = [
    'Hips',       # Root motion
    'Spine',      # Torso
    'Head',       # Head orientation
    'LeftArm',    # Upper body
    'RightArm',
    'LeftLeg',    # Lower body
    'RightLeg',
    'LeftHand',   # Extremities
    'RightHand'
]

if critical_mapped >= 8:
    quality = 'excellent'  # Safe to auto-apply
elif critical_mapped >= 6:
    quality = 'good'       # Quick review recommended
elif critical_mapped >= 4:
    quality = 'fair'       # Thorough review required
else:
    quality = 'poor'       # Manual mapping needed
```

---

## Two-Phase Workflow

Blender Toolkit uses a two-phase workflow to ensure mapping accuracy.

### Phase 1: Generate & Display

**What Happens:**
1. Import animation FBX into Blender
2. Auto-generate bone mapping using fuzzy matching
3. Calculate quality score
4. Display mapping in Blender UI panel

**Blender UI Shows:**
- Complete bone mapping table
- Source bone → Target bone correspondence
- Editable dropdowns for each mapping
- Quality assessment score
- "Auto Re-map" button (regenerate)
- "Apply Retargeting" button (proceed to Phase 2)

**User Actions:**
- Review each bone correspondence
- Fix incorrect mappings using dropdowns
- Use "Auto Re-map" to regenerate if needed
- Click "Apply Retargeting" when satisfied

### Phase 2: Apply & Bake

**What Happens:**
1. User clicks "Apply Retargeting" in Blender
2. Creates constraint-based retargeting setup
3. Bakes animation to keyframes
4. Adds animation to NLA track
5. Cleans up temporary objects

**Result:**
- Fully retargeted animation on your character
- Animation stored in NLA track
- Original character rig unchanged
- Ready for further editing or export

---

## Quality Assessment

The system automatically evaluates mapping quality.

### Quality Metrics

**Total Mappings:**
- Number of bones successfully mapped
- Higher is better

**Critical Bones Mapped:**
- 9 essential bones for quality animation
- Shows as ratio: "7/9 critical bones"

**Quality Rating:**
| Rating | Critical Bones | Recommendation |
|--------|----------------|----------------|
| **Excellent** | 8-9 | Safe to auto-apply with skip-confirmation |
| **Good** | 6-7 | Quick review recommended |
| **Fair** | 4-5 | Thorough review required |
| **Poor** | 0-3 | Manual mapping required |

### Quality Report Example

```json
{
  "total_mappings": 52,
  "critical_bones_mapped": "8/9",
  "quality": "excellent",
  "summary": "52 bones mapped, 8/9 critical bones"
}
```

### When to Review Mappings

**Always Review If:**
- Quality is "Fair" or "Poor"
- Character uses non-standard rig
- Animation has unusual requirements
- First time using a new character rig

**Quick Review If:**
- Quality is "Good"
- Character is standard Rigify
- Similar mappings worked before

**Auto-Apply If:**
- Quality is "Excellent"
- Using trusted custom mapping
- Repeated animations on same character

---

## Blender UI Panel

The bone mapping UI panel appears in Blender's View3D sidebar.

### Location

**Path:** View3D → Sidebar (N key) → "Blender Toolkit" tab → "Bone Mapping Review"

### Panel Components

**1. Mapping Table**
```
┌─────────────────────────────────┐
│ Bone Mapping Review             │
├─────────────────────────────────┤
│ Source Bone    → Target Bone    │
│ ─────────────────────────────── │
│ Hips           → [Dropdown: Hips]│
│ Spine          → [Dropdown: Spine]│
│ LeftArm        → [Dropdown: LeftArm]│
│ ...                             │
└─────────────────────────────────┘
```

**2. Quality Info**
```
Quality: Excellent
Total: 52 mappings
Critical: 8/9 bones
```

**3. Action Buttons**
- **Auto Re-map** - Regenerate mapping
- **Apply Retargeting** - Proceed to apply

### Using the Panel

**Step 1: Open Panel**
```
1. Press N key in 3D View
2. Click "Blender Toolkit" tab
3. Find "Bone Mapping Review" panel
```

**Step 2: Review Mappings**
```
1. Scroll through mapping table
2. Check each source → target correspondence
3. Pay special attention to critical bones:
   - Hips (root motion)
   - Spine chain (posture)
   - Arms and legs (animation transfer)
```

**Step 3: Edit Mappings**
```
1. Click dropdown next to incorrect mapping
2. Select correct target bone from list
3. Repeat for all incorrect mappings
```

**Step 4: Apply**
```
1. Click "Apply Retargeting" button
2. Wait for processing (progress shown in console)
3. Animation will be applied and baked
```

---

## Common Mapping Patterns

### Rigify Rigs

**Standard Rigify Control Rig:**
```
Mixamo              Rigify
--------            ------
Hips                hips
Spine               spine_fk
Spine1              spine_fk.001
Spine2              spine_fk.002
Neck                neck
Head                head

LeftShoulder        shoulder.L
LeftArm             upper_arm_fk.L
LeftForeArm         forearm_fk.L
LeftHand            hand_fk.L

RightShoulder       shoulder.R
RightArm            upper_arm_fk.R
RightForeArm        forearm_fk.R
RightHand           hand_fk.R

LeftUpLeg           thigh_fk.L
LeftLeg             shin_fk.L
LeftFoot            foot_fk.L

RightUpLeg          thigh_fk.R
RightLeg            shin_fk.R
RightFoot           foot_fk.R
```

### Unreal Engine (UE4/UE5)

**UE4 Mannequin Skeleton:**
```
Mixamo              UE4/UE5
--------            -------
Hips                pelvis
Spine               spine_01
Spine1              spine_02
Spine2              spine_03
Neck                neck_01
Head                head

LeftShoulder        clavicle_l
LeftArm             upperarm_l
LeftForeArm         lowerarm_l
LeftHand            hand_l

RightShoulder       clavicle_r
RightArm            upperarm_r
RightForeArm        lowerarm_r
RightHand           hand_r
```

### Unity Humanoid

**Unity Mecanim Humanoid:**
```
Mixamo              Unity
--------            -----
Hips                Hips
Spine               Spine
Spine1              Chest
Spine2              UpperChest
Neck                Neck
Head                Head

LeftShoulder        LeftShoulder
LeftArm             LeftUpperArm
LeftForeArm         LeftLowerArm
LeftHand            LeftHand
```

---

## Troubleshooting

### "Poor Quality" Mapping

**Symptoms:**
- Quality assessment shows "Poor"
- Less than 4 critical bones mapped

**Solutions:**
1. **Check Rig Structure**
   - Verify character has proper armature
   - Ensure bones follow hierarchical structure
   - Check for missing bones

2. **Use Custom Mapping**
   - Create explicit bone mapping dictionary
   - Test with known-good mapping first

3. **Review Bone Names**
   - Check for unusual naming conventions
   - Look for typos or special characters

### Incorrect Left/Right Mapping

**Symptoms:**
- Left arm mapped to right arm
- Crossed animations

**Solutions:**
1. **Check Suffix Convention**
   - Ensure consistent use of .L/.R or _l/_r
   - Verify suffix matches throughout rig

2. **Manual Correction**
   - Use Blender UI to swap mappings
   - Fix all left/right pairs

### Missing Critical Bones

**Symptoms:**
- Key bones not mapped (Hips, Spine, etc.)
- Animation doesn't transfer properly

**Solutions:**
1. **Lower Threshold**
   ```python
   # In custom workflow
   bone_map = fuzzy_match_bones(
       source_bones,
       target_bones,
       threshold=0.5  # Lower from default 0.6
   )
   ```

2. **Check Bone Names**
   - Print all bone names in Blender console
   - Verify expected bones exist

3. **Use Explicit Mapping**
   - Map critical bones manually
   - Let auto-match handle fingers/toes

### Twisted or Inverted Limbs

**Symptoms:**
- Arms twist incorrectly
- Legs bend backwards

**Causes:**
- Bone roll differences
- Constraint axis misalignment

**Solutions:**
1. **Check Bone Roll**
   - Compare source and target bone rolls
   - Adjust in Edit Mode if needed

2. **Post-Process Animation**
   - Use constraint influence
   - Add corrective keyframes

---

## Best Practices

### 1. Start Simple

**First Animation:**
- Use simple animation (Idle, Walking)
- Verify mapping quality
- Test full body movement
- Check for issues before complex animations

### 2. Review Critical Bones First

**Priority Order:**
1. **Hips** - Root motion and posture
2. **Spine Chain** - Torso movement
3. **Shoulders** - Upper body orientation
4. **Arms/Legs** - Limb movement
5. **Hands/Feet** - Extremity position
6. **Fingers/Toes** - Fine detail (optional)

### 3. Save Custom Mappings

**For Reuse:**
```typescript
// Save successful mapping
const myCharacterMapping = {
  "Hips": "root_bone",
  "Spine": "torso_01",
  // ... complete mapping
};

// Reuse for all animations
await workflow.run({
  boneMapping: myCharacterMapping,
  skipConfirmation: true  // Safe with known mapping
});
```

### 4. Use Quality Threshold

**Decide Confirmation Strategy:**
```typescript
// Auto-apply only for excellent quality
if (quality === 'excellent') {
  skipConfirmation = true;
} else {
  skipConfirmation = false;  // Review in UI
}
```

### 5. Document Your Rigs

**Create Mapping Reference:**
```markdown
# Character: Hero
Rig Type: Custom
Created: 2024-01-15

## Bone Mapping
Mixamo → Hero
- Hips → root
- Spine → spine_01
- ...

## Notes
- Uses custom spine chain (4 bones)
- Left/Right suffix: _L / _R
- Tested with: Walking, Running, Jumping
```

### 6. Test Before Batch Processing

**Workflow:**
1. Test mapping with one animation
2. Verify quality and appearance
3. Save mapping configuration
4. Batch process remaining animations

### 7. Handle Edge Cases

**Preparation:**
- Create fallback mappings for unusual rigs
- Document special handling requirements
- Test with varied animation types
