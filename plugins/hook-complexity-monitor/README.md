# Code Complexity Monitor

> **Language**: [English](README.md) | [한국어](README.ko.md)

Monitors code complexity metrics and warns when thresholds are exceeded.

## Features

- 📊 Calculates **cyclomatic complexity** (decision points)
- 📏 Checks **function length** (lines per function)
- 📄 Monitors **file length** (lines per file)
- 🏗️ Tracks **nesting depth** with exact line numbers
- 🌐 Supports **11 programming languages** with dedicated analyzers
- 🔄 **Auto-deletes** resolved issues from log
- ⚡ Real-time analysis after Edit/Write operations
- 📝 Maintains persistent log (`.complexity-log.md`) with clickable links
- 🎯 Only analyzes files you modify

## How it Works

This plugin uses **two hooks** for comprehensive complexity tracking:

### PostToolUse Hook (`check-complexity.js`)
Runs immediately after Write or Edit operations:
1. Receives the modified file path from hook input (stdin)
2. Checks if file has a supported extension (JS, TS, Python, Java, etc.)
3. Selects appropriate language analyzer from registry
4. Analyzes the file:
   - Extract functions using language-specific patterns
   - Calculate cyclomatic complexity per function
   - Measure function lengths
   - Check file length
   - Analyze nesting depth with exact line tracking
5. Compare metrics against thresholds
6. Store issues in session file (`.state/complexity-session.json`)
7. Records analyzed files even if no issues found

### Stop Hook (`finalize-session.js`)
Runs when your Claude Code session ends:
1. Loads session data from `.state/complexity-session.json`
2. Merges with existing log, updating file entries
3. Auto-deletes resolved issues (files with empty issue arrays)
4. Generates/updates `.complexity-log.md` with clickable file links
5. Cleans up session file

## Installation

```bash
/plugin install hook-complexity-monitor@dev-gom-plugins
```

## Default Thresholds

```javascript
const THRESHOLDS = {
  cyclomaticComplexity: 10,  // Max decision points per function
  functionLength: 50,         // Max lines per function
  fileLength: 500,           // Max lines per file
  nesting: 4                 // Max nesting depth
};
```

## Example Output

### During Session (PostToolUse Hook)
After editing a file, issues are tracked silently in the session file.

### At Session End (Stop Hook)
The consolidated log is generated/updated:

### .complexity-log.md

```markdown
# Code Complexity Issues

Last Updated: 2025-10-14 03:45:12

## Issues by File

### [utils.js](./src/utils.js#L45)

- Function 'processData' has complexity 15 (threshold: 10)
- Max nesting depth is 6 (threshold: 4) starts at line 53

### [handlers.js](./src/handlers.js#L23)

- Function 'handleRequest' has 75 lines (threshold: 50)
```

**Note**: When you fix issues, they automatically disappear from the log at the next session end.

## Metrics Explained

### Cyclomatic Complexity

Measures the number of decision points in code:
- Each `if`, `else if`, `while`, `for`, `case` adds 1
- Each `&&`, `||`, `?` adds 1
- Each `catch` adds 1

**Example**:
```javascript
function complexFunction(x, y) {  // Complexity = 1 (base)
  if (x > 0) {                    // +1 = 2
    if (y > 0) {                  // +1 = 3
      return x + y;
    }
  }
  return 0;
}
// Total complexity: 3
```

**Threshold**: 10 (warning if exceeded)

### Function Length

Counts lines of code in a function.

**Threshold**: 50 lines (info if exceeded)

### File Length

Counts total lines in a file.

**Threshold**: 500 lines (warning if exceeded)

### Nesting Depth

Measures how deeply nested your code blocks are.

**Example**:
```javascript
function deeplyNested() {
  if (condition1) {         // Depth 1
    while (condition2) {    // Depth 2
      for (let i = 0; i < 10; i++) {  // Depth 3
        if (condition3) {   // Depth 4
          if (condition4) { // Depth 5 ⚠️ Exceeds threshold
            // Code here
          }
        }
      }
    }
  }
}
```

**Threshold**: 4 levels (warning if exceeded)

## Configuration

You can configure the plugin's behavior in the `configuration` section of `hooks/hooks.json`.

### Available Configuration Options

#### `thresholds`
- **Description**: Code complexity threshold settings
- **Default**:
  ```json
  {
    "cyclomaticComplexity": 10,  // Max decision points per function
    "functionLength": 50,         // Max lines per function
    "fileLength": 500,           // Max lines per file
    "nesting": 4                 // Max nesting depth
  }
  ```

#### `supportedExtensions`
- **Description**: List of file extensions to analyze
- **Default**: `[".js", ".jsx", ".ts", ".tsx", ".py", ".java", ".go", ".c", ".cpp", ".cs", ".rb", ".php", ".rs", ".swift", ".kt", ".kts"]`

#### `outputDirectory`
- **Description**: Directory path to save log files
- **Default**: `""` (project root)

#### `logFile`
- **Description**: Complexity log filename
- **Default**: `".complexity-log.md"`

#### `severityLevels`
- **Description**: Severity levels for each metric (warning/info)
- **Default**:
  ```json
  {
    "complexity": "warning",
    "nesting": "warning",
    "fileLength": "warning",
    "functionLength": "info"
  }
  ```

### How to Change Settings

Edit the `plugins/hook-complexity-monitor/hooks/hooks.json` file:

