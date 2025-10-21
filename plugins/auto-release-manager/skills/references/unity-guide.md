# Unity Project Version Management

## Overview

Unity projects use a dual-file approach for version management:
1. **`version.json`** - Single source of truth (easy to read/edit)
2. **`ProjectSettings/ProjectSettings.asset`** - Auto-synced (used by Unity builds)

## File Structure

```
MyUnityProject/
├── version.json                          # Primary source
├── ProjectSettings/
│   └── ProjectSettings.asset            # Auto-synced
└── Assets/
    └── ...
```

## version.json (Primary)

Create this file at project root:

```json
{
  "version": "1.2.3",
  "buildNumber": 42,
  "releaseDate": "2025-01-20"
}
```

**Fields:**
- `version` (required): Semantic version (MAJOR.MINOR.PATCH)
- `buildNumber` (optional): Incremental build number
- `releaseDate` (optional): Release date in YYYY-MM-DD format

## ProjectSettings.asset (Auto-sync)

The `bundleVersion` field in this file is automatically synced from `version.json`:

```yaml
PlayerSettings:
  bundleVersion: 1.2.3
  AndroidBundleVersionCode: 42
  buildNumber:
    iOS: 42
```

## Workflow

### Manual Update

1. Edit `version.json`:
   ```json
   {
     "version": "1.3.0"
   }
   ```

2. Run sync script:
   ```bash
   python scripts/sync_unity_version.py
   ```

3. Commit both files:
   ```bash
   git add version.json ProjectSettings/ProjectSettings.asset
   git commit -m "chore: bump version to 1.3.0"
   ```

### Automatic Update (with auto-release-manager)

The skill handles everything automatically:

```
1. Update version.json → 1.3.0
2. Sync to ProjectSettings.asset
3. Git commit both files
4. Create tag v1.3.0
5. Push to remote
```

## Benefits of Dual-File Approach

✅ **Easy Version Management**
- `version.json` is simple JSON, easy to read/edit
- Clean git diffs

✅ **Unity Integration**
- `ProjectSettings.asset` is used by Unity builds
- Version automatically appears in build

✅ **Automated Sync**
- Scripts ensure consistency
- No manual errors

✅ **Extended Metadata**
- `version.json` can store additional info (buildNumber, releaseDate)
- `ProjectSettings.asset` only has bundleVersion

## Common Issues

### Q: Why not just use ProjectSettings.asset?

A: ProjectSettings.asset is a YAML file that's hard to read and edit manually. It also contains hundreds of other settings, making git diffs noisy.

### Q: Can I use only version.json?

A: No. Unity reads bundleVersion from ProjectSettings.asset for builds. Both files are needed.

### Q: What if files get out of sync?

A: Run `python scripts/sync_unity_version.py` to sync from version.json (source of truth) to ProjectSettings.asset.

## Example: Version Update

**Before:**
```json
// version.json
{
  "version": "1.2.3",
  "buildNumber": 42
}
```

**After:**
```json
// version.json
{
  "version": "1.3.0",
  "buildNumber": 43
}
```

**Auto-synced:**
```yaml
# ProjectSettings.asset
PlayerSettings:
  bundleVersion: 1.3.0  # ← Automatically updated
```
