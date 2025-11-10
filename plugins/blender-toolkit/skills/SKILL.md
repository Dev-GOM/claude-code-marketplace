---
name: blender-toolkit
description: |
  Blender automation toolkit with CLI for geometry creation, object manipulation, and animation retargeting. 3D modeling, vertex editing, modifiers, animation tools.

  Features: Geometry creation (Cube, Sphere, Cylinder, Plane, Cone, Torus), Object manipulation (transform, duplicate, delete, list), Vertex editing (move, subdivide, extrude), Modifiers (add, apply), Animation retargeting with fuzzy bone matching, WebSocket-based Blender control, CLI interface.

  Commands: create-cube, create-sphere, create-cylinder, create-plane, create-cone, create-torus, list-objects, transform, duplicate, delete, get-vertices, move-vertex, subdivide, add-modifier, apply-modifier, retarget.
---

# blender-toolkit

## Purpose

Automate Blender 3D modeling, geometry creation, and animation retargeting with CLI commands and WebSocket-based control. Supports creating primitives, manipulating objects, editing vertices, applying modifiers, and retargeting Mixamo animations to custom characters.

## When to Use

Use blender-toolkit when tasks involve:
- Creating 3D geometry (cubes, spheres, cylinders, etc.)
- Object manipulation (transform, duplicate, delete)
- Vertex-level mesh editing
- Adding and applying modifiers
- Animation retargeting from Mixamo to custom characters
- Blender automation via CLI or WebSocket

## Prerequisites

- Blender 3.0+ installed
- Local scripts initialize automatically on session start (no manual setup required)
- For animation retargeting: Blender WebSocket server must be running

## Getting Help

All commands support `--help` for detailed options:

```bash
# See all available commands
node .blender-toolkit/bt --help

# Get help for specific command
node .blender-toolkit/bt create-cube --help
```

## Core Workflow

### 1. Geometry Creation

Create basic 3D primitives:

```bash
# Create cube
node .blender-toolkit/bt create-cube -x 0 -y 0 -z 0 --size 2.0 --name "MyCube"

# Create sphere
node .blender-toolkit/bt create-sphere --radius 1.5 --segments 64 --rings 32

# Create cylinder
node .blender-toolkit/bt create-cylinder --radius 0.5 --depth 3.0

# Create plane (ground)
node .blender-toolkit/bt create-plane --size 10.0 --name "Ground"

# Create cone
node .blender-toolkit/bt create-cone --radius 2.0 --depth 4.0

# Create torus
node .blender-toolkit/bt create-torus --major-radius 2.0 --minor-radius 0.5
```

### 2. Object Manipulation

List, transform, and manage objects:

```bash
# List all objects
node .blender-toolkit/bt list-objects

# List only mesh objects
node .blender-toolkit/bt list-objects --type MESH

# Transform object (move, rotate, scale)
node .blender-toolkit/bt transform --name "Cube" --loc-x 5.0 --loc-y 0 --loc-z 2.0
node .blender-toolkit/bt transform --name "Sphere" --scale-x 2.0 --scale-y 2.0 --scale-z 2.0

# Duplicate object
node .blender-toolkit/bt duplicate --name "Cube" --new-name "CubeCopy" -x 5.0

# Delete object
node .blender-toolkit/bt delete --name "Cube"
```

### 3. Vertex & Mesh Editing

Edit meshes at the vertex level:

```bash
# Get vertex information
node .blender-toolkit/bt get-vertices --name "Cube"

# Move specific vertex
node .blender-toolkit/bt move-vertex --name "Cube" --index 0 -x 2.0 -y 1.0 -z -1.0

# Subdivide mesh
node .blender-toolkit/bt subdivide --name "Cube" --cuts 2
```

### 4. Modifiers

Add and apply Blender modifiers:

```bash
# Add Subdivision Surface modifier
node .blender-toolkit/bt add-modifier --name "Cube" --type SUBSURF --levels 2

# Add Mirror modifier
node .blender-toolkit/bt add-modifier --name "Cube" --type MIRROR

# Apply modifier
node .blender-toolkit/bt apply-modifier --name "Cube" --modifier "Subdivision"
```

### 5. Animation Retargeting

Retarget Mixamo animations to custom characters:

```bash
# Retarget animation
node .blender-toolkit/bt retarget --target "MyCharacter" --file "./animations/Walking.fbx"

# Show Mixamo help
node .blender-toolkit/bt mixamo-help
node .blender-toolkit/bt mixamo-help "Walking"
```

## Command Reference

### Geometry Commands

| Command | Description |
|---------|-------------|
| `create-cube` | Create a cube primitive |
| `create-sphere` | Create a sphere primitive |
| `create-cylinder` | Create a cylinder primitive |
| `create-plane` | Create a plane primitive |
| `create-cone` | Create a cone primitive |
| `create-torus` | Create a torus primitive |

### Object Commands

| Command | Description |
|---------|-------------|
| `list-objects` | List all objects in the scene |
| `transform` | Transform object (location, rotation, scale) |
| `duplicate` | Duplicate an object |
| `delete` | Delete an object |

### Vertex Commands

| Command | Description |
|---------|-------------|
| `get-vertices` | Get vertex information of an object |
| `move-vertex` | Move a specific vertex |
| `subdivide` | Subdivide a mesh |

### Modifier Commands

| Command | Description |
|---------|-------------|
| `add-modifier` | Add a modifier to an object |
| `apply-modifier` | Apply a modifier |

### Animation Commands

| Command | Description |
|---------|-------------|
| `retarget` | Retarget Mixamo animation to character |
| `mixamo-help` | Show Mixamo download instructions |

## Common Use Cases

### Create a Basic Scene

```bash
# Create ground plane
node .blender-toolkit/bt create-plane --size 20.0 --name "Ground" -z -1.0

# Create cube on ground
node .blender-toolkit/bt create-cube --size 2.0 --name "Box"

# Add subdivision for smooth surface
node .blender-toolkit/bt add-modifier --name "Box" --type SUBSURF --levels 2

# Duplicate cube
node .blender-toolkit/bt duplicate --name "Box" --new-name "Box2" -x 5.0
```

### Edit Mesh

```bash
# Create cube
node .blender-toolkit/bt create-cube --name "EditableCube"

# Subdivide for more vertices
node .blender-toolkit/bt subdivide --name "EditableCube" --cuts 2

# Get vertices to find indices
node .blender-toolkit/bt get-vertices --name "EditableCube"

# Move specific vertex
node .blender-toolkit/bt move-vertex --name "EditableCube" --index 0 -x 3.0 -y 1.0 -z 1.0
```

### Retarget Animation

```bash
# Download animation from Mixamo first
node .blender-toolkit/bt mixamo-help "Walking"

# After manual download, retarget
node .blender-toolkit/bt retarget \
  --target "MyCharacter" \
  --file "./animations/Walking.fbx" \
  --name "WalkCycle"
```

## Important Notes

- **WebSocket Connection**: Animation retargeting requires Blender WebSocket server running (port 9400)
- **Blender Add-on**: Install the Blender Toolkit add-on from `skills/blender-retargeting/addon/__init__.py`
- **Auto-initialization**: CLI wrapper automatically initializes on session start
- **Output Directory**: Files saved to `.blender-toolkit/` in your project root

## Troubleshooting

If commands fail:

1. Check Blender is running (for retargeting commands)
2. Verify WebSocket server is active in Blender
3. Check port 9400 is not blocked
4. Rebuild scripts if needed:
   ```bash
   cd .blender-toolkit/skills/scripts
   npm install
   npm run build
   ```

For more details, see [Full Documentation](../README.md)
