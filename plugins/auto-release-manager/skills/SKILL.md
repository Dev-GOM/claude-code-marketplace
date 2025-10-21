---
name: auto-release-manager
description: Automate version updates and releases for any project type (Node.js, Python, Rust, Unity, Unreal, etc.). Detect project type, update version files, generate CHANGELOG, and handle git operations with cross-platform support.
allowed-tools: Bash, Read, Write
---

# Auto Release Manager

Automate the entire release workflow for any project type with intelligent project detection and cross-platform support.

## Purpose

This skill streamlines version management across different project types by:
- Automatically detecting project type (Node.js, Python, Rust, Unity, Unreal, etc.)
- Updating version files in appropriate formats (JSON, TOML, YAML, Unity assets)
- Generating CHANGELOG from git commit history
- Handling git operations (commit, tag, push) with OS compatibility
- Supporting game engine specific workflows (Unity version.json ← → ProjectSettings.asset sync)

## When to Use

Use this skill when:
- Releasing a new version of any project
- User requests "update version", "create release", "bump version"
- Need to handle versions across multiple files (e.g., Unity's dual-file approach)
- Want automated CHANGELOG generation from commits
- Working with game engine projects (Unity, Unreal)

Example user requests:
- "Bump patch version and create release"
- "Update to v2.1.0"
- "Create Unity release with version 1.5.0"
- "Generate CHANGELOG and commit"

## Workflow

### Step 1: Detect Project Type

Start by running the project detection script to identify the project type and version files:

```bash
python -X utf8 scripts/detect_project.py .
```

The script returns JSON with:
```json
{
  "project_type": "unity",
  "version_files": [
    "version.json",
    "ProjectSettings/ProjectSettings.asset"
  ],
  "detected_version": "1.2.3"
}
```

Supported project types:
- `nodejs` - Node.js (package.json)
- `python` - Python (pyproject.toml, setup.py)
- `rust` - Rust (Cargo.toml)
- `go` - Go (VERSION file)
- `unity` - Unity (version.json + ProjectSettings.asset)
- `unreal` - Unreal Engine (.uproject)
- `claude-plugin` - Claude Code Plugin (plugin.json)
- `generic` - Generic project (VERSION file)

### Step 2: Determine New Version

Calculate the new version based on update type:

**Semantic Versioning (MAJOR.MINOR.PATCH):**
- **PATCH** (x.x.X): Bug fixes
- **MINOR** (x.X.0): New features (backward compatible)
- **MAJOR** (X.0.0): Breaking changes

Examples:
- 1.2.3 → 1.2.4 (patch)
- 1.2.3 → 1.3.0 (minor)
- 1.2.3 → 2.0.0 (major)

If user specifies version directly (e.g., "v2.1.0"), use that version.

### Step 3: Update Version Files

Use the universal version updater to update all detected files:

```bash
python -X utf8 scripts/update_version.py <file1> <file2> ... <new_version>
```

Example for Node.js:
```bash
python -X utf8 scripts/update_version.py package.json 1.3.0
```

Example for Unity (multiple files):
```bash
python -X utf8 scripts/update_version.py version.json ProjectSettings/ProjectSettings.asset 1.3.0
```

**Unity-specific:** After updating version.json, sync to ProjectSettings.asset:
```bash
python -X utf8 scripts/sync_unity_version.py
```

This ensures version.json is the single source of truth.

### Step 4: Generate CHANGELOG (Optional)

If user wants CHANGELOG updates or it's part of the workflow:

```bash
python -X utf8 scripts/changelog_generator.py <new_version> [since_tag] [changelog_path]
```

Examples:
```bash
# Generate from last tag to HEAD
python -X utf8 scripts/changelog_generator.py 1.3.0 v1.2.3

# Generate from all commits
python -X utf8 scripts/changelog_generator.py 1.3.0

# Custom CHANGELOG path
python -X utf8 scripts/changelog_generator.py 1.3.0 v1.2.3 CHANGELOG.ko.md
```

The script parses Conventional Commits and groups by type:
- `feat:` → Added
- `fix:` → Fixed
- `refactor:` → Changed
- `docs:` → Documentation

### Step 5: Git Operations

Ask user which git operations to perform using AskUserQuestion tool:

**Tool constraints:**
- Header: "Git 작업" (6 characters ✅)
- Options: 3 options (within 2-4 range ✅)
- multiSelect: false

**Options:**

1. **"커밋만"** (label: 2 words ✅)
   - Description: "버전 업데이트를 커밋만 합니다. 태그와 푸시는 나중에 직접 처리하겠습니다."
   - Action: Commit only

2. **"커밋+태그"** (label: 2 words ✅)
   - Description: "커밋과 태그를 생성합니다. 푸시는 나중에 직접 하겠습니다."
   - Action: Commit + Create tag

3. **"전체"** (label: 1 word ✅)
   - Description: "커밋, 태그 생성, 푸시까지 모든 작업을 자동으로 처리합니다. (권장)"
   - Action: Commit + Tag + Push

Based on user selection:

**Commit:**
```bash
python -X utf8 scripts/git_operations.py commit "chore: bump version to <VERSION>

Version updates:
- Updated <files> to <VERSION>

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

**Create Tag:**
```bash
python -X utf8 scripts/git_operations.py tag v<VERSION> "Release v<VERSION>"
```

**Push (branch + tags):**
```bash
python -X utf8 scripts/git_operations.py push
python -X utf8 scripts/git_operations.py push-tags
```

### Step 6: GitHub Release (Optional)

If user wants GitHub release, use `gh` CLI:

```bash
gh release create v<VERSION> \
  --title "v<VERSION> - <Title>" \
  --notes "<Release notes from CHANGELOG>"
```

## Project-Specific Workflows

### Unity Workflow

Unity projects require special handling due to dual-file approach:

1. Detect Unity project (ProjectSettings.asset exists)
2. Update version.json first (source of truth)
3. Sync to ProjectSettings.asset using sync_unity_version.py
4. Commit both files together
5. Tag and push

Reference: `references/unity-guide.md` for detailed Unity workflow.

### Unreal Workflow

Unreal projects use .uproject JSON file:

1. Detect .uproject file
2. Update Version field in .uproject
3. Optionally sync to Config/DefaultGame.ini
4. Commit, tag, push

Reference: `references/unreal-guide.md` for detailed Unreal workflow.

### Node.js / Python / Rust Workflow

Standard workflow for web/backend projects:

1. Detect project type via package file
2. Update version field in package file
3. Generate CHANGELOG from commits
4. Commit, tag, push

## Error Handling

Handle common errors:

**Project not detected:**
- Check if running in correct directory
- Look for .git directory
- Suggest creating VERSION file for generic projects

**Version file not found:**
- Suggest creating file from template (assets/)
- For Unity: Create version.json from template

**Git errors:**
- Check if git repository exists
- Verify remote is configured
- Handle authentication issues

**Script errors:**
- Ensure Python 3.11+ is installed
- Check file permissions
- Verify file encodings (UTF-8)

## Bundled Resources

### Scripts

All scripts are in `scripts/` directory and work cross-platform (Windows, macOS, Linux):

- **detect_project.py**: Auto-detect project type
- **update_version.py**: Universal version updater
- **sync_unity_version.py**: Unity version synchronization
- **git_operations.py**: Git workflow automation
- **changelog_generator.py**: CHANGELOG generation

### References

Detailed guides in `references/` directory:

- **project-types.md**: All supported project types and version file locations
- **unity-guide.md**: Unity-specific version management
- **unreal-guide.md**: Unreal Engine version management

Load these as needed for detailed information.

### Assets

Templates in `assets/` directory:

- **version.json.template**: Template for Unity/game projects
- **CHANGELOG.md.template**: Template for new CHANGELOG files

Use these when creating new version files.

## Best Practices

- Always commit version files together (e.g., Unity's version.json + ProjectSettings.asset)
- Use semantic versioning consistently
- Write meaningful commit messages following Conventional Commits
- Tag releases with `v` prefix (e.g., v1.2.3)
- Keep CHANGELOG updated for user-facing changes
- For Unity: version.json is source of truth, always sync to ProjectSettings.asset

## Notes

- Scripts use Python 3.11+ with only stdlib dependencies
- All file operations use UTF-8 encoding
- Path handling uses pathlib for cross-platform compatibility
- Git operations use subprocess for reliability
- Unity YAML parsing uses regex for robustness
