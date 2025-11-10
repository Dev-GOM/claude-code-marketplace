# Commands Reference

Complete command-line interface reference for Blender Toolkit CLI.

## Table of Contents

- [Geometry Commands](#geometry-commands)
- [Object Commands](#object-commands)
- [Modifier Commands](#modifier-commands)
- [Material Commands](#material-commands)
- [Collection Commands](#collection-commands)
- [Retargeting Commands](#retargeting-commands)
- [Daemon Commands](#daemon-commands)
- [Global Options](#global-options)

---

## Geometry Commands

Create and manipulate geometric primitives and meshes.

### create-cube

Create a cube primitive.

```bash
blender-toolkit create-cube [options]
```

**Options:**
- `-x, --x <number>` - X position (default: 0)
- `-y, --y <number>` - Y position (default: 0)
- `-z, --z <number>` - Z position (default: 0)
- `-s, --size <number>` - Cube size (default: 2.0)
- `-n, --name <string>` - Object name
- `-p, --port <number>` - Blender WebSocket port (default: 9400)

**Example:**
```bash
blender-toolkit create-cube --x 0 --y 0 --z 2 --size 1.5 --name "MyCube"
```

### create-sphere

Create a sphere primitive.

```bash
blender-toolkit create-sphere [options]
```

**Options:**
- `-x, --x <number>` - X position (default: 0)
- `-y, --y <number>` - Y position (default: 0)
- `-z, --z <number>` - Z position (default: 0)
- `-r, --radius <number>` - Sphere radius (default: 1.0)
- `--segments <number>` - Number of segments (default: 32)
- `--rings <number>` - Number of rings (default: 16)
- `-n, --name <string>` - Object name
- `-p, --port <number>` - Blender WebSocket port (default: 9400)

**Example:**
```bash
blender-toolkit create-sphere --radius 2 --segments 64 --rings 32
```

### create-cylinder

Create a cylinder primitive.

```bash
blender-toolkit create-cylinder [options]
```

**Options:**
- `-x, --x <number>` - X position (default: 0)
- `-y, --y <number>` - Y position (default: 0)
- `-z, --z <number>` - Z position (default: 0)
- `-r, --radius <number>` - Cylinder radius (default: 1.0)
- `-d, --depth <number>` - Cylinder height/depth (default: 2.0)
- `--vertices <number>` - Number of vertices (default: 32)
- `-n, --name <string>` - Object name
- `-p, --port <number>` - Blender WebSocket port (default: 9400)

**Example:**
```bash
blender-toolkit create-cylinder --radius 1.5 --depth 3 --vertices 64
```

### create-plane

Create a plane primitive.

```bash
blender-toolkit create-plane [options]
```

**Options:**
- `-x, --x <number>` - X position (default: 0)
- `-y, --y <number>` - Y position (default: 0)
- `-z, --z <number>` - Z position (default: 0)
- `-s, --size <number>` - Plane size (default: 2.0)
- `-n, --name <string>` - Object name
- `-p, --port <number>` - Blender WebSocket port (default: 9400)

**Example:**
```bash
blender-toolkit create-plane --size 10 --name "Ground"
```

### create-cone

Create a cone primitive.

```bash
blender-toolkit create-cone [options]
```

**Options:**
- `-x, --x <number>` - X position (default: 0)
- `-y, --y <number>` - Y position (default: 0)
- `-z, --z <number>` - Z position (default: 0)
- `-r, --radius <number>` - Cone base radius (default: 1.0)
- `-d, --depth <number>` - Cone height/depth (default: 2.0)
- `--vertices <number>` - Number of vertices (default: 32)
- `-n, --name <string>` - Object name
- `-p, --port <number>` - Blender WebSocket port (default: 9400)

**Example:**
```bash
blender-toolkit create-cone --radius 2 --depth 4
```

### create-torus

Create a torus primitive.

```bash
blender-toolkit create-torus [options]
```

**Options:**
- `-x, --x <number>` - X position (default: 0)
- `-y, --y <number>` - Y position (default: 0)
- `-z, --z <number>` - Z position (default: 0)
- `--major-radius <number>` - Major radius (default: 1.0)
- `--minor-radius <number>` - Minor radius/tube thickness (default: 0.25)
- `--major-segments <number>` - Major segments (default: 48)
- `--minor-segments <number>` - Minor segments (default: 12)
- `-n, --name <string>` - Object name
- `-p, --port <number>` - Blender WebSocket port (default: 9400)

**Example:**
```bash
blender-toolkit create-torus --major-radius 3 --minor-radius 0.5
```

### subdivide

Subdivide a mesh object to add more geometry detail.

```bash
blender-toolkit subdivide [options]
```

**Options:**
- `-n, --name <string>` - Object name **(required)**
- `-c, --cuts <number>` - Number of subdivision cuts (default: 1)
- `-p, --port <number>` - Blender WebSocket port (default: 9400)

**Example:**
```bash
blender-toolkit subdivide --name "Cube" --cuts 2
```

### get-vertices

Get vertices information of an object.

```bash
blender-toolkit get-vertices [options]
```

**Options:**
- `-n, --name <string>` - Object name **(required)**
- `-p, --port <number>` - Blender WebSocket port (default: 9400)

**Example:**
```bash
blender-toolkit get-vertices --name "Sphere"
```

### move-vertex

Move a specific vertex to a new position.

```bash
blender-toolkit move-vertex [options]
```

**Options:**
- `-n, --name <string>` - Object name **(required)**
- `-i, --index <number>` - Vertex index **(required)**
- `-x, --x <number>` - New X position **(required)**
- `-y, --y <number>` - New Y position **(required)**
- `-z, --z <number>` - New Z position **(required)**
- `-p, --port <number>` - Blender WebSocket port (default: 9400)

**Example:**
```bash
blender-toolkit move-vertex --name "Cube" --index 0 --x 1.5 --y 0 --z 0
```

---

## Object Commands

Manage and manipulate Blender objects.

### list-objects

List all objects in the scene.

```bash
blender-toolkit list-objects [options]
```

**Options:**
- `-t, --type <string>` - Filter by object type (MESH, ARMATURE, CAMERA, LIGHT)
- `-p, --port <number>` - Blender WebSocket port (default: 9400)

**Example:**
```bash
blender-toolkit list-objects --type MESH
```

### transform

Transform an object (move, rotate, scale).

```bash
blender-toolkit transform [options]
```

**Options:**
- `-n, --name <string>` - Object name **(required)**
- `--loc-x <number>` - X location
- `--loc-y <number>` - Y location
- `--loc-z <number>` - Z location
- `--rot-x <number>` - X rotation (radians)
- `--rot-y <number>` - Y rotation (radians)
- `--rot-z <number>` - Z rotation (radians)
- `--scale-x <number>` - X scale
- `--scale-y <number>` - Y scale
- `--scale-z <number>` - Z scale
- `-p, --port <number>` - Blender WebSocket port (default: 9400)

**Example:**
```bash
blender-toolkit transform --name "Cube" --loc-x 5 --loc-y 0 --loc-z 2 --scale-x 2
```

### duplicate

Duplicate an object.

```bash
blender-toolkit duplicate [options]
```

**Options:**
- `-n, --name <string>` - Source object name **(required)**
- `--new-name <string>` - New object name
- `-x, --x <number>` - X position for duplicate
- `-y, --y <number>` - Y position for duplicate
- `-z, --z <number>` - Z position for duplicate
- `-p, --port <number>` - Blender WebSocket port (default: 9400)

**Example:**
```bash
blender-toolkit duplicate --name "Cube" --new-name "Cube.001" --x 3
```

### delete

Delete an object.

```bash
blender-toolkit delete [options]
```

**Options:**
- `-n, --name <string>` - Object name **(required)**
- `-p, --port <number>` - Blender WebSocket port (default: 9400)

**Example:**
```bash
blender-toolkit delete --name "Cube.001"
```

---

## Modifier Commands

Add and manage modifiers on objects.

### add-modifier

Add a modifier to an object.

```bash
blender-toolkit add-modifier [options]
```

**Options:**
- `-n, --name <string>` - Object name **(required)**
- `-t, --type <string>` - Modifier type (SUBSURF, MIRROR, ARRAY, BEVEL, etc.) **(required)**
- `--mod-name <string>` - Modifier name
- `--levels <number>` - Subdivision levels (for SUBSURF)
- `--render-levels <number>` - Render levels (for SUBSURF)
- `-p, --port <number>` - Blender WebSocket port (default: 9400)

**Common Modifier Types:**
- `SUBSURF` - Subdivision Surface
- `MIRROR` - Mirror
- `ARRAY` - Array
- `BEVEL` - Bevel
- `SOLIDIFY` - Solidify
- `BOOLEAN` - Boolean

**Example:**
```bash
blender-toolkit add-modifier --name "Cube" --type SUBSURF --levels 2
```

### apply-modifier

Apply a modifier to an object.

```bash
blender-toolkit apply-modifier [options]
```

**Options:**
- `-n, --name <string>` - Object name **(required)**
- `-m, --modifier <string>` - Modifier name **(required)**
- `-p, --port <number>` - Blender WebSocket port (default: 9400)

**Example:**
```bash
blender-toolkit apply-modifier --name "Cube" --modifier "Subdivision"
```

### list-modifiers

List all modifiers on an object.

```bash
blender-toolkit list-modifiers [options]
```

**Options:**
- `-n, --name <string>` - Object name **(required)**
- `-p, --port <number>` - Blender WebSocket port (default: 9400)

**Example:**
```bash
blender-toolkit list-modifiers --name "Cube"
```

### remove-modifier

Remove a modifier from an object.

```bash
blender-toolkit remove-modifier [options]
```

**Options:**
- `-n, --name <string>` - Object name **(required)**
- `-m, --modifier <string>` - Modifier name **(required)**
- `-p, --port <number>` - Blender WebSocket port (default: 9400)

**Example:**
```bash
blender-toolkit remove-modifier --name "Cube" --modifier "Subdivision"
```

### toggle-modifier

Toggle modifier visibility.

```bash
blender-toolkit toggle-modifier [options]
```

**Options:**
- `-n, --name <string>` - Object name **(required)**
- `-m, --modifier <string>` - Modifier name **(required)**
- `--viewport <boolean>` - Viewport visibility (true/false)
- `--render <boolean>` - Render visibility (true/false)
- `-p, --port <number>` - Blender WebSocket port (default: 9400)

**Example:**
```bash
blender-toolkit toggle-modifier --name "Cube" --modifier "Subdivision" --viewport false
```

### modify-modifier

Modify modifier properties.

```bash
blender-toolkit modify-modifier [options]
```

**Options:**
- `-n, --name <string>` - Object name **(required)**
- `-m, --modifier <string>` - Modifier name **(required)**
- `--levels <number>` - Subdivision levels
- `--render-levels <number>` - Render levels
- `--width <number>` - Bevel width
- `--segments <number>` - Bevel segments
- `--count <number>` - Array count
- `-p, --port <number>` - Blender WebSocket port (default: 9400)

**Example:**
```bash
blender-toolkit modify-modifier --name "Cube" --modifier "Subdivision" --levels 3
```

### get-modifier-info

Get detailed modifier information.

```bash
blender-toolkit get-modifier-info [options]
```

**Options:**
- `-n, --name <string>` - Object name **(required)**
- `-m, --modifier <string>` - Modifier name **(required)**
- `-p, --port <number>` - Blender WebSocket port (default: 9400)

**Example:**
```bash
blender-toolkit get-modifier-info --name "Cube" --modifier "Subdivision"
```

### reorder-modifier

Reorder modifier in the modifier stack.

```bash
blender-toolkit reorder-modifier [options]
```

**Options:**
- `-n, --name <string>` - Object name **(required)**
- `-m, --modifier <string>` - Modifier name **(required)**
- `-d, --direction <string>` - Direction (UP or DOWN) **(required)**
- `-p, --port <number>` - Blender WebSocket port (default: 9400)

**Example:**
```bash
blender-toolkit reorder-modifier --name "Cube" --modifier "Subdivision" --direction UP
```

---

## Material Commands

Create and manage materials.

### material create

Create a new material.

```bash
blender-toolkit material create [options]
```

**Options:**
- `--name <name>` - Material name **(required)**
- `--no-nodes` - Disable node-based material (default: enabled)

**Example:**
```bash
blender-toolkit material create --name "RedMaterial"
```

### material list

List all materials in the scene.

```bash
blender-toolkit material list
```

**Example:**
```bash
blender-toolkit material list
```

### material delete

Delete a material.

```bash
blender-toolkit material delete [options]
```

**Options:**
- `--name <name>` - Material name **(required)**

**Example:**
```bash
blender-toolkit material delete --name "RedMaterial"
```

### material assign

Assign a material to an object.

```bash
blender-toolkit material assign [options]
```

**Options:**
- `--object <name>` - Object name **(required)**
- `--material <name>` - Material name **(required)**
- `--slot <index>` - Material slot index (default: 0)

**Example:**
```bash
blender-toolkit material assign --object "Cube" --material "RedMaterial"
```

### material list-object

List materials assigned to an object.

```bash
blender-toolkit material list-object [options]
```

**Options:**
- `--object <name>` - Object name **(required)**

**Example:**
```bash
blender-toolkit material list-object --object "Cube"
```

### material set-color

Set material base color.

```bash
blender-toolkit material set-color [options]
```

**Options:**
- `--material <name>` - Material name **(required)**
- `--r <value>` - Red (0-1) **(required)**
- `--g <value>` - Green (0-1) **(required)**
- `--b <value>` - Blue (0-1) **(required)**
- `--a <value>` - Alpha (0-1) (default: 1.0)

**Example:**
```bash
blender-toolkit material set-color --material "RedMaterial" --r 1.0 --g 0.0 --b 0.0
```

### material set-metallic

Set material metallic value.

```bash
blender-toolkit material set-metallic [options]
```

**Options:**
- `--material <name>` - Material name **(required)**
- `--value <value>` - Metallic value (0-1) **(required)**

**Example:**
```bash
blender-toolkit material set-metallic --material "MetalMaterial" --value 1.0
```

### material set-roughness

Set material roughness value.

```bash
blender-toolkit material set-roughness [options]
```

**Options:**
- `--material <name>` - Material name **(required)**
- `--value <value>` - Roughness value (0-1) **(required)**

**Example:**
```bash
blender-toolkit material set-roughness --material "MetalMaterial" --value 0.2
```

### material set-emission

Set material emission.

```bash
blender-toolkit material set-emission [options]
```

**Options:**
- `--material <name>` - Material name **(required)**
- `--r <value>` - Red (0-1) **(required)**
- `--g <value>` - Green (0-1) **(required)**
- `--b <value>` - Blue (0-1) **(required)**
- `--strength <value>` - Emission strength (default: 1.0)

**Example:**
```bash
blender-toolkit material set-emission --material "GlowMaterial" --r 0 --g 1 --b 0 --strength 5
```

### material get-properties

Get material properties.

```bash
blender-toolkit material get-properties [options]
```

**Options:**
- `--material <name>` - Material name **(required)**

**Example:**
```bash
blender-toolkit material get-properties --material "RedMaterial"
```

---

## Collection Commands

Organize objects into collections.

### collection create

Create a new collection.

```bash
blender-toolkit collection create [options]
```

**Options:**
- `--name <name>` - Collection name **(required)**

**Example:**
```bash
blender-toolkit collection create --name "Props"
```

### collection list

List all collections.

```bash
blender-toolkit collection list
```

**Example:**
```bash
blender-toolkit collection list
```

### collection add-object

Add an object to a collection.

```bash
blender-toolkit collection add-object [options]
```

**Options:**
- `--object <name>` - Object name **(required)**
- `--collection <name>` - Collection name **(required)**

**Example:**
```bash
blender-toolkit collection add-object --object "Cube" --collection "Props"
```

### collection remove-object

Remove an object from a collection.

```bash
blender-toolkit collection remove-object [options]
```

**Options:**
- `--object <name>` - Object name **(required)**
- `--collection <name>` - Collection name **(required)**

**Example:**
```bash
blender-toolkit collection remove-object --object "Cube" --collection "Props"
```

### collection delete

Delete a collection.

```bash
blender-toolkit collection delete [options]
```

**Options:**
- `--name <name>` - Collection name **(required)**

**Example:**
```bash
blender-toolkit collection delete --name "Props"
```

---

## Retargeting Commands

Animation retargeting from Mixamo to custom rigs.

### retarget

Retarget animation from Mixamo to your character.

```bash
blender-toolkit retarget [options]
```

**Options:**
- `-t, --target <string>` - Target character armature name **(required)**
- `-f, --file <string>` - Animation file path (FBX or DAE) **(required)**
- `-n, --name <string>` - Animation name for NLA track
- `-m, --mapping <string>` - Bone mapping mode (auto, mixamo_to_rigify, custom) (default: auto)
- `--skip-confirmation` - Skip bone mapping confirmation (default: false)
- `-p, --port <number>` - Blender WebSocket port (default: 9400)
- `-o, --output <string>` - Output directory

**Example:**
```bash
blender-toolkit retarget --target "Hero" --file "./Walking.fbx" --name "Walking"
```

**With Auto Confirmation:**
```bash
blender-toolkit retarget --target "Hero" --file "./Walking.fbx" --skip-confirmation
```

### mixamo-help

Show Mixamo download instructions and popular animations.

```bash
blender-toolkit mixamo-help [animation-name]
```

**Arguments:**
- `[animation-name]` - Optional: Get specific animation instructions

**Example:**
```bash
# Show all popular animations and general instructions
blender-toolkit mixamo-help

# Show instructions for specific animation
blender-toolkit mixamo-help Walking
```

---

## Daemon Commands

Manage Blender WebSocket server daemon.

### daemon-start

Start the Blender WebSocket server.

```bash
blender-toolkit daemon-start [options]
```

**Options:**
- `-p, --port <number>` - Port number (default: 9400)

**Example:**
```bash
blender-toolkit daemon-start --port 9400
```

### daemon-stop

Stop the Blender WebSocket server.

```bash
blender-toolkit daemon-stop [options]
```

**Options:**
- `-p, --port <number>` - Port number (default: 9400)

**Example:**
```bash
blender-toolkit daemon-stop
```

### daemon-status

Check Blender WebSocket server status.

```bash
blender-toolkit daemon-status [options]
```

**Options:**
- `-p, --port <number>` - Port number (default: 9400)

**Example:**
```bash
blender-toolkit daemon-status
```

---

## Global Options

Options available for all commands:

- `-p, --port <number>` - Blender WebSocket port (default: 9400)
- `-h, --help` - Display help for command
- `-V, --version` - Output the version number

---

## Port Range

Blender Toolkit uses port range **9400-9500** for WebSocket connections.

- Default port: **9400**
- Browser Pilot uses: **9222-9322** (no conflict)
- Multiple projects can run simultaneously with different ports
- Ports are auto-assigned and persisted in project configuration

---

## Tips

1. **Use `--help` for Detailed Options:**
   ```bash
   blender-toolkit <command> --help
   ```

2. **Port Conflicts:**
   - If default port 9400 is in use, specify a different port
   - Configuration persists across sessions

3. **Object Names are Case-Sensitive:**
   - Use exact names as they appear in Blender

4. **WebSocket Connection:**
   - Ensure Blender addon is enabled and server is started
   - Check port number matches between CLI and addon

5. **Batch Operations:**
   - Use shell scripts to combine multiple commands
   - Example: Create multiple objects with different positions
