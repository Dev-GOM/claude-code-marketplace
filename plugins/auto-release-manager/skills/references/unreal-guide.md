# Unreal Engine Project Version Management

## Overview

Unreal Engine projects use `.uproject` JSON file for project configuration and versioning.

## File Structure

```
MyUnrealProject/
├── MyGame.uproject                      # Project file with version
├── Config/
│   └── DefaultGame.ini                  # Game config
├── Source/
│   └── ...
└── Content/
    └── ...
```

## .uproject File

The project file is a JSON file containing project metadata:

```json
{
  "FileVersion": 3,
  "EngineAssociation": "5.3",
  "Category": "",
  "Description": "",
  "Version": "1.2.3",
  "Modules": [
    {
      "Name": "MyGame",
      "Type": "Runtime",
      "LoadingPhase": "Default"
    }
  ],
  "Plugins": [
    ...
  ]
}
```

**Version Fields:**
- `Version` (custom): Semantic version of your project
- `EngineAssociation`: Unreal Engine version (e.g., "5.3", "5.4")

## Version Update Workflow

### Manual Update

1. Edit `.uproject` file:
   ```json
   {
     "Version": "1.3.0"
   }
   ```

2. Commit:
   ```bash
   git add MyGame.uproject
   git commit -m "chore: bump version to 1.3.0"
   ```

### Automatic Update (with auto-release-manager)

```
1. Detect .uproject file
2. Update Version field → 1.3.0
3. Git commit
4. Create tag v1.3.0
5. Push to remote
```

## DefaultGame.ini

Optional: You can also store version in `Config/DefaultGame.ini`:

```ini
[/Script/EngineSettings.GeneralProjectSettings]
ProjectID=...
ProjectName=MyGame
ProjectVersion=1.2.3
CompanyName=MyCompany
```

This is useful for in-game version display.

## Build Versioning

For packaging builds, you may want to configure:

**Config/DefaultGame.ini:**
```ini
[/Script/UnrealEd.ProjectPackagingSettings]
BuildConfiguration=PPBC_Shipping
ProjectVersion=1.2.3
```

## Example: Full Update

When updating version from 1.2.3 to 1.3.0:

**Files to update:**
1. `MyGame.uproject` → `Version: "1.3.0"`
2. `Config/DefaultGame.ini` → `ProjectVersion=1.3.0` (if used)

**auto-release-manager handles:**
- Detecting .uproject file
- Updating Version field
- Git commit + tag
- Push to remote

## Common Issues

### Q: Is Version field required in .uproject?

A: No, it's optional. But recommended for version tracking.

### Q: What about EngineAssociation?

A: EngineAssociation is the UE version (e.g., "5.3"). Don't confuse it with your project version.

### Q: Can I use multiple version fields?

A: Yes! You can maintain:
- `.uproject` → Version (project version)
- `DefaultGame.ini` → ProjectVersion (in-game display)
- `version.json` → Custom metadata

Just ensure they stay synced.

## Recommended Approach

**Best Practice:**
1. Use `.uproject` → Version as primary
2. Optionally sync to `DefaultGame.ini` for in-game display
3. Use auto-release-manager to keep everything consistent

**Example:**
```json
// MyGame.uproject
{
  "Version": "1.3.0"
}
```

```ini
; Config/DefaultGame.ini
[/Script/EngineSettings.GeneralProjectSettings]
ProjectVersion=1.3.0
```
