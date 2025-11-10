# Sound Notifications Hook Plugin

Audio notifications for Claude Code hook events with customizable sounds and volume control.

## ⚠️ Experimental Feature - Known Issues

**WARNING**: This plugin is currently experimental and has known stability issues:

- **Claude Code may intermittently crash or terminate** when using this plugin
- This appears to be related to Claude Code's hook execution system
- The issue occurs randomly and is not yet fully understood
- **Recommended**: Disable this plugin if you experience frequent crashes
- Use at your own risk for non-critical work

We are actively investigating this issue. If you experience crashes, please disable the plugin via `/plugin disable hook-sound-notifications`.

## Features

- 🔊 **Sound notifications for 9 hook types**
  - SessionStart, SessionEnd
  - PreToolUse, PostToolUse (PostToolUse disabled by default)
  - Notification, UserPromptSubmit
  - Stop, SubagentStop, PreCompact

- 🎚️ **Volume control**
  - Global volume setting (0.0-1.0)
  - Per-hook volume override
  - Recommended: 0.3-0.5 for frequent events

- 🔒 **Duplicate execution prevention**
  - 1-second cooldown per hook type
  - Prevents Claude Code hook duplication bug

- 🌐 **Cross-platform support**
  - Requires: Node.js v14+
  - Windows: PowerShell MediaPlayer (volume control supported)
  - macOS: afplay (no volume control)
  - Linux: mpg123 (MP3, volume control) / aplay (WAV)

## Requirements

### Node.js (Required)

This plugin requires **Node.js v14 or higher** to be installed on your system.

**Check if Node.js is installed:**
```bash
node --version
```

If the command fails or shows a version lower than v14, install Node.js:

- **Download:** https://nodejs.org/ (recommended: LTS version)
- **After installation:**
  1. Restart your terminal/command prompt
  2. Restart Claude Code
  3. The plugin will now work correctly

**Troubleshooting:**
- If hooks don't play sounds, check Node.js installation: `node --version`
- Ensure Node.js is in your system PATH
- On Windows, restart Command Prompt after Node.js installation

## Installation

This plugin is included in the Dev GOM Plugins marketplace. Restart Claude Code after installation.

## Configuration

Settings are stored in `.plugin-config/hook-sound-notifications.json`:

```json
{
  "soundNotifications": {
    "soundsFolder": "~/.claude/sounds/hook-sound-notifications",
    "enabled": true,
    "volume": 0.5,
    "hooks": {
      "SessionStart": {
        "enabled": true,
        "soundFile": "session-start.mp3",
        "volume": 0.5
      },
      "PreToolUse": {
        "enabled": true,
        "soundFile": "pre-tool-use.mp3",
        "volume": 0.3
      }
    }
  }
}
```

### Settings

- `enabled`: Global enable/disable (default: true)
- `volume`: Global volume 0.0-1.0 (default: 0.5)
- `soundsFolder`: Sound files folder path
  - **Default:** `~/.claude/sounds/hook-sound-notifications/` (user home folder)
  - Sound files are automatically copied to this folder on first run
  - **Safe from plugin updates** - your customizations are preserved
  - Can be changed to use a custom absolute path
- `hooks.[hookType].enabled`: Enable/disable specific hook
- `hooks.[hookType].soundFile`: Sound file name (relative to soundsFolder)
- `hooks.[hookType].volume`: Override global volume

### Enable/Disable Hooks

Edit `.plugin-config/hook-sound-notifications.json` and restart Claude Code.

**Note:** PostToolUse is disabled by default as it may cause instability when used frequently.

## Customization

### Custom Sound Files

Sound files are stored in your home folder and are **safe from plugin updates**.

