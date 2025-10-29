param(
    [Parameter(Mandatory=$true)]
    [string]$SoundPath,

    [Parameter(Mandatory=$true)]
    [double]$Volume
)

Add-Type -AssemblyName presentationCore
$mediaPlayer = New-Object System.Windows.Media.MediaPlayer
$mediaPlayer.Open([System.Uri]::new($SoundPath))
$mediaPlayer.Volume = $Volume

# Wait for media to load
Start-Sleep -Milliseconds 500

# Get duration
while ($mediaPlayer.NaturalDuration.HasTimeSpan -eq $false) {
    Start-Sleep -Milliseconds 50
}
$duration = $mediaPlayer.NaturalDuration.TimeSpan.TotalMilliseconds

# Play
$mediaPlayer.Play()

# Wait for playback to complete
Start-Sleep -Milliseconds ($duration + 500)

# Cleanup
$mediaPlayer.Stop()
$mediaPlayer.Close()
