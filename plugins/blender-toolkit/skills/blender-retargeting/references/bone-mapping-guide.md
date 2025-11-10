# Bone Mapping Guide

Complete guide to bone mapping strategies, fuzzy matching algorithm, and quality assessment.

## Overview

Bone mapping is the process of establishing correspondence between source (Mixamo) and target (your character) armature bones. Accurate mapping is critical for successful animation retargeting.

## Bone Mapping Strategies

### 1. Auto Mapping (Recommended)

Uses fuzzy matching algorithm to automatically generate bone mappings based on name similarity.

**When to use:**
- Target rig uses standard naming conventions
- Rig structure is similar to Mixamo (humanoid)
- You want fast, automated mapping with manual review option

**How it works:**
```typescript
const boneMap = await controller.autoMapBones(
  'Mixamo_Rig',      // Source
  'MyCharacter'      // Target
);
```

### 2. Preset Mapping

Use predefined mappings for common rig types.

**Available presets:**
- `mixamo_to_rigify`: Mixamo → Blender Rigify rig

**When to use:**
- Target rig is Rigify-based
- Standard Mixamo animations

**How it works:**
```typescript
await controller.retarget({
  sourceArmature: 'Mixamo_Rig',
  targetArmature: 'MyCharacter',
  boneMapping: 'mixamo_to_rigify'
});
```

### 3. Custom Mapping

Manually specify exact bone correspondences.

**When to use:**
- Auto mapping fails or produces poor results
- Non-standard rig structure
- Specific bone mapping requirements

**How it works:**
```typescript
await controller.retarget({
  sourceArmature: 'Mixamo_Rig',
  targetArmature: 'MyCharacter',
  boneMapping: 'custom',
  customBoneMap: {
    'Hips': 'Root',
    'Spine': 'Spine01',
    'Spine1': 'Spine02',
    'Spine2': 'Chest',
    'Neck': 'Neck01',
    'Head': 'Head01',
    'LeftShoulder': 'Clavicle_L',
    'LeftArm': 'UpperArm_L',
    'LeftForeArm': 'ForeArm_L',
    'LeftHand': 'Hand_L',
    // ... continue for all bones
  }
});
```

## Fuzzy Matching Algorithm

The auto bone mapping system uses a sophisticated fuzzy matching algorithm to find the best bone correspondences.

### Algorithm Components

**1. Name Normalization**
- Converts to lowercase
- Replaces special characters with underscores
- Removes consecutive underscores
- Trims whitespace

Examples:
- `"Left_Arm"` → `"left_arm"`
- `"left-arm"` → `"left_arm"`
- `"LeftArm"` → `"leftarm"`

**2. Similarity Calculation** (0.0 - 1.0 score)

Base score using `SequenceMatcher` from Python's difflib:
```python
base_score = SequenceMatcher(None, norm1, norm2).ratio()
```

Bonus points added for:
- **Substring match** (+0.15): One name contains the other
- **Prefix match** (+0.1): Common prefixes (left, right, upper, lower)
- **Suffix match** (+0.1): Common suffixes (.l, .r, _l, _r)
- **Digit match** (+0.1): Same numbers in names (Spine1, Spine2)
- **Keyword match** (+0.05): Keywords present (arm, hand, leg, foot, finger, etc.)

**3. Matching Strategy**

Two-phase matching:

**Phase 1: Exact matching**
- Uses known aliases from Mixamo bone database
- Matches exact names (case-insensitive)
- Prevents duplicate target assignments

**Phase 2: Fuzzy matching**
- Finds best match above threshold (default 60%)
- Uses similarity scoring with bonuses
- Prevents duplicate target assignments

### Supported Bones

60+ bones supported, including:

**Body (6 bones):**
- Hips, Spine, Spine1, Spine2, Neck, Head

**Arms (8 bones):**
- LeftShoulder, LeftArm, LeftForeArm, LeftHand
- RightShoulder, RightArm, RightForeArm, RightHand

