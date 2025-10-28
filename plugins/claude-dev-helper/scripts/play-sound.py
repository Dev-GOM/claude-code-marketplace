#!/usr/bin/env python3
"""
Cross-platform sound player utility (Python version)
Plays audio files in background without blocking
"""

import sys
import os
import platform
import subprocess


def play_sound_background(file_path: str):
    """Play sound file in background (non-blocking)"""

    if not os.path.exists(file_path):
        # Silent failure
        sys.exit(0)

    system = platform.system()

    try:
        if system == 'Windows':
            # Windows: Use VBScript with Windows Media Player COM object
            # Most reliable method for MP3 playback without dependencies
            import tempfile

            # Create temporary VBS script
            vbs_content = f'''
Set player = CreateObject("WMPlayer.OCX")
player.URL = "{file_path.replace(chr(92), chr(92) + chr(92))}"
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

            if ext == '.wav':
                cmd = ['aplay', '-q', file_path]
            elif ext == '.mp3':
                cmd = ['mpg123', '-q', file_path]
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
        print('Usage: play-sound.py <sound-file-path>', file=sys.stderr)
        sys.exit(1)

    play_sound_background(sys.argv[1])
