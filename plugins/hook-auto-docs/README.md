# Auto Documentation Generator

> **Language**: [English](README.md) | [한국어](README.ko.md)

Automatically scans and documents your project structure.

## Features

- 📁 **Project Structure Scanning**: Auto-generates complete directory tree
- 📦 **package.json Extraction**: Project name, version, scripts, and dependencies
- 🔗 **Clickable Links**: Direct navigation to each file
- ⚡ **Smart Scanning**: Full scan on first run, tracks only changed files afterward
- 🚫 **Auto-Exclusion**: Excludes node_modules, .git, dist, and other unnecessary directories
- 📝 **Single Document**: Consolidates all information in `.project-structure.md`

## How it Works

This plugin uses a **two-stage tracking approach**:

### Stage 1: Real-time File Change Tracking (PostToolUse Hook)
- Runs after every `Write` operation
- Records changed file paths to `.structure-changes.json`
- Silent execution (no user interruption)

### Stage 2: Structure Documentation Generation (Stop Hook)
- Runs when Claude Code session ends
- When there are changes or it's the first run:
  1. Scans entire project directory
  2. Extracts information from `package.json`
  3. Generates directory tree (with clickable file links)
  4. Saves to `.project-structure.md`
  5. Stores current file list in `.structure-state.json`

## Installation

```bash
/plugin install hook-auto-docs@dev-gom-plugins
```

## Usage

Once installed, works automatically. When your session ends:

```
📚 Auto-Docs: Generated project structure documentation (245 files)
```

Or:

```
📚 Auto-Docs: Updated project structure (5 file(s) changed)
```

## Generated Files

### .project-structure.md

Document containing entire project structure:

```markdown
# Project Structure

**Generated**: 2025-10-15 14:30:00

## Project Information

- **Name**: claude-code-marketplace
- **Version**: 1.0.0
- **Description**: Claude Code plugin marketplace

## Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm test`: Run tests

## Dependencies

### Production (5)

- express: `^4.18.0`
- dotenv: `^16.0.0`

### Development (3)

- eslint: `^8.0.0`
- prettier: `^2.8.0`

## Directory Structure

