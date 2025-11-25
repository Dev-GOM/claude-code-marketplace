# Asset Management Commands (ScriptableObject)

Unity ScriptableObject 에셋을 생성하고 조회하며 수정할 수 있는 명령어입니다. 배열/리스트 완전 지원 및 모든 필드 타입을 지원합니다.

## Available Commands

| Command | Description |
|---------|-------------|
| `asset list-types` | List available ScriptableObject types |
| `asset create-so` | Create a new ScriptableObject asset |
| `asset get-fields` | Get fields of a ScriptableObject (supports array expansion) |
| `asset set-field` | Set a field value (supports array index notation) |
| `asset inspect` | Inspect a ScriptableObject with full metadata |
| `asset add-element` | Add an element to an array/list field |
| `asset remove-element` | Remove an element from an array/list field |
| `asset get-element` | Get a specific array element |
| `asset clear-array` | Clear all elements from an array/list field |

---

## asset list-types

프로젝트에서 사용 가능한 ScriptableObject 타입을 조회합니다.

### Usage

```bash
cd <unity-project-root> && node .unity-websocket/uw asset list-types [options]
```

### Options

- `--filter <pattern>` - Filter types by pattern (supports * wildcard)
- `--json` - Output in JSON format
- `--timeout <ms>` - WebSocket connection timeout (default: 30000)

### Examples

```bash
# List all ScriptableObject types
cd <unity-project-root> && node .unity-websocket/uw asset list-types

# Filter by pattern
cd <unity-project-root> && node .unity-websocket/uw asset list-types --filter "*Config*"
cd <unity-project-root> && node .unity-websocket/uw asset list-types --filter "Game*"

# JSON output
cd <unity-project-root> && node .unity-websocket/uw asset list-types --json
```

---

## asset create-so

새로운 ScriptableObject 에셋을 생성합니다.

### Usage

```bash
cd <unity-project-root> && node .unity-websocket/uw asset create-so <typeName> <path> [options]
```

### Parameters

- `<typeName>` - ScriptableObject type name (full or short name)
- `<path>` - Asset path (e.g., "Assets/Config/game.asset")

### Options

- `--json` - Output in JSON format
- `--timeout <ms>` - WebSocket connection timeout (default: 30000)

### Examples

```bash
# Create ScriptableObject by short name
cd <unity-project-root> && node .unity-websocket/uw asset create-so GameConfig "Assets/Config/game.asset"

# Create ScriptableObject by full name
cd <unity-project-root> && node .unity-websocket/uw asset create-so "MyGame.GameConfig" "Config/settings"

# JSON output
cd <unity-project-root> && node .unity-websocket/uw asset create-so ItemData "Items/sword.asset" --json
```

### Notes

- Path automatically gets "Assets/" prefix if not present
- Path automatically gets ".asset" extension if not present
- Parent directories are created automatically
- Type name can be short (e.g., "GameConfig") or full (e.g., "MyGame.GameConfig")

---

## asset get-fields

ScriptableObject의 필드를 조회합니다. 배열 확장 옵션 지원.

### Usage

```bash
cd <unity-project-root> && node .unity-websocket/uw asset get-fields <path> [options]
```

### Parameters

- `<path>` - Asset path (e.g., "Assets/Config/game.asset")

### Options

- `--expand` - Expand array/list elements
- `--depth <n>` - Max depth for nested expansion (default: 3)
- `--json` - Output in JSON format
- `--timeout <ms>` - WebSocket connection timeout (default: 30000)

### Examples

```bash
# Get basic fields
cd <unity-project-root> && node .unity-websocket/uw asset get-fields "Assets/Config/game.asset"

# Expand arrays
cd <unity-project-root> && node .unity-websocket/uw asset get-fields "Config/game.asset" --expand

# Expand with custom depth
cd <unity-project-root> && node .unity-websocket/uw asset get-fields "Config/game.asset" --expand --depth 5

# JSON output
cd <unity-project-root> && node .unity-websocket/uw asset get-fields "Config/game.asset" --json
```

### Response (without --expand)

