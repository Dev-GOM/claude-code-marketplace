# WebSocket Commands Reference

Complete reference for all Blender Toolkit WebSocket commands using JSON-RPC protocol.

## Command Protocol

Blender Toolkit uses JSON-RPC over WebSocket for communication between TypeScript client and Blender Python addon.

**Request format:**
```json
{
  "id": 1,
  "method": "CommandCategory.methodName",
  "params": {
    "paramName": "value"
  }
}
```

**Response format:**
```json
{
  "id": 1,
  "result": { ... }
}
```

**Error format:**
```json
{
  "id": 1,
  "error": {
    "code": -1,
    "message": "Error description"
  }
}
```

## Command Categories

### Armature Commands

**Armature.list** - List all armature objects in scene
```typescript
await client.sendCommand<string[]>('Armature.list');

// Returns:
["MyCharacter", "Mixamo_Rig", "Hero"]
```

**Armature.getBones** - Get bone information from armature
```typescript
await client.sendCommand<BoneInfo[]>('Armature.getBones', {
  armatureName: 'MyCharacter'
});

// Returns:
[
  {
    "name": "Hips",
    "parent": null,
    "children": ["Spine", "LeftUpLeg", "RightUpLeg"]
  },
  {
    "name": "Spine",
    "parent": "Hips",
    "children": ["Spine1"]
  }
  // ...
]
```

Parameters:
- `armatureName` (string, required): Name of the armature object

### Retargeting Commands

**Retargeting.autoMapBones** - Auto-generate bone mapping with fuzzy matching
```typescript
await client.sendCommand<Record<string, string>>('Retargeting.autoMapBones', {
  sourceArmature: 'Mixamo_Rig',
  targetArmature: 'MyCharacter'
});

// Returns:
{
  "Hips": "pelvis",
  "Spine": "spine_01",
  "LeftArm": "upper_arm.L",
  // ... 60+ bone mappings
}
```

Parameters:
- `sourceArmature` (string, required): Source armature name (Mixamo)
- `targetArmature` (string, required): Target armature name (your character)

**Retargeting.getPresetMapping** - Get predefined bone mapping preset
```typescript
await client.sendCommand<Record<string, string>>('Retargeting.getPresetMapping', {
  preset: 'mixamo_to_rigify'
});

// Returns:
{
  "Hips": "torso",
  "Spine": "spine",
  "Spine1": "spine.001",
  // ...
}
```

Parameters:
- `preset` (string, required): Preset name
  - `"mixamo_to_rigify"`: Mixamo to Rigify rig mapping

**Retargeting.retargetAnimation** - Execute animation retargeting
```typescript
await client.sendCommand('Retargeting.retargetAnimation', {
  sourceArmature: 'Mixamo_Rig',
  targetArmature: 'MyCharacter',
  boneMap: {
    "Hips": "pelvis",
    "Spine": "spine_01",
    // ...
  },
  preserveRotation: true,
  preserveLocation: true
});

// Returns: "Animation retargeted to MyCharacter"
```

Parameters:
- `sourceArmature` (string, required): Source armature name
- `targetArmature` (string, required): Target armature name
- `boneMap` (object, required): Bone mapping dictionary
- `preserveRotation` (boolean, optional, default: true): Preserve rotation constraints
- `preserveLocation` (boolean, optional, default: false): Preserve location constraints (usually Hips only)

### Animation Commands

**Animation.list** - List animation actions for armature
```typescript
await client.sendCommand<string[]>('Animation.list', {
  armatureName: 'MyCharacter'
});

// Returns:
["Walking", "Running", "Idle"]
```

Parameters:
- `armatureName` (string, required): Armature name

**Animation.play** - Play animation
```typescript
await client.sendCommand('Animation.play', {
  armatureName: 'MyCharacter',
  actionName: 'Walking',
  loop: true
});

// Returns: "Playing Walking"
```

Parameters:
- `armatureName` (string, required): Armature name
- `actionName` (string, required): Action name to play
- `loop` (boolean, optional, default: true): Loop playback

**Animation.stop** - Stop animation playback
```typescript
await client.sendCommand('Animation.stop');

// Returns: "Animation stopped"
```

**Animation.addToNLA** - Add animation to NLA track
```typescript
await client.sendCommand('Animation.addToNLA', {
  armatureName: 'MyCharacter',
  actionName: 'Walking',
  trackName: 'Retargeted_Walking'
});

// Returns: "Added Walking to NLA track Retargeted_Walking"
```

Parameters:
- `armatureName` (string, required): Armature name
- `actionName` (string, required): Action name to add
- `trackName` (string, required): NLA track name

### Import Commands