```json
{
  "hooks": { ... },
  "configuration": {
    "outputDirectory": ".claude-logs",
    "thresholds": {
      "cyclomaticComplexity": 15,
      "functionLength": 100,
      "fileLength": 1000,
      "nesting": 5
    },
    "supportedExtensions": [
      ".js", ".jsx", ".ts", ".tsx",
      ".py", ".java", ".go", ".c", ".cpp",
      ".rs", ".rb"
    ],
    "logFile": ".complexity-log.md",
    "severityLevels": {
      "complexity": "warning",
      "nesting": "warning",
      "fileLength": "info",
      "functionLength": "info"
    }
  }
}
```

### Configuration Priority

The `outputDirectory` is determined in this order:
1. `configuration.outputDirectory` in `hooks.json`
2. Environment variable `COMPLEXITY_LOG_DIR`
3. Environment variable `CLAUDE_PLUGIN_OUTPUT_DIR`
4. Default (project root)

## Issue Severity Levels

- **Warning** 🔴: Cyclomatic complexity, nesting depth, file length
- **Info** 🔵: Function length

## Best Practices

### Add to .gitignore

```gitignore
.complexity-log.txt
```

### Interpreting Results

**Cyclomatic Complexity > 10**:
- Consider breaking function into smaller functions
- Extract complex conditionals into named functions
- Use early returns to reduce nesting

**Nesting Depth > 4**:
- Extract nested blocks into separate functions
- Use early returns/continues
- Flatten conditional logic

**Function Length > 50**:
- Split into smaller, focused functions
- Extract reusable logic
- Apply Single Responsibility Principle

**File Length > 500**:
- Split into multiple files
- Organize by feature/domain
- Consider module structure

### When to Ignore Warnings

Some legitimate reasons to exceed thresholds:
- Generated code (parsers, config files)
- Complex algorithms that can't be simplified
- State machines with many cases
- Legacy code being gradually refactored

## Troubleshooting

### Plugin not running?

1. **Check hook is triggered**: Only runs after Edit/Write operations
2. **Verify code files**: Must have supported extension
3. **Check file path**: Plugin receives file path from hook input (not git)

### False positives?

1. **Adjust thresholds** to match your project
2. **Exclude generated files** by modifying `getChangedFiles()`
3. **Review the actual code** - sometimes complexity is unavoidable

### Missing some complex code?

1. **Check file extension**: File must be supported (11 languages available)
2. **Modified during session**: Only files you Write/Edit are analyzed
3. **Function detection**: Ensure your function syntax matches analyzer patterns

## Performance

- **Only analyzes modified files** (not entire project)
- **Language-specific analyzers** for accurate function extraction
- **Typical analysis time**: < 100ms per file
- **Session-based tracking** prevents redundant analysis
- **No impact on Claude Code responsiveness**

## Related Plugins

- **TODO Collector** - Track TODO comments
- **Git Auto-Backup** - Auto-commit changes
- **Session File Tracker** - Summarize file operations

## Technical Details

### Script Locations
- `plugins/hook-complexity-monitor/scripts/check-complexity.js` - Analyzes modified files
- `plugins/hook-complexity-monitor/scripts/finalize-session.js` - Generates final log
- `plugins/hook-complexity-monitor/scripts/analyzers/` - Language-specific analyzers

### Analyzer Architecture
- **Base Analyzer**: Abstract class defining the analyzer interface
- **BraceBasedAnalyzer**: Common logic for brace-based languages
- **Language Analyzers**: JavaScript, Python, Java, Go, C/C++, C#, Rust, Swift, Kotlin, Ruby, PHP

### Hook Types
- **PostToolUse** (Write|Edit) - Analyzes files in real-time
- **Stop** - Consolidates and updates the complexity log

### State Files
- `.state/complexity-session.json` - Tracks issues during session
- Automatically cleaned up at session end

### Dependencies
- Node.js

### Timeout
- PostToolUse: 15 seconds
- Stop: 10 seconds

## Supported Languages

The plugin includes specialized analyzers for:
- **JavaScript/TypeScript** (`.js`, `.jsx`, `.ts`, `.tsx`, `.mjs`, `.cjs`)
- **Python** (`.py`) - Uses indentation-based nesting
- **Java** (`.java`)
- **Go** (`.go`)
- **C/C++** (`.c`, `.cpp`, `.cc`, `.cxx`, `.h`, `.hpp`)
- **C#** (`.cs`)
- **Rust** (`.rs`)
- **Swift** (`.swift`)
- **Kotlin** (`.kt`, `.kts`)
- **Ruby** (`.rb`) - Uses `end` keyword tracking
- **PHP** (`.php`)

Each analyzer understands language-specific syntax for accurate function extraction and complexity calculation.

## Limitations

- **Regex-based function detection**: May miss unusual function declarations
- **No semantic analysis**: Doesn't understand code meaning
- **Cyclomatic complexity**: Simplified calculation (not cognitive complexity)

## Future Improvements

Ideas for contributions:
- Cognitive complexity (more accurate than cyclomatic)
- More language analyzers (Scala, Haskell, Elixir, etc.)
- Integration with linters (ESLint, Pylint)
- Trend tracking over time
- HTML reports with charts

## Contributing

Pull requests welcome! See [CONTRIBUTING.md](../../CONTRIBUTING.md)

## License

MIT License - See [LICENSE](../../LICENSE) for details

## Credits

Part of the [Claude Code Developer Utilities](../../README.md) collection.
