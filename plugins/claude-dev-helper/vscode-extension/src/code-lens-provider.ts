import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';
import { promisify } from 'util';

const execAsync = promisify(cp.exec);

interface GitChange {
    startLine: number;
    endLine: number;
}

export class GitDiffCodeLensProvider implements vscode.CodeLensProvider {
    private _onDidChangeCodeLenses = new vscode.EventEmitter<void>();
    public readonly onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;
    private isEnabledFunc: () => boolean;

    constructor(isEnabledFunc: () => boolean) {
        this.isEnabledFunc = isEnabledFunc;
    }

    refresh(): void {
        this._onDidChangeCodeLenses.fire();
    }

    async provideCodeLenses(
        document: vscode.TextDocument,
        token: vscode.CancellationToken
    ): Promise<vscode.CodeLens[]> {
        if (document.uri.scheme !== 'file') {
            return [];
        }

        // Don't show CodeLens when inline diff is disabled
        if (!this.isEnabledFunc()) {
            return [];
        }

        const changes = await this.getGitChanges(document.uri);
        if (changes.length === 0) {
            return [];
        }

        const groups = this.groupConsecutiveChanges(changes);
        const codeLenses: vscode.CodeLens[] = [];

        for (const group of groups) {
            const range = new vscode.Range(group.startLine, 0, group.startLine, 0);
            codeLenses.push(new vscode.CodeLens(range, {
                title: `$(diff) Show Diff Editor`,
                command: 'claudeDevHelper.showDiff',
                arguments: [document.uri]
            }));
        }

        return codeLenses;
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
        let currentNewLine = 0;
        let inHunk = false;

        for (const line of lines) {
            const hunkMatch = line.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
            if (hunkMatch) {
                currentNewLine = parseInt(hunkMatch[3], 10);
                inHunk = true;
                continue;
            }

            if (!inHunk) continue;

            if (line.startsWith('+')) {
                changes.push({ startLine: currentNewLine - 1, endLine: currentNewLine - 1 });
                currentNewLine++;
            } else if (line.startsWith('-')) {
                const deletionMarkerLine = currentNewLine - 1;
                if (deletionMarkerLine >= 0) {
                    changes.push({ startLine: deletionMarkerLine, endLine: deletionMarkerLine });
                }
            } else if (line.startsWith(' ')) {
                currentNewLine++;
            } else if (line.startsWith('\\')) {
                continue;
            } else if (line.startsWith('diff ') || line.startsWith('index ') ||
                       line.startsWith('---') || line.startsWith('+++')) {
                inHunk = false;
            }
        }

        return changes;
    }

    private groupConsecutiveChanges(changes: GitChange[]): GitChange[] {
        if (changes.length === 0) return [];

        const grouped: GitChange[] = [];
        let current = { ...changes[0] };

        for (let i = 1; i < changes.length; i++) {
            const change = changes[i];
            if (change.startLine <= current.endLine + 1) {
                current.endLine = change.endLine;
            } else {
                grouped.push(current);
                current = { ...change };
            }
        }

        grouped.push(current);
        return grouped;
    }
}
