# Sound Notifications Hook Plugin

Audio notifications for Claude Code hook events with customizable sounds and volume control.

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

- PostToolUse hook may cause Claude Code to hang when enabled

## Changelog

### v1.1.0 (2025-10-29)
- **Changed:** Windows sound playback from VBScript to PowerShell MediaPlayer for better stability
- **Added:** SessionEnd hook to update hooks.json settings for next session
- **Added:** Duplicate execution prevention utility for all scripts
- **Fixed:** Settings changes now properly apply after session restart

### v1.0.2 (2025-10-29)
- **Fixed:** Configuration file path in sound-hook.js

### v1.0.1 (2025-10-29)
- **Fixed:** Hook selection logic in init-config.js
- **Fixed:** Plugin manifest author field validation

### v1.0.0 (2025-10-29)
- Initial release as independent plugin

## License

MIT
