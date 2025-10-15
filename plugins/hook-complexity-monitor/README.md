# Code Complexity Monitor

> **Language**: [English](README.md) | [한국어](README.ko.md)

Monitors code complexity metrics and warns when thresholds are exceeded.

## Features

- 📊 Calculates **cyclomatic complexity** (decision points)
- 📏 Checks **function length** (lines per function)
- 📄 Monitors **file length** (lines per file)
- 🏗️ Tracks **nesting depth** (deeply nested code)
- ⚡ Real-time feedback after Edit/Write operations
- 📝 Logs all issues to `.complexity-log.txt`
- 🎯 Only analyzes changed files (performance optimization)

## How it Works

This plugin uses the **PostToolUse hook** (Edit|Write) to run after you modify code.

1. Detect changed files using `git status --porcelain`
2. Filter for code files only (JS, TS, Python, Java, Go, C++)
3. For each file:
   - Calculate cyclomatic complexity
   - Measure function lengths
   - Check file length
   - Analyze nesting depth
4. Compare against thresholds
5. Report issues and save to log file

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

When complexity issues are detected:

```
⚠️ Complexity Monitor found 3 issue(s) in 2 file(s) (2 warnings, 1 info). Check .complexity-log.txt
```

### .complexity-log.txt

```
[2025-10-14 12:34:56]
src/utils.js:
  - Function 'processData' has complexity 15 (threshold: 10)
  - Max nesting depth is 6 (threshold: 4)

src/handlers.js:
  - Function 'handleRequest' has 75 lines (threshold: 50)
```

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

1. **Check hook is triggered**: Only runs after Edit/Write
2. **Verify code files**: Must have supported extension
3. **Check changes**: Uses git to detect changed files

### False positives?

1. **Adjust thresholds** to match your project
2. **Exclude generated files** by modifying `getChangedFiles()`
3. **Review the actual code** - sometimes complexity is unavoidable

### Missing some complex code?

1. **Check file extension**: File must be in `CODE_EXTENSIONS`
2. **Check git status**: File must show as changed
3. **Function detection**: Ensure your function syntax is recognized

## Performance

- **Only analyzes changed files** (not entire project)
- **Typical analysis time**: < 1 second per file
- **No impact on Claude Code responsiveness**

## Related Plugins

- **TODO Collector** - Track TODO comments
- **Git Auto-Backup** - Auto-commit changes
- **Session File Tracker** - Summarize file operations

## Technical Details

### Script Location
`plugins/hook-complexity-monitor/scripts/check-complexity.js`

### Hook Type
`PostToolUse` - Runs after Edit/Write operations

### Dependencies
- Node.js
- Git (for change detection)

### Timeout
15 seconds

## Limitations

- **Simple complexity calculation**: May not catch all complexity patterns
- **Language-specific**: Function detection works best for JavaScript/TypeScript
- **Regex-based**: May miss some function declarations
- **No semantic analysis**: Doesn't understand code meaning

## Future Improvements

Ideas for contributions:
- Cognitive complexity (more accurate than cyclomatic)
- Better language support (Python, Java, Go)
- Integration with linters (ESLint, Pylint)
- Trend tracking over time
- HTML reports with charts

## Contributing

Pull requests welcome! See [CONTRIBUTING.md](../../CONTRIBUTING.md)

## License

MIT License - See [LICENSE](../../LICENSE) for details

## Credits

Part of the [Claude Code Developer Utilities](../../README.md) collection.
