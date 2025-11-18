# Unity Editor Toolkit - Database Guide

Complete guide for Unity Editor Toolkit's SQLite database integration and real-time GameObject synchronization.

## Overview

Unity Editor Toolkit provides a complete SQLite database integration for real-time GameObject synchronization, analytics, and version control capabilities.

### Key Features

- **GUID-based Persistence**: GameObjects are identified by persistent GUIDs across Unity sessions
- **Real-time Synchronization**: Auto-sync all loaded scenes every 1 second
- **Multi-scene Support**: Synchronize all loaded scenes simultaneously
- **Command Pattern**: Undo/Redo support for database operations
- **Auto Migration**: Automatic schema migration system
- **Batch Operations**: Efficient bulk operations (500 objects/batch)
- **Security**: SQL injection prevention with parameterized queries and transaction safety

## Database Setup

### 1. Unity Editor Setup

1. Open **Unity Editor Toolkit Server** window
   ```
   Tools > Unity Editor Toolkit > Server Window
   ```

2. Switch to **"Database"** tab

3. Click **"Connect"** to initialize SQLite database
   - Database file: `{ProjectRoot}/.unity-websocket/unity-editor.db`
   - Auto-creates schema with migrations

4. Enable Real-time Sync (Optional)
   - Click **"Start Sync"** for auto-sync (1s interval)
   - All loaded scenes are synchronized automatically
   - GameObjects automatically tagged with GUID components

### 2. Database File Location

```
{ProjectRoot}/
└── .unity-websocket/
    ├── unity-editor.db          # SQLite database
    ├── server-status.json       # WebSocket status
    └── uw.js                    # CLI wrapper
```

## CLI Commands

All database commands run from the Unity project root:

```bash
cd <unity-project-root> && node .unity-websocket/uw <command> [options]
```

### Database Management (`db`)

#### Connect to Database

```bash
# Connect and initialize database
cd <unity-project-root> && node .unity-websocket/uw db connect

# Connect with WAL mode disabled (default: enabled)
cd <unity-project-root> && node .unity-websocket/uw db connect --no-wal
```

**WAL Mode** (Write-Ahead Logging):
- Default: Enabled for better performance
- Multiple readers, single writer
- Disable with `--no-wal` for compatibility

#### Check Database Status

```bash
# Get connection and health status
cd <unity-project-root> && node .unity-websocket/uw db status

# Output in JSON format
cd <unity-project-root> && node .unity-websocket/uw db status --json
```

Output includes:
- Connection status
- Database file path and existence
- Initialization state
- Auto-sync status

#### Disconnect from Database

```bash
# Safely disconnect and cleanup
cd <unity-project-root> && node .unity-websocket/uw db disconnect
```

#### Reset Database

```bash
# Delete and recreate database with fresh migrations
cd <unity-project-root> && node .unity-websocket/uw db reset

# Confirm reset
cd <unity-project-root> && node .unity-websocket/uw db reset --yes
```

**Warning**: Deletes all data!

#### Run Migrations

```bash
# Apply pending migrations
cd <unity-project-root> && node .unity-websocket/uw db migrate

# Force re-run all migrations
cd <unity-project-root> && node .unity-websocket/uw db clear-migrations
cd <unity-project-root> && node .unity-websocket/uw db migrate
```

### Scene Synchronization (`sync`)

#### Sync Entire Scene

```bash
# Sync current active scene to database
cd <unity-project-root> && node .unity-websocket/uw sync scene

# Keep existing data (no clear)
cd <unity-project-root> && node .unity-websocket/uw sync scene --no-clear

# Skip components (GameObject only)
cd <unity-project-root> && node .unity-websocket/uw sync scene --no-components

# Skip hierarchy closure table
cd <unity-project-root> && node .unity-websocket/uw sync scene --no-closure

# JSON output
cd <unity-project-root> && node .unity-websocket/uw sync scene --json
```

**Closure Table**: Stores parent-child relationships for efficient hierarchy queries.

#### Sync Specific GameObject

```bash
# Sync single GameObject
cd <unity-project-root> && node .unity-websocket/uw sync object "Player"

# Sync with full hierarchy path
cd <unity-project-root> && node .unity-websocket/uw sync object "Environment/Trees/Oak"

# Include children
cd <unity-project-root> && node .unity-websocket/uw sync object "Player" --children

# Skip components
cd <unity-project-root> && node .unity-websocket/uw sync object "Player" --no-components
```

