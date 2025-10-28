#!/usr/bin/env python3
"""
Cross-platform sound player utility (Python version)
Plays audio files in background without blocking
"""

import sys
import os
import platform
import subprocess


def play_sound_background(file_path: str, volume: float = 0.5):
    """Play sound file in background (non-blocking)

    Args:
        file_path: Path to sound file
        volume: Volume level (0.0 - 1.0), default 0.5
    """

    if not os.path.exists(file_path):
        # Silent failure
        sys.exit(0)

    # Clamp volume to 0.0 - 1.0
    volume = max(0.0, min(1.0, volume))

    system = platform.system()

    try:
        if system == 'Windows':
            # Windows: Use VBScript with Windows Media Player COM object
            # Most reliable method for MP3 playback without dependencies
            import tempfile

            # Convert volume from 0.0-1.0 to 0-100 for WMPlayer
            windows_volume = int(volume * 100)

            # Create temporary VBS script
            vbs_content = f'''
Set player = CreateObject("WMPlayer.OCX")
player.URL = "{file_path.replace(chr(92), chr(92) + chr(92))}"
player.settings.volume = {windows_volume}
player.controls.play
WScript.Sleep 2000
'''.strip()

            # Write VBS to temp file
            with tempfile.NamedTemporaryFile(
                mode='w', suffix='.vbs', delete=False
            ) as f:
                vbs_path = f.name
                f.write(vbs_content)

            # Execute VBS in background
            subprocess.Popen(
                ['wscript', vbs_path],
                creationflags=(
                    subprocess.CREATE_NO_WINDOW |
                    subprocess.DETACHED_PROCESS
                ),
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )

            # Note: VBS file will be cleaned up by OS temp folder cleanup

        elif system == 'Darwin':
            # macOS: Use afplay
            subprocess.Popen(
                ['afplay', file_path],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )

        elif system == 'Linux':
            # Linux: Use aplay or mpg123
            ext = os.path.splitext(file_path)[1].lower()

            # Convert volume to percentage (0-100) for mpg123 --scale
            linux_volume_scale = volume

            if ext == '.wav':
                # aplay doesn't have simple volume control
                cmd = ['aplay', '-q', file_path]
            elif ext == '.mp3':
                # mpg123 --scale option (0.0 - 1.0+ scale factor)
                cmd = ['mpg123', '-q', '--scale',
                       str(linux_volume_scale), file_path]
            else:
                sys.exit(0)

            subprocess.Popen(
                cmd,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )

    except Exception:
        # Silent failure - don't block workflow
        pass

    # Exit immediately (non-blocking)
    sys.exit(0)


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Usage: play-sound.py <sound-file-path> [volume]',
              file=sys.stderr)
        sys.exit(1)

    file_path = sys.argv[1]
    volume = float(sys.argv[2]) if len(sys.argv) >= 3 else 0.5

    play_sound_background(file_path, volume)