**Import.fbx** - Import FBX file
```typescript
await client.sendCommand('Import.fbx', {
  filepath: '/path/to/animation.fbx'
});

// Returns: "Imported /path/to/animation.fbx"
```

Parameters:
- `filepath` (string, required): Absolute path to FBX file

**Import.dae** - Import Collada (DAE) file
```typescript
await client.sendCommand('Import.dae', {
  filepath: '/path/to/animation.dae'
});

// Returns: "Imported /path/to/animation.dae"
```

Parameters:
- `filepath` (string, required): Absolute path to DAE file

### Bone Mapping Commands

**BoneMapping.show** - Display bone mapping in Blender UI
```typescript
await client.sendCommand('BoneMapping.show', {
  sourceArmature: 'Mixamo_Rig',
  targetArmature: 'MyCharacter',
  boneMapping: {
    "Hips": "pelvis",
    "Spine": "spine_01",
    // ...
  }
});

// Returns: "Bone mapping stored (52 bones)"
```

Parameters:
- `sourceArmature` (string, required): Source armature name
- `targetArmature` (string, required): Target armature name
- `boneMapping` (object, required): Bone mapping dictionary

**BoneMapping.get** - Retrieve bone mapping from Blender UI
```typescript
await client.sendCommand<Record<string, string>>('BoneMapping.get', {
  sourceArmature: 'Mixamo_Rig',
  targetArmature: 'MyCharacter'
});

// Returns:
{
  "Hips": "pelvis",
  "Spine": "spine_01_edited",  // User may have edited this
  // ...
}
```

Parameters:
- `sourceArmature` (string, required): Source armature name
- `targetArmature` (string, required): Target armature name

## TypeScript Client Usage

### Connecting to Blender

```typescript
import { BlenderClient } from './blender/client';

const client = new BlenderClient(9400);  // Port number

// Connect
await client.connect();
console.log('Connected to Blender');

// Send commands
const armatures = await client.sendCommand<string[]>('Armature.list');
console.log('Armatures:', armatures);

// Disconnect
await client.disconnect();
```

### Using Retargeting Controller

```typescript
import { BlenderClient } from './blender/client';
import { RetargetingController } from './blender/retargeting';

const client = new BlenderClient(9400);
await client.connect();

const controller = new RetargetingController(client);

// Get bones
const bones = await controller.getBones('MyCharacter');
console.log('Bones:', bones.map(b => b.name));

// Auto-map bones
const boneMap = await controller.autoMapBones('Mixamo_Rig', 'MyCharacter');
console.log('Bone mapping:', boneMap);

// Retarget animation
await controller.retarget({
  sourceArmature: 'Mixamo_Rig',
  targetArmature: 'MyCharacter',
  boneMapping: 'auto',
  preserveRotation: true,
  preserveLocation: true
});
```

### Full Workflow Example

```typescript
import { AnimationRetargetingWorkflow } from './index';

const workflow = new AnimationRetargetingWorkflow();

// Execute complete workflow
await workflow.run({
  blenderPort: 9400,
  targetCharacterArmature: 'MyCharacter',
  animationFilePath: './animations/Walking.fbx',
  animationName: 'Walking',
  boneMapping: 'auto',
  skipConfirmation: false,  // Enable UI confirmation
});
```

## Error Handling

All commands may throw errors. Always use try-catch:

```typescript
try {
  await client.sendCommand('Armature.getBones', {
    armatureName: 'NonExistent'
  });
} catch (error) {
  console.error('Command failed:', error.message);
  // Error: Armature 'NonExistent' not found
}
```

Common errors:
- `"Not connected to Blender"`: Client not connected, call `connect()` first
- `"Armature 'X' not found"`: Armature doesn't exist in scene
- `"Source or target armature not found"`: One of the armatures is invalid
- `"Source armature has no animation"`: No animation data on source
- `"Bone mapping is empty"`: No bones were mapped (check bone names)
- `"Command timeout"`: Command took longer than 120 seconds

## Timeouts

- **Connection timeout**: 30 seconds
- **Command timeout**: 120 seconds (2 minutes)
- **Retargeting timeout**: 120 seconds (customizable)

Increase timeout for long operations:

```typescript
// Extend timeout for retargeting (not yet implemented)
await controller.retarget({
  sourceArmature: 'Mixamo_Rig',
  targetArmature: 'MyCharacter',
  // ... other options
}, 300000);  // 5 minutes
```

## Logging

Enable debug logging with `DEBUG` environment variable:

```bash
DEBUG=1 node .blender-toolkit/bt.js retarget ...
```

Logs are saved to:
- TypeScript: `.blender-toolkit/logs/typescript.log`
- Python: `.blender-toolkit/logs/blender-addon.log`
- Errors: `.blender-toolkit/logs/error.log`
