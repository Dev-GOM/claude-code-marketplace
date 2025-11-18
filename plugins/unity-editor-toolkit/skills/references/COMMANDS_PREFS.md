# Unity Editor Toolkit - EditorPrefs Management Commands

Complete reference for reading, writing, and managing Unity EditorPrefs (persistent editor settings).

**Last Updated**: 2025-01-15

---

## cd <unity-project-root> && node .unity-websocket/uw prefs get

Get EditorPrefs value by key.

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw prefs get <key> [options]
```

**Arguments:**
```
<key>                  EditorPrefs key name
```

**Options:**
```
-t, --type <type>      Value type: string|int|float|bool (default: "string")
-d, --default <value>  Default value if key does not exist
--json                 Output in JSON format
-h, --help             Display help for command
```

**Examples:**
```bash
# Get string value
cd <unity-project-root> && node .unity-websocket/uw prefs get "UnityEditorToolkit.DatabaseConfig"

# Get int value with default
cd <unity-project-root> && node .unity-websocket/uw prefs get "MyInt" -t int -d "0"

# Get bool value as JSON
cd <unity-project-root> && node .unity-websocket/uw prefs get "MyBool" -t bool --json
```

---

## cd <unity-project-root> && node .unity-websocket/uw prefs set

Set EditorPrefs value by key.

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw prefs set <key> <value> [options]
```

**Arguments:**
```
<key>                  EditorPrefs key name
<value>                Value to set
```

**Options:**
```
-t, --type <type>      Value type: string|int|float|bool (default: "string")
--json                 Output in JSON format
-h, --help             Display help for command
```

**Examples:**
```bash
# Set string value
cd <unity-project-root> && node .unity-websocket/uw prefs set "MyKey" "MyValue"

# Set int value
cd <unity-project-root> && node .unity-websocket/uw prefs set "MyInt" "42" -t int

# Set bool value
cd <unity-project-root> && node .unity-websocket/uw prefs set "MyBool" "true" -t bool

# Set float value as JSON
cd <unity-project-root> && node .unity-websocket/uw prefs set "MyFloat" "3.14" -t float --json
```

---

## cd <unity-project-root> && node .unity-websocket/uw prefs delete

Delete EditorPrefs key.

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw prefs delete <key> [options]
```

**Arguments:**
```
<key>                  EditorPrefs key name to delete
```

**Options:**
```
--json                 Output in JSON format
-h, --help             Display help for command
```

**⚠️ Warning:**
Deletion is irreversible. Make sure you have the correct key name.

**Examples:**
```bash
# Delete key
cd <unity-project-root> && node .unity-websocket/uw prefs delete "MyKey"

# Delete with JSON output
cd <unity-project-root> && node .unity-websocket/uw prefs delete "OldConfig" --json
```

---

## cd <unity-project-root> && node .unity-websocket/uw prefs clear

Delete all EditorPrefs (WARNING: irreversible).

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw prefs clear [options]
```

**Options:**
```
--force                Skip confirmation prompt (REQUIRED)
--json                 Output in JSON format
-h, --help             Display help for command
```

**⚠️ DANGER:**
This command deletes **ALL** EditorPrefs data for the entire Unity Editor, not just the current project. Use with extreme caution. **Always backup your settings first!**

**Examples:**
```bash
# Attempt to clear (will show warning without --force)
cd <unity-project-root> && node .unity-websocket/uw prefs clear

# Force clear all EditorPrefs
cd <unity-project-root> && node .unity-websocket/uw prefs clear --force

# Clear with JSON output
cd <unity-project-root> && node .unity-websocket/uw prefs clear --force --json
```

---

## cd <unity-project-root> && node .unity-websocket/uw prefs has

Check if EditorPrefs key exists. If key exists, also returns its type and value.

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw prefs has <key> [options]
```

**Arguments:**
```
<key>                  EditorPrefs key name to check
```

**Options:**
```
--json                 Output in JSON format
-h, --help             Display help for command
```

**Output:**
```
Key: <key-name>
Exists: Yes/No
Type: string|int|float|bool      (only if exists)
Value: <value>                    (only if exists)
```

**Examples:**
```bash
# Check if key exists (shows value if exists)
cd <unity-project-root> && node .unity-websocket/uw prefs has "UnityEditorToolkit.Database.EnableWAL"
# Output:
# Key: UnityEditorToolkit.Database.EnableWAL
# Exists: Yes
# Type: bool
# Value: true

# Check non-existent key
cd <unity-project-root> && node .unity-websocket/uw prefs has "NonExistentKey"
# Output:
# Key: NonExistentKey
# Exists: No

# Check with JSON output
cd <unity-project-root> && node .unity-websocket/uw prefs has "MyKey" --json
```

---

## Common Use Cases

### Debug DatabaseConfig

```bash
# Check if config exists
cd <unity-project-root> && node .unity-websocket/uw prefs has "UnityEditorToolkit.DatabaseConfig"

# Get current config (JSON format)
cd <unity-project-root> && node .unity-websocket/uw prefs get "UnityEditorToolkit.DatabaseConfig"

# Reset config (delete)
cd <unity-project-root> && node .unity-websocket/uw prefs delete "UnityEditorToolkit.DatabaseConfig"
```

### Manual Configuration

```bash
# Set custom database path
cd <unity-project-root> && node .unity-websocket/uw prefs set "CustomDatabasePath" "D:/MyData/db.sqlite"

# Enable feature flag
cd <unity-project-root> && node .unity-websocket/uw prefs set "FeatureEnabled" "true" -t bool

# Set numeric setting
cd <unity-project-root> && node .unity-websocket/uw prefs set "MaxConnections" "10" -t int
```

---

## EditorPrefs Storage Location

EditorPrefs are stored per-Unity-Editor (not per-project):

- **Windows**: `HKEY_CURRENT_USER\Software\Unity\UnityEditor\CompanyName\ProductName`
- **macOS**: `~/Library/Preferences/com.CompanyName.ProductName.plist`
- **Linux**: `~/.config/unity3d/CompanyName/ProductName/prefs`

**Note**: CompanyName and ProductName are from your Unity Project Settings.

---

## See Also

- [Connection & Status Commands](./COMMANDS_CONNECTION_STATUS.md)
- [GameObject & Hierarchy Commands](./COMMANDS_GAMEOBJECT_HIERARCHY.md)
- [Transform Commands](./COMMANDS_TRANSFORM.md)
- [Scene Management Commands](./COMMANDS_SCENE.md)
- [Asset Database & Editor Commands](./COMMANDS_EDITOR.md)
- [Console & Logging Commands](./COMMANDS_CONSOLE.md)
