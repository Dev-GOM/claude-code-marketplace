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
  - Windows: PowerShell MediaPlayer (volume control supported)
  - macOS: afplay (no volume control)
  - Linux: mpg123 (MP3, volume control) / aplay (WAV)

## Installation

This plugin is included in the Dev GOM Plugins marketplace. Restart Claude Code after installation.

## Configuration

Settings are stored in `.plugin-config/hook-sound-notifications.json`:

```json
{
  "soundNotifications": {
    "soundsFolder": "${CLAUDE_PLUGIN_ROOT}/sounds",
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
- `soundsFolder`: Sound files folder path (auto-detected from plugin location)
  - Automatically set to `${CLAUDE_PLUGIN_ROOT}/sounds`
  - Can be customized to use absolute or relative path
  - Default sounds are included with plugin
- `hooks.[hookType].enabled`: Enable/disable specific hook
- `hooks.[hookType].soundFile`: Sound file name (relative to soundsFolder)
- `hooks.[hookType].volume`: Override global volume

### Enable/Disable Hooks

Edit `.plugin-config/hook-sound-notifications.json` and restart Claude Code.

**Note:** PostToolUse is disabled by default as it may cause instability when used frequently.

## Customization

### Custom Sound Files

Replace sound files in the plugin's `sounds` folder, or update `soundFile` paths in the configuration.

**Supported formats:** MP3, WAV

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

MIT
