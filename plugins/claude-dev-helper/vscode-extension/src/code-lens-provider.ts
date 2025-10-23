import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';
import { promisify } from 'util';
import { i18n } from './i18n';

const execAsync = promisify(cp.exec);

interface GitChange {
    startLine: number;
    endLine: number;
    type: 'addition' | 'deletion' | 'modification';
}

export class GitDiffCodeLensProvider implements vscode.CodeLensProvider {
    private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

    /**
     * Refresh CodeLenses
     */
    refresh(): void {
        this._onDidChangeCodeLenses.fire();
    }

    /**
     * Provide CodeLenses for git changes
     */
    async provideCodeLenses(
        document: vscode.TextDocument,
        token: vscode.CancellationToken
    ): Promise<vscode.CodeLens[]> {
        if (document.uri.scheme !== 'file') {
            return [];
        }

        const changes = await this.getGitChanges(document.uri);
        const codeLenses: vscode.CodeLens[] = [];

        for (const change of changes) {
            const range = new vscode.Range(change.startLine, 0, change.startLine, 0);

            // Accept CodeLens
            const acceptLens = new vscode.CodeLens(range, {
                title: `✓ ${i18n.t('accept')}`,
                command: 'claudeDevHelper.acceptChangeAtLine',
                arguments: [document.uri, change.startLine, change.endLine]
            });

            // Reject CodeLens
            const rejectLens = new vscode.CodeLens(range, {
                title: `✗ ${i18n.t('reject')}`,
                command: 'claudeDevHelper.rejectChangeAtLine',
                arguments: [document.uri, change.startLine, change.endLine]
            });

            codeLenses.push(acceptLens, rejectLens);
        }

        return codeLenses;
    }

    /**
     * Get git changes for a file
     */
    private async getGitChanges(uri: vscode.Uri): Promise<GitChange[]> {
        try {
            const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
            if (!workspaceFolder) {
                return [];
            }

            const relativePath = path.relative(workspaceFolder.uri.fsPath, uri.fsPath);

            // Get git diff
            const { stdout } = await execAsync(`git diff --unified=0 "${relativePath}"`, {
                cwd: workspaceFolder.uri.fsPath
            });

            return this.parseGitDiff(stdout);
        } catch (error) {
            return [];
        }
    }

    /**
     * Parse git diff output
     */
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
                    endLine: newStart + newCount - 1,
                    type: 'addition'
                });
            }
        }

        return changes;
    }
}
