param(
    [Parameter(Mandatory=$true)]
    [string]$HookType,

    [Parameter(Mandatory=$false)]
    [string]$ConfigPath = ""
)

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
    $soundsFolder = Join-Path $PSScriptRoot "..\sounds"
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
