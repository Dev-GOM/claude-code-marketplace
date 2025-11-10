# Workflow Examples

Complete workflow examples for common animation retargeting use cases.

## Basic Workflow

### Example 1: Simple Retargeting with Auto Mapping

**Scenario:** Apply Walking animation to custom character with automatic bone mapping.

```typescript
import { AnimationRetargetingWorkflow } from './index';

async function retargetWalking() {
  const workflow = new AnimationRetargetingWorkflow();

  await workflow.run({
    targetCharacterArmature: 'Hero',           // Character name in Blender
    animationFilePath: './animations/Walking.fbx',
    animationName: 'Walking',
    boneMapping: 'auto',                      // Auto bone mapping
    skipConfirmation: false,                  // Enable UI review
  });
}

retargetWalking().catch(console.error);
```

**Steps:**
1. Downloads Walking.fbx from Mixamo manually
2. Opens Blender with Hero character loaded
3. Runs script
4. Reviews bone mapping in Blender UI
5. Clicks "Apply Retargeting" in Blender
6. Animation is retargeted and added to NLA track

---

### Example 2: Rigify Character

**Scenario:** Retarget to Rigify-based character using preset mapping.

```typescript
async function retargetToRigify() {
  const workflow = new AnimationRetargetingWorkflow();

  await workflow.run({
    targetCharacterArmature: 'RigifyCharacter',
    animationFilePath: './animations/Running.fbx',
    animationName: 'Running',
    boneMapping: 'mixamo_to_rigify',         // Use Rigify preset
    skipConfirmation: false,
  });
}
```

**Why use preset:**
- Rigify rigs have standardized bone names
- Preset includes optimized mappings
- Faster than auto-mapping

---

### Example 3: Custom Bone Mapping

**Scenario:** Non-standard rig requires manual bone mapping.

```typescript
async function retargetWithCustomMapping() {
  const workflow = new AnimationRetargetingWorkflow();

  const customMap = {
    // Spine chain
    'Hips': 'Root',
    'Spine': 'Spine_01',
    'Spine1': 'Spine_02',
    'Spine2': 'Spine_03',
    'Neck': 'Neck_01',
    'Head': 'Head_01',

    // Left arm
    'LeftShoulder': 'Clavicle_L',
    'LeftArm': 'UpperArm_L',
    'LeftForeArm': 'ForeArm_L',
    'LeftHand': 'Hand_L',

    // Right arm
    'RightShoulder': 'Clavicle_R',
    'RightArm': 'UpperArm_R',
    'RightForeArm': 'ForeArm_R',
    'RightHand': 'Hand_R',

    // Left leg
    'LeftUpLeg': 'UpperLeg_L',
    'LeftLeg': 'LowerLeg_L',
    'LeftFoot': 'Foot_L',
    'LeftToeBase': 'Toe_L',

    // Right leg
    'RightUpLeg': 'UpperLeg_R',
    'RightLeg': 'LowerLeg_R',
    'RightFoot': 'Foot_R',
    'RightToeBase': 'Toe_R',
  };

  await workflow.run({
    targetCharacterArmature: 'CustomRig',
    animationFilePath: './animations/Jump.fbx',
    animationName: 'Jump',
    boneMapping: 'custom',
    customBoneMap: customMap,
    skipConfirmation: true,                  // Skip UI (trust custom mapping)
  });
}
```

**When to use:**
- Auto-mapping produces poor results
- Non-standard bone naming convention
- Need precise control over mappings

---

## Advanced Workflows

### Example 4: Batch Processing Multiple Animations

**Scenario:** Retarget multiple Mixamo animations to same character.

