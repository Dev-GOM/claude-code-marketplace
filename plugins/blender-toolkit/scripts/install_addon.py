"""
Blender Addon Auto-Installation Script

This script runs in Blender's background mode to automatically install
and enable the Blender Toolkit WebSocket Server addon.

Usage:
    blender --background --python install_addon.py -- /path/to/addon/__init__.py
"""

import sys
import os
import zipfile
import bpy


def get_addon_module_name(addon_path):
    """
    Derive the module name Blender will register the addon under.

    For a zip install, Blender registers the module under the zip's
    top-level folder name. For a single-file install, it's the filename
    (without extension) Blender copies the file as. Deriving this from the
    actual artifact avoids hardcoding a name that silently drifts out of
    sync with the addon package (its bl_info["name"] is a display string,
    not the importable module name).

    Args:
        addon_path (str): Path to the addon .zip or a single .py file

    Returns:
        str: The module name to pass to bpy.ops.preferences.addon_enable()
    """
    if addon_path.lower().endswith(".zip"):
        with zipfile.ZipFile(addon_path) as zf:
            names = zf.namelist()
            if not names:
                raise ValueError(f"Addon zip is empty: {addon_path}")
            return names[0].split("/")[0]

    return os.path.splitext(os.path.basename(addon_path))[0]


def check_addon_installed(addon_module):
    """
    Check if addon is already installed and enabled

    Args:
        addon_module (str): Addon module name

    Returns:
        bool: True if addon is installed and enabled
    """
    try:
        return addon_module in bpy.context.preferences.addons.keys()
    except AttributeError:
        return False


def install_and_enable_addon(addon_path, addon_module):
    """
    Install and enable Blender addon

    Args:
        addon_path (str): Full path to addon __init__.py file
        addon_module (str): Addon module name for enabling

    Returns:
        tuple: (success: bool, message: str)
    """
    try:
        # Check Blender version (must be 4.0+)
        if bpy.app.version < (4, 0, 0):
            version_str = f"{bpy.app.version[0]}.{bpy.app.version[1]}.{bpy.app.version[2]}"
            return False, f"ERROR: Blender 4.0+ required, found {version_str}"

        # Verify addon file exists
        if not os.path.exists(addon_path):
            return False, f"ERROR: Addon file not found: {addon_path}"

        # Check if already installed
        if check_addon_installed(addon_module):
            return True, "ALREADY_INSTALLED"

        # Install addon
        bpy.ops.preferences.addon_install(
            overwrite=True,
            filepath=addon_path
        )

        # Enable addon
        bpy.ops.preferences.addon_enable(module=addon_module)

        # Save preferences to persist addon state
        bpy.ops.wm.save_userpref()

        # Verify installation
        if check_addon_installed(addon_module):
            return True, "INSTALLED"

        return False, "ERROR: Addon enabled but not found in preferences"

    except (RuntimeError, OSError, IOError) as e:
        return False, f"ERROR: {str(e)}"
    except AttributeError as e:
        return False, f"ERROR: Blender API error: {str(e)}"


def main():
    """
    Main entry point for addon installation
    """
    # Get addon path from command line arguments
    # Arguments after '--' are passed to the script
    argv = sys.argv
    argv = argv[argv.index("--") + 1:] if "--" in argv else []

    if not argv:
        print("ERROR: No addon path provided")
        print("Usage: blender --background --python install_addon.py -- /path/to/addon.zip")
        sys.exit(1)

    addon_path = argv[0]

    try:
        addon_module = get_addon_module_name(addon_path)
    except (ValueError, OSError) as e:
        print(f"ERROR: Could not determine addon module name: {e}")
        sys.exit(1)

    # Install and enable addon
    success, message = install_and_enable_addon(addon_path, addon_module)

    # Print result (will be captured by Node.js)
    print(message)

    # Exit with appropriate code
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
