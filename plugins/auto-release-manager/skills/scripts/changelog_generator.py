#!/usr/bin/env python3
"""
CHANGELOG generator from git commit history.
Supports Conventional Commits format.
"""

import re
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional


class ChangelogGenerator:
    def __init__(self, repo_path: str = "."):
        self.repo_path = Path(repo_path).resolve()

        # Conventional Commits types
        self.commit_types = {
            'feat': 'Added',
            'fix': 'Fixed',
            'docs': 'Documentation',
            'style': 'Style',
            'refactor': 'Changed',
            'perf': 'Performance',
            'test': 'Tests',
            'chore': 'Chore',
            'build': 'Build',
            'ci': 'CI/CD',
        }

    def get_commits_since_tag(
            self,
            since_tag: Optional[str] = None) -> List[str]:
        """Get commit messages since last tag."""
        try:
            if since_tag:
                cmd = [
                    'git',
                    'log',
                    f'{since_tag}..HEAD',
                    '--pretty=format:%s']
            else:
                # Get all commits if no tag specified
                cmd = ['git', 'log', '--pretty=format:%s']

            result = subprocess.run(
                cmd,
                cwd=self.repo_path,
                capture_output=True,
                text=True,
                check=True,
                encoding='utf-8'
            )

            return (
                result.stdout.strip().split('\n')
                if result.stdout.strip() else []
            )

        except subprocess.CalledProcessError as e:
            print(f"Error getting git commits: {e.stderr}", file=sys.stderr)
            return []

    def parse_commit(self, commit_message: str) -> Dict[str, str]:
        """Parse conventional commit message."""
        # Pattern: type(scope): description
        pattern = r'^(\w+)(?:\(([^)]+)\))?: (.+)$'
        match = re.match(pattern, commit_message)

        if match:
            commit_type, scope, description = match.groups()
            return {
                'type': commit_type,
                'scope': scope or '',
                'description': description,
                'raw': commit_message
            }
        else:
            return {
                'type': 'other',
                'scope': '',
                'description': commit_message,
                'raw': commit_message
            }

    def group_commits(self, commits: List[str]) -> Dict[str, List[str]]:
        """Group commits by type."""
        grouped: Dict[str, List[str]] = {}

        for commit_msg in commits:
            parsed = self.parse_commit(commit_msg)
            commit_type = parsed['type']
            description = parsed['description']

            category = self.commit_types.get(commit_type, 'Other')

            if category not in grouped:
                grouped[category] = []

            grouped[category].append(description)

        return grouped

    def generate_changelog_entry(
            self,
            version: str,
            since_tag: Optional[str] = None) -> str:
        """Generate changelog entry for new version."""
        commits = self.get_commits_since_tag(since_tag)

        if not commits:
            print("No commits found", file=sys.stderr)
            return ""

        grouped = self.group_commits(commits)

        # Build changelog entry
        date = datetime.now().strftime('%Y-%m-%d')
        lines = [
            f"## [{version}] - {date}",
            ""
        ]

        # Add sections in order
        section_order = [
            'Added', 'Fixed', 'Changed', 'Deprecated', 'Removed',
            'Security', 'Performance', 'Documentation', 'Other'
        ]

        for section in section_order:
            if section in grouped:
                lines.append(f"### {section}")
                for item in grouped[section]:
                    lines.append(f"- {item}")
                lines.append("")

        return '\n'.join(lines)

    def update_changelog_file(
        self,
        version: str,
        since_tag: Optional[str] = None,
        changelog_path: str = "CHANGELOG.md"
    ) -> bool:
        """Update CHANGELOG.md file with new entry."""
        entry = self.generate_changelog_entry(version, since_tag)

        if not entry:
            return False

        changelog_file = self.repo_path / changelog_path

        if changelog_file.exists():
            # Insert at top after header
            content = changelog_file.read_text(encoding='utf-8')

            # Find position to insert (after # Changelog header)
            lines = content.split('\n')
            insert_pos = 0

            for i, line in enumerate(lines):
                if line.startswith('# '):
                    insert_pos = i + 1
                    # Skip empty lines after header
                    while (insert_pos < len(lines) and
                           not lines[insert_pos].strip()):
                        insert_pos += 1
                    break

            lines.insert(insert_pos, entry)
            new_content = '\n'.join(lines)

        else:
            # Create new CHANGELOG
            new_content = f"# Changelog\n\n{entry}"

        changelog_file.write_text(new_content, encoding='utf-8')
        print(f"✓ Updated {changelog_path}")

        return True


def main():
    if len(sys.argv) < 2:
        print(
            "Usage: python changelog_generator.py "
            "<version> [since_tag] [changelog_path]",
            file=sys.stderr
        )
        sys.exit(1)

    version = sys.argv[1]
    since_tag = sys.argv[2] if len(sys.argv) > 2 else None
    changelog_path = sys.argv[3] if len(sys.argv) > 3 else "CHANGELOG.md"

    generator = ChangelogGenerator()

    if not generator.update_changelog_file(version, since_tag, changelog_path):
        sys.exit(1)


if __name__ == "__main__":
    main()
