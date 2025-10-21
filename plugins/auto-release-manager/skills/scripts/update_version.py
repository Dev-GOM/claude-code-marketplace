#!/usr/bin/env python3
"""
Universal version updater supporting multiple file formats.
Supports: JSON, TOML, YAML, plain text, Unity asset files, etc.
"""

import json
import re
import sys
from pathlib import Path
from typing import List


class VersionUpdater:
    def __init__(self):
        self.updated_files: List[str] = []

    def update(self, file_path: str, new_version: str) -> bool:
        """Update version in file based on its format."""
        path = Path(file_path)

        if not path.exists():
            print(f"Error: File not found: {file_path}", file=sys.stderr)
            return False

        # Detect file type and update accordingly
        if path.suffix == '.json':
            return self._update_json(path, new_version)
        elif path.suffix == '.toml':
            return self._update_toml(path, new_version)
        elif path.suffix in ['.yaml', '.yml']:
            return self._update_yaml(path, new_version)
        elif path.name == 'ProjectSettings.asset':
            return self._update_unity_asset(path, new_version)
        elif path.suffix == '.uproject':
            return self._update_unreal_uproject(path, new_version)
        elif path.name in ['VERSION', 'version.txt']:
            return self._update_plain_text(path, new_version)
        else:
            print(f"Warning: Unknown file type: {file_path}", file=sys.stderr)
            return False

    def _update_json(self, path: Path, new_version: str) -> bool:
        """Update version in JSON file."""
        try:
            data = json.loads(path.read_text(encoding='utf-8'))

            # Update version field
            if 'version' in data:
                old_version = data['version']
                data['version'] = new_version
                print(f"Updated {path.name}: {old_version} → {new_version}")
            else:
                data['version'] = new_version
                print(f"Added version to {path.name}: {new_version}")

            # Write back with proper formatting
            path.write_text(
                json.dumps(
                    data,
                    indent=2,
                    ensure_ascii=False) +
                '\n',
                encoding='utf-8')
            self.updated_files.append(str(path))
            return True

        except Exception as e:
            print(f"Error updating {path}: {e}", file=sys.stderr)
            return False

    def _update_toml(self, path: Path, new_version: str) -> bool:
        """Update version in TOML file."""
        try:
            content = path.read_text(encoding='utf-8')

            # Try to find and replace version
            patterns = [
                (r'(version\s*=\s*["\'])([^"\']+)(["\'])',
                 r'\g<1>' + new_version + r'\g<3>'),
                (r'(\[project\].*?version\s*=\s*["\'])([^"\']+)(["\'])',
                 r'\g<1>' + new_version + r'\g<3>'),
            ]

            updated = False
            for pattern, replacement in patterns:
                if re.search(pattern, content, re.DOTALL):
                    content = re.sub(
                        pattern, replacement, content, flags=re.DOTALL)
                    updated = True
                    break

            if updated:
                path.write_text(content, encoding='utf-8')
                self.updated_files.append(str(path))
                print(f"Updated {path.name} → {new_version}")
                return True
            else:
                print(
                    f"Warning: Could not find version in {
                        path.name}", file=sys.stderr)
                return False

        except Exception as e:
            print(f"Error updating {path}: {e}", file=sys.stderr)
            return False

    def _update_yaml(self, path: Path, new_version: str) -> bool:
        """Update version in YAML file."""
        try:
            content = path.read_text(encoding='utf-8')

            # Replace version field
            pattern = r'(version:\s*["\']?)([^"\'\n]+)(["\']?)'
            replacement = r'\g<1>' + new_version + r'\g<3>'

            if re.search(pattern, content):
                content = re.sub(pattern, replacement, content)
                path.write_text(content, encoding='utf-8')
                self.updated_files.append(str(path))
                print(f"Updated {path.name} → {new_version}")
                return True
            else:
                print(
                    f"Warning: Could not find version in {
                        path.name}", file=sys.stderr)
                return False

        except Exception as e:
            print(f"Error updating {path}: {e}", file=sys.stderr)
            return False

    def _update_unity_asset(self, path: Path, new_version: str) -> bool:
        """Update bundleVersion in Unity ProjectSettings.asset."""
        try:
            content = path.read_text(encoding='utf-8')

            # Replace bundleVersion
            pattern = r'(bundleVersion:\s*)(.+)'
            replacement = r'\g<1>' + new_version

            if re.search(pattern, content):
                old_content = content
                content = re.sub(pattern, replacement, content)

                if content != old_content:
                    path.write_text(content, encoding='utf-8')
                    self.updated_files.append(str(path))
                    print(
                        f"Updated Unity ProjectSettings.asset → {new_version}")
                    return True

            print(
                f"Warning: Could not find bundleVersion in {
                    path.name}", file=sys.stderr)
            return False

        except Exception as e:
            print(f"Error updating {path}: {e}", file=sys.stderr)
            return False

    def _update_unreal_uproject(self, path: Path, new_version: str) -> bool:
        """Update version in Unreal .uproject file."""
        try:
            data = json.loads(path.read_text(encoding='utf-8'))

            # Unreal uses EngineAssociation or custom Version field
            if 'Version' in data:
                old_version = data['Version']
                data['Version'] = new_version
                print(f"Updated {path.name}: {old_version} → {new_version}")
            else:
                data['Version'] = new_version
                print(f"Added Version to {path.name}: {new_version}")

            path.write_text(
                json.dumps(
                    data,
                    indent=4,
                    ensure_ascii=False) +
                '\n',
                encoding='utf-8')
            self.updated_files.append(str(path))
            return True

        except Exception as e:
            print(f"Error updating {path}: {e}", file=sys.stderr)
            return False

    def _update_plain_text(self, path: Path, new_version: str) -> bool:
        """Update plain text version file."""
        try:
            path.write_text(new_version + '\n', encoding='utf-8')
            self.updated_files.append(str(path))
            print(f"Updated {path.name} → {new_version}")
            return True

        except Exception as e:
            print(f"Error updating {path}: {e}", file=sys.stderr)
            return False


def main():
    if len(sys.argv) < 3:
        print(
            "Usage: python update_version.py <file_path> <new_version>",
            file=sys.stderr)
        print(
            "       python update_version.py "
            "<file1> <file2> ... <new_version>",
            file=sys.stderr)
        sys.exit(1)

    files = sys.argv[1:-1]
    new_version = sys.argv[-1]

    updater = VersionUpdater()
    success_count = 0

    for file_path in files:
        if updater.update(file_path, new_version):
            success_count += 1

    print(f"\nUpdated {success_count}/{len(files)} files successfully")

    if success_count < len(files):
        sys.exit(1)


if __name__ == "__main__":
    main()
