# Changelog

All notable changes to the Dev GOM Plugins marketplace will be documented in this file.

> **Version**: 2.22.0 | **Last Updated**: 2025-11-13

---

## [2.22.0] - 2025-11-13

### Documentation
- 📚 **Unity Editor Toolkit v0.5.0**: Documentation Structure Improvements
  - **Reorganized Documentation**: Separated user documentation from Claude reference documentation
    - Moved user docs (QUICKSTART, TEST_GUIDE, API_COMPATIBILITY) to plugin root
    - Kept Claude reference docs (COMMANDS_*.md) in `skills/references/`
  - **Command Reference Split**: Split monolithic COMMANDS_IMPLEMENTED.md into 6 category-specific files
    - `COMMANDS_CONNECTION_STATUS.md` - Connection and status commands
    - `COMMANDS_GAMEOBJECT_HIERARCHY.md` - GameObject manipulation and hierarchy commands
    - `COMMANDS_TRANSFORM.md` - Transform manipulation commands
    - `COMMANDS_SCENE.md` - Scene management commands
    - `COMMANDS_EDITOR.md` - Asset Database and Editor utilities commands
    - `COMMANDS_CONSOLE.md` - Console and logging commands
  - **Bilingual Navigation**: Added language switcher links to all documentation
    - English/Korean navigation at top of each document
    - Improved documentation accessibility for international users
  - **Link Updates**: Updated all internal documentation links to reflect new structure
    - SKILL.md references updated
    - All command reference "See Also" sections updated

### Changed
- **Unity Editor Toolkit**: Improved documentation organization and navigation
- **Unity Editor Toolkit**: Enhanced command reference structure for better maintainability

---

## [2.21.0] - 2025-11-12

### Security & Stability
- 🔒 **Unity Editor Toolkit v0.4.0**: Major Security and Stability Improvements (11 Issues Resolved)
  - **Critical Security Fix**: Path traversal vulnerability in file copy operations
    - Added path normalization and validation using `Path.GetFullPath()`
    - Validated source paths against allowed plugin directory (`~/.claude/plugins`)
    - Validated destination paths within project boundaries
    - Blocked symbolic links (security risk)
    - Prevented null byte injection in filenames
  - **High Priority Fixes** (6 issues):
    - Process resource cleanup: Added try-finally pattern with Kill + WaitForExit + Dispose
    - File atomicity: Using `File.Replace()` for crash-safe updates
    - WebSocket connection cleanup: Finally blocks in all 14 command functions
    - Lock PID validation: Enhanced checks (valid range, process existence, Unity Editor detection, HasExited)
    - Timeout handling: Detailed error information with method, requestId, params, timestamp
    - Heartbeat error handling: Try-catch blocks with proper logging
  - **Medium Priority Improvements** (4 issues):
    - Magic numbers to constants: `ProcessKillWaitTimeoutMs`, `NpmInstallTimeoutSeconds`, `NpmBuildTimeoutSeconds`, `HeartbeatStaleSeconds`
    - Input validation: Method name, timeout, request parameter validation
    - Code deduplication: New `command-helpers.ts` with `getUnityPortOrExit()`, `connectToUnity()`, `disconnectUnity()`
    - Code quality: Replaced console.log with logger
- 🔒 **Blender Toolkit v1.4.4**: Security and Dependency Management Improvements (3 Issues Resolved)
  - **High Security Fix**: Removed `--trusted-host` flags from pip install
    - Prevents MITM attacks by enforcing SSL/TLS certificate validation
    - No longer bypasses PyPI security checks
  - **Medium Priority Improvements**:
    - Dependency management: Using `requirements.txt` instead of hardcoded dependencies
    - Code simplification: Streamlined `.dist-info` exclusion logic using `in` operator
  - **New Features**:
    - Version-aware dependency specification: `aiohttp>=3.8,<4.0`
    - Fallback mechanism when requirements.txt missing

### Changed
- **Unity Editor Toolkit**: Enhanced error messages throughout codebase
- **Unity Editor Toolkit**: Improved resource management patterns
- **Blender Toolkit**: Better dependency management workflow

---

## [2.19.1] - 2025-11-12