claude-code-marketplace/
├── [.gitignore](.gitignore)
├── [package.json](package.json)
├── [README.md](README.md)
├── plugins/
│   ├── hook-auto-docs/
│   │   ├── [scripts/track-structure-changes.js](plugins/hook-auto-docs/scripts/track-structure-changes.js)
│   │   ├── [scripts/update-structure-docs.js](plugins/hook-auto-docs/scripts/update-structure-docs.js)
│   │   └── [hooks/hooks.json](plugins/hook-auto-docs/hooks/hooks.json)
│   └── hook-complexity-monitor/
│       └── ...
```

## Configuration

You can configure the plugin's behavior in the `configuration` section of `hooks/hooks.json`.

### Available Configuration Options

#### `outputDirectory`
- **Description**: Directory path to save generated documentation
- **Default**: `""` (project root)
- **Example**: `"docs"`, `".claude-output"`

#### `includeDirs`
- **Description**: List of specific directories to scan (if empty, scans entire project)
- **Default**: `[]` (empty - scans all directories except excluded ones)
- **Example**: `["src", "lib"]` - only scans `src` and `lib` folders
- **Use Case**: Useful for large projects where you only want to document specific parts

#### `excludeDirs`
- **Description**: List of directories to exclude from project structure scan (ignored if `includeDirs` is set)
- **Default**: `["node_modules", ".git", "dist", "build", "coverage", ".next", "out", ".nuxt", "vendor", ".vscode", ".idea"]`
- **Example**: Add/remove directories from the array

#### `includeExtensions`
- **Description**: List of file extensions to include (if empty, all files are included unless excluded)
- **Default**: `[]` (empty - includes all file extensions except excluded ones)
- **Example**: `[".js", ".ts", ".jsx", ".tsx"]` - only includes JavaScript/TypeScript files
- **Note**: Can be specified with or without dot (`.meta` or `meta`)
- **Use Case**: Focus documentation on specific file types (e.g., only source code, only configs)

#### `excludeExtensions`
- **Description**: List of file extensions to exclude from project structure (works together with `includeExtensions`)
- **Default**: `[]` (empty - no extensions excluded)
- **Example**: `[".meta", ".log", ".tmp"]` - excludes Unity meta files, logs, and temp files
- **Note**: Can be specified with or without dot (`.meta` or `meta`)
- **Use Case**: Hide unnecessary file types from documentation (e.g., Unity `.meta` files, build artifacts)

### How to Change Settings

Edit the `plugins/hook-auto-docs/hooks/hooks.json` file:

```json
{
  "hooks": { ... },
  "configuration": {
    "outputDirectory": "docs",
    "includeDirs": ["src", "lib"],
    "excludeDirs": [
      "node_modules",
      ".git",
      "dist",
      "build",
      "coverage",
      ".next",
      "out",
      ".nuxt",
      "vendor",
      ".vscode",
      ".idea",
      "tmp",
      "cache"
    ],
    "includeExtensions": [],
    "excludeExtensions": [".meta", ".log", ".tmp"]
  }
}
```

**Filter Rules**:
- If `includeDirs` is set to a non-empty array, only those directories will be scanned and `excludeDirs` will be ignored
- If `includeExtensions` is set, only those extensions are included first, then `excludeExtensions` is applied to filter them further
- Both extension filters work together (AND condition) for maximum flexibility

### Configuration Priority

The `outputDirectory` is determined in this order:
1. `configuration.outputDirectory` in `hooks.json`
2. Environment variable `AUTO_DOCS_DIR`
3. Environment variable `CLAUDE_PLUGIN_OUTPUT_DIR`
4. Default (project root)

## Best Practices

### Add to .gitignore

```gitignore
.project-structure.md
.structure-state.json
.structure-changes.json
```

### Regular Reviews

Use the generated project structure documentation to:
- Onboard new team members
- Understand project organization
- Plan refactoring efforts

## Output Files

| File | Purpose | Commit? |
|------|---------|---------|
| `.project-structure.md` | Project structure documentation | ❌ Optional |
| `.structure-state.json` | File list state (internal) | ❌ No |
| `.structure-changes.json` | Session changes (temporary) | ❌ No |

## Troubleshooting

### Plugin not generating documentation?

1. **Check for changes**:
   Plugin only updates when files have changed.

2. **First run**:
   Automatically scans entire structure on first run.

3. **Check file permissions**:
   Ensure plugin has write permissions to project root.

### Some directories missing?

1. **Check exclusion list**: See if it's in `configuration.excludeDirs`
2. **Hidden directories**: Directories starting with `.` are automatically excluded

## Performance

- **First scan**: < 3 seconds even for 1000+ file projects
- **Incremental updates**: Only tracks changed files for fast execution
- **Memory efficient**: Processes files in streaming fashion

## Related Plugins

- **Session Summary** - Summarizes file operations during session
- **TODO Collector** - Collects TODO comments
- **Git Auto-Backup** - Auto-commits at session end

## Technical Details

### Script Locations
- `plugins/hook-auto-docs/scripts/track-structure-changes.js` - File change tracking
- `plugins/hook-auto-docs/scripts/update-structure-docs.js` - Structure documentation generation

### Hook Types
- `PostToolUse` - Tracks file changes after Write operations
- `Stop` - Generates structure documentation at session end

### Dependencies
- Node.js
- Git (optional - for change detection)

### Timeouts
- PostToolUse: 5 seconds
- Stop: 15 seconds

## License

MIT License - See [LICENSE](../../LICENSE) for details

## Credits

Part of the [Claude Code Developer Utilities](../../README.md) collection.