**Legs (8 bones):**
- LeftUpLeg, LeftLeg, LeftFoot, LeftToeBase
- RightUpLeg, RightLeg, RightFoot, RightToeBase

**Fingers (30 bones):**
- LeftHandThumb1/2/3
- LeftHandIndex1/2/3
- LeftHandMiddle1/2/3
- LeftHandRing1/2/3
- LeftHandPinky1/2/3
- (Same for Right)

### Known Aliases

The fuzzy matcher uses a database of known aliases for common bone names:

**Examples:**
```python
"Hips": ["hips", "pelvis", "root"]
"Spine": ["spine", "spine1"]
"LeftArm": ["upper_arm.l", "leftarm", "upperarm.l"]
"LeftHand": ["hand.l", "lefthand"]
"LeftHandThumb1": ["thumb.01.l", "lefthandthumb1", "thumb_01.l"]
```

### Similarity Threshold

Default threshold: **0.6 (60%)**

- ≥ 0.9: Near-perfect match
- 0.7-0.9: High confidence
- 0.6-0.7: Medium confidence (review recommended)
- < 0.6: Not matched

## Mapping Quality Assessment

After auto-mapping, a quality report is generated:

### Quality Levels

**Excellent (8-9 critical bones):**
```
✅ Auto-mapped 52 bones
   Quality: EXCELLENT
   Critical bones: 9/9
```

**Good (6-7 critical bones):**
```
✅ Auto-mapped 48 bones
   Quality: GOOD
   Critical bones: 7/9
```

**Fair (4-5 critical bones):**
```
⚠️  Auto-mapped 35 bones
   Quality: FAIR
   Critical bones: 5/9
```

**Poor (< 4 critical bones):**
```
❌ Auto-mapped 18 bones
   Quality: POOR
   Critical bones: 3/9
```

### Critical Bones

These bones must be mapped for acceptable retargeting:
1. Hips (root motion)
2. Spine
3. Head
4. LeftArm / RightArm (arms)
5. LeftLeg / RightLeg (legs)
6. LeftHand / RightHand (hands)

## UI Confirmation Workflow

The 2-stage workflow allows manual review before applying retargeting.

### Stage 1: Auto-generate

```typescript
await workflow.run({
  targetCharacterArmature: 'MyCharacter',
  animationFilePath: './animations/Walking.fbx',
  skipConfirmation: false  // Enable UI workflow
});
```

Workflow:
1. Auto-generates bone mapping
2. Sends mapping to Blender UI
3. Displays in "Blender Toolkit" panel

### Stage 2: User Review

In Blender:
1. Press `N` key to open sidebar
2. Go to "Blender Toolkit" tab
3. Review "Bone Mapping Review" section
4. Check each source → target pair
5. Edit incorrect mappings using dropdowns
6. Click "Apply Retargeting" when ready

### Editing Mappings in UI

Blender UI panel shows:
```
Source Bone      Target Bone
───────────      ───────────
Hips        →    [pelvis ▼]
Spine       →    [spine_01 ▼]
LeftArm     →    [upper_arm.L ▼]
```

Each dropdown shows all target bones. Select correct bone if auto-mapping is wrong.

### Retrieving Edited Mapping

After user clicks "Apply Retargeting":

```typescript
const editedMapping = await client.sendCommand<Record<string, string>>(
  'BoneMapping.get',
  {
    sourceArmature: 'Mixamo_Rig',
    targetArmature: 'MyCharacter'
  }
);
```

## Best Practices

### 1. Use Descriptive Bone Names

**Good names:**
- `UpperArm_L`, `LowerArm_L`, `Hand_L`
- `upper_arm.L`, `forearm.L`, `hand.L`
- `Shoulder.L`, `Elbow.L`, `Wrist.L`