**Location:**
- **Windows:** `C:\Users\<YourName>\.claude\sounds\hook-sound-notifications\`
- **macOS/Linux:** `~/.claude/sounds/hook-sound-notifications/`

**How to customize:**

1. Navigate to the sound folder location above
2. Replace any of the 9 sound files with your own:
   - `session-start.mp3`
   - `session-end.mp3`
   - `pre-tool-use.mp3`
   - `post-tool-use.mp3`
   - `notification.mp3`
   - `user-prompt-submit.mp3`
   - `stop.mp3`
   - `subagent-stop.mp3`
   - `pre-compact.mp3`
3. Your custom sounds will be preserved across plugin updates

**Supported formats:** MP3, WAV

**Note:** If you want to use sounds from a different location, update the `soundsFolder` path in `.plugin-config/hook-sound-notifications.json`.

### Volume Levels

- **SessionStart/End, Stop**: 0.5 (default)
- **PreToolUse/PostToolUse**: 0.3 (lower for frequent events)
- **Notification, UserPromptSubmit**: 0.5

## Known Issues

### Critical
- **Claude Code may intermittently crash or terminate** - This appears to be related to the hook execution system in Claude Code. The crashes occur randomly regardless of which sound playback method is used (VBScript, PowerShell, or PowerShell scripts).

### Minor
- PostToolUse hook may cause increased instability when enabled (disabled by default)

## Changelog

### v1.4.4 (2025-11-03)
- **Fixed:** Windows path handling by switching from bash wrapper to Node.js wrapper
- **Changed:** All hooks now use `sound-hook-executor.js` (Node.js) instead of `sound-hook-wrapper.sh` (bash)
- **Improved:** Cross-platform compatibility - no longer relies on Git Bash for Windows
- **Added:** Node.js v14+ requirement explicitly documented
- **Removed:** `sound-hook-wrapper.sh` (replaced by Node.js executor)

### v1.4.3 (2025-11-03)
- **Fixed:** PowerShell lock cleanup now uses try-finally (properly cleans up on all exit paths)
- **Fixed:** Windows fallback soundsFolder now uses home folder (matches Unix behavior)
- **Added:** Tilde expansion support in PowerShell for cross-platform config compatibility (`~/...` paths)
- **Enhanced:** Dynamic file reading filters hidden files (.DS_Store, Thumbs.db) and validates audio extensions
- **Changed:** Replaced `bc` with `awk` for better portability (POSIX compliance, works in minimal environments)

### v1.4.2 (2025-11-03)
- **Fixed:** sound-hook.sh SOUNDS_FOLDER fallback now uses home folder instead of plugin folder
- **Added:** Tilde expansion for paths in sound-hook.sh (`~/.claude/sounds/...`)
- **Fixed:** grep fallback (when jq unavailable) now uses home folder
- **Enhanced:** init-config.js dynamically reads sound files (no hardcoded list)
- **Improved:** sound-hook-wrapper.sh combines Darwin/Linux cases (reduces code duplication)

### v1.4.1 (2025-11-03)
- **Fixed:** Windows path normalization in bash wrapper (C:\Users\... → /c/Users/...)
- **Added:** Lock mechanism to prevent duplicate hook execution (PID-based)
- **Enhanced:** Cross-platform compatibility (CYGWIN/MINGW/MSYS/Windows_NT support)
- **Changed:** All hooks use bash wrapper with lock mechanism

### v1.4.0 (2025-11-03)
- **Added:** Home folder sound migration - sounds are now stored in `~/.claude/sounds/hook-sound-notifications/`
- **Added:** Automatic sound file copying on first run (preserves existing files)
- **Added:** Cross-platform hook support with OS detection wrapper (Windows/macOS/Linux)
- **Added:** Unix sound playback script with jq-based JSON parsing and grep fallback
- **Changed:** Default soundsFolder changed from plugin folder to user home folder
- **Fixed:** User sound customizations are now preserved across plugin updates
- **Documentation:** Added detailed customization guide with home folder instructions

### v1.2.0 (2025-10-29)
- **Changed:** Windows sound playback to PowerShell script files (sound-hook.ps1, play-sound.ps1)
- **Changed:** Hooks now directly call PowerShell scripts instead of Node.js wrapper
- **Removed:** sound-hook.js (replaced by PowerShell scripts)
- **Warning:** Added experimental feature warning due to intermittent Claude Code crashes
- **Documentation:** Updated README with critical stability warnings

### v1.1.0 (2025-10-29)
- **Changed:** Windows sound playback to PowerShell script files (sound-hook.ps1, play-sound.ps1)
- **Changed:** Hooks now directly call PowerShell scripts instead of Node.js wrapper
- **Added:** SessionEnd hook to update hooks.json settings for next session
- **Added:** Duplicate execution prevention utility for all scripts
- **Fixed:** Settings changes now properly apply after session restart
- **Warning:** Added experimental feature warning due to intermittent Claude Code crashes

### v1.0.2 (2025-10-29)
- **Fixed:** Configuration file path in sound-hook.js

### v1.0.1 (2025-10-29)
- **Fixed:** Hook selection logic in init-config.js
- **Fixed:** Plugin manifest author field validation

### v1.0.0 (2025-10-29)
- Initial release as independent plugin

## License

Apache License 2.0 - See [LICENSE](../../LICENSE) for details