### Fixed
- 🐛 **Unity Editor Toolkit v0.2.1**: Code Review Feedback - 4 Issues Resolved
  - **Critical Fix**: Added missing `ToJson()` and `FromJson()` methods to `JsonRpcRequest` class
    - Required by `JsonRpcProtocolTests` for serialization/deserialization
    - Implements proper JSON-RPC request serialization with `NullValueHandling.Ignore`
  - **High Fix**: Changed `FindGameObject()` method visibility from `protected` to `public`
    - Enables test class `GameObjectCachingTests` to access the method
    - Changed exception throwing to `null` return for null/empty GameObject names
    - Aligns with test expectations and improves API usability
  - **High Fix**: Updated `GetParams_Should_ThrowOnInvalidFormat` test to `GetParams_Should_HandleUnknownFields`
    - `JsonConvert` ignores unknown fields by default (doesn't throw exceptions)
    - Test now verifies that unknown fields are ignored and expected fields are null
    - Corrects test logic to match actual deserialization behavior
  - **Medium Fix**: Improved cache eviction logic in `BaseHandler`
    - Added `System.Linq` namespace for `Keys.First()` support
    - Now properly removes oldest entries when cache exceeds 100 items
    - Ensures cache size limit is maintained even when all entries are alive
    - Prevents unbounded cache growth with comment alignment

---

## [2.19.0] - 2025-11-12

### Added
- ✨ **Unity Editor Toolkit v0.2.0**: Automated Testing with Unity Test Framework (🧪 Experimental)
  - **Comprehensive Test Suite**: 66 automated tests covering core functionality
    - **UnityMainThreadDispatcherTests** (10 tests): Thread safety verification
      - Singleton instance creation and lifecycle
      - Main thread execution guarantee for Unity API calls
      - Action queue processing with proper ordering
      - Exception handling in queued actions
      - Concurrent access safety (5 simultaneous threads)
      - Background thread Unity API call safety
    - **GameObjectCachingTests** (13 tests): Performance optimization validation
      - GameObject search with WeakReference caching
      - Cache hit performance (10x-100x faster than uncached)
      - Cache invalidation when GameObject destroyed
      - Inactive GameObject handling
      - Nested GameObject support (parent/child relationships)
      - Large-scale caching performance (100+ objects)
    - **Vector3ValidationTests** (20 tests): Security and data integrity
      - NaN detection for x, y, z coordinates
      - PositiveInfinity detection
      - NegativeInfinity detection
      - Valid value acceptance (zero, positive, negative)
      - Float precision preservation
      - Edge cases (MaxValue, MinValue, Epsilon)
    - **JsonRpcProtocolTests** (23 tests): Protocol compliance verification
      - Request serialization/deserialization
      - Response serialization with result handling
      - Error response with request ID preservation
      - Error codes: Parse error (-32700), Invalid request (-32600), Method not found (-32601), Invalid params (-32602), Internal error (-32603)
      - Parameter deserialization (simple and complex types)
      - JSON-RPC 2.0 specification compliance
  - **Assembly Definitions**: Proper test isolation and compilation
    - `UnityEditorToolkit.Editor.Tests.asmdef`: EditMode test assembly
    - `UnityEditorToolkit.Tests.asmdef`: Runtime test assembly (for future PlayMode tests)
    - References to NUnit 3.5 framework and Unity Test Runner
    - `UNITY_INCLUDE_TESTS` define constraint
  - **Version Compatibility**: Unity 2020.3 - Unity 6+ (no conditional compilation needed)
    - Same NUnit 3.5 across all Unity versions
    - All Unity APIs available since Unity 2017.1+
    - Test Framework auto-included since Unity 2019.2
    - Unity 6 classifies Test Framework as "Core Package" (version locked)
  - **Documentation**: Comprehensive test guides
    - `TEST_GUIDE.md` (English): Complete testing guide with setup, execution, troubleshooting
    - `TEST_GUIDE.ko.md` (Korean): Korean translation of testing guide
    - `API_COMPATIBILITY.md`: Version compatibility analysis and verification
    - Updated `README.md` with Unity Test Framework information
    - Updated `package.json` with `testables` field for Unity 2020.3-2022.x
  - **package.json Updates**: Test Framework integration
    - Added `testables: ["com.unity.test-framework"]` for Unity 2020.3-2022.x
    - Minimum Unity version: `"unity": "2020.3"`
- **Marketplace Integration**: Unity Editor Toolkit added to marketplace
  - Plugin category: `game-development`
  - Status: 🧪 Experimental (APIs may change)
  - Keywords: unity, websocket, editor, testing, automation, gameobject, transform, scene, console, experimental

### Changed
- **Unity Editor Toolkit**: Status changed to 🧪 Experimental
  - Warning: "APIs and features may change"
  - All documentation updated with experimental status

---

## [2.18.1] - 2025-11-11

### Added
- ✨ **Blender Toolkit v1.4.0**: Addon Distribution and Project Structure
  - **Addon Package Builder**: ZIP packaging system for Blender addon distribution
    - `build-addon.js` script for creating distributable addon packages
    - Automatic version tracking (rebuilds only when version changes)
    - Smart cleanup of old ZIP files
    - Python-based ZIP creation for cross-platform compatibility
    - Excludes development files (`.pylintrc`, `pyrightconfig.json`, `__pycache__`)
    - Output: `.blender-toolkit/blender-toolkit-addon-v{version}.zip`
  - **CLI Command**: `addon-build` command via bt wrapper
    - `node .blender-toolkit/bt addon-build` - Build addon ZIP
    - `node .blender-toolkit/bt addon-build --force` - Force rebuild
    - Automatically invoked during SessionStart initialization
  - **Project Structure**: Animations folder auto-creation
    - Creates `animations/` directory for Mixamo FBX files
    - Includes `.gitignore` to exclude large animation files (`*.fbx`, `*.dae`)
    - Supports workflow paths like `./Walking.fbx` from documentation
  - **Documentation**: Comprehensive addon distribution guide
    - Installation from ZIP (recommended method)
    - Manual build instructions
    - Package contents and exclusions
    - Added to both English and Korean READMEs

### Changed
- 🔧 **Blender Toolkit**: Init script improvements
  - `init-config.js` now calls `buildAddonZip()` during initialization
  - Automatic ZIP generation on session start (with version check)
  - Better project structure setup with animations folder

---

## [2.17.3] - 2025-11-10

### Added
- ✨ **Blender Toolkit v1.3.0**: Materials, Advanced Modifiers, and Collections
  - **Material Management**: Principled BSDF-based material system
    - Create, delete, and list materials
    - Assign materials to objects
    - Control base color, metallic, roughness, and emission properties
    - Get detailed material properties
    - Python: 9 material functions (`material.py`)
    - TypeScript: 10 material CLI commands
  - **Advanced Modifier Control**: Comprehensive modifier system (30+ modifier types supported)
    - List all modifiers on objects with type-specific properties
    - Remove modifiers from objects
    - Toggle viewport/render visibility
    - Modify properties dynamically (levels, width, segments, count, etc.)
    - Get detailed modifier information
    - Reorder modifiers in the stack (UP/DOWN)
    - Supports: SUBSURF, MIRROR, ARRAY, BEVEL, BOOLEAN, SOLIDIFY, ARMATURE, LATTICE, CURVE, SIMPLE_DEFORM, CAST, DISPLACE, WAVE, and many more
    - Python: 8 modifier functions (`modifier.py`)
    - TypeScript: 8 modifier CLI commands
  - **Collection Management**: Scene hierarchy organization
    - Create and delete collections
    - List all collections with object counts
    - Add/remove objects to/from collections
    - Python: 5 collection functions (`collection.py`)
    - TypeScript: 5 collection CLI commands
  - **Architecture Improvements**:
    - Separated modifiers from `geometry.py` into dedicated `modifier.py` module
    - Better code organization and extensibility
    - Updated WebSocket handlers: `Material.*`, `Collection.*`, `Modifier.*`
  - **Documentation**: Updated all READMEs with experimental status warning and v1.3.0 features
  - **Statistics**: 30+ new CLI commands, 1568 lines added, 13 files changed

### Changed
- 🔧 **Blender Toolkit**: Status changed to 🧪 Experimental
  - Added warning: "APIs and features may change"
  - Updated all documentation with experimental status

---

## [2.17.2] - 2025-11-09

### Fixed
- 🐛 **Browser Pilot v1.9.2**: Promise.race Timeout Cleanup
  - Fixed memory leak in rimraf timeout handling by adding `clearTimeout()`
  - Timeout is now properly cleared when rimraf completes before timeout
  - Prevents unnecessary timers from remaining in event loop

---

## [2.17.1] - 2025-11-09

### Changed
- 🔧 **Browser Pilot v1.9.1**: Code Quality and Performance Improvements
  - **Documentation**: Added comprehensive comment explaining `getLocalTimestamp` function duplication
    - Function exists in both `init-config.js` (JavaScript hook) and `timestamp.ts` (TypeScript module)
    - Duplication is intentional as hook scripts cannot import TypeScript modules
    - Prevents build dependencies for lightweight hook scripts
  - **Refactoring**: Improved `rimraf` timeout handling using modern `Promise.race` pattern
    - Replaced complex completed flag logic with cleaner Promise-based approach
    - Better separation of execution promise vs timeout promise
    - Enhanced code readability and maintainability
  - **Error Handling**: Enhanced npm error messages to preserve original error context
    - Install errors now include original error message: `Failed to install dependencies: ${errorMessage}`
    - Build errors now include original error message: `Failed to build scripts: ${errorMessage}`
    - Improved debuggability when npm operations fail
  - **Performance**: Converted synchronous file I/O to async operations
    - Changed `readFileSync` to async `readFile` from `fs/promises`
    - Made `getPid()` and `isRunning()` async methods
    - Updated 12 call sites across 4 files to use `await`
    - Eliminates event loop blocking for better server responsiveness
    - Maintains PID caching (1-second TTL) to minimize actual file I/O

---

## [2.17.0] - 2025-11-09

### Changed
- 🔧 **Browser Pilot v1.9.0**: Code Review Feedback - 27 Issues Resolved
  - See v2.17.0 release notes for full details

---

## [2.16.0] - 2025-11-08

### Added
- ✨ **Browser Pilot v1.8.0**: Reinstall Command for Troubleshooting
  - **New Command**: `reinstall` - Force complete reinstallation of Browser Pilot scripts
    - Stops daemon if running
    - Removes `.browser-pilot` directory completely
    - Next command triggers automatic reinstallation via SessionStart hook
  - **Use Cases**: Corrupted installations, scripts not updating, troubleshooting persistent issues
  - **Options**:
    - `-y, --yes`: Skip confirmation prompt
    - `-q, --quiet`: Suppress output messages
  - **Documentation**: Added comprehensive guide in `commands-reference.md`

---

## [2.15.3] - 2025-11-07

### Added
- ✨ **Browser Pilot v1.7.3**: Auto-Restore Last Visited URL
  - **Auto-Restore Feature**: Automatically restores last visited URL when daemon restarts
    - Saves URL to `.browser-pilot/last-url.txt` on navigation, back, forward, reload, and map regeneration
    - Loads and navigates to last URL when daemon starts (if `autoRestore: true`)
    - New config option `autoRestore` (default: `true`) in project configuration
  - **Enhanced URL Persistence**: URL is now saved across all navigation operations
    - Navigate command
    - Back/Forward commands
    - Reload command
    - Map regeneration (regen-map)
  - Seamless workflow: Stop daemon, run non-navigate command, automatically returns to last page

---

## [2.15.2] - 2025-11-07

### Changed
- 🔧 **Browser Pilot v1.7.2**: Code Quality Improvements
  - Added `logActionError` helper function to `helpers.ts` for centralized error logging
  - Refactored `emulation.ts` to eliminate duplicate error logging in catch blocks
  - Added type guard functions in `capture.ts` for safe viewport response validation
  - Improved type safety by replacing `as` type assertions with proper type guards

---

## [2.15.1] - 2025-11-06

### Added
- ✨ **Browser Pilot v1.7.1**: Viewport Information Commands
  - **New Commands**: Added viewport and screen information retrieval
    - `get-viewport`: Get current viewport size (width, height, devicePixelRatio)
    - `get-screen-info`: Get comprehensive screen metrics (screen size, available area, viewport, scale)
  - Full integration through actions → handlers → CLI layers

### Fixed
- 🐛 **Browser Pilot v1.7.1**: Map Generation Bug Fixes
  - Fixed XPath escape syntax error in `generate-interaction-map.ts`
  - Enhanced error logging in `map-manager.ts` for better debugging
  - Resolved "Failed to extract interactive elements" error on complex pages

---

## [2.12.0] - 2025-11-06

### Changed
- 🎉 **Browser Pilot v1.4.0**: Enhanced Documentation and Smart Mode Emphasis
  - **BREAKING**: Simplified SKILL.md to 914 words (from 1,504 words) following skill-creator guidelines
  - **Documentation Reorganization**: Moved detailed content to `references/` folder (progressive disclosure)
    - `references/commands-reference.md`: Complete command list with all options
    - `references/interaction-map.md`: Smart Mode system and query API
    - `references/selector-guide.md`: Selector strategies and best practices
  - **Smart Mode Emphasis**: Now prominently recommended over Direct Mode
    - Reordered documentation to show Smart Mode first in all sections
    - Added "Recommended" labels and 🌟 emoji for Smart Mode
    - Updated comparison tables with star ratings (Smart Mode: ⭐⭐⭐⭐⭐, Direct Mode: ⭐⭐)
    - Changed Direct Mode description to "fallback for unique IDs only"
  - **Quote Rules Clarification**: Explicit documentation for single and chain commands
    - No quotes for single words: `--text Login`, `--text Submit`
    - Quotes when spaces: `--text "Sign In"`, `--text "Email Address"`
    - Applied to both Smart Mode and Chain Mode examples
  - **CLI Help System Enhancement**: All 18 command files (52+ commands) improved
    - Added detailed descriptions with option explanations
    - Better parameter documentation (required vs optional)
    - Consistent help format across all commands
  - **Chain Command Improvements**: Enhanced description with clear examples
    - Format: `chain <cmd1> [opts1] <cmd2> [opts2] ...`
    - Example: `chain navigate -u http://example.com click --text Submit screenshot -o result.png`
    - Automatic map synchronization and human-like delays (300-800ms)
  - **Documentation Best Practices**: Applied throughout all files
    - Removed duplicated content between SKILL.md and references/
    - Standardized placeholder formats with angle brackets (`<url>`, `<login-url>`)
    - Removed personal project examples from public documentation
    - Progressive disclosure: load detailed docs only when needed

### Fixed
- 📝 **Browser Pilot v1.4.0**: Documentation consistency and clarity
  - Fixed inconsistent quote usage in examples (removed unnecessary quotes)
  - Standardized all placeholders to angle bracket format
  - Unified Smart Mode documentation across all reference files
  - Single mode quote rules now consistent with chain mode

---

## [2.11.0] - 2025-11-04

### Changed
- 🎉 **Browser Pilot v1.0.0**: First Stable Release - Production Ready
  - **Breaking Changes**:
    - **Removed `--project-root` parameter**: Now auto-detected from environment
    - **Configuration system migration**: Per-project files → shared config
  - **Shared Configuration System**: Single config manages multiple projects
    - Multi-project port management (9222-9322 auto-assigned)
    - Project identification by folder name
    - Port collision detection and automatic assignment
  - **Automated Session Management**: SessionStart/SessionEnd hooks
    - SessionStart: Auto-registers project, assigns port, creates `.browser-pilot/` directory
    - SessionEnd: Optional cleanup when `autoCleanup: true`
  - **Modular CLI Architecture**: Reorganized `cli.ts` to `src/cli/cli.ts`
  - **Documentation Updates**: XPath wildcard examples, shared config docs, architecture diagrams
  - **Cross-Platform Support**: All path operations use Node.js `path` module
  - **Files Changed**: 11 files (config.ts, browser.ts, helpers.ts, cli.ts, hooks.json, etc.)

---

## [2.10.7] - 2025-11-03

### Added
- ⚛️ **Browser Pilot v0.3.0**: React/Framework Compatibility
  - **React Synthetic Event Support**: All form actions now properly trigger React synthetic events
    - `fill`, `check`, `uncheck`, `typeText`, `pressKey` converted to CDP coordinate-based interactions
    - Works seamlessly with React controlled components and other modern frameworks (Vue, Angular, Svelte)
    - Maintains backward compatibility with non-React applications
  - **CDP Input Domain Migration**: Changed from JavaScript event simulation to Chrome DevTools Protocol
    - `fill`: JavaScript value assignment → CDP click + Input.insertText
    - `check`/`uncheck`: JavaScript property changes → CDP mouse events
    - `typeText`: JavaScript KeyboardEvent → CDP Input.insertText (with optional delay)
    - `pressKey`: JavaScript KeyboardEvent → CDP Input.dispatchKeyEvent
  - **Modular Action Architecture**: Split actions.ts into 14 focused modules
    - Created `actions/` directory with specialized modules
    - capture.ts, cookies.ts, data.ts, debugging.ts, dialogs.ts, emulation.ts, forms.ts, helpers.ts
    - input.ts, interaction.ts, navigation.ts, network.ts, scroll.ts, tabs.ts, wait.ts
    - Better maintainability and code organization
  - **Comprehensive Logging**: All 47 actions now include verbose logging
    - Added `ActionOptions` parameter with `verbose: boolean` (default: true)
    - 148 total logging statements (average 3.1 per function)
    - Enhanced error messages across all actions
  - **Technical Details**:
    - Coordinate-based interactions ensure React onChange/onClick handlers are triggered
    - All form interactions maintain state synchronization with React components
    - No breaking changes - all existing selectors and parameters remain the same

---

## [2.10.6] - 2025-11-03

### Fixed
- 🔧 **Browser Pilot v0.2.1**: Improved Error Messages and Documentation
  - **Enhanced Error Messages**: Added selector information to error messages
    - Changed from `'Element not found'` to `'Element not found: ' + selector`
    - Applied to 9 functions across actions.ts and actions-extra.ts
    - Improves debugging by showing which selector failed
  - **Documentation Clarity**: Fixed CSS/XPath selector comparison in SKILL.md
    - Changed "Complex structure" to "N-th child element" for clarity
    - Added note explaining difference between CSS `>` (direct children) and XPath `//` (all descendants)
    - Clarified that XPath `/` (single slash) is equivalent to CSS `>` for direct children

---

## [2.10.5] - 2025-11-03

### Added
- ✨ **Browser Pilot v0.2.0**: XPath Selector Support with Indexing
  - **XPath Selector Support**: Powerful text-based element selection
    - Select elements by visible text: `//button[contains(text(), 'Submit')]`
    - Select by exact text: `//button[text()='Sign In']`
    - Complex XPath queries: `//div[@class='modal']//button[@type='submit']`
    - Works with all element interaction commands (click, fill, hover, focus, blur, etc.)
  - **XPath Indexing**: Select N-th element when multiple elements share the same text
    - Syntax: `(//xpath-expression)[N]` where N is 1-based
    - Example: `(//button[contains(text(), 'Add to Cart')])[3]` selects the 3rd "Add to Cart" button
    - Solves the problem of selecting specific elements among duplicates
  - **Code Quality Improvements**: Refactored to centralized utility
    - Created `getFindElementScript()` in utils.ts
    - Applied to 15+ functions across actions.ts and actions-extra.ts
    - Single source of truth for element finding logic
  - **Enhanced Documentation**: Updated SKILL.md with comprehensive selector guide
    - Selector Types section: CSS vs XPath vs XPath+Indexing
    - Decision table: when to use each selector type
    - Practical examples and troubleshooting tips
  - **Implementation Details**:
    - Uses `document.evaluate()` with `ORDERED_NODE_SNAPSHOT_TYPE` for indexing
    - Regex pattern matching to detect `(//xpath)[N]` syntax
    - Backward compatible: existing CSS selectors continue to work

---

## [2.10.4] - 2025-11-03

### Fixed
- 🔊 **Sound Notifications v1.4.4**: Windows Path Handling with Node.js Wrapper
  - **Windows Path Issue Resolution**: Switched from bash wrapper to Node.js wrapper
    - Git Bash could not interpret Windows-style paths (`C:\Users\...`) in `${CLAUDE_PLUGIN_ROOT}`
    - Node.js natively handles Windows paths through built-in `path` module
    - Eliminates dependency on Git Bash path conversion
  - **Cross-Platform Compatibility**: Node.js wrapper provides true cross-platform support
    - Windows: Routes to PowerShell script (`sound-hook.ps1`)
    - macOS/Linux: Routes to bash script (`sound-hook.sh`)
    - Consistent behavior across all platforms
  - **Architecture Change**:
    - Removed: `sound-hook-wrapper.sh` (bash wrapper)
    - Added: `sound-hook-executor.js` (Node.js wrapper)
    - All 9 hooks updated to use Node.js executor
  - **Requirements**: Node.js v14+ now explicitly documented as a requirement
    - Installation guide added to README
    - Troubleshooting section for Node.js setup issues

---

## [2.10.3] - 2025-11-03

### Fixed
- 🔊 **Sound Notifications v1.4.3**: Critical Bug Fixes
  - **PowerShell Lock Cleanup**: Fixed lock file cleanup using try-finally pattern
    - Lock files now properly cleaned up on all exit paths (normal, early return, exception)
    - Prevents accumulation of stale lock files in temp directory
  - **Windows Fallback Consistency**: Windows now uses home folder like Unix
    - Changed fallback from `plugin/sounds` to `~/.claude/sounds/hook-sound-notifications`
    - Ensures consistent behavior across all platforms
  - **Cross-Platform Config Compatibility**: Added tilde expansion in PowerShell
    - Config files with `~/...` paths now work on Windows
    - Matches Unix behavior for portable configuration files
  - **Dynamic File Reading Enhancement**: Filters system files and validates extensions
    - Skips hidden files (.DS_Store, Thumbs.db, desktop.ini)
    - Only copies audio files (.mp3, .wav, .ogg, .m4a, .aac, .flac)
    - Improved error handling for permission issues
  - **Portability Improvement**: Replaced `bc` with `awk`
    - Works in minimal environments (Alpine Linux, minimal Docker)
    - POSIX compliant, more widely available

---

## [2.10.1] - 2025-11-03

### Improved
- 🔧 **Browser Pilot v0.1.6**: Optional URL Parameters & Page State Preservation
  - **Optional URL Parameter**: URL (`-u, --url`) is now optional for 10 commands
    - Commands: `screenshot`, `click`, `fill`, `extract`, `select`, `check`, `uncheck`, `hover`, `upload`, `drag`
    - When URL is omitted, commands operate on the current page without refreshing
    - Preserves page state: console logs, network data, form inputs, JavaScript state
  - **Required Project Root**: `--project-root` is now a required parameter for all commands
    - Ensures proper file output paths and prevents save errors
    - Clear error message when not provided
  - **Multi-Step Workflow Optimization**:
    - Only first `navigate` command needs URL parameter
    - Subsequent commands reuse the same page without refresh
    - Eliminates unnecessary page reloads in automation workflows
  - **Performance Improvement**: Reduced workflow time by eliminating reload overhead
  - **Developer Experience**: Simplified command chaining with preserved page state

---

## [2.10.0] - 2025-11-03

### Improved
- 🔊 **Sound Notifications v1.4.0**: Home Folder Migration & Cross-Platform Support
  - **Home Folder Sound Storage**: Sounds now stored in `~/.claude/sounds/hook-sound-notifications/`
    - Automatic migration from plugin folder to user home folder
    - Preserves user customizations across plugin updates
    - Safe from being overwritten during updates
  - **Intelligent Migration Logic**:
    - New users: Sounds automatically copied to home folder
    - Existing users with default path: Migrated to home folder
    - Existing users with custom path: Path preserved (no migration)
  - **Cross-Platform Hook Support**:
    - Added OS detection wrapper (`sound-hook-wrapper.sh`)
    - Routes to appropriate handler based on OS (Windows/macOS/Linux)
    - Unix sound playback with jq-based JSON parsing and grep fallback
  - **Enhanced Configuration Parsing**:
    - Reads settings from `.plugin-config/hook-sound-notifications.json`
    - Respects global and per-hook enabled/disabled states
    - Volume control support across platforms (where available)
  - **Documentation**: Added detailed customization guide with home folder instructions

---

## [2.8.5] - 2025-11-03

### Improved
- 🔧 **Browser Pilot v0.1.5**: Public API Type Exports
  - **Exported Core CDP Interfaces**: Made `StackTrace` and `RemoteObject` interfaces public
    - `StackTrace` is now accessible as part of `ConsoleMessage` public API
    - `RemoteObject` is exported for reusability across modules
  - **Better TypeScript API Design**: Follows best practices for module exports
  - **Enhanced Developer Experience**: Module consumers can now use these types directly
  - **Type Safety**: Enables type-safe usage of CDP types in external code

---

## [2.8.4] - 2025-11-03

### Improved
- 🔧 **Browser Pilot v0.1.4**: Enhanced Type Safety with Proper Interface Reuse
  - **FormattedConsoleMessage Interface**: Added dedicated interface for formatted console messages
    - Separates `ConsoleMessage` (internal, `timestamp: number`) from `FormattedConsoleMessage` (API, `timestamp: string`)
    - Resolves type mismatch between internal representation and formatted output
    - Improves code clarity and prevents timestamp type confusion
  - **Eliminated `any` Types**:
    - `ConsoleMessage.stackTrace`: `any` → `StackTrace`
    - `LogEntry.stackTrace`: `any` → `StackTrace`
    - `ExceptionDetails.stackTrace`: `any` → `StackTrace`
    - `RemoteObject.value`: `any` → `unknown`
    - `RemoteObject` index signature: `[key: string]: any` → `[key: string]: unknown`
  - **Type Reuse**: CLI now imports and uses `FormattedConsoleMessage` instead of inline type
  - **Better Type Safety**: Using `unknown` instead of `any` forces explicit type checking
  - **Improved Maintainability**: Single source of truth for console message types

---

## [2.8.3] - 2025-11-03

### Improved
- 🔧 **Browser Pilot v0.1.3**: TypeScript Type Safety Improvements
  - Added explicit TypeScript interfaces for CDP event payloads:
    - `LogEntryAddedPayload` for `Log.entryAdded` events
    - `ConsoleAPICalledPayload` for `Runtime.consoleAPICalled` events
    - `ExceptionThrownPayload` for `Runtime.exceptionThrown` events
    - `RemoteObject`, `StackTrace` supporting interfaces
  - Replaced `params: any` with typed parameters in event handlers
  - Added explicit type annotation for console message objects in CLI
  - Improved code maintainability and IDE autocomplete support

---

## [2.8.2] - 2025-11-03

### Added
- ✨ **Browser Pilot v0.1.2**: Console Message Collection & 14 New CLI Commands
  - **Console Message Collection**:
    - Real-time console message collection via CDP events
    - Captures `Log.entryAdded`, `Runtime.consoleAPICalled`, `Runtime.exceptionThrown`
    - Message buffer with level, text, timestamp, URL, line number tracking
    - Statistics: total, error, warning, and log counts
  - **New CLI Commands** (14):
    - `console` - Get console messages (with `-e` for errors only)
    - `focus` / `blur` - Focus/unfocus elements
    - `extract-data` - Extract multiple data points with JSON selector mapping
    - `find` - Find element and get detailed info
    - `get-property` - Get element property values
    - `switch-tab` - Switch between browser tabs
    - `set-cookie` / `delete-cookies` - Cookie management
    - `sleep` - Wait for specified milliseconds
    - `wait-idle` - Wait for network idle state
    - `accessibility` - Get accessibility tree
    - `enable-interception` / `disable-interception` - Request interception control

### Improved
- 🔧 **Browser Pilot v0.1.2**: Architecture Enhancements
  - CDPClient now extends EventEmitter for proper event handling
  - Added permanent event listener in WebSocket message handler
  - ChromeBrowser maintains console message buffer
  - All 48 implemented functions now accessible via CLI
  - npm script shortcuts added for all commands in package.json
  - Updated SKILL.md with comprehensive command documentation

---

## [2.8.1] - 2025-11-03

### Security
- 🔒 **Browser Pilot v0.1.1**: Additional XSS Vulnerability Fixes
  - Fixed template string injection vulnerabilities in 7 additional functions
  - Fixed functions: `pressKey`, `typeText`, `uploadFile`, `getElementProperty`, `findElement`, `scroll`, `dragAndDrop`
  - Replaced unsafe template literals with `JSON.stringify()` for proper escaping
  - Total: 18 functions now protected against XSS attacks (11 in v2.8.0 + 7 in v2.8.1)

### Fixed
- 📝 **Browser Pilot v0.1.1**: Documentation Inconsistency
  - Fixed README documentation where `maxAttempts` example (40) differed from actual code default (20)
  - Clarified that default timeout is 10 seconds (20 attempts × 500ms)
  - Updated both English and Korean documentation

---

## [2.8.0] - 2025-11-03

### Added
- ✨ **New Plugin: Browser Pilot v0.1.0**
  - Chrome DevTools Protocol (CDP) based browser automation, web scraping, and crawling
  - Features:
    - Headless browser automation with screenshot capture and PDF generation
    - Form automation (fill, click, type, press keys)
    - Web scraping with element text extraction
    - Tab management (list, switch, close)
    - JavaScript execution in page context
    - Bot detection bypass (`navigator.webdriver = false`)
    - Multi-step workflows with human-like delays
  - Cross-platform CLI built with TypeScript
  - Auto-initialization via SessionStart hook
  - Files saved to `.browser-pilot/` directory
  - Comprehensive documentation with workflow examples

- ✨ **New Plugin: Unity Editor Pilot v0.1.0** (🚧 Under Development)
  - WebSocket-based Unity Editor control (port 30090-30099)
  - Planned features:
    - GameObject/Scene/PlayMode management
    - Transform and component operations
    - Build automation
  - Status: Development in progress, not yet available for installation

### Fixed
- 🐛 **Browser Pilot v0.1.0**: Polling Logic Bug Fix
  - Fixed potential infinite loop when HTTP response returns non-OK status
  - Changed polling logic to increment attempts on every iteration
  - Connection now properly times out after 10 seconds (20 attempts × 500ms)

- 🐛 **Browser Pilot v0.1.0**: CLI Option Handling Improvement
  - Replaced manual `process.argv` parsing with Commander.js `preAction` hook
  - Improved maintainability and follows library best practices
  - `--project-root` option now handled cleanly before command execution

### Security
- 🔒 **Browser Pilot v0.1.0**: XSS Vulnerability Fixes
  - Fixed template string injection vulnerabilities in 11 high-priority functions
  - Replaced unsafe template literals with `JSON.stringify()` for proper escaping
  - Fixed functions: `click`, `fill`, `extractText`, `hover`, `focus`, `blur`, `extractData`, `selectOption`, `check`, `uncheck`, `waitFor`
  - Prevents arbitrary JavaScript code execution through malicious selectors or values
  - Example: `selector = "'); alert('XSS'); //"` no longer causes code injection

---

## [2.7.0] - 2025-11-03

### Added
- ✨ **New Plugin: Browser Pilot v0.1.0**
  - Chrome DevTools Protocol (CDP) based browser automation, web scraping, and crawling
  - Features:
    - Headless browser automation with screenshot capture and PDF generation
    - Form automation (fill, click, type, press keys)
    - Web scraping with element text extraction
    - Tab management (list, switch, close)
    - JavaScript execution in page context
    - Bot detection bypass (`navigator.webdriver = false`)
    - Multi-step workflows with human-like delays
  - Cross-platform CLI built with TypeScript
  - Auto-initialization via SessionStart hook
  - Files saved to `.browser-pilot/` directory
  - Comprehensive documentation with workflow examples

- ✨ **New Plugin: Unity Editor Pilot v0.1.0** (🚧 Under Development)
  - WebSocket-based Unity Editor control (port 30090-30099)
  - Planned features:
    - GameObject/Scene/PlayMode management
    - Transform and component operations
    - Build automation
  - Status: Development in progress, not yet available for installation

### Fixed
- 🐛 **Browser Pilot v0.1.0**: Polling Logic Bug Fix
  - Fixed potential infinite loop when HTTP response returns non-OK status
  - Changed polling logic to increment attempts on every iteration
  - Connection now properly times out after 10 seconds (20 attempts × 500ms)

- 🐛 **Browser Pilot v0.1.0**: CLI Option Handling Improvement
  - Replaced manual `process.argv` parsing with Commander.js `preAction` hook
  - Improved maintainability and follows library best practices
  - `--project-root` option now handled cleanly before command execution

---

## [2.5.2] - 2025-10-29

### Fixed
- 🐛 **Sound Notifications v1.0.2**: Configuration Path Bug Fix
  - Fixed sound-hook.js to load correct config file (`hook-sound-notifications.json` instead of `claude-dev-helper.json`)
  - Sounds now properly play when configured

---

## [2.5.1] - 2025-10-29

### Fixed
- 🐛 **Sound Notifications v1.0.1**: Critical Bug Fixes
  - Fixed plugin.json author field format (string → object) for proper validation
  - Fixed init-config.js hook selection logic using dynamic find() instead of hardcoded [0]
  - SessionStart sound enable/disable settings now work correctly

---

## [2.5.0] - 2025-10-29

### Added
- ✨ **New Plugin: Sound Notifications v1.0.0**
  - Independent sound notification plugin for Claude Code hook events
  - Supports 9 hook types: SessionStart, SessionEnd, PreToolUse, PostToolUse, Notification, UserPromptSubmit, Stop, SubagentStop, PreCompact
  - Features global and per-hook volume control (0.0-1.0)
  - Cross-platform support: Windows (VBScript + WMPlayer), macOS (afplay), Linux (mpg123/aplay)
  - Duplicate execution prevention with 1-second cooldown
  - PostToolUse disabled by default to prevent instability
  - Configuration via `.plugin-config/hook-sound-notifications.json`
  - MP3 and WAV file format support

### Changed
- 🔄 **Claude Dev Helper v1.4.0**: Breaking Changes - Sound Notifications Removed
  - Sound notification features moved to separate `hook-sound-notifications` plugin
  - Simplified to focus on core file management and Git diff features
  - Removed sound-hook.js and sounds folder
  - Removed `soundNotifications` configuration section
  - Removed all sound-related hooks from hooks.json
  - Migration required: Install `hook-sound-notifications` plugin separately for audio feedback

### Migration Guide
If you were using sound notifications in Claude Dev Helper:
1. Install the new plugin: `/plugin install hook-sound-notifications@dev-gom-plugins`
2. Reconfigure sound settings in `.plugin-config/hook-sound-notifications.json`
3. Your previous sound settings will need to be manually migrated

---

## [2.4.19] - 2025-10-28

### Fixed
- 🐛 **Claude Dev Helper v1.2.5**: Config Migration Fix
  - Fixed deep merge logic in init-config.js to properly add new fields to existing hooks
  - New `volume` field now correctly added to all hooks during config migration
  - Version bump triggers automatic migration for existing users
  - Users with v1.2.4 will automatically receive volume fields on next session

---

## [2.4.18] - 2025-10-28

### Added
- 🔊 **Claude Dev Helper v1.2.4**: Volume Control for Sound Notifications
  - Added global volume control (0.0 - 1.0)
  - Added per-hook volume override capability
  - PreToolUse and PostToolUse default to 0.3 (quieter for frequent events)
  - Other hooks default to 0.5 (50% volume)
  - Platform support:
    - Windows: WMPlayer volume setting (0-100)
    - Linux: mpg123 --scale option for MP3 files
    - macOS: afplay (no volume control yet)
  - Users can customize volume in `.plugin-config/claude-dev-helper.json`

---

## [2.4.16] - 2025-10-28

### Fixed
- 🐛 **Claude Dev Helper v1.2.3**: Sound Path Configuration Fix
  - Fixed sound file path to automatically use plugin's sounds folder
  - sound-hook.js now uses `__dirname` to locate sounds folder (no config needed)
  - Removed `soundsFolder` from default config - auto-detected from plugin location
  - Ensures sounds work regardless of where the plugin is installed
  - Users can still override with custom `soundsFolder` path if needed

---

## [2.4.15] - 2025-10-28

### Fixed
- 🐛 **Claude Dev Helper v1.2.2**: Code Quality Improvements
  - Fixed Flake8 linting errors in `play-sound.py`:
    - Added proper blank lines (E302, E305)
    - Fixed line length violations (E501)
    - Added type annotation for `file_path` parameter
  - Improved code readability and maintainability

### Changed
- 🔧 **Claude Dev Helper v1.2.1**: Dynamic hooks.json Update
  - Configuration changes now automatically update `hooks.json` on next session start
  - Users only need to edit `.plugin-config/claude-dev-helper.json` (no manual hooks.json editing)
  - When `soundNotifications.enabled` is `false`, all sound hooks are automatically disabled
  - When `soundNotifications.enabled` is `true`, individual hook settings are respected
  - Restart notice displayed when configuration changes are detected
  - Eliminates unnecessary Node.js process overhead when sound notifications are disabled

---

## [2.4.14] - 2025-10-28

### Added
- 🔔 **Claude Dev Helper v1.2.0**: Sound Notifications for ALL Hook Events
  - Audio feedback for **all 9 Claude Code hook types**:
    - SessionStart, SessionEnd
    - PreToolUse, PostToolUse
    - Notification, UserPromptSubmit
    - Stop, SubagentStop, PreCompact
  - Configurable sound files per hook type
  - Global and per-hook enable/disable flags
  - Configurable sound folder path (relative or absolute)
  - Cross-platform sound playback support:
    - Windows: PowerShell with Media.SoundPlayer
    - macOS: afplay (built-in)
    - Linux: aplay (WAV) / mpg123 (MP3)
  - Non-blocking sound playback with detached process spawning
  - Silent failure pattern for non-critical sound operations
  - Configuration in `.plugin-config/claude-dev-helper.json`
  - Performance-heavy hooks (PreToolUse, PostToolUse) disabled by default
  - Settings require Claude Code restart to take effect
  - Includes sample sound files downloaded from soundeffect-lab.info
  - Scripts:
    - `play-sound.js`: Cross-platform sound player utility
    - `sound-hook.js`: Hook entry point for sound playback
    - `init-config.js`: Updated with soundNotifications default config

---

## [2.4.13] - 2025-10-27

### Fixed
- 🔧 **Claude Dev Helper v1.1.8 + Extension v1.1.6**: Focus preservation finally working!
  - **BREAKING**: Changed to `vscode.open` command with `background: true` instead of `showTextDocument`
  - This properly preserves focus - files now open in background without stealing focus
  - Updated `openLocation` semantics: `0` = first column (left), `1` = second column (right)
  - Both values now use explicit viewColumn (ViewColumn.One / ViewColumn.Two)
  - Based on VSCode API recommendation for background file opening
  - Extension v1.1.6 ready for VS Marketplace

---

## [2.4.12] - 2025-10-27

### Changed
- 🔧 **Claude Dev Helper v1.1.7 + Extension v1.1.4**: Change openLocation to numeric values
  - Changed `openLocation` from string to number for type safety (prevents typos)
  - `0` = current (open in current tab with ViewColumn.Active)
  - `1` = beside (open in split view with ViewColumn.Two)
  - Fixed focus issue: ViewColumn.Active added for 'current' mode to properly preserve focus
  - Default value: `1` (beside - maintains existing behavior)

---

## [2.4.11] - 2025-10-27

### Fixed
- 🔧 **Claude Dev Helper v1.1.6**: Config migration bug fix
  - Fixed deep merge logic in init-config.js to properly add new fields
  - `openLocation` field now correctly added to existing config files during migration
  - Version bump to 1.1.6 to trigger config re-migration for existing users
  - Users with v1.1.5 will automatically receive openLocation field on next session

---

## [2.4.10] - 2025-10-27

### Added
- 🎯 **Claude Dev Helper v1.1.5 + Extension v1.1.2**: Configurable file opening location
  - New `openLocation` config option: `'beside'` (split view) or `'current'` (current tab)
  - Default: `'beside'` (maintains existing behavior - opens in split view)
  - Set to `'current'` to open files in the current editor tab instead
  - Configurable via `.plugin-config/claude-dev-helper.json`
  - VSCode extension updated to support both opening modes

---

## [2.4.9] - 2025-10-27

### Fixed
- 🔧 **Claude Dev Helper v1.1.4**: Restored VSCode extension pattern for focus control
  - Reverted from direct `code` command to VSCode extension + file watcher pattern
  - Fixed focus issue: files now open in background without stealing focus
  - Restored `.claude-dev-helper/open-files.json` queue communication
  - VSCode extension with `preserveFocus: true` provides proper focus control
  - **Note**: VSCode extension installation required for auto-open feature

---

## [2.4.8] - 2025-10-27

### Changed
- 🔧 **Claude Dev Helper v1.1.3**: Simplified auto-open implementation
  - Replaced VSCode extension dependency with direct `code` command execution
  - Uses `exec` to run `code -r "filepath"` for background file opening
  - No longer requires `.claude-dev-helper/open-files.json` or file watcher
  - Simplified architecture: hook script → code CLI → VSCode
  - Cross-platform path normalization for Windows/Unix/Linux
  - Eliminates need to install VSCode extension separately

---

## [2.4.7] - 2025-10-27

### Fixed
- 🔧 **Claude Dev Helper v1.1.2**: Auto-open stdin parsing fix
  - Fixed stdin data structure parsing for PostToolUse hook
  - Corrected from `toolUse.parameters.file_path` to `input.tool_input.file_path`
  - Added `tool_name` validation for Write and Edit operations
  - Matches hook-auto-open-file plugin pattern
  - Removed unnecessary console logging for silent operation

---

## [2.4.6] - 2025-10-27

### Fixed
- 🔧 **Claude Dev Helper v1.1.1**: Plugin manifest validation fix
  - Removed unsupported `requirements` key from plugin.json
  - Fixes "Unrecognized key(s) in object: 'requirements'" validation error
  - Plugin now loads correctly without manifest errors

---

## [2.4.5] - 2025-10-27

### Added
- 🔧 **Claude Dev Helper v1.1.0**: Auto-open files feature
  - Automatically opens files in VSCode when Claude creates or edits them
  - Configurable via `.plugin-config/claude-dev-helper.json` (project root)
  - Settings: enabled (default: true), focus (default: false), maxQueueSize (default: 10)
  - SessionStart hook initializes config with default values
  - VSCode Extension v1.1.0 published to VS Marketplace
  - File watcher integration with `.claude-dev-helper/open-files.json`
  - Background opening support (no focus stealing)

---

## [2.4.4] - 2025-10-22

### Added
- 🧪 **Unity Dev Toolkit v1.4.0**: New test automation skill
  - Added `unity-test-runner` skill for automated Unity Test Framework execution and analysis
  - Cross-platform Unity Editor detection (Windows/macOS/Linux)
  - EditMode and PlayMode test execution via Unity CLI
  - NUnit XML results parsing with detailed failure analysis
  - Smart test pattern matching against 6 common failure categories
  - File:line references in failure reports for quick navigation
  - Node.js scripts for editor detection and test result parsing
  - Comprehensive test patterns database with NUnit assertions and Unity-specific patterns

---

## [2.4.3] - 2025-10-22

### Added
- 🔧 **Unity Dev Toolkit v1.3.0**: New compile error resolution skill
  - Added `unity-compile-fixer` skill for automated C# compilation error detection and resolution
  - VSCode diagnostics integration (OmniSharp) for real-time error detection
  - Comprehensive Unity C# error patterns database (CS0246, CS0029, CS1061, etc.)
  - Smart context-aware fix suggestions based on error analysis
  - Unity .meta file conflict detection and version control integration
  - Node.js analysis script for processing VSCode diagnostics

---

## [2.4.2] - 2025-10-21

### Fixed
- 🔒 **Auto Release Manager v1.0.3**: Enhanced error handling
  - Added UnicodeDecodeError handling in detect_project.py and sync_unity_version.py
  - Prevents script crashes when encountering malformed or non-UTF-8 encoded files

---

## [2.4.1] - 2025-10-21

### Fixed
- 🔧 **Auto Release Manager v1.0.2**: Code quality and documentation improvements
  - Fixed Unreal Engine version detection priority
  - Improved exception handling with specific exception types
  - Updated Python version requirements to 3.11+ across all documentation
  - Fixed plugin.json skills array configuration

---

## [2.4.0] - 2025-10-21

### Added
- 🎉 **New Plugin**: Auto Release Manager - Automate version updates and releases for any project type
  - Universal project type detection (Node.js, Python, Rust, Go, Unity, Unreal, etc.)
  - Cross-platform version update scripts
  - Unity dual-file sync (version.json ← → ProjectSettings.asset)
  - Unreal Engine .uproject support
  - CHANGELOG auto-generation from Conventional Commits
  - Git workflow automation
  - Python 3.11+ with zero external dependencies

---

## Spec-Kit Integration

### [2.3.2] - 2025-10-21

#### Fixed
- AskUserQuestion tool not being called due to ambiguous instructions ("필요시", "선택적")
- Step 4.2 minimum options requirement violation (1 option → 2 options required)

#### Added
- Explicit AskUserQuestion Tool Usage Guidelines section with all constraints
- MUST directives for all user interaction points (Step 1-B, 1-C, Step 2, Step 4.2, What's Next)
- Tool constraint validation with checkmarks (✅) in all sections
- Clear documentation of "Other" option auto-addition by system

#### Changed
- Step 4.2 header changed from "(선택적)" to mandatory
- Added "요구사항 추가" option to meet 2-4 options requirement

### [2.3.1] - 2025-10-21

#### Changed
- Removed rigid AskUserQuestion JSON structures from tasks command
- Claude now autonomously decides what questions to ask based on context
- Improved user experience with more flexible conversation flow
- Enhanced flexibility in Step 1 (Git changes), Step 2 (Update mode), and What's Next sections

### v2.3.0 (2025-10-21)
- 🚀 **Token Efficiency Optimization**: Completely redesigned `/spec-kit:tasks` command workflow
  - Removed redundant information collection (Step 4-7) - CLI now auto-parses spec.md and plan.md directly
  - Eliminated draft file requirement - CLI reads source documents directly
  - Reduced code from 415 lines to ~270 lines (35% reduction)
  - Plugin now focuses only on pre-validation and collecting additional context
  - **Token savings**: ~50% reduction by eliminating duplicate questions
  - **User experience**: Minimal questions (only additional context if needed)
- 🎯 **CLI Auto-Generation**: Full utilization of GitHub Spec-Kit CLI's automatic parsing capabilities
  - CLI automatically extracts user stories, priorities, and acceptance criteria from spec.md
  - CLI automatically extracts tech stack, libraries, and implementation strategy from plan.md
  - Automatic task generation organized by user story phases (P1, P2, P3...)
  - Automatic dependency mapping and parallel execution identification
- ✨ **Optional Context Collection**: Users can now choose to:
  - Include specific additional tasks
  - Exclude certain tasks
  - Adjust priorities
  - Specify time constraints
  - Define test strategy preferences
  - Or simply auto-generate without additional input (recommended)

### v2.2.0 (2025-10-20)
- ✨ **SlashCommand Tool Integration**: Enhanced all 8 command files to explicitly use SlashCommand tool with critical warnings
- 🚀 **Git Setup Workflow**: Added comprehensive Git installation and GitHub setup to init command
  - Auto-detects and installs Git based on OS (Windows/macOS/Linux)
  - Configures Git user information interactively
  - GitHub CLI installation and authentication
  - Private repository creation with `gh repo create --private`
- 📝 **Phase-Based Draft Naming**: implement command now creates draft files with phase and task ID
  - Format: `[phase]-[task-id]-[slug]-draft.md` (e.g., `p2-t010-currency-draft.md`)
  - English-only slug generation for cross-platform compatibility
  - Better file organization and task tracking

### v2.0.4 (2025-10-19)
- 🐛 **Bug Fix**: Fixed SlashCommand format - merged command and INSTRUCTION into single line for all 8 command files
- 📝 **Improved Clarity**: Removed ambiguous newlines between `/speckit.*` commands and INSTRUCTION parameters
- 📝 **Documentation**: Clarified INSTRUCTION blocks - explicitly mention "AskUserQuestion tool" instead of ambiguous "Use if clarification needed"
- 🔄 **Workflow Enhancement**: Added Git status check before `/spec-kit:specify` to prompt for committing existing changes
- 🚀 **Better Git Integration**: `/speckit.specify` now asks about branch publishing (publish/local commit/decide later)
- ♻️ **Role Separation**: Removed PowerShell execution from plugin command for clearer workflow

### v2.0.3 (2025-10-19)
- 🐛 **Bug Fix**: Removed duplicate `CURRENT_BRANCH` declarations across all command files
- 📝 **Documentation**: Added command distinction warnings to prevent confusion between `/spec-kit:*` and `/speckit.*`

### v2.0.2 (2025-10-19)
- 📝 **Documentation**: Added AskUserQuestion tool instruction to all command INSTRUCTIONS

### v2.0.1 (2025-10-19)
- 🐛 **Bug Fix**: Fixed clarify command draft file paths to use branch-based structure

### v2.0.0 (2025-10-19)
- 🔄 **Branch-Based Workflow**: Complete restructuring to support per-branch feature specifications
- 📁 **Path Changes**: Migrated from `.specify/memory/` to `specs/[branch-name]/` structure for feature files
- ✨ **Workflow Selection**: `/spec-kit:specify` command now offers choice between creating new specs or rewriting existing ones
- 🔗 **PowerShell Integration**: Integrated with `create-new-feature.ps1` script for automated branch creation
- 🎯 **Branch Detection**: All commands now automatically detect current branch and work with correct spec files
- 📋 **Next Step Guidance**: Added AskUserQuestion prompts to all commands for workflow navigation
- ⚠️ **BREAKING CHANGE**: Existing v1.x users must migrate their specs to the new branch-based structure

### v1.7.0 (2025-10-19)
- 🔄 **Next Step Suggestions**: All commands now prompt users for next actions after completion using AskUserQuestion
- 🎯 **Workflow Guidance**: Each command suggests contextually relevant next steps (e.g., specify → clarify/plan, tasks → implement)
- 📋 **Smart Navigation**: Users can choose to continue workflow, review files, or complete session
- 💡 **Improved User Experience**: Clear visual option cards for next action selection
- 🚀 **Seamless Workflow**: Reduces friction by guiding users through the entire SDD process

### v1.6.0 (2025-10-18)
- 🤝 **Interactive User Prompts**: All commands now use AskUserQuestion for better user interaction
- 🔄 **Update Mode Selection**: specify, plan, and tasks commands prompt users to choose between Full Regeneration or Incremental Update
- ⚠️ **Smart Warnings**: implement command warns about Open Questions and offers to run clarify first
- 📋 **Issue Prioritization**: clarify command lets users select which ambiguous items to address first
- 🎯 **Improved UX**: Visual option cards with clear descriptions replace text-based prompts

### v1.5.0 (2025-10-18)
- 📊 **Project Status Display**: When canceling re-initialization, displays current project structure and progress
- 🗺️ **Smart Navigation**: Analyzes existing files (constitution, specification, plan, tasks) and recommends next steps
- 🎯 **Context-Aware Guidance**: Shows completed stages and suggests appropriate next command
- 💡 **Workflow Clarity**: Helps users understand where they are in the SDD workflow

### v1.4.0 (2025-10-18)
- 🔄 **Re-initialization Check**: `/spec-kit:init` now detects existing installations and asks user confirmation before re-initializing
- 📝 **Command Arguments Support**: All commands now accept `$ARGUMENTS` for user input
- 🏷️ **Argument Hints**: Added bilingual (English/Korean) argument hints to all commands for better UX
- 🌐 **Enhanced User Input**: Commands can now be invoked with inline arguments (e.g., `/spec-kit:specify Add user authentication`)

### v1.3.0 (2025-10-18)
- 🔄 **Update Mode Selection**: All core commands now detect existing files and offer two update options
- 📋 **Full Regeneration**: Complete rewrite from scratch when requirements drastically change
- ✏️ **Incremental Update**: Merge-based updates for targeted changes
- 📖 **Iterative Workflow Documentation**: Comprehensive guide on when and how to update earlier stages
- 🎯 **Context Preservation**: Re-running commands maintains conversation history and change rationale
- ⚡ **Cascade Updates**: Clear guidance on updating downstream stages after changes

### v1.2.0 (2025-10-18)
- ✨ **Smart Prerequisite Checks**: Automatic Open Questions detection in `/spec-kit:plan`, `/spec-kit:tasks`, and `/spec-kit:implement` commands
- 🎨 **Unified Commit Flow**: Single decision point with 3 clear options (quality gate + commit / direct commit / skip)
- 📋 **Better UX**: Context-appropriate guidance for each commit option
- 🛡️ **Error Prevention**: Warns about unclear requirements before proceeding
- 📖 **Documentation**: Added comprehensive "Smart Prerequisite Checks" section to READMEs

### v1.1.0 (2025-10-17)
- ✨ **Token Efficiency**: Implemented two-layer architecture with draft files
- 🚀 **Performance**: Reduced token usage by using file paths instead of full content
- 📁 **Draft System**: All commands now create reusable draft files in `.specify/temp/`
- 📝 **Instructions**: Added precise instructions for each command to skip redundant steps
- 🌐 **Multi-language**: Enhanced system language detection for all commands

### v1.0.0 (2025-10-16)
- 🎉 Initial release
- 📋 10 slash commands for complete SDD workflow
- 🔧 Integration with GitHub Spec-Kit CLI

---

## AI Pair Programming Suite

### v1.1.1 (2025-10-20)
- 🔄 **Auto Migration**: Plugin version-based configuration migration
- 📦 **Smart Updates**: Preserves user settings while adding new fields
- 🏷️ **Project Scoping**: State and output files now use project name to prevent conflicts
- 🎯 **SessionStart Hook**: Auto-creates configuration file on session start
- ⚡ **Performance**: SessionStart hook exits immediately if config is up-to-date
- 🌍 **Cross-Platform**: Enhanced path handling for Windows/macOS/Linux compatibility

### v1.0.0 (2025-10-15)
- 🎉 Initial release
- 💬 5 slash commands: `/pair`, `/review`, `/suggest`, `/fix`, `/explain`
- 🤖 4 expert agents: `@code-reviewer`, `@bug-hunter`, `@architect`, `@performance-expert`
- 🔔 3 intelligent hooks: Code review on Edit/Write, bug detection, session summary
- 🎨 Configuration system for all plugins

---

## TODO Collector

### v1.2.0 (2025-10-20)
- 🔄 **Auto Migration**: Plugin version-based configuration migration
- 📦 **Smart Updates**: Preserves user settings while adding new fields
- 🏷️ **Project Scoping**: State files now use project name to prevent conflicts
- ⚡ **Performance**: SessionStart hook exits immediately if config is up-to-date
- 🌍 **Cross-Platform**: Enhanced path handling for Windows/macOS/Linux compatibility
- 🎯 **SessionStart Hook**: Auto-creates configuration file on session start
- ⚙️ **Custom Filtering**: Added includeDirs and includeExtensions settings
- 🔍 **Full Project Scan**: Automatically scans entire project on first run
- 🔧 **Configuration Refactor**: Moved settings to `.plugin-config/hook-todo-collector.json`
- 📝 **Bug Fix**: Fixed issue where report wasn't generated when no files were modified
- 🐛 **Bug Fix**: Improved full scan logic - immediately scan when report file is missing

### v1.1.1 (2025-10-18)
- 🐛 **Bug Fix**: Fixed empty array handling for `outputFormats` configuration

### v1.1.0 (2025-10-18)
- 📛 **Project-Named Output Files**: All generated files now include project name to prevent conflicts across multiple projects

### v1.0.0 (2025-10-14)
- 🎉 Initial release
- 🔗 Clickable file links in TODO reports
- 📝 Multiple comment types support (TODO, FIXME, HACK, XXX, NOTE, BUG)
- 📊 Detailed markdown reports with statistics
- 🎯 Skip markdown headers to avoid false positives
- 🌐 Multi-language support

---

## Hook Plugins (All Hook Plugins)

### v1.1.1 (2025-10-20) - All Hook Plugins
- 🔄 **Auto Migration**: Plugin version-based configuration migration
- 📦 **Smart Updates**: Preserves user settings while adding new fields
- 🏷️ **Project Scoping**: State and output files now use project name to prevent conflicts
- 🎯 **SessionStart Hook**: Auto-creates configuration file on session start
- ⚡ **Performance**: SessionStart hook exits immediately if config is up-to-date
- 🌍 **Cross-Platform**: Enhanced path handling for Windows/macOS/Linux compatibility
- 🔍 **Complexity Monitor**: Added includeDirs, excludeDirs, includeExtensions, excludeExtensions settings for selective scanning
- 🐛 **Bug Fix - Complexity Monitor v1.1.1**: Full project scan when complexity log file doesn't exist

### v1.1.0 (2025-10-18) - Complexity Monitor, Session Summary, TODO Collector
- 📛 **Project-Named Output Files**: All generated files now include project name to prevent conflicts across multiple projects
- 🏷️ **File Naming**: Changed from `.complexity-log.md` to `.{project-name}-complexity-log.md` (same for all hooks)
- 🔀 **Multi-Project Support**: Work on multiple projects simultaneously without file collisions
- 📁 **State Isolation**: Each project's tracking files are now separate in plugin `.state` directory

### v1.0.0 (2025-10-14)
- 🎉 Initial release
- 🔄 **Git Auto-Backup**: Automatic git commits after sessions
- 📊 **Complexity Monitor**: Code complexity tracking with configurable thresholds
- 📝 **Auto-Docs**: Automatic project structure documentation
- 📋 **Session Summary**: Track all file operations during sessions
- ⚙️ Configurable via `.plugin-config/` files
- 🔇 Optional log suppression with `showLogs` setting

---

## Auto-Docs

### v1.4.1 (2025-10-20)
- ✨ **Improvement**: Unified tree structure when multiple directories are included
- 🐛 **Bug Fix**: Regenerate documentation when output file is deleted
- 🔄 **Auto Migration**: Plugin version-based configuration migration
- 📦 **Smart Updates**: Preserves user settings while adding new fields
- 🎯 **SessionStart Hook**: Auto-creates configuration file on session start
- ⚡ **Performance**: SessionStart hook exits immediately if config is up-to-date
- 🌍 **Cross-Platform**: Enhanced path handling for Windows/macOS/Linux compatibility

### v1.4.0 (2025-10-18)
- 📁 **Empty Directory Control**: Added `includeEmptyDirs` configuration option to control empty directory inclusion
- 🐛 **Bug Fix**: Fixed extension filter display to show both filters when both are active

### v1.3.0 (2025-10-18)
- 📄 **File Extension Filtering**: Added `includeExtensions` and `excludeExtensions` configuration options
- 🎯 **Selective File Inclusion**: Include only specific file types (e.g., `.js`, `.ts`, `.json`)
- 🚫 **File Type Exclusion**: Exclude unwanted file types (e.g., `.meta`, `.log`, `.tmp`)
- 🔧 **Flexible Configuration**: Specify extensions with or without dot (`.meta` or `meta`)
- 📋 **AND Condition**: Both filters work together for fine-grained control (include first, then exclude)
- 💡 **Use Cases**: Focus on source code only, exclude build artifacts, hide metadata files

### v1.2.0 (2025-10-18)
- 📛 **Project-Named Output Files**: Generated files now include project name (`.{project-name}-project-structure.md`)
- 🔀 **Multi-Project Support**: Work on multiple projects simultaneously without file collisions
- 📁 **State Isolation**: Project-specific state files in plugin directory

### v1.1.0 (2025-10-18)
- 📁 **Selective Directory Scanning**: Added `includeDirs` configuration to scan only specific directories
- 🎯 **Focused Documentation**: Generate project structure for selected folders instead of entire project
- ⚙️ **Configuration Priority**: `includeDirs` takes precedence over `excludeDirs` when set
- 📚 **Large Project Support**: Useful for documenting specific parts of large codebases
- 🌐 **Multi-language Documentation**: Updated both English and Korean READMEs

---

## Unity Dev Toolkit

### v1.3.0 (2025-10-22)
- 🔧 **New Skill**: Added `unity-compile-fixer` skill for automated C# compilation error detection and resolution
- 🔍 **VSCode Integration**: Leverages VSCode diagnostics (OmniSharp) for real-time error detection
- 📊 **Error Pattern Database**: Includes comprehensive Unity C# error patterns (CS0246, CS0029, CS1061, etc.)
- 💡 **Smart Solutions**: Proposes context-aware fixes based on error analysis
- ✅ **VCS Support**: Handles Unity .meta file conflicts and version control integration
- 📝 **Analysis Scripts**: Includes Node.js script for processing VSCode diagnostics

### v1.2.0 (2025-10-18)
- 🎨 **UI Toolkit Templates**: Added complete UI Toolkit templates for both Editor and Runtime (6 files total)
- 📝 **Editor Templates**: EditorWindow with UXML/USS (C#, UXML, USS)
- 🎮 **Runtime Templates**: UIDocument for game UI with UXML/USS (C#, UXML, USS)
- ⚡ **New Skill**: Added `unity-uitoolkit` skill for UI Toolkit development assistance
- 📚 **Template Count**: Increased from 7 to 10 production-ready templates
- 🔗 **Cross-References**: Updated Skills to reference new UI Toolkit capabilities

### v1.1.0 (2025-10-18)
- 🤖 **New Agent**: Added `@unity-refactor` agent for code refactoring and quality improvement
- 📝 **Skills Enhancement**: Added "When to Use vs Other Components" sections to all Skills
- 🔗 **Component Integration**: Clear guidance on when to use Skills vs Agents vs Commands
- 📚 **Documentation**: Improved cross-component references and usage patterns

### v1.0.1 (2025-10-18)
- 📝 **Skill Documentation Optimization**: Simplified SKILL.md files (834 → 197 lines, 76% reduction)
- 🎯 **Progressive Disclosure**: Applied best practices for concise skill documentation
- 🗑️ **Removed Redundancy**: Eliminated "When to Use This Skill" sections (skill activation is determined by description field)
- ⚡ **Token Efficiency**: Reduced context size for faster skill loading and activation

### v1.0.0 (2025-10-18)
- 🎉 Initial release
- 📝 3 slash commands: `/unity:new-script`, `/unity:optimize-scene`, `/unity:setup-test`
- 🤖 3 expert agents: `@unity-scripter`, `@unity-performance`, `@unity-architect` (expanded to 4 in v1.1.0)
- ⚡ 4 Agent Skills: `unity-script-validator`, `unity-scene-optimizer`, `unity-template-generator`, `unity-ui-selector` (expanded to 5 in v1.2.0)
- 📄 Production-ready templates for MonoBehaviour, ScriptableObject, Editor, and Test scripts

---

## Auto Release Manager

### v1.0.3 (2025-10-21)

#### Fixed
- 🔒 **Error Handling**: Added UnicodeDecodeError handling for better robustness
  - `detect_project.py`: Now handles UTF-8 decoding errors in Unreal Engine .uproject files
  - `sync_unity_version.py`: Now handles UTF-8 decoding errors in Unity files
  - Prevents script crashes when encountering malformed or non-UTF-8 encoded files

### v1.0.2 (2025-10-21)

#### Fixed
- 🔧 **Unreal Engine Version Priority**: Fixed version detection to prioritize `Version` over `EngineAssociation`
  - Now correctly reads project version instead of engine version
  - Aligned with documentation in unreal-guide.md
- 🐛 **Exception Handling**: Improved error handling with specific exceptions
  - Changed `except BaseException` to `except (json.JSONDecodeError, IOError)` in detect_project.py
  - Changed `except Exception` to `except (json.JSONDecodeError, IOError)` in sync_unity_version.py
- 📝 **Code Readability**: Replaced `chr(10)` with `'\n'` in git_operations.py
- 🔧 **Plugin Configuration**: Fixed skills array in plugin.json to use actual skill name

#### Documentation
- 📚 **Consistency**: Updated all Python version requirements from 3.8+ to 3.11+ across all documentation files

### v1.0.1 (2025-10-21)

#### Changed
- 📦 **Python 3.11+ Requirement**: Removed tomli dependency by requiring Python 3.11+
  - Now uses built-in `tomllib` for TOML parsing
  - Added Python version check with clear error message
  - Zero external dependencies for all scripts

#### Fixed
- 🔧 **Type Hints**: Fixed all type annotations across 5 Python scripts
  - Added type parameters to all Dict, List, Optional types
  - Fixed `subprocess.CompletedProcess[str]` type hints
  - Resolved all Pylance and mypy warnings
- 📏 **Code Quality**: Fixed all PEP 8 linter errors
  - Fixed E501 line length violations (79 character limit)
  - Improved code formatting consistency
  - Added type hints to all variables

#### Documentation
- 📝 **Requirements**: Added Python 3.11+ requirement to README.md and README.ko.md
- 📚 **Clarity**: Updated installation instructions with clear version requirements

### v1.0.0 (2025-10-20)
- 🎉 Initial release
- 🔍 Universal project type detection (Node.js, Python, Rust, Go, Unity, Unreal, etc.)
- 📝 Cross-platform version update scripts
- 🔄 Unity dual-file sync (version.json ← → ProjectSettings.asset)
- 🎮 Unreal Engine .uproject support
- 📋 CHANGELOG auto-generation from Conventional Commits
- 🚀 Git workflow automation
- 📚 Comprehensive documentation and guides
