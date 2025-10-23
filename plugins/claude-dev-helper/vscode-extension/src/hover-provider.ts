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

export class GitDiffHoverProvider implements vscode.HoverProvider {
    private changesCache: Map<string, GitChange[]> = new Map();

    /**
     * Update changes cache for a document
     */
    async updateChanges(uri: vscode.Uri): Promise<void> {
        const changes = await this.getGitChanges(uri);
        this.changesCache.set(uri.toString(), changes);
    }

    /**
     * Clear changes cache
     */
    clearCache(uri?: vscode.Uri): void {
        if (uri) {
            this.changesCache.delete(uri.toString());
        } else {
            this.changesCache.clear();
        }
    }

    /**
     * Provide hover information
     */
    async provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): Promise<vscode.Hover | undefined> {
        if (document.uri.scheme !== 'file') {
            return undefined;
        }

        // Get cached changes or fetch new ones
        let changes = this.changesCache.get(document.uri.toString());
        if (!changes) {
            changes = await this.getGitChanges(document.uri);
            this.changesCache.set(document.uri.toString(), changes);
        }

        // Find change at current line
        const line = position.line;
        const change = changes.find(c => line >= c.startLine && line <= c.endLine);

        if (!change) {
            return undefined;
        }

        // Create hover content with clickable buttons
        const markdown = new vscode.MarkdownString();
        markdown.isTrusted = true;
        markdown.supportHtml = true;

        // Add title
        markdown.appendMarkdown(`**${i18n.t('gitChange')}** (${i18n.t('lines')} ${change.startLine + 1}-${change.endLine + 1})\n\n`);

        // Create clickable command links
        const acceptCommand = vscode.Uri.parse(
            `command:claudeDevHelper.acceptChangeAtLine?${encodeURIComponent(JSON.stringify([
                document.uri.toString(),
                change.startLine,
                change.endLine
            ]))}`
        );

        const rejectCommand = vscode.Uri.parse(
            `command:claudeDevHelper.rejectChangeAtLine?${encodeURIComponent(JSON.stringify([
                document.uri.toString(),
                change.startLine,
                change.endLine
            ]))}`
        );

        // Add buttons
        markdown.appendMarkdown(`[✓ ${i18n.t('accept')}](${acceptCommand}) | `);
        markdown.appendMarkdown(`[✗ ${i18n.t('reject')}](${rejectCommand})\n\n`);

        // Add keyboard shortcuts hint
        const isMac = process.platform === 'darwin';
        const acceptKey = isMac ? '⌘Y' : 'Ctrl+Y';
        const rejectKey = isMac ? '⌘N' : 'Ctrl+N';
        markdown.appendMarkdown(`\n---\n*${i18n.t('keyboardHint')}: ${acceptKey} / ${rejectKey}*`);

        return new vscode.Hover(markdown);
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
