"""
Security utilities for Blender Toolkit addon
"""

import os
from pathlib import Path
from typing import Optional


def validate_file_path(file_path: str, allowed_root: Optional[str] = None) -> str:
    """
    Validate file path to prevent path traversal attacks.

    Args:
        file_path: Path to validate
        allowed_root: Optional allowed root directory. If None, only checks for dangerous patterns.

    Returns:
        Validated absolute path

    Raises:
        ValueError: If path is invalid or outside allowed directory
    """
    if not file_path:
        raise ValueError("File path cannot be empty")

    # Resolve to absolute path
    try:
        abs_path = os.path.abspath(os.path.expanduser(file_path))
    except Exception as e:
        raise ValueError(f"Invalid file path: {e}")

    # Check for null bytes (security risk)
    if '\0' in file_path:
        raise ValueError("File path contains null bytes")

    # If allowed_root is specified, ensure path is within it
    if allowed_root:
        allowed_abs = os.path.abspath(os.path.expanduser(allowed_root))

        # Resolve symlinks to prevent bypass
        try:
            real_path = os.path.realpath(abs_path)
            real_root = os.path.realpath(allowed_abs)
        except Exception:
            # If realpath fails, use absolute paths
            real_path = abs_path
            real_root = allowed_abs

        # Check if path is within allowed root
        try:
            Path(real_path).relative_to(real_root)
        except ValueError:
            raise ValueError(f"Path outside allowed directory: {file_path}")

    return abs_path


def validate_port(port: int) -> int:
    """
    Validate WebSocket port number.

    Args:
        port: Port number to validate

    Returns:
        Validated port number

    Raises:
        ValueError: If port is invalid
    """
    if not isinstance(port, int):
        raise ValueError("Port must be an integer")

    if port < 1024 or port > 65535:
        raise ValueError("Port must be between 1024 and 65535")

    return port


# Whitelist for safe object attributes
ALLOWED_OBJECT_ATTRIBUTES = {
    'location',
    'rotation_euler',
    'rotation_quaternion',
    'rotation_axis_angle',
    'scale',
    'name',
    'hide',
    'hide_viewport',
    'hide_render',
    'hide_select',
}

# Whitelist for safe armature bone attributes
ALLOWED_BONE_ATTRIBUTES = {
    'name',
    'head',
    'tail',
    'roll',
    'use_connect',
    'use_deform',
    'use_inherit_rotation',
    'use_inherit_scale',
    'use_local_location',
}


def validate_attribute_name(attr_name: str, allowed_attributes: set) -> str:
    """
    Validate attribute name against whitelist.

    Args:
        attr_name: Attribute name to validate
        allowed_attributes: Set of allowed attribute names

    Returns:
        Validated attribute name

    Raises:
        ValueError: If attribute is not allowed
    """
    if not attr_name:
        raise ValueError("Attribute name cannot be empty")

    if attr_name not in allowed_attributes:
        raise ValueError(f"Attribute '{attr_name}' is not allowed")

    return attr_name
