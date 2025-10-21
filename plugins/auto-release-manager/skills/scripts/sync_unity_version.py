#!/usr/bin/env python3
"""
Sync Unity version from version.json to ProjectSettings.asset.
This ensures version.json is the single source of truth.
"""

import json
import re
import sys
from pathlib import Path


def sync_unity_version(project_root: str = ".") -> bool:
    """Sync version from version.json to ProjectSettings.asset."""
    root = Path(project_root).resolve()

    version_json_path = root / "version.json"
    project_settings_path = root / "ProjectSettings" / "ProjectSettings.asset"

    # Check if files exist
    if not version_json_path.exists():
        print(
            f"Error: version.json not found at {version_json_path}",
            file=sys.stderr)
        return False

    if not project_settings_path.exists():
        print(
            f"Error: ProjectSettings.asset not found at "
            f"{project_settings_path}",
            file=sys.stderr)
        return False

    try:
        # Read version from version.json
        version_data = json.loads(
            version_json_path.read_text(
                encoding='utf-8'))
        version = version_data.get('version')

        if not version:
            print(
                "Error: 'version' field not found in version.json",
                file=sys.stderr)
            return False

        # Read ProjectSettings.asset
        content = project_settings_path.read_text(encoding='utf-8')

        # Find and replace bundleVersion
        pattern = r'(bundleVersion:\s*)(.+)'
        replacement = r'\g<1>' + version

        if not re.search(pattern, content):
            print(
                "Error: bundleVersion not found in ProjectSettings.asset",
                file=sys.stderr)
            return False

        # Update content
        new_content = re.sub(pattern, replacement, content)

        if new_content == content:
            print(f"✓ Version already synced: {version}")
            return True

        # Write back
        project_settings_path.write_text(new_content, encoding='utf-8')
        print(f"✓ Synced Unity version: {version}")
        print("  version.json → ProjectSettings.asset")

        return True

    except Exception as e:
        print(f"Error syncing Unity version: {e}", file=sys.stderr)
        return False


def main():
    project_root = sys.argv[1] if len(sys.argv) > 1 else "."

    if not sync_unity_version(project_root):
        sys.exit(1)


if __name__ == "__main__":
    main()
