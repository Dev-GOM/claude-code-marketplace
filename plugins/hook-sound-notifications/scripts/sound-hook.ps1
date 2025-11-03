param(
    [Parameter(Mandatory=$true)]
    [string]$HookType,

    [Parameter(Mandatory=$false)]
    [string]$ConfigPath = ""
)

# Lock mechanism to prevent duplicate execution
$lockFile = Join-Path $env:TEMP "claude-sound-$HookType.lock"

# Check if lock exists and process is still running
if (Test-Path $lockFile) {
    try {
        $lockPid = Get-Content $lockFile -ErrorAction SilentlyContinue
        if ($lockPid) {
            $process = Get-Process -Id $lockPid -ErrorAction SilentlyContinue
            if ($process) {
                # Process still running, exit silently
                exit 0
            }
        }
    } catch {
        # Ignore errors, proceed with lock creation
    }
    # Stale lock file, remove it
    Remove-Item $lockFile -ErrorAction SilentlyContinue
}

# Create lock file and ensure cleanup with try-finally
try {
    # Create lock file with current PID
    $PID | Out-File -FilePath $lockFile -Encoding ASCII -ErrorAction Stop

    # Read configuration
    if ($ConfigPath -eq "") {
        # Default: use current working directory (project root when run from hooks)
        $projectRoot = Get-Location
        $ConfigPath = Join-Path $projectRoot ".plugin-config\hook-sound-notifications.json"
    }

    $configPath = $ConfigPath

    if (-not (Test-Path $configPath)) {
        exit 0
    }

    $config = Get-Content $configPath | ConvertFrom-Json
    $soundConfig = $config.soundNotifications

    # Check if globally enabled
    if (-not $soundConfig.enabled) {
        exit 0
    }

    # Check if specific hook is enabled
    $hookConfig = $soundConfig.hooks.$HookType
    if (-not $hookConfig -or -not $hookConfig.enabled) {
        exit 0
    }

    # Get sound file path
    $soundsFolder = $soundConfig.soundsFolder
    if (-not $soundsFolder) {
        # Match Unix fallback: user home folder
        $soundsFolder = Join-Path $env:USERPROFILE ".claude\sounds\hook-sound-notifications"
    }

    # Expand tilde if present (for cross-platform config files)
    if ($soundsFolder -match '^~') {
        $soundsFolder = $soundsFolder -replace '^~', $env:USERPROFILE
        # Normalize path separators
        $soundsFolder = $soundsFolder -replace '/', '\'
    }

    $soundFile = Join-Path $soundsFolder $hookConfig.soundFile

    if (-not (Test-Path $soundFile)) {
        exit 0
    }

    # Get volume
    $volume = $hookConfig.volume
    if ($null -eq $volume) {
        $volume = $soundConfig.volume
    }
    if ($null -eq $volume) {
        $volume = 0.5
    }

    # Clamp volume to 0.0-1.0
    $volume = [Math]::Max(0.0, [Math]::Min(1.0, $volume))

    # Call play-sound.ps1
    $playSoundScript = Join-Path $PSScriptRoot "play-sound.ps1"
    & $playSoundScript -SoundPath $soundFile -Volume $volume

} catch {
    # Silent failure - lock will be cleaned up in finally block
} finally {
    # Always cleanup lock file (runs on normal exit, early return, or exception)
    if (Test-Path $lockFile) {
        Remove-Item $lockFile -ErrorAction SilentlyContinue
    }
}

exit 0
