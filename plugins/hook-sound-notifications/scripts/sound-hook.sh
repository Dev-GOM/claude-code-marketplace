#!/bin/bash
# Unix sound hook script for macOS and Linux
# Supports afplay (macOS), paplay (Linux/PulseAudio), ffplay (FFmpeg)
# Matches PowerShell script behavior with config file validation

HOOK_TYPE=""
CONFIG_PATH=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -HookType)
            HOOK_TYPE="$2"
            shift 2
            ;;
        -ConfigPath)
            CONFIG_PATH="$2"
            shift 2
            ;;
        *)
            shift
            ;;
    esac
done

# Exit if no hook type specified
if [ -z "$HOOK_TYPE" ]; then
    exit 0
fi

# Lock mechanism to prevent duplicate execution
LOCK_FILE="/tmp/claude-sound-${HOOK_TYPE}.lock"

# Check if lock exists and process is still running
if [ -f "$LOCK_FILE" ]; then
    LOCK_PID=$(cat "$LOCK_FILE" 2>/dev/null)
    if [ -n "$LOCK_PID" ]; then
        # Check if process is still running
        if kill -0 "$LOCK_PID" 2>/dev/null; then
            # Process still running, exit silently
            exit 0
        fi
    fi
    # Stale lock file, remove it
    rm -f "$LOCK_FILE"
fi

# Create lock file with current PID
echo $$ > "$LOCK_FILE" 2>/dev/null || exit 0

# Clean up lock on exit
cleanup_lock() {
    rm -f "$LOCK_FILE"
}

# Register cleanup handler
trap cleanup_lock EXIT INT TERM

# Determine config path (default: project root .plugin-config)
if [ -z "$CONFIG_PATH" ]; then
    PROJECT_ROOT="$(pwd)"
    CONFIG_PATH="${PROJECT_ROOT}/.plugin-config/hook-sound-notifications.json"
fi

# Exit if config file doesn't exist
if [ ! -f "$CONFIG_PATH" ]; then
    exit 0
fi

# Check if jq is available for JSON parsing
if ! command -v jq >/dev/null 2>&1; then
    # Fallback: simple grep-based check (less reliable)
    # Check if globally enabled
    if ! grep -q '"enabled"[[:space:]]*:[[:space:]]*true' "$CONFIG_PATH"; then
        exit 0
    fi

    # Simple fallback - just check if hook exists and is enabled
    # This is not perfect but works for basic cases
    HOOK_SECTION=$(grep -A 5 "\"$HOOK_TYPE\"" "$CONFIG_PATH" | grep -c '"enabled"[[:space:]]*:[[:space:]]*true')
    if [ "$HOOK_SECTION" -eq 0 ]; then
        exit 0
    fi

    # Determine sounds directory. Since jq is unavailable, we can't read custom
    # paths from config. Use the new default home directory path.
    SOUNDS_DIR="${HOME}/.claude/sounds/hook-sound-notifications"

    # Map hook type to sound file (fallback)
    case "$HOOK_TYPE" in
        SessionStart)
            SOUND_FILE="${SOUNDS_DIR}/session-start.mp3"
            ;;
        SessionEnd)
            SOUND_FILE="${SOUNDS_DIR}/session-end.mp3"
            ;;
        PreToolUse)
            SOUND_FILE="${SOUNDS_DIR}/pre-tool-use.mp3"
            ;;
        PostToolUse)
            SOUND_FILE="${SOUNDS_DIR}/post-tool-use.mp3"
            ;;
        Notification)
            SOUND_FILE="${SOUNDS_DIR}/notification.mp3"
            ;;
        UserPromptSubmit)
            SOUND_FILE="${SOUNDS_DIR}/user-prompt-submit.mp3"
            ;;
        Stop)
            SOUND_FILE="${SOUNDS_DIR}/stop.mp3"
            ;;
        SubagentStop)
            SOUND_FILE="${SOUNDS_DIR}/subagent-stop.mp3"
            ;;
        PreCompact)
            SOUND_FILE="${SOUNDS_DIR}/pre-compact.mp3"
            ;;
        *)
            exit 0
            ;;
    esac

    VOLUME=50  # Default volume for ffplay