**Avoid:**
- `Bone.001`, `Bone.002`
- `Armature_01`, `Armature_02`
- Generic names like `bone1`, `bone2`

### 2. Follow Naming Conventions

**Rigify convention:**
```
spine, spine.001, spine.002
upper_arm.L, forearm.L, hand.L
thigh.L, shin.L, foot.L
```

**Mixamo convention:**
```
Hips, Spine, Spine1, Spine2
LeftArm, LeftForeArm, LeftHand
LeftUpLeg, LeftLeg, LeftFoot
```

### 3. Always Review Auto-Mapping

Even with high quality scores, always review critical bones:
- Hips (root motion)
- Spine chain
- Shoulder connections
- Hip connections

### 4. Test with Simple Animations

Start with simple animations to verify bone mapping:
1. Idle pose (minimal movement)
2. T-pose or A-pose (binding pose)
3. Walking (basic locomotion)
4. Running (more complex)

### 5. Check for Flipped Bones

Common issues:
- Left/Right swapped
- Forward/Backward orientation
- Up/Down axis mismatch

Fix: Edit mapping in Blender UI or use custom mapping.

### 6. Use Preset for Rigify

If target rig is Rigify-based:

```typescript
boneMapping: 'mixamo_to_rigify'
```

This uses optimized preset for Rigify structure.

### 7. Save Custom Mappings

For non-standard rigs, save custom mapping as preset:

```typescript
const customMap = {
  'Hips': 'CustomRoot',
  'Spine': 'CustomSpine01',
  // ...
};

// Save for reuse
fs.writeFileSync('my-custom-mapping.json', JSON.stringify(customMap, null, 2));
```

Reuse later:

```typescript
const customMap = JSON.parse(fs.readFileSync('my-custom-mapping.json', 'utf-8'));

await controller.retarget({
  sourceArmature: 'Mixamo_Rig',
  targetArmature: 'MyCharacter',
  boneMapping: 'custom',
  customBoneMap: customMap
});
```

## Troubleshooting

### Issue: Low Mapping Quality (Poor/Fair)

**Cause:** Target rig uses non-standard naming

**Solution:**
1. Check target bone names in Blender outliner
2. Create custom mapping dictionary
3. Use exact bone names (case-sensitive)

### Issue: Animation Looks Broken

**Cause:** Incorrect bone mapping (left/right swapped, wrong spine chain)

**Solution:**
1. Review mapping in Blender UI
2. Check critical bones first (Hips, Spine, Head)
3. Verify left/right bones not swapped
4. Re-map using custom mapping if needed

### Issue: Fingers Not Moving

**Cause:** Finger bones not mapped (optional)

**Solution:**
1. Check if target rig has finger bones
2. Verify finger bone names match pattern
3. Add custom finger mappings if needed

### Issue: Root Motion Lost

**Cause:** Hips bone not mapped or `preserveLocation: false`

**Solution:**
```typescript
preserveLocation: true  // Enable location for Hips
```

## Advanced Usage

### Custom Similarity Threshold

Adjust threshold for stricter/looser matching:

```python
# In Python addon (modify bone_matching.py)
bone_map = fuzzy_match_bones(
    source_bones=source_bones,
    target_bones=target_bones,
    known_aliases=mixamo_bone_aliases,
    threshold=0.7  # Stricter (70% similarity required)
)
```

### Partial Bone Mapping

Map only specific bones:

```typescript
customBoneMap: {
  'Hips': 'Root',
  'Spine': 'Spine01',
  'Head': 'Head01',
  // Leave other bones unmapped
}
```

Non-mapped bones will not be retargeted.

### Debug Fuzzy Matching

Enable debug logging to see similarity scores:

```bash
DEBUG=1 node .blender-toolkit/bt.js retarget ...
```

Check logs:
```
[DEBUG] Bone matching: Hips → pelvis (score: 0.85)
[DEBUG] Bone matching: LeftArm → upper_arm.L (score: 0.72)
```
