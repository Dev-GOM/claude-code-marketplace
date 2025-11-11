#!/bin/bash
# Unity Editor Toolkit - websocket-sharp Installer (macOS/Linux)
# This script downloads websocket-sharp.dll automatically

echo "========================================="
echo "Unity Editor Toolkit"
echo "websocket-sharp Installer"
echo "========================================="
echo ""

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
DLL_PATH="$SCRIPT_DIR/websocket-sharp.dll"

# Check if DLL already exists
if [ -f "$DLL_PATH" ]; then
    echo "[INFO] websocket-sharp.dll already exists!"
    echo ""
    read -p "Do you want to re-download? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
fi

echo "[INFO] Downloading websocket-sharp.dll from GitHub..."
echo ""

# Download using curl
if command -v curl &> /dev/null; then
    curl -L -o "$DLL_PATH" "https://github.com/sta/websocket-sharp/releases/download/1.0.3-rc11/websocket-sharp.dll"
elif command -v wget &> /dev/null; then
    wget -O "$DLL_PATH" "https://github.com/sta/websocket-sharp/releases/download/1.0.3-rc11/websocket-sharp.dll"
else
    echo "[ERROR] Neither curl nor wget is available!"
    echo ""
    echo "Please install curl or wget, or download manually from:"
    echo "https://github.com/sta/websocket-sharp/releases"
    echo ""
    exit 1
fi

# Verify download
if [ -f "$DLL_PATH" ]; then
    echo ""
    echo "[SUCCESS] websocket-sharp.dll downloaded successfully!"
    echo ""
    echo "File location: $DLL_PATH"
    echo ""
    echo "Next steps:"
    echo "1. Return to Unity Editor"
    echo "2. Unity will automatically detect the DLL"
    echo "3. Check Console for import confirmation"
    echo "4. Add UnityEditorServer component to a GameObject"
    echo "5. Enter Play Mode to start the server"
    echo ""
else
    echo ""
    echo "[ERROR] Download failed!"
    echo ""
    echo "Please download manually from:"
    echo "https://github.com/sta/websocket-sharp/releases"
    echo ""
    echo "And save as: $DLL_PATH"
    echo ""
    exit 1
fi