```typescript
async function batchRetarget() {
  const workflow = new AnimationRetargetingWorkflow();

  const animations = [
    { file: './animations/Walking.fbx', name: 'Walking' },
    { file: './animations/Running.fbx', name: 'Running' },
    { file: './animations/Jumping.fbx', name: 'Jumping' },
    { file: './animations/Idle.fbx', name: 'Idle' },
  ];

  for (const anim of animations) {
    console.log(`\n🎬 Processing: ${anim.name}`);

    await workflow.run({
      targetCharacterArmature: 'Hero',
      animationFilePath: anim.file,
      animationName: anim.name,
      boneMapping: 'auto',
      skipConfirmation: true,                // Skip UI for batch processing
    });

    console.log(`✅ Completed: ${anim.name}\n`);
  }

  console.log('🎉 All animations retargeted!');
}

batchRetarget().catch(console.error);
```

**Output:**
```
🎬 Processing: Walking
🔍 Auto-generating bone mapping...
✅ Auto-mapped 52 bones (Quality: GOOD)
🎬 Starting animation retargeting...
✅ Animation retargeted successfully!
✅ Completed: Walking

🎬 Processing: Running
...
```

**Tips:**
- Use `skipConfirmation: true` for batch processing
- Verify first animation carefully, then trust auto-mapping for rest
- All animations use same bone mapping (first one generated)

---

### Example 5: Error Handling and Retry

**Scenario:** Robust workflow with error recovery.

