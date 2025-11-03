#!/bin/bash
# Cross-platform sound hook wrapper with Windows path normalization
# Detects OS and routes to appropriate sound player

PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT}"
if [ -z "$PLUGIN_ROOT" ]; then
    PLUGIN_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
else
    # Windows 경로를 Git Bash 경로로 변환
    # C:\Users\... -> /c/Users/...
    case "$(uname -s)" in
        MINGW*|MSYS*|CYGWIN*)
            # Windows 환경에서 경로 정규화
            # 백슬래시를 슬래시로 변환
            PLUGIN_ROOT=$(echo "$PLUGIN_ROOT" | sed 's|\\|/|g')
            # 드라이브 레터 변환 (C: -> /c)
            PLUGIN_ROOT=$(echo "$PLUGIN_ROOT" | sed 's|^\([A-Za-z]\):|/\L\1|')
            ;;
    esac
fi

OS_TYPE="$(uname -s)"

case "$OS_TYPE" in
    Darwin*|Linux*)
        # macOS or Linux
        bash "${PLUGIN_ROOT}/scripts/sound-hook.sh" "$@"
        ;;
    CYGWIN*|MINGW*|MSYS*|Windows_NT*)
        # Windows - use PowerShell
        # PowerShell은 Windows 경로 필요하므로 다시 변환
        WIN_PLUGIN_ROOT=$(echo "$PLUGIN_ROOT" | sed 's|^/\([a-z]\)|\U\1:|' | sed 's|/|\\|g')
        powershell.exe -NoProfile -ExecutionPolicy Bypass \
          -File "${WIN_PLUGIN_ROOT}\\scripts\\sound-hook.ps1" "$@"
        ;;
    *)
        # Fallback to Unix script if available
        if [ -f "${PLUGIN_ROOT}/scripts/sound-hook.sh" ]; then
            bash "${PLUGIN_ROOT}/scripts/sound-hook.sh" "$@"
        fi
        ;;
esac

exit 0
