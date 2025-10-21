#!/usr/bin/env python3
"""
Git operations wrapper with cross-platform support.
Handles: commit, tag, push, branch detection
"""

import subprocess
import sys
from pathlib import Path
from typing import Optional, List


class GitOperations:
    def __init__(self, repo_path: str = "."):
        self.repo_path = Path(repo_path).resolve()

    def run_command(
            self,
            cmd: List[str],
            check: bool = True) -> subprocess.CompletedProcess[str]:
        """Run git command with proper error handling."""
        try:
            result = subprocess.run(
                cmd,
                cwd=self.repo_path,
                capture_output=True,
                text=True,
                check=check,
                encoding='utf-8'
            )
            return result
        except subprocess.CalledProcessError as e:
            print(f"Git command failed: {' '.join(cmd)}", file=sys.stderr)
            print(f"Error: {e.stderr}", file=sys.stderr)
            raise

    def get_current_branch(self) -> str:
        """Get current git branch name."""
        result = self.run_command(['git', 'branch', '--show-current'])
        return result.stdout.strip()

    def get_status(self) -> str:
        """Get git status."""
        result = self.run_command(['git', 'status', '--porcelain'])
        return result.stdout

    def add_files(self, files: Optional[List[str]] = None) -> bool:
        """Stage files for commit."""
        if files:
            self.run_command(['git', 'add'] + files)
        else:
            self.run_command(['git', 'add', '-A'])

        print("✓ Files staged for commit")
        return True

    def commit(self, message: str) -> bool:
        """Create git commit."""
        self.run_command(['git', 'commit', '-m', message])
        print(f"✓ Committed: {message.split('\n')[0][:60]}...")
        return True

    def create_tag(self, tag_name: str, message: Optional[str] = None) -> bool:
        """Create annotated git tag."""
        cmd = ['git', 'tag', '-a', tag_name]

        if message:
            cmd.extend(['-m', message])
        else:
            cmd.extend(['-m', f"Release {tag_name}"])

        self.run_command(cmd)
        print(f"✓ Created tag: {tag_name}")
        return True

    def push(
            self,
            remote: str = 'origin',
            branch: Optional[str] = None,
            tags: bool = False) -> bool:
        """Push commits and/or tags to remote."""
        if tags:
            # Push tags
            cmd = ['git', 'push', remote, '--tags']
            self.run_command(cmd)
            print(f"✓ Pushed tags to {remote}")
        else:
            # Push branch
            if not branch:
                branch = self.get_current_branch()

            cmd = ['git', 'push', remote, branch]
            self.run_command(cmd)
            print(f"✓ Pushed {branch} to {remote}")

        return True

    def tag_exists(self, tag_name: str) -> bool:
        """Check if tag exists."""
        result = self.run_command(['git', 'tag', '-l', tag_name], check=False)
        return bool(result.stdout.strip())


def main():
    if len(sys.argv) < 2:
        print("Usage:", file=sys.stderr)
        print("  python git_operations.py commit <message>", file=sys.stderr)
        print(
            "  python git_operations.py tag <tag_name> [message]",
            file=sys.stderr)
        print("  python git_operations.py push [branch]", file=sys.stderr)
        print("  python git_operations.py push-tags", file=sys.stderr)
        sys.exit(1)

    action = sys.argv[1]
    git = GitOperations()

    try:
        if action == 'commit':
            if len(sys.argv) < 3:
                print("Error: Commit message required", file=sys.stderr)
                sys.exit(1)

            message = sys.argv[2]
            git.add_files()
            git.commit(message)

        elif action == 'tag':
            if len(sys.argv) < 3:
                print("Error: Tag name required", file=sys.stderr)
                sys.exit(1)

            tag_name = sys.argv[2]
            message = sys.argv[3] if len(sys.argv) > 3 else None
            git.create_tag(tag_name, message)

        elif action == 'push':
            branch = sys.argv[2] if len(sys.argv) > 2 else None
            git.push(branch=branch)

        elif action == 'push-tags':
            git.push(tags=True)

        else:
            print(f"Error: Unknown action '{action}'", file=sys.stderr)
            sys.exit(1)

    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
