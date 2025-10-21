# Supported Project Types

This document describes all project types supported by auto-release-manager and their version file locations.

## Web & Backend

### Node.js
- **Detection file**: `package.json`
- **Version location**: `package.json` → `version` field
- **Format**: JSON
- **Example**:
  ```json
  {
    "name": "my-project",
    "version": "1.2.3"
  }
  ```

### Python
- **Detection files**: `pyproject.toml` or `setup.py`
- **Version location**:
  - `pyproject.toml` → `project.version` or `tool.poetry.version`
  - `setup.py` → `version=` parameter
- **Format**: TOML or Python
- **Example**:
  ```toml
  [project]
  name = "my-project"
  version = "1.2.3"
  ```

### Rust
- **Detection file**: `Cargo.toml`
- **Version location**: `Cargo.toml` → `package.version`
- **Format**: TOML
- **Example**:
  ```toml
  [package]
  name = "my-project"
  version = "1.2.3"
  ```

### Go
- **Detection file**: `go.mod`
- **Version location**: `VERSION` file (custom)
- **Format**: Plain text
- **Note**: Go doesn't have built-in versioning in go.mod

## Game Engines

### Unity
- **Detection file**: `ProjectSettings/ProjectSettings.asset`
- **Version locations**:
  1. `version.json` (Primary source of truth) → `version` field
  2. `ProjectSettings/ProjectSettings.asset` → `bundleVersion` field
- **Format**: JSON + Unity YAML
- **Workflow**: Update `version.json` first, then sync to `ProjectSettings.asset`
- **Example**:

  `version.json`:
  ```json
  {
    "version": "1.2.3",
    "buildNumber": 42
  }
  ```

  `ProjectSettings.asset`:
  ```yaml
  PlayerSettings:
    bundleVersion: 1.2.3
  ```

### Unreal Engine
- **Detection file**: `*.uproject`
- **Version location**: `<ProjectName>.uproject` → `Version` or `EngineAssociation`
- **Format**: JSON
- **Example**:
  ```json
  {
    "FileVersion": 3,
    "EngineAssociation": "5.3",
    "Version": "1.2.3"
  }
  ```

### Godot
- **Detection file**: `project.godot`
- **Version location**: `project.godot` → `config/version`
- **Format**: INI-like
- **Example**:
  ```ini
  [application]
  config/name="MyGame"
  config/version="1.2.3"
  ```

## Plugins & Extensions

### Claude Code Plugin
- **Detection file**: `.claude-plugin/plugin.json`
- **Version location**: `.claude-plugin/plugin.json` → `version`
- **Format**: JSON
- **Example**:
  ```json
  {
    "name": "my-plugin",
    "version": "1.2.3",
    "description": "..."
  }
  ```

### VS Code Extension
- **Detection file**: `package.json` + `package.nls.json`
- **Version location**: `package.json` → `version`
- **Format**: JSON
- **Same as Node.js projects**

### Browser Extension
- **Detection file**: `manifest.json`
- **Version location**: `manifest.json` → `version`
- **Format**: JSON
- **Example**:
  ```json
  {
    "manifest_version": 3,
    "name": "My Extension",
    "version": "1.2.3"
  }
  ```

## Generic Projects

### Plain VERSION file
- **Detection file**: `VERSION` or `version.txt`
- **Version location**: Content of file
- **Format**: Plain text
- **Example**:
  ```
  1.2.3
  ```

## Version Format

All projects follow **Semantic Versioning (semver)**:

```
MAJOR.MINOR.PATCH

1.2.3
│ │ │
│ │ └─ PATCH: Bug fixes
│ └─── MINOR: New features (backward compatible)
└───── MAJOR: Breaking changes
```

Examples:
- `1.0.0` → `1.0.1` (patch: bug fix)
- `1.0.1` → `1.1.0` (minor: new feature)
- `1.1.0` → `2.0.0` (major: breaking change)
