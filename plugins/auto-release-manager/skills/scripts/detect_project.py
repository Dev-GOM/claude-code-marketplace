#!/usr/bin/env python3
"""
Detect project type and version files automatically.
Supports: Node.js, Python, Rust, Go, Unity, Unreal Engine,
Claude Code Plugins, etc.
"""

import json
import sys
import tomllib  # Python 3.11+ required
from pathlib import Path
from typing import Any, Dict, Optional

# Check Python version
if sys.version_info < (3, 11):
    print(
        "Error: Python 3.11+ is required for this script",
        file=sys.stderr
    )
    print(
        "Current version: "
        f"{sys.version_info.major}.{sys.version_info.minor}",
        file=sys.stderr
    )
    sys.exit(1)


class ProjectDetector:
    def __init__(self, project_root: str = "."):
        self.root = Path(project_root).resolve()

    def detect(self) -> Dict[str, Any]:
        """Detect project type and return version file paths."""
        result: Dict[str, Any] = {
            "project_type": None,
            "version_files": [],
            "detected_version": None
        }

        # Check in priority order
        detectors = [
            self._detect_unity,
            self._detect_unreal,
            self._detect_nodejs,
            self._detect_python,
            self._detect_rust,
            self._detect_go,
            self._detect_claude_plugin,
            self._detect_generic
        ]

        for detector in detectors:
            detection = detector()
            if detection:
                result.update(detection)
                break

        return result

    def _detect_unity(self) -> Optional[Dict[str, Any]]:
        """Detect Unity project."""
        project_settings = (
            self.root / "ProjectSettings" / "ProjectSettings.asset"
        )
        version_json = self.root / "version.json"

        if project_settings.exists():
            files = [str(project_settings)]
            if version_json.exists():
                files.append(str(version_json))

            # Try to read version from version.json first
            version = None
            if version_json.exists():
                try:
                    data = json.loads(
                        version_json.read_text(encoding='utf-8')
                    )
                    version = data.get('version')
                except Exception:
                    pass

            # Fallback to ProjectSettings.asset
            if not version:
                try:
                    content = project_settings.read_text(
                        encoding='utf-8'
                    )
                    for line in content.split('\n'):
                        if 'bundleVersion:' in line:
                            version = line.split(':', 1)[1].strip()
                            break
                except Exception:
                    pass

            return {
                "project_type": "unity",
                "version_files": files,
                "detected_version": version
            }

        return None

    def _detect_unreal(self) -> Optional[Dict[str, Any]]:
        """Detect Unreal Engine project."""
        uproject_files = list(self.root.glob("*.uproject"))

        if uproject_files:
            uproject = uproject_files[0]
            version = None

            try:
                data = json.loads(uproject.read_text(encoding='utf-8'))
                version = data.get('Version') or data.get('EngineAssociation')
            except (json.JSONDecodeError, IOError):
                pass

            return {
                "project_type": "unreal",
                "version_files": [str(uproject)],
                "detected_version": version
            }

        return None

    def _detect_nodejs(self) -> Optional[Dict[str, Any]]:
        """Detect Node.js project."""
        package_json = self.root / "package.json"

        if package_json.exists():
            version = None

            try:
                data = json.loads(package_json.read_text(encoding='utf-8'))
                version = data.get('version')
            except BaseException:
                pass

            return {
                "project_type": "nodejs",
                "version_files": [str(package_json)],
                "detected_version": version
            }

        return None

    def _detect_python(self) -> Optional[Dict[str, Any]]:
        """Detect Python project."""
        pyproject = self.root / "pyproject.toml"
        setup_py = self.root / "setup.py"

        if pyproject.exists():
            version = None

            if tomllib:
                try:
                    data = tomllib.loads(
                        pyproject.read_text(encoding='utf-8')
                    )
                    version = (
                        data.get('project', {}).get('version') or
                        data.get('tool', {}).get('poetry', {}).get('version')
                    )
                except Exception:
                    pass

            return {
                "project_type": "python",
                "version_files": [str(pyproject)],
                "detected_version": version
            }

        elif setup_py.exists():
            return {
                "project_type": "python",
                "version_files": [str(setup_py)],
                "detected_version": None  # Requires parsing Python
            }

        return None

    def _detect_rust(self) -> Optional[Dict[str, Any]]:
        """Detect Rust project."""
        cargo_toml = self.root / "Cargo.toml"

        if cargo_toml.exists():
            version = None

            if tomllib:
                try:
                    data = tomllib.loads(
                        cargo_toml.read_text(
                            encoding='utf-8'))
                    version = data.get('package', {}).get('version')
                except BaseException:
                    pass

            return {
                "project_type": "rust",
                "version_files": [str(cargo_toml)],
                "detected_version": version
            }

        return None

    def _detect_go(self) -> Optional[Dict[str, Any]]:
        """Detect Go project."""
        go_mod = self.root / "go.mod"

        if go_mod.exists():
            # Go doesn't have built-in versioning in go.mod
            # Check for common version files
            version_file = self.root / "VERSION"

            if version_file.exists():
                version = version_file.read_text().strip()
                return {
                    "project_type": "go",
                    "version_files": [str(version_file)],
                    "detected_version": version
                }

            return {
                "project_type": "go",
                "version_files": [],
                "detected_version": None
            }

        return None

    def _detect_claude_plugin(self) -> Optional[Dict[str, Any]]:
        """Detect Claude Code plugin."""
        plugin_json = self.root / ".claude-plugin" / "plugin.json"

        if plugin_json.exists():
            version = None

            try:
                data = json.loads(plugin_json.read_text(encoding='utf-8'))
                version = data.get('version')
            except BaseException:
                pass

            return {
                "project_type": "claude-plugin",
                "version_files": [str(plugin_json)],
                "detected_version": version
            }

        return None

    def _detect_generic(self) -> Optional[Dict[str, Any]]:
        """Detect generic project with VERSION file."""
        version_file = self.root / "VERSION"

        if version_file.exists():
            version = version_file.read_text().strip()
            return {
                "project_type": "generic",
                "version_files": [str(version_file)],
                "detected_version": version
            }

        return {
            "project_type": "unknown",
            "version_files": [],
            "detected_version": None
        }


def main():
    project_root = sys.argv[1] if len(sys.argv) > 1 else "."

    detector = ProjectDetector(project_root)
    result = detector.detect()

    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