#### Check Sync Status

```bash
# Get sync status for current scene
cd <unity-project-root> && node .unity-websocket/uw sync status

# JSON output
cd <unity-project-root> && node .unity-websocket/uw sync status --json
```

Output includes:
- Unity object count
- Database object count
- Component count
- Closure record count
- In-sync status

#### Clear Sync Data

```bash
# Clear all sync data for current scene
cd <unity-project-root> && node .unity-websocket/uw sync clear

# Confirm clear
cd <unity-project-root> && node .unity-websocket/uw sync clear --yes
```

#### Auto-Sync Control

```bash
# Start auto-sync (1s interval)
cd <unity-project-root> && node .unity-websocket/uw sync start

# Stop auto-sync
cd <unity-project-root> && node .unity-websocket/uw sync stop

# Get auto-sync status
cd <unity-project-root> && node .unity-websocket/uw sync auto-status
```

Auto-sync status includes:
- Running state
- Last sync time
- Success/fail counts
- Sync interval (ms)
- Batch size

### Analytics (`analytics`)

#### Scene Analytics

```bash
# Get scene statistics
cd <unity-project-root> && node .unity-websocket/uw analytics scene

# JSON output
cd <unity-project-root> && node .unity-websocket/uw analytics scene --json
```

Output includes:
- Total GameObjects
- Total Components
- Active vs inactive objects
- Object hierarchy depth
- Component type distribution

#### GameObject Analytics

```bash
# Get GameObject statistics
cd <unity-project-root> && node .unity-websocket/uw analytics objects

# Filter by active state
cd <unity-project-root> && node .unity-websocket/uw analytics objects --active-only
```

#### Component Analytics

```bash
# Get component type distribution
cd <unity-project-root> && node .unity-websocket/uw analytics components

# Top N most used components
cd <unity-project-root> && node .unity-websocket/uw analytics components --top 10
```

#### Tag Analytics

```bash
# Get tag usage statistics
cd <unity-project-root> && node .unity-websocket/uw analytics tags
```

#### Layer Analytics

```bash
# Get layer usage statistics
cd <unity-project-root> && node .unity-websocket/uw analytics layers
```

### Snapshots (`snapshot`)

Snapshots capture the complete state of GameObjects and Components at a specific point in time.

#### Create Snapshot

```bash
# Create snapshot of current scene
cd <unity-project-root> && node .unity-websocket/uw snapshot create "Before Refactor"

# Create snapshot with description
cd <unity-project-root> && node .unity-websocket/uw snapshot create "v1.0 Release" \
  --description "Scene state before major refactor"
```

#### List Snapshots

```bash
# List all snapshots
cd <unity-project-root> && node .unity-websocket/uw snapshot list

# JSON output
cd <unity-project-root> && node .unity-websocket/uw snapshot list --json
```

#### Get Snapshot Details

```bash
# Get snapshot by ID
cd <unity-project-root> && node .unity-websocket/uw snapshot get 1

# JSON output
cd <unity-project-root> && node .unity-websocket/uw snapshot get 1 --json
```

#### Compare Snapshots

```bash
# Compare two snapshots
cd <unity-project-root> && node .unity-websocket/uw snapshot compare 1 2

# Show differences only
cd <unity-project-root> && node .unity-websocket/uw snapshot compare 1 2 --diff-only
```

Output includes:
- Added objects
- Removed objects
- Modified objects
- Component changes

#### Restore Snapshot

```bash
# Restore scene from snapshot
cd <unity-project-root> && node .unity-websocket/uw snapshot restore 1

# Confirm restore
cd <unity-project-root> && node .unity-websocket/uw snapshot restore 1 --yes
```

**Warning**: Overwrites current scene state!

#### Delete Snapshot

```bash
# Delete snapshot by ID
cd <unity-project-root> && node .unity-websocket/uw snapshot delete 1

# Confirm delete
cd <unity-project-root> && node .unity-websocket/uw snapshot delete 1 --yes
```

### Transform History (`transform-history`)

Track position, rotation, and scale changes over time with Undo/Redo support.

#### Start Recording

```bash
# Start recording transform changes
cd <unity-project-root> && node .unity-websocket/uw transform-history start

# Record specific GameObject
cd <unity-project-root> && node .unity-websocket/uw transform-history start "Player"
```

#### Stop Recording

```bash
# Stop recording
cd <unity-project-root> && node .unity-websocket/uw transform-history stop
```

