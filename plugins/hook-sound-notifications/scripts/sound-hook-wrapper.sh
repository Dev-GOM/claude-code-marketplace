#!/bin/bash
# Cross-platform sound hook wrapper
# Detects OS and routes to appropriate sound player

PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT}"
if [ -z "$PLUGIN_ROOT" ]; then
    PLUGIN_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
fi

OS_TYPE="$(uname -s)"

case "$OS_TYPE" in
    Darwin*)
        # macOS
        bash "${PLUGIN_ROOT}/scripts/sound-hook.sh" "$@"
        ;;
    Linux*)
        # Linux
        bash "${PLUGIN_ROOT}/scripts/sound-hook.sh" "$@"
        ;;
    CYGWIN*|MINGW*|MSYS*|Windows_NT*)
        # Windows
        powershell.exe -NoProfile -ExecutionPolicy Bypass \
          -File "${PLUGIN_ROOT}/scripts/sound-hook.ps1" "$@"
        ;;
    *)
        # Fallback to Unix script if available
        if [ -f "${PLUGIN_ROOT}/scripts/sound-hook.sh" ]; then
            bash "${PLUGIN_ROOT}/scripts/sound-hook.sh" "$@"
        fi
        ;;
esac

exit 0
