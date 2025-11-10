# Addon API Reference

Complete reference for Blender Toolkit Python Addon WebSocket API.

## Table of Contents

- [Overview](#overview)
- [WebSocket Protocol](#websocket-protocol)
- [Command Categories](#command-categories)
- [Geometry API](#geometry-api)
- [Object API](#object-api)
- [Material API](#material-api)
- [Collection API](#collection-api)
- [Armature API](#armature-api)
- [Animation API](#animation-api)
- [Bone Mapping API](#bone-mapping-api)
- [Retargeting API](#retargeting-api)
- [Modifier API](#modifier-api)
- [Import API](#import-api)
- [Error Handling](#error-handling)

---

## Overview

The Blender Toolkit addon provides a WebSocket-based JSON-RPC API for controlling Blender programmatically.

**Key Features:**
- Real-time Blender control via WebSocket
- JSON-RPC 2.0 protocol
- Comprehensive API coverage
- Type-safe commands
- Error reporting
- Security validation

**Architecture:**
```
Client (TypeScript)     WebSocket      Blender Addon (Python)
─────────────────────   ─────────      ──────────────────────
BlenderClient.sendCommand()  ──────►   Command Handler
    {                                   │
      method: "Geometry.createCube",    │
      params: {...}                     ▼
    }                               Execute Command
                                        │
Response ◄──────────────────────────────┘
    {
      result: {...},
      error: null
    }
```

---

## WebSocket Protocol

### Connection

**Endpoint:**
```
ws://localhost:9400/
```

**Port Range:** 9400-9500

**Connection Example:**
```typescript
import { BlenderClient } from './blender/client';

const client = new BlenderClient();
await client.connect(9400);

// Send command
const result = await client.sendCommand('Geometry.createCube', {
  location: [0, 0, 0],
  size: 2.0
});

await client.disconnect();
```

### Message Format

**Request (JSON-RPC 2.0):**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "Geometry.createCube",
  "params": {
    "location": [0, 0, 0],
    "size": 2.0,
    "name": "MyCube"
  }
}
```

**Response (Success):**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "name": "Cube",
    "location": [0.0, 0.0, 0.0],
    "vertices": 8,
    "faces": 6
  },
  "error": null
}
```

**Response (Error):**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": null,
  "error": {
    "code": -32602,
    "message": "Invalid params",
    "data": "Object 'MyCube' not found"
  }
}
```

---

## Command Categories

| Category | Description | Commands |
|----------|-------------|----------|
| **Geometry** | Create and modify meshes | createCube, createSphere, subdivide, etc. |
| **Object** | Object manipulation | list, transform, duplicate, delete |
| **Material** | Material management | create, assign, setColor, etc. |
| **Collection** | Collection organization | create, addObject, removeObject |
| **Armature** | Armature operations | getBones, getBoneInfo |
| **Animation** | Animation control | import, bake, addToNLA |
| **BoneMapping** | Bone correspondence | generate, display, apply |
| **Retargeting** | Animation retargeting | Full workflow commands |
| **Modifier** | Modifier management | add, apply, toggle, modify |
| **Import** | File import | importFBX, importDAE |

---

## Geometry API

### Geometry.createCube

Create a cube primitive.

**Method:** `Geometry.createCube`

**Parameters:**
```typescript
{
  location?: [number, number, number];  // Default: [0, 0, 0]
  size?: number;                        // Default: 2.0
  name?: string;                        // Optional custom name
}
```

**Returns:**
```typescript
{
  name: string;
  location: [number, number, number];
  vertices: number;
  faces: number;
}
```

**Example:**
```python
# Blender Python equivalent
import bpy
bpy.ops.mesh.primitive_cube_add(
    size=2.0,
    location=(0, 0, 0)
)
```

### Geometry.createSphere

Create a sphere primitive.

**Method:** `Geometry.createSphere`

**Parameters:**
```typescript
{
  location?: [number, number, number];  // Default: [0, 0, 0]
  radius?: number;                      // Default: 1.0
  segments?: number;                    // Default: 32
  ringCount?: number;                   // Default: 16
  name?: string;
}
```

**Returns:**
```typescript
{
  name: string;
  location: [number, number, number];
  vertices: number;
  faces: number;
}
```

### Geometry.createCylinder

Create a cylinder primitive.

**Method:** `Geometry.createCylinder`

**Parameters:**
```typescript
{
  location?: [number, number, number];
  radius?: number;                      // Default: 1.0
  depth?: number;                       // Height, default: 2.0
  vertices?: number;                    // Default: 32
  name?: string;
}
```

### Geometry.createPlane

Create a plane primitive.

**Method:** `Geometry.createPlane`

**Parameters:**
```typescript
{
  location?: [number, number, number];
  size?: number;                        // Default: 2.0
  name?: string;
}
```

### Geometry.createCone

Create a cone primitive.

**Method:** `Geometry.createCone`

**Parameters:**
```typescript
{
  location?: [number, number, number];
  radius1?: number;                     // Base radius
  depth?: number;                       // Height
  vertices?: number;
  name?: string;
}
```

### Geometry.createTorus

Create a torus primitive.

**Method:** `Geometry.createTorus`

**Parameters:**
```typescript
{
  location?: [number, number, number];
  majorRadius?: number;                 // Default: 1.0
  minorRadius?: number;                 // Tube thickness, default: 0.25
  majorSegments?: number;               // Default: 48
  minorSegments?: number;               // Default: 12
  name?: string;
}
```

### Geometry.subdivideMesh

Subdivide a mesh to add detail.

**Method:** `Geometry.subdivideMesh`

**Parameters:**
```typescript
{
  name: string;                         // Object name (required)
  cuts?: number;                        // Subdivision cuts, default: 1
}
```

**Returns:**
```typescript
{
  name: string;
  vertices: number;
  edges: number;
  faces: number;
}
```

### Geometry.getVertices

Get all vertices of a mesh.

**Method:** `Geometry.getVertices`

**Parameters:**
```typescript
{
  name: string;                         // Object name (required)
}
```

**Returns:**
```typescript
Array<{
  index: number;
  co: [number, number, number];       // Coordinate
}>
```

### Geometry.moveVertex

Move a specific vertex.

**Method:** `Geometry.moveVertex`

**Parameters:**
```typescript
{
  objectName: string;
  vertexIndex: number;
  newPosition: [number, number, number];
}
```

**Returns:**
```typescript
{
  object: string;
  vertex_index: number;
  position: [number, number, number];
}
```

---

## Object API

### Object.list

List all objects in the scene.

**Method:** `Object.list`

**Parameters:**
```typescript
{
  type?: string;                        // Filter: MESH, ARMATURE, CAMERA, LIGHT
}
```

**Returns:**
```typescript
Array<{
  name: string;
  type: string;
  location: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}>
```

### Object.transform

Transform an object (move, rotate, scale).

**Method:** `Object.transform`

**Parameters:**
```typescript
{
  name: string;                         // Object name (required)
  location?: [number, number, number];
  rotation?: [number, number, number];  // Radians
  scale?: [number, number, number];
}
```

**Returns:**
```typescript
{
  name: string;
  location: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}
```

### Object.duplicate

Duplicate an object.

**Method:** `Object.duplicate`

**Parameters:**
```typescript
{
  name: string;                         // Source object (required)
  newName?: string;
  location?: [number, number, number];
}
```

**Returns:**
```typescript
{
  name: string;                         // New object name
  type: string;
  location: [number, number, number];
}
```

### Object.delete

Delete an object.

**Method:** `Object.delete`

**Parameters:**
```typescript
{
  name: string;                         // Object name (required)
}
```

**Returns:**
```typescript
{
  message: string;                      // "Object 'X' deleted successfully"
}
```

---

## Material API

### Material.create

Create a new material.

**Method:** `Material.create`

**Parameters:**
```typescript
{
  name: string;                         // Material name (required)
  useNodes?: boolean;                   // Default: true
}
```

**Returns:**
```typescript
{
  name: string;
  use_nodes: boolean;
}
```

### Material.list

List all materials.

**Method:** `Material.list`

**Parameters:** `{}`

**Returns:**
```typescript
Array<{
  name: string;
  use_nodes: boolean;
}>
```

### Material.delete

Delete a material.

**Method:** `Material.delete`

**Parameters:**
```typescript
{
  name: string;                         // Material name (required)
}
```

### Material.assign

Assign material to object.

**Method:** `Material.assign`

**Parameters:**
```typescript
{
  objectName: string;                   // Object name (required)
  materialName: string;                 // Material name (required)
  slotIndex?: number;                   // Default: 0
}
```

**Returns:**
```typescript
{
  object: string;
  material: string;
  slot: number;
}
```

### Material.listObjectMaterials

List materials on an object.

**Method:** `Material.listObjectMaterials`

**Parameters:**
```typescript
{
  objectName: string;                   // Object name (required)
}
```

**Returns:**
```typescript
Array<{
  slot: number;
  material: string | null;
}>
```

### Material.setBaseColor

Set material base color.

**Method:** `Material.setBaseColor`

**Parameters:**
```typescript
{
  materialName: string;                 // Material name (required)
  color: [number, number, number, number]; // RGBA (0-1)
}
```

**Returns:**
```typescript
{
  material: string;
  base_color: [number, number, number, number];
}
```

### Material.setMetallic

Set metallic value.

**Method:** `Material.setMetallic`

**Parameters:**
```typescript
{
  materialName: string;
  metallic: number;                     // 0.0 - 1.0
}
```

### Material.setRoughness

Set roughness value.

**Method:** `Material.setRoughness`

**Parameters:**
```typescript
{
  materialName: string;
  roughness: number;                    // 0.0 - 1.0
}
```

### Material.setEmission

Set emission color and strength.

**Method:** `Material.setEmission`

**Parameters:**
```typescript
{
  materialName: string;
  color: [number, number, number, number];
  strength?: number;                    // Default: 1.0
}
```

### Material.getProperties

Get all material properties.

**Method:** `Material.getProperties`

**Parameters:**
```typescript
{
  materialName: string;
}
```

**Returns:**
```typescript
{
  name: string;
  use_nodes: boolean;
  base_color?: [number, number, number, number];
  metallic?: number;
  roughness?: number;
  // ... other properties
}
```

---

## Collection API

### Collection.create

Create a new collection.

**Method:** `Collection.create`

**Parameters:**
```typescript
{
  name: string;                         // Collection name (required)
}
```

### Collection.list

List all collections.

**Method:** `Collection.list`

**Parameters:** `{}`

**Returns:**
```typescript
Array<{
  name: string;
  objects: number;                      // Count of objects
}>
```

### Collection.addObject

Add object to collection.

**Method:** `Collection.addObject`

**Parameters:**
```typescript
{
  objectName: string;
  collectionName: string;
}
```

### Collection.removeObject

Remove object from collection.

**Method:** `Collection.removeObject`

**Parameters:**
```typescript
{
  objectName: string;
  collectionName: string;
}
```

### Collection.delete

Delete a collection.

**Method:** `Collection.delete`

**Parameters:**
```typescript
{
  name: string;
}
```

---

## Armature API

### Armature.getBones

Get all bones in an armature.

**Method:** `Armature.getBones`

**Parameters:**
```typescript
{
  armatureName: string;
}
```

**Returns:**
```typescript
Array<string>                           // Bone names
```

### Armature.getBoneInfo

Get detailed bone information.

**Method:** `Armature.getBoneInfo`

**Parameters:**
```typescript
{
  armatureName: string;
  boneName: string;
}
```

**Returns:**
```typescript
{
  name: string;
  head: [number, number, number];
  tail: [number, number, number];
  parent: string | null;
  children: string[];
}
```

---

## Animation API

### Animation.import

Import animation from FBX.

**Method:** `Animation.import`

**Parameters:**
```typescript
{
  filePath: string;
  removeNamespace?: boolean;            // Default: true
}
```

**Returns:**
```typescript
{
  imported: string;                     // Armature name
  frames: number;
}
```

### Animation.bake

Bake animation to keyframes.

**Method:** `Animation.bake`

**Parameters:**
```typescript
{
  armatureName: string;
  startFrame: number;
  endFrame: number;
}
```

### Animation.addToNLA

Add animation to NLA track.

**Method:** `Animation.addToNLA`

**Parameters:**
```typescript
{
  armatureName: string;
  trackName: string;
  actionName: string;
}
```

---

## Bone Mapping API

### BoneMapping.generate

Generate automatic bone mapping.

**Method:** `BoneMapping.generate`

**Parameters:**
```typescript
{
  sourceArmature: string;
  targetArmature: string;
  threshold?: number;                   // Default: 0.6
}
```

**Returns:**
```typescript
{
  mapping: Record<string, string>;      // source -> target
  quality: {
    total_mappings: number;
    critical_bones_mapped: string;      // "8/9"
    quality: string;                    // excellent/good/fair/poor
    summary: string;
  };
}
```

### BoneMapping.display

Display mapping in Blender UI.

**Method:** `BoneMapping.display`

**Parameters:**
```typescript
{
  sourceArmature: string;
  targetArmature: string;
  mapping: Record<string, string>;
  quality: object;
}
```

**Effect:**
- Creates UI panel in View3D sidebar
- Shows mapping table
- Allows user editing
- Provides "Apply" button

### BoneMapping.getUserConfirmation

Wait for user confirmation.

**Method:** `BoneMapping.getUserConfirmation`

**Parameters:** `{}`

**Returns:**
```typescript
{
  confirmed: boolean;
  mapping: Record<string, string>;      // Updated mapping
}
```

**Behavior:**
- Blocks until user clicks "Apply Retargeting"
- Returns updated mapping (after user edits)

---

## Retargeting API

### Retargeting.apply

Apply retargeting with constraints.

**Method:** `Retargeting.apply`

**Parameters:**
```typescript
{
  sourceArmature: string;
  targetArmature: string;
  mapping: Record<string, string>;
  startFrame: number;
  endFrame: number;
}
```

**Process:**
1. Creates Copy Rotation constraints
2. Sets constraint targets
3. Bakes animation to keyframes
4. Removes constraints
5. Cleans up

**Returns:**
```typescript
{
  success: boolean;
  frames_baked: number;
}
```

### Retargeting.cleanup

Clean up temporary objects.

**Method:** `Retargeting.cleanup`

**Parameters:**
```typescript
{
  sourceArmature: string;
}
```

**Effect:**
- Removes imported Mixamo armature
- Cleans up temporary data

---

## Modifier API

### Modifier.add

Add a modifier to object.

**Method:** `Modifier.add`

**Parameters:**
```typescript
{
  objectName: string;
  modifierType: string;                 // SUBSURF, MIRROR, ARRAY, etc.
  name?: string;
  properties?: Record<string, any>;
}
```

**Modifier Types:**
- `SUBSURF` - Subdivision Surface
- `MIRROR` - Mirror
- `ARRAY` - Array
- `BEVEL` - Bevel
- `SOLIDIFY` - Solidify
- `BOOLEAN` - Boolean
- And many more...

### Modifier.apply

Apply a modifier.

**Method:** `Modifier.apply`

**Parameters:**
```typescript
{
  objectName: string;
  modifierName: string;
}
```

### Modifier.list

List modifiers on object.

**Method:** `Modifier.list`

**Parameters:**
```typescript
{
  objectName: string;
}
```

**Returns:**
```typescript
Array<{
  name: string;
  type: string;
  show_viewport: boolean;
  show_render: boolean;
  // Type-specific properties
}>
```

### Modifier.remove

Remove a modifier.

**Method:** `Modifier.remove`

**Parameters:**
```typescript
{
  objectName: string;
  modifierName: string;
}
```

### Modifier.toggle

Toggle modifier visibility.

**Method:** `Modifier.toggle`

**Parameters:**
```typescript
{
  objectName: string;
  modifierName: string;
  viewport?: boolean;
  render?: boolean;
}
```

### Modifier.modify

Modify modifier properties.

**Method:** `Modifier.modify`

**Parameters:**
```typescript
{
  objectName: string;
  modifierName: string;
  properties: Record<string, any>;
}
```

**Example Properties:**
```typescript
// Subdivision Surface
{
  levels: 2,
  render_levels: 3
}

// Bevel
{
  width: 0.1,
  segments: 4
}

// Array
{
  count: 5,
  relative_offset_displace: [2, 0, 0]
}
```

### Modifier.getInfo

Get detailed modifier info.

**Method:** `Modifier.getInfo`

**Parameters:**
```typescript
{
  objectName: string;
  modifierName: string;
}
```

### Modifier.reorder

Reorder modifier in stack.

**Method:** `Modifier.reorder`

**Parameters:**
```typescript
{
  objectName: string;
  modifierName: string;
  direction: 'UP' | 'DOWN';
}
```

---

## Import API

### Import.importFBX

Import FBX file.

**Method:** `Import.importFBX`

**Parameters:**
```typescript
{
  filePath: string;
  useImageSearch?: boolean;
  globalScale?: number;
  applyTransform?: boolean;
  removeNamespace?: boolean;
}
```

### Import.importDAE

Import Collada (DAE) file.

**Method:** `Import.importDAE`

**Parameters:**
```typescript
{
  filePath: string;
  fixOrientation?: boolean;
  importUnits?: boolean;
}
```

---

## Error Handling

### Error Codes

Standard JSON-RPC error codes:

| Code | Name | Description |
|------|------|-------------|
| `-32700` | Parse error | Invalid JSON |
| `-32600` | Invalid Request | Invalid JSON-RPC |
| `-32601` | Method not found | Unknown method |
| `-32602` | Invalid params | Invalid parameters |
| `-32603` | Internal error | Server error |

### Custom Error Codes

| Code | Name | Description |
|------|------|-------------|
| `1001` | Object not found | Specified object doesn't exist |
| `1002` | Invalid operation | Operation not allowed |
| `1003` | File error | File not found or unreadable |
| `1004` | Validation error | Parameter validation failed |

### Error Response Format

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": null,
  "error": {
    "code": 1001,
    "message": "Object not found",
    "data": {
      "object_name": "NonExistent",
      "details": "No object named 'NonExistent' in scene"
    }
  }
}
```

### Error Handling in Client

```typescript
try {
  const result = await client.sendCommand('Object.transform', {
    name: 'NonExistent'
  });
} catch (error) {
  if (error.code === 1001) {
    console.error('Object not found:', error.data.object_name);
  } else {
    console.error('Error:', error.message);
  }
}
```

---

## Security

### Input Validation

All commands validate inputs:
- Type checking
- Range validation
- Path sanitization
- Object existence verification

### Path Security

File paths are validated to prevent:
- Directory traversal (`../../../`)
- Absolute path exploits
- Symbolic link attacks

### Command Whitelist

Only registered commands are allowed:
- No arbitrary Python code execution
- No system commands
- No file system write access (except designated dirs)

---

## Performance Tips

1. **Batch Commands:** Group related operations
2. **Reuse Connections:** Don't reconnect for each command
3. **Use Appropriate Timeouts:** Long operations need longer timeouts
4. **Cache Data:** Store repeated query results
5. **Minimize Data Transfer:** Only request needed data