#### Get History

```bash
# Get transform history for GameObject
cd <unity-project-root> && node .unity-websocket/uw transform-history get "Player"

# Limit results
cd <unity-project-root> && node .unity-websocket/uw transform-history get "Player" --limit 10

# JSON output
cd <unity-project-root> && node .unity-websocket/uw transform-history get "Player" --json
```

#### Compare Transforms

```bash
# Compare transform between two timestamps
cd <unity-project-root> && node .unity-websocket/uw transform-history compare "Player" \
  --from "2025-11-19T10:00:00" \
  --to "2025-11-19T11:00:00"
```

#### Undo/Redo

```bash
# Undo last transform change
cd <unity-project-root> && node .unity-websocket/uw transform-history undo "Player"

# Redo last undone change
cd <unity-project-root> && node .unity-websocket/uw transform-history redo "Player"

# Undo N steps
cd <unity-project-root> && node .unity-websocket/uw transform-history undo "Player" --steps 3
```

#### Clear History

```bash
# Clear history for specific GameObject
cd <unity-project-root> && node .unity-websocket/uw transform-history clear "Player"

# Clear all history
cd <unity-project-root> && node .unity-websocket/uw transform-history clear-all --yes
```

## Database Schema

### Core Tables

#### `scenes`
Stores scene information.
```sql
CREATE TABLE scenes (
    scene_id INTEGER PRIMARY KEY AUTOINCREMENT,
    scene_path TEXT NOT NULL UNIQUE,
    scene_name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### `gameobjects`
Stores GameObject data with GUID-based identification.
```sql
CREATE TABLE gameobjects (
    object_id INTEGER PRIMARY KEY AUTOINCREMENT,
    guid TEXT UNIQUE,                        -- Persistent GUID
    instance_id INTEGER NOT NULL,
    scene_id INTEGER NOT NULL,
    object_name TEXT NOT NULL,
    parent_id INTEGER,
    tag TEXT,
    layer INTEGER,
    is_active BOOLEAN DEFAULT 1,
    is_static BOOLEAN DEFAULT 0,
    is_deleted BOOLEAN DEFAULT 0,            -- Soft delete
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (scene_id) REFERENCES scenes(scene_id)
);
```

#### `gameobject_closure`
Stores hierarchy relationships for efficient queries.
```sql
CREATE TABLE gameobject_closure (
    ancestor_id INTEGER NOT NULL,
    descendant_id INTEGER NOT NULL,
    depth INTEGER NOT NULL,
    PRIMARY KEY (ancestor_id, descendant_id),
    FOREIGN KEY (ancestor_id) REFERENCES gameobjects(object_id),
    FOREIGN KEY (descendant_id) REFERENCES gameobjects(object_id)
);
```

#### `migrations`
Tracks applied schema migrations.
```sql
CREATE TABLE migrations (
    migration_id INTEGER PRIMARY KEY AUTOINCREMENT,
    migration_name TEXT NOT NULL UNIQUE,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Migration History

- **Migration_001**: Initial schema (scenes, gameobjects, migrations)
- **Migration_002**: Add GUID column to gameobjects table

## Security

### SQL Injection Prevention

All database operations use **parameterized queries**:

```csharp
// ✓ Safe (parameterized)
connection.Execute("DELETE FROM gameobjects WHERE guid = ?", guid);

// ✗ Unsafe (string concatenation)
connection.Execute($"DELETE FROM gameobjects WHERE guid = '{guid}'");
```

**Batch Operations**:
- ≤100 items: Individual parameterized DELETE statements
- >100 items: Temporary table pattern with transaction

### Transaction Safety

**Nested Transaction Prevention**:
```csharp
ExecuteInTransaction(connection, () => {
    // Safe transaction execution
    // Detects and prevents nested transactions
    // Graceful fallback if transaction already started
});
```

### Memory Safety

**Domain Reload Safety**:
```csharp
if (!isDisposed)
{
    await UniTask.SwitchToMainThread();
}
```

Prevents crashes during Unity Domain Reload.

## Best Practices

### 1. Connection Management

```bash
# Always check status before operations
cd <unity-project-root> && node .unity-websocket/uw db status

# Connect once at session start
cd <unity-project-root> && node .unity-websocket/uw db connect

# Disconnect at session end
cd <unity-project-root> && node .unity-websocket/uw db disconnect
```

### 2. Auto-Sync Usage

**When to use**:
- Active development with frequent GameObject changes
- Real-time analytics and monitoring
- Multi-scene editing

**When to disable**:
- Performance-critical operations
- Large scene modifications (use manual sync)
- Prefab editing

### 3. Snapshot Workflow

```bash
# Before major changes
cd <unity-project-root> && node .unity-websocket/uw snapshot create "Before Refactor"

# Make changes...

# If something goes wrong
cd <unity-project-root> && node .unity-websocket/uw snapshot restore 1 --yes

# After successful changes
cd <unity-project-root> && node .unity-websocket/uw snapshot create "After Refactor"
```

### 4. Performance Optimization

**Batch Operations**:
- Use `sync scene` for full scene sync (more efficient than individual objects)
- Disable components with `--no-components` if not needed
- Skip closure table with `--no-closure` for flat hierarchies

**Auto-Sync Interval**:
- Default: 1000ms (1 second)
- Adjust in Unity Editor window if needed
- Disable during intensive operations

### 5. Analytics Workflow

```bash
# Get scene overview
cd <unity-project-root> && node .unity-websocket/uw analytics scene

# Identify performance issues
cd <unity-project-root> && node .unity-websocket/uw analytics components --top 10

# Check tag/layer usage
cd <unity-project-root> && node .unity-websocket/uw analytics tags
cd <unity-project-root> && node .unity-websocket/uw analytics layers
```

## Troubleshooting

### Database Connection Failed

```bash
# Check Unity Editor is running
cd <unity-project-root> && node .unity-websocket/uw status

# Check database status
cd <unity-project-root> && node .unity-websocket/uw db status

# Reconnect
cd <unity-project-root> && node .unity-websocket/uw db connect
```

### Sync Issues

```bash
# Check sync status
cd <unity-project-root> && node .unity-websocket/uw sync status

# Clear and resync
cd <unity-project-root> && node .unity-websocket/uw sync clear --yes
cd <unity-project-root> && node .unity-websocket/uw sync scene
```

### Migration Errors

```bash
# Reset and reapply migrations
cd <unity-project-root> && node .unity-websocket/uw db reset --yes
cd <unity-project-root> && node .unity-websocket/uw db migrate
```

### Performance Issues

```bash
# Stop auto-sync
cd <unity-project-root> && node .unity-websocket/uw sync stop

# Use manual sync with optimizations
cd <unity-project-root> && node .unity-websocket/uw sync scene --no-closure
```

## Examples

### Complete Workflow Example

```bash
# 1. Initialize database
cd /path/to/unity/project
node .unity-websocket/uw db connect

# 2. Sync current scene
node .unity-websocket/uw sync scene

# 3. Create snapshot
node .unity-websocket/uw snapshot create "Initial State"

# 4. Get analytics
node .unity-websocket/uw analytics scene --json

# 5. Start auto-sync
node .unity-websocket/uw sync start

# 6. Make changes in Unity Editor...

# 7. Check sync status
node .unity-websocket/uw sync status

# 8. Create another snapshot
node .unity-websocket/uw snapshot create "After Changes"

# 9. Compare snapshots
node .unity-websocket/uw snapshot compare 1 2

# 10. Cleanup
node .unity-websocket/uw sync stop
node .unity-websocket/uw db disconnect
```

### CI/CD Integration

```bash
#!/bin/bash
# Build validation script

cd /path/to/unity/project

# Initialize
node .unity-websocket/uw db connect

# Sync and analyze
node .unity-websocket/uw sync scene
node .unity-websocket/uw analytics scene --json > scene-stats.json

# Validate object count
OBJECT_COUNT=$(cat scene-stats.json | jq '.totalObjects')
if [ "$OBJECT_COUNT" -gt 10000 ]; then
    echo "❌ Scene too complex: $OBJECT_COUNT objects"
    exit 1
fi

# Create snapshot for rollback
node .unity-websocket/uw snapshot create "CI Build $BUILD_NUMBER"

# Cleanup
node .unity-websocket/uw db disconnect
```

## Related Documentation

- [README.md](../../README.md) - Main plugin documentation
- [COMMANDS.md](./COMMANDS.md) - Complete CLI command reference
- [SKILL.md](../SKILL.md) - Skill documentation
- [Unity C# Package](../assets/unity-package/Editor/Database/) - Database implementation

---

**Version**: 0.7.0
**Last Updated**: 2025-11-19
**Database Version**: Migration_002 (GUID support)
