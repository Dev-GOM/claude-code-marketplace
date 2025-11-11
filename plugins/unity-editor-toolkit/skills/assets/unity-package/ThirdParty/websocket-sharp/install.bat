@echo off
REM Unity Editor Toolkit - websocket-sharp Installer (Windows)
REM This script downloads websocket-sharp.dll automatically

echo =========================================
echo Unity Editor Toolkit
echo websocket-sharp Installer
echo =========================================
echo.

REM Check if DLL already exists
if exist websocket-sharp.dll (
    echo [INFO] websocket-sharp.dll already exists!
    echo.
    choice /C YN /M "Do you want to re-download? (Y/N)"
    if errorlevel 2 goto :end
    if errorlevel 1 goto :download
) else (
    goto :download
)

:download
echo [INFO] Downloading websocket-sharp.dll from GitHub...
echo.

REM Download using PowerShell
powershell -Command "& {Invoke-WebRequest -Uri 'https://github.com/sta/websocket-sharp/releases/download/1.0.3-rc11/websocket-sharp.dll' -OutFile 'websocket-sharp.dll'}"

if exist websocket-sharp.dll (
    echo.
    echo [SUCCESS] websocket-sharp.dll downloaded successfully!
    echo.
    echo File location: %CD%\websocket-sharp.dll
    echo.
    echo Next steps:
    echo 1. Return to Unity Editor
    echo 2. Unity will automatically detect the DLL
    echo 3. Check Console for import confirmation
    echo 4. Add UnityEditorServer component to a GameObject
    echo 5. Enter Play Mode to start the server
    echo.
) else (
    echo.
    echo [ERROR] Download failed!
    echo.
    echo Please download manually from:
    echo https://github.com/sta/websocket-sharp/releases
    echo.
    echo And save as: %CD%\websocket-sharp.dll
    echo.
)

:end
echo.
pause