```typescript
async function retargetWithRetry(
  characterName: string,
  animFile: string,
  animName: string,
  maxRetries: number = 3
) {
  const workflow = new AnimationRetargetingWorkflow();

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📝 Attempt ${attempt}/${maxRetries}`);

      await workflow.run({
        targetCharacterArmature: characterName,
        animationFilePath: animFile,
        animationName: animName,
        boneMapping: 'auto',
        skipConfirmation: attempt > 1,       // Skip confirmation on retries
      });

      console.log(`✅ Success on attempt ${attempt}`);
      return true;

    } catch (error) {
      console.error(`❌ Attempt ${attempt} failed:`, error.message);

      if (attempt === maxRetries) {
        console.error('🛑 Max retries reached. Giving up.');
        throw error;
      }

      // Wait before retry
      console.log(`⏳ Retrying in 5 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

// Usage
retargetWithRetry('Hero', './animations/Walking.fbx', 'Walking')
  .catch(console.error);
```

**Common errors handled:**
- WebSocket connection failures
- Blender not running
- File not found
- Armature name mismatch

---

### Example 6: Programmatic Mixamo Download Instructions

**Scenario:** User doesn't have Mixamo file yet.

```typescript
async function guideUserDownload(animationName: string) {
  const workflow = new AnimationRetargetingWorkflow();

  // Show download instructions
  console.log(workflow.getManualDownloadInstructions(animationName));

  // Show recommended settings
  console.log('\n📋 Recommended Download Settings:');
  const settings = workflow.getRecommendedSettings();
  console.log(`  Format: ${settings.format}`);
  console.log(`  Skin: ${settings.skin}`);
  console.log(`  FPS: ${settings.fps}`);
  console.log(`  Keyframe Reduction: ${settings.keyframeReduction}`);

  // Show popular animations
  console.log('\n🔥 Popular Animations:');
  const popular = workflow.getPopularAnimations();
  popular.forEach(anim => {
    console.log(`  - ${anim.name}: ${anim.description}`);
  });
}

guideUserDownload('Walking');
```

**Output:**
```
📥 Manual Download Instructions for "Walking"

1. Visit: https://www.mixamo.com/
2. Browse or search for "Walking" animation
3. Download with these settings:
   - Format: FBX (.fbx)
   - Skin: Without Skin
   - FPS: 30 fps
   - Keyframe Reduction: None
4. Save to: ./animations/Walking.fbx

📋 Recommended Download Settings:
  Format: FBX (.fbx)
  Skin: Without Skin
  FPS: 30 fps
  Keyframe Reduction: None

🔥 Popular Animations:
  - Walking: Natural walking cycle
  - Running: Fast running motion
  - Idle: Standing idle pose
  - Jumping: Jump with landing
  - ...
```

---

### Example 7: Custom Port Configuration

**Scenario:** Multiple projects using different Blender instances.

```typescript
async function retargetWithCustomPort() {
  const workflow = new AnimationRetargetingWorkflow();

  // Use non-default port (e.g., Blender on port 9401)
  await workflow.run({
    blenderPort: 9401,                       // Custom port
    targetCharacterArmature: 'Hero',
    animationFilePath: './animations/Walking.fbx',
    animationName: 'Walking',
    boneMapping: 'auto',
  });
}
```

**When to use:**
- Multiple Blender instances running
- Port conflict with default 9400
- Specific project configuration

---

### Example 8: Separate Import and Retargeting

**Scenario:** Import animation first, then retarget separately.

```typescript
import { BlenderClient } from './blender/client';
import { RetargetingController } from './blender/retargeting';

async function separateImportAndRetarget() {
  const client = new BlenderClient(9400);
  await client.connect();

  try {
    // Step 1: Import FBX
    console.log('📦 Importing FBX...');
    await client.sendCommand('Import.fbx', {
      filepath: '/absolute/path/to/Walking.fbx'
    });

    // Step 2: List armatures to find imported one
    console.log('🔍 Finding imported armature...');
    const armatures = await client.sendCommand<string[]>('Armature.list');
    console.log('Available armatures:', armatures);

    // Step 3: Auto-map bones
    const controller = new RetargetingController(client);
    console.log('🗺️  Generating bone mapping...');
    const boneMap = await controller.autoMapBones(
      'Mixamo_Rig',    // Imported armature (adjust name)
      'Hero'           // Target character
    );

    // Step 4: Review mapping
    console.log('📋 Bone mapping:');
    Object.entries(boneMap).forEach(([src, tgt]) => {
      console.log(`  ${src} → ${tgt}`);
    });

    // Step 5: Apply retargeting
    console.log('🎬 Applying retargeting...');
    await controller.retarget({
      sourceArmature: 'Mixamo_Rig',
      targetArmature: 'Hero',
      boneMapping: 'custom',
      customBoneMap: boneMap,
    });

    console.log('✅ Retargeting complete!');

  } finally {
    await client.disconnect();
  }
}

separateImportAndRetarget().catch(console.error);
```

**Why separate:**
- More control over each step
- Inspect imported armature before mapping
- Debug bone mapping issues
- Reuse bone mapping for multiple animations

---

### Example 9: Validation Before Retargeting

**Scenario:** Validate bone mapping quality before applying.

```typescript
import { AnimationRetargetingWorkflow } from './index';
import { BlenderClient } from './blender/client';
import { RetargetingController } from './blender/retargeting';

async function retargetWithValidation() {
  const client = new BlenderClient(9400);
  await client.connect();

  try {
    const controller = new RetargetingController(client);

    // Generate bone mapping
    const boneMap = await controller.autoMapBones('Mixamo_Rig', 'Hero');

    // Assess quality
    const quality = assessMappingQuality(boneMap);
    console.log(`📊 Mapping Quality: ${quality.level}`);
    console.log(`   Total mappings: ${quality.totalMappings}`);
    console.log(`   Critical bones: ${quality.criticalBones}`);

    // Proceed based on quality
    if (quality.level === 'poor') {
      console.error('❌ Quality too low. Manual mapping required.');
      return;
    }

    if (quality.level === 'fair') {
      console.warn('⚠️  Fair quality. Recommend manual review.');
      // Show mapping in UI for review
      await client.sendCommand('BoneMapping.show', {
        sourceArmature: 'Mixamo_Rig',
        targetArmature: 'Hero',
        boneMapping: boneMap
      });
      console.log('Please review mapping in Blender and confirm...');
      return;
    }

    // Good or excellent quality - proceed automatically
    console.log('✅ Quality sufficient. Proceeding with retargeting...');
    await controller.retarget({
      sourceArmature: 'Mixamo_Rig',
      targetArmature: 'Hero',
      boneMapping: 'custom',
      customBoneMap: boneMap,
    });

    console.log('🎉 Retargeting complete!');

  } finally {
    await client.disconnect();
  }
}

function assessMappingQuality(boneMap: Record<string, string>) {
  const criticalBones = [
    'Hips', 'Spine', 'Head',
    'LeftArm', 'RightArm',
    'LeftLeg', 'RightLeg',
    'LeftHand', 'RightHand'
  ];

  const mapped = criticalBones.filter(bone => bone in boneMap);
  const criticalCount = mapped.length;
  const totalCount = Object.keys(boneMap).length;

  let level: 'excellent' | 'good' | 'fair' | 'poor';
  if (criticalCount >= 8) level = 'excellent';
  else if (criticalCount >= 6) level = 'good';
  else if (criticalCount >= 4) level = 'fair';
  else level = 'poor';

  return {
    level,
    totalMappings: totalCount,
    criticalBones: `${criticalCount}/${criticalBones.length}`,
    mappedCritical: mapped,
    missingCritical: criticalBones.filter(b => !(b in boneMap))
  };
}

retargetWithValidation().catch(console.error);
```

**Output:**
```
📊 Mapping Quality: good
   Total mappings: 48
   Critical bones: 7/9
   Missing: LeftToeBase, RightToeBase

✅ Quality sufficient. Proceeding with retargeting...
```

---

## Troubleshooting Workflows

### Example 10: Connection Retry Logic

```typescript
async function connectWithRetry(port: number, maxRetries: number = 5) {
  const client = new BlenderClient(port);

  for (let i = 1; i <= maxRetries; i++) {
    try {
      console.log(`🔌 Connection attempt ${i}/${maxRetries}...`);
      await client.connect();
      console.log('✅ Connected!');
      return client;
    } catch (error) {
      console.error(`❌ Attempt ${i} failed:`, error.message);

      if (i === maxRetries) {
        console.error('🛑 Failed to connect to Blender.');
        console.error('Please ensure:');
        console.error('  1. Blender is running');
        console.error('  2. Blender Toolkit addon is enabled');
        console.error('  3. WebSocket server is started');
        console.error(`  4. Server is listening on port ${port}`);
        throw error;
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  throw new Error('Failed to connect');
}

// Usage
const client = await connectWithRetry(9400);
```

---

### Example 11: Animation Cleanup After Failed Retargeting

```typescript
async function cleanupAfterFailure() {
  const client = new BlenderClient(9400);
  await client.connect();

  try {
    // Attempt retargeting
    await someRetargetingWorkflow();
  } catch (error) {
    console.error('❌ Retargeting failed:', error.message);

    // Cleanup: Remove imported animation
    console.log('🧹 Cleaning up imported animation...');
    // TODO: Implement cleanup commands
    // await client.sendCommand('Scene.removeObject', { name: 'Mixamo_Rig' });

    throw error;
  } finally {
    await client.disconnect();
  }
}
```

---

## Integration Examples

### Example 12: Express API Endpoint

```typescript
import express from 'express';
import { AnimationRetargetingWorkflow } from './index';

const app = express();
app.use(express.json());

app.post('/api/retarget', async (req, res) => {
  const { character, animationFile, animationName } = req.body;

  try {
    const workflow = new AnimationRetargetingWorkflow();

    await workflow.run({
      targetCharacterArmature: character,
      animationFilePath: animationFile,
      animationName: animationName,
      boneMapping: 'auto',
      skipConfirmation: true,
    });

    res.json({ success: true, message: 'Retargeting complete' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(3000, () => {
  console.log('API server running on port 3000');
});
```

---

## Summary

These workflows demonstrate:
- Basic single animation retargeting
- Batch processing multiple animations
- Custom bone mappings
- Error handling and retry logic
- Quality validation
- Connection management
- API integration

Adapt these examples to your specific use case by adjusting:
- Character armature names
- Animation file paths
- Bone mapping strategies
- Confirmation workflow (UI vs automatic)
- Port configurations