```
✓ Fields for MyGame.GameConfig (Assets/Config/game.asset):

  Player Health (playerHealth)
    Type: Integer
    Value: 100

  Items (items)
    Type: Generic [Array: 3]
    Element Type: Generic
    Value: [Array: 3 elements]
```

### Response (with --expand)

```
✓ Fields for MyGame.GameConfig (Assets/Config/game.asset):

  Items (items)
    Type: Generic [Array: 3]
    Element Type: Generic
    Value: [Array: 3 elements]
      Element 0 ([0])
        Type: Generic
        Value: [Object: 2 fields]
          Item Name (itemName)
            Type: String
            Value: Sword
          Item Count (itemCount)
            Type: Integer
            Value: 5
```

---

## asset set-field

ScriptableObject의 필드 값을 설정합니다. 배열 인덱스 표기법 지원.

### Usage

```bash
cd <unity-project-root> && node .unity-websocket/uw asset set-field <path> <fieldName> <value> [options]
```

### Parameters

- `<path>` - Asset path
- `<fieldName>` - Field name or path (supports array index: `items[0]`, `items[2].name`)
- `<value>` - New value (format depends on field type)

### Options

- `--json` - Output in JSON format
- `--timeout <ms>` - WebSocket connection timeout (default: 30000)

### Field Name Patterns

```bash
# Simple field
"playerHealth"

# Array element (by index)
"items[0]"

# Nested field in array element
"items[0].itemName"
"items[2].count"

# Multi-level nesting
"enemies[1].stats.health"
```

### Value Formats by Type

| Type | Format | Example |
|------|--------|---------|
| Integer | `"10"` | `"100"` |
| Float | `"1.5"` | `"3.14"` |
| String | `"text"` | `"Sword"` |
| Boolean | `"true"` or `"false"` | `"true"` |
| Enum | `"EnumValue"` or `"0"` | `"Active"` |
| Vector2 | `"x,y"` | `"1.0,2.0"` |
| Vector3 | `"x,y,z"` | `"1.0,2.0,3.0"` |
| Vector4 | `"x,y,z,w"` | `"1,2,3,4"` |
| Color | `"r,g,b,a"` | `"1,0,0,1"` |
| Quaternion | `"x,y,z,w"` | `"0,0,0,1"` |
| Rect | `"x,y,width,height"` | `"0,0,100,50"` |
| Bounds | `"centerX,Y,Z,sizeX,Y,Z"` | `"0,0,0,10,10,10"` |
| Vector2Int | `"x,y"` | `"10,20"` |
| Vector3Int | `"x,y,z"` | `"1,2,3"` |
| RectInt | `"x,y,width,height"` | `"0,0,100,50"` |
| BoundsInt | `"posX,Y,Z,sizeX,Y,Z"` | `"0,0,0,5,5,5"` |
| AnimationCurve | `"time:value;time:value"` | `"0:0;1:1"` |
| ObjectReference | `"Assets/path/to/asset"` | `"Assets/Prefabs/Player.prefab"` |
| ArraySize | `"3"` | Changes array size |

### Examples

```bash
# Set simple field
cd <unity-project-root> && node .unity-websocket/uw asset set-field "Config/game.asset" "playerHealth" "100"

# Set array element
cd <unity-project-root> && node .unity-websocket/uw asset set-field "Config/game.asset" "items[0]" "NewValue"

# Set nested field in array
cd <unity-project-root> && node .unity-websocket/uw asset set-field "Config/game.asset" "items[0].itemName" "Sword"
cd <unity-project-root> && node .unity-websocket/uw asset set-field "Config/game.asset" "items[2].count" "10"

# Set Vector3
cd <unity-project-root> && node .unity-websocket/uw asset set-field "Config/game.asset" "spawnPosition" "10.5,0,5.2"

# Set Color
cd <unity-project-root> && node .unity-websocket/uw asset set-field "Config/game.asset" "tintColor" "1,0,0,1"

# Set ObjectReference
cd <unity-project-root> && node .unity-websocket/uw asset set-field "Config/game.asset" "playerPrefab" "Assets/Prefabs/Player.prefab"

# Change array size
cd <unity-project-root> && node .unity-websocket/uw asset set-field "Config/game.asset" "items.Array.size" "5"
```

---

## asset inspect

ScriptableObject의 전체 메타데이터와 필드를 조회합니다.

