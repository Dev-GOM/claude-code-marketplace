import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';
import { promisify } from 'util';

const execAsync = promisify(cp.exec);

interface GitChange {
    startLine: number;
    endLine: number;
}

export class GitDiffHoverProvider implements vscode.HoverProvider {
    private changesCache = new Map<string, GitChange[]>();
    private isEnabledFunc: () => boolean;

    constructor(isEnabledFunc: () => boolean) {
        this.isEnabledFunc = isEnabledFunc;
    }

    async updateChanges(uri: vscode.Uri): Promise<void> {
        const changes = await this.getGitChanges(uri);
        this.changesCache.set(uri.toString(), changes);
    }

    clearCache(uri?: vscode.Uri): void {
        if (uri) {
            this.changesCache.delete(uri.toString());
        } else {
            this.changesCache.clear();
        }
    }

    async provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): Promise<vscode.Hover | undefined> {
        if (document.uri.scheme !== 'file') {
            return undefined;
        }

        // Don't show hover when inline diff is disabled
        if (!this.isEnabledFunc()) {
            return undefined;
        }

        let changes = this.changesCache.get(document.uri.toString());
        if (!changes) {
            changes = await this.getGitChanges(document.uri);
            this.changesCache.set(document.uri.toString(), changes);
        }

        const line = position.line;
        const change = changes.find(c => line >= c.startLine && line <= c.endLine);

        if (!change) {
            return undefined;
        }

        const markdown = new vscode.MarkdownString();
        markdown.isTrusted = true;
        markdown.appendMarkdown(`**Git Change** (lines ${change.startLine + 1}-${change.endLine + 1})\n\n`);

        const showDiffCommand = vscode.Uri.parse(
            `command:claudeDevHelper.showDiff?${encodeURIComponent(JSON.stringify([
                document.uri.toString()
            ]))}`
        );

        markdown.appendMarkdown(`[$(diff) Show Diff Editor](${showDiffCommand})`);

        return new vscode.Hover(markdown);
    }

    private async getGitChanges(uri: vscode.Uri): Promise<GitChange[]> {
        try {
            const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
            if (!workspaceFolder) {
                return [];
            }

            const relativePath = path.relative(workspaceFolder.uri.fsPath, uri.fsPath);
            const { stdout } = await execAsync(`git diff --unified=0 "${relativePath}"`, {
                cwd: workspaceFolder.uri.fsPath
            });

            return this.parseGitDiff(stdout);
        } catch (error) {
            return [];
        }
    }

    private parseGitDiff(diffOutput: string): GitChange[] {
        const changes: GitChange[] = [];
        const lines = diffOutput.split('\n');

        for (const line of lines) {
            const hunkMatch = line.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
            if (hunkMatch) {
                const newStart = parseInt(hunkMatch[3], 10) - 1;
                const newCount = hunkMatch[4] ? parseInt(hunkMatch[4], 10) : 1;
                changes.push({
                    startLine: newStart,
                    endLine: newStart + newCount - 1
                });
            }
        }

        return changes;
    }
}