else
    # Use jq for proper JSON parsing

    # Check if globally enabled
    GLOBAL_ENABLED=$(jq -r '.soundNotifications.enabled // false' "$CONFIG_PATH")
    if [ "$GLOBAL_ENABLED" != "true" ]; then
        exit 0
    fi

    # Check if specific hook is enabled
    HOOK_ENABLED=$(jq -r ".soundNotifications.hooks.${HOOK_TYPE}.enabled // false" "$CONFIG_PATH")
    if [ "$HOOK_ENABLED" != "true" ]; then
        exit 0
    fi

    # Get sounds folder
    SOUNDS_FOLDER=$(jq -r '.soundNotifications.soundsFolder // empty' "$CONFIG_PATH")

    if [ -z "$SOUNDS_FOLDER" ] || [ "$SOUNDS_FOLDER" = "null" ]; then
        # Fallback to correct default: user home sounds folder
        SOUNDS_FOLDER="${HOME}/.claude/sounds/hook-sound-notifications"
    fi

    # Expand tilde in path if present
    SOUNDS_FOLDER="${SOUNDS_FOLDER/#\~/$HOME}"

    # Get sound file name
    SOUND_FILE_NAME=$(jq -r ".soundNotifications.hooks.${HOOK_TYPE}.soundFile // empty" "$CONFIG_PATH")

    if [ -z "$SOUND_FILE_NAME" ] || [ "$SOUND_FILE_NAME" = "null" ]; then
        # No sound file configured
        exit 0
    fi

    SOUND_FILE="${SOUNDS_FOLDER}/${SOUND_FILE_NAME}"

    # Get volume (hook-specific or global, default 0.5)
    HOOK_VOLUME=$(jq -r ".soundNotifications.hooks.${HOOK_TYPE}.volume // empty" "$CONFIG_PATH")
    GLOBAL_VOLUME=$(jq -r '.soundNotifications.volume // empty' "$CONFIG_PATH")

    if [ -n "$HOOK_VOLUME" ] && [ "$HOOK_VOLUME" != "null" ]; then
        VOLUME_FLOAT="$HOOK_VOLUME"
    elif [ -n "$GLOBAL_VOLUME" ] && [ "$GLOBAL_VOLUME" != "null" ]; then
        VOLUME_FLOAT="$GLOBAL_VOLUME"
    else
        VOLUME_FLOAT="0.5"
    fi

    # Convert to ffplay volume (0-100)
    # Use awk instead of bc (more portable)
    if command -v awk >/dev/null 2>&1; then
        VOLUME=$(awk "BEGIN {printf \"%.0f\", $VOLUME_FLOAT * 100}")
    else
        # Fallback if awk not available
        VOLUME=50
    fi
fi

# Check if sound file exists
if [ ! -f "$SOUND_FILE" ]; then
    exit 0
fi

# Play sound using available player
if command -v afplay >/dev/null 2>&1; then
    # macOS - afplay doesn't support volume parameter easily
    afplay "$SOUND_FILE" &
elif command -v ffplay >/dev/null 2>&1; then
    # FFmpeg (macOS/Linux) - supports volume control
    ffplay -nodisp -autoexit -volume "$VOLUME" "$SOUND_FILE" >/dev/null 2>&1 &
elif command -v paplay >/dev/null 2>&1; then
    # PulseAudio (Linux) - volume support via --volume parameter
    # paplay uses 0-65536 range, convert from 0-100
    PA_VOLUME=$((VOLUME * 655))
    paplay --volume="$PA_VOLUME" "$SOUND_FILE" &
fi

exit 0