### Usage

```bash
cd <unity-project-root> && node .unity-websocket/uw asset inspect <path> [options]
```

### Parameters

- `<path>` - Asset path

### Options

- `--expand` - Expand array/list elements
- `--depth <n>` - Max depth for nested expansion (default: 3)
- `--json` - Output in JSON format
- `--timeout <ms>` - WebSocket connection timeout (default: 30000)

### Examples

```bash
# Inspect asset
cd <unity-project-root> && node .unity-websocket/uw asset inspect "Assets/Config/game.asset"

# Inspect with array expansion
cd <unity-project-root> && node .unity-websocket/uw asset inspect "Config/game.asset" --expand

# JSON output
cd <unity-project-root> && node .unity-websocket/uw asset inspect "Config/game.asset" --json
```

---

## asset add-element

배열/리스트 필드에 새 요소를 추가합니다.

### Usage

```bash
cd <unity-project-root> && node .unity-websocket/uw asset add-element <path> <fieldName> [options]
```

### Parameters

- `<path>` - Asset path
- `<fieldName>` - Array field name

### Options

- `--value <value>` - Initial value for the new element
- `--index <n>` - Insert position (-1 = end, default: -1)
- `--json` - Output in JSON format
- `--timeout <ms>` - WebSocket connection timeout (default: 30000)

### Examples

```bash
# Add element at end
cd <unity-project-root> && node .unity-websocket/uw asset add-element "Config/game.asset" "items"

# Add element with initial value
cd <unity-project-root> && node .unity-websocket/uw asset add-element "Config/game.asset" "items" --value "NewItem"

# Add element at specific index
cd <unity-project-root> && node .unity-websocket/uw asset add-element "Config/game.asset" "items" --index 0 --value "FirstItem"

# JSON output
cd <unity-project-root> && node .unity-websocket/uw asset add-element "Config/game.asset" "enemies" --json
```

---

## asset remove-element

배열/리스트 필드에서 요소를 제거합니다.

### Usage

```bash
cd <unity-project-root> && node .unity-websocket/uw asset remove-element <path> <fieldName> <index> [options]
```

### Parameters

- `<path>` - Asset path
- `<fieldName>` - Array field name
- `<index>` - Index of element to remove

### Options

- `--json` - Output in JSON format
- `--timeout <ms>` - WebSocket connection timeout (default: 30000)

### Examples

```bash
# Remove first element
cd <unity-project-root> && node .unity-websocket/uw asset remove-element "Config/game.asset" "items" 0

# Remove last element (if array has 5 elements)
cd <unity-project-root> && node .unity-websocket/uw asset remove-element "Config/game.asset" "items" 4

# JSON output
cd <unity-project-root> && node .unity-websocket/uw asset remove-element "Config/game.asset" "enemies" 2 --json
```

---

## asset get-element

배열/리스트 필드의 특정 요소를 조회합니다.

### Usage

```bash
cd <unity-project-root> && node .unity-websocket/uw asset get-element <path> <fieldName> <index> [options]
```

### Parameters

- `<path>` - Asset path
- `<fieldName>` - Array field name
- `<index>` - Index of element to get

### Options

- `--json` - Output in JSON format
- `--timeout <ms>` - WebSocket connection timeout (default: 30000)

### Examples

```bash
# Get first element
cd <unity-project-root> && node .unity-websocket/uw asset get-element "Config/game.asset" "items" 0

# Get specific element
cd <unity-project-root> && node .unity-websocket/uw asset get-element "Config/game.asset" "enemies" 2

# JSON output
cd <unity-project-root> && node .unity-websocket/uw asset get-element "Config/game.asset" "items" 0 --json
```

---

## asset clear-array

배열/리스트 필드의 모든 요소를 제거합니다.

### Usage

```bash
cd <unity-project-root> && node .unity-websocket/uw asset clear-array <path> <fieldName> [options]
```

### Parameters

- `<path>` - Asset path
- `<fieldName>` - Array field name

### Options

- `--json` - Output in JSON format
- `--timeout <ms>` - WebSocket connection timeout (default: 30000)

### Examples

```bash
# Clear array
cd <unity-project-root> && node .unity-websocket/uw asset clear-array "Config/game.asset" "items"

# JSON output
cd <unity-project-root> && node .unity-websocket/uw asset clear-array "Config/game.asset" "enemies" --json
```

---

## Workflow Examples

### 1. Create and Configure ScriptableObject

```bash
# Step 1: List available types
cd <unity-project-root> && node .unity-websocket/uw asset list-types --filter "*Config*"

# Step 2: Create new ScriptableObject
cd <unity-project-root> && node .unity-websocket/uw asset create-so GameConfig "Assets/Config/game.asset"

# Step 3: View fields
cd <unity-project-root> && node .unity-websocket/uw asset get-fields "Assets/Config/game.asset"

# Step 4: Set field values
cd <unity-project-root> && node .unity-websocket/uw asset set-field "Assets/Config/game.asset" "playerHealth" "100"
cd <unity-project-root> && node .unity-websocket/uw asset set-field "Assets/Config/game.asset" "playerName" "Hero"
```

### 2. Manage Array/List Fields

```bash
# View array
cd <unity-project-root> && node .unity-websocket/uw asset get-fields "Config/game.asset" --expand

# Add elements
cd <unity-project-root> && node .unity-websocket/uw asset add-element "Config/game.asset" "items" --value "Sword"
cd <unity-project-root> && node .unity-websocket/uw asset add-element "Config/game.asset" "items" --value "Shield"

# Modify array element
cd <unity-project-root> && node .unity-websocket/uw asset set-field "Config/game.asset" "items[0]" "LegendarySword"

# Remove element
cd <unity-project-root> && node .unity-websocket/uw asset remove-element "Config/game.asset" "items" 1

# Clear all
cd <unity-project-root> && node .unity-websocket/uw asset clear-array "Config/game.asset" "items"
```

### 3. Work with Nested Objects

```bash
# View nested structure
cd <unity-project-root> && node .unity-websocket/uw asset get-fields "Config/game.asset" --expand --depth 5

# Modify nested field
cd <unity-project-root> && node .unity-websocket/uw asset set-field "Config/game.asset" "player.stats.health" "100"
cd <unity-project-root> && node .unity-websocket/uw asset set-field "Config/game.asset" "enemies[0].name" "Goblin"
cd <unity-project-root> && node .unity-websocket/uw asset set-field "Config/game.asset" "enemies[0].stats.damage" "15"
```

---

## Supported Field Types

All Unity SerializedPropertyType values are supported:

- **Numeric**: Integer, Float, Boolean, Character, LayerMask
- **Vectors**: Vector2, Vector3, Vector4, Vector2Int, Vector3Int
- **Geometry**: Rect, RectInt, Bounds, BoundsInt, Quaternion
- **Graphics**: Color, AnimationCurve, Gradient (read-only)
- **References**: ObjectReference, ExposedReference
- **Special**: Enum, String, Hash128, ArraySize
- **Complex**: Generic (nested objects), ManagedReference

---

## Error Handling

### Asset Not Found
```
Error: ScriptableObject not found at: Assets/Config/missing.asset
```
**Solution**: Check asset path and ensure asset exists

### Type Not Found
```
Error: ScriptableObject type not found: InvalidType
```
**Solution**: Use `asset list-types` to find valid type names

### Field Not Found
```
Error: Field not found: invalidField
```
**Solution**: Use `asset get-fields` to see available fields

### Array Index Out of Range
```
Error: Index 10 out of range (0-4)
```
**Solution**: Check array size with `asset get-fields` or `asset get-element`

### Invalid Value Format
```
Error: Cannot convert '1.5' to integer
```
**Solution**: Check value format for the field type

---

## Best Practices

1. **Type Discovery**: Use `list-types` before `create-so`
2. **Field Inspection**: Use `get-fields --expand` to see structure
3. **Array Index**: Always check array size before accessing elements
4. **Nested Paths**: Use dot notation for nested objects: `items[0].name`
5. **Undo Support**: All modifications support Unity's Undo system
6. **Batch Operations**: Combine multiple `set-field` calls for efficiency
7. **JSON Output**: Use `--json` for programmatic parsing
8. **Error Handling**: Always check response for success/error status
