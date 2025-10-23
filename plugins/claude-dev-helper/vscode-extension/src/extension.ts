import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';
import { promisify } from 'util';
import { i18n } from './i18n';
import { FeedbackFileStorage } from './feedback-storage';
import { GitDiffCodeLensProvider } from './code-lens-provider';
import { GitDiffHoverProvider } from './hover-provider';

const execAsync = promisify(cp.exec);

// Global feedback storage
let feedbackStorage: FeedbackFileStorage | null = null;

// Global CodeLens provider
let codeLensProvider: GitDiffCodeLensProvider | null = null;

// Global Hover provider
let hoverProvider: GitDiffHoverProvider | null = null;

interface GitChange {
    startLine: number;
    endLine: number;
    type: 'addition' | 'deletion' | 'modification';
}

// Decoration types for highlighting changes
let additionDecorationType: vscode.TextEditorDecorationType;
let deletionDecorationType: vscode.TextEditorDecorationType;

/**
 * Extension activation
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('Claude Dev Helper extension activated');

    // Initialize file-based feedback storage
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (workspaceFolder) {
        feedbackStorage = new FeedbackFileStorage(workspaceFolder.uri.fsPath);

        // Clean up old feedback on startup
        feedbackStorage.cleanupOldFeedback();

        console.log(`Feedback storage initialized: ${feedbackStorage.getFilePath()}`);
    }

    // Create decoration types (Cursor-like styling)
    createDecorationTypes();

    // Register CodeLens provider (default enabled)
    const enableCodeLens = vscode.workspace.getConfiguration('claudeDevHelper').get('enableCodeLens', true);
    if (enableCodeLens) {
        codeLensProvider = new GitDiffCodeLensProvider();
        context.subscriptions.push(
            vscode.languages.registerCodeLensProvider(
                { scheme: 'file' },
                codeLensProvider
            )
        );
    }

    // Register Hover provider (optional - alternative to CodeLens)
    const enableHover = vscode.workspace.getConfiguration('claudeDevHelper').get('enableHover', false);
    if (enableHover) {
        hoverProvider = new GitDiffHoverProvider();
        context.subscriptions.push(
            vscode.languages.registerHoverProvider(
                { scheme: 'file' },
                hoverProvider
            )
        );
    }

    // Track active changes per editor
    const editorChanges = new Map<string, GitChange[]>();

    // Update decorations when editor changes
    const updateDecorations = async (editor: vscode.TextEditor | undefined) => {
        if (!editor || editor.document.uri.scheme !== 'file') {
            return;
        }

        const changes = await getGitChanges(editor.document.uri);
        editorChanges.set(editor.document.uri.toString(), changes);

        applyDecorations(editor, changes);
    };

    // Initial decoration
    if (vscode.window.activeTextEditor) {
        updateDecorations(vscode.window.activeTextEditor);
    }

    // Watch for active editor change
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(updateDecorations)
    );

    // Watch for document changes
    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument((event) => {
            const editor = vscode.window.visibleTextEditors.find(
                e => e.document === event.document
            );
            if (editor) {
                // Debounce updates
                setTimeout(() => updateDecorations(editor), 500);
            }
        })
    );

    // Register commands with keybindings
    context.subscriptions.push(
        vscode.commands.registerCommand('claudeDevHelper.acceptChange', async () => {
            await handleAccept(editorChanges);
            if (vscode.window.activeTextEditor) {
                updateDecorations(vscode.window.activeTextEditor);
                codeLensProvider?.refresh();
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('claudeDevHelper.rejectChange', async () => {
            await handleReject(editorChanges);
            if (vscode.window.activeTextEditor) {
                updateDecorations(vscode.window.activeTextEditor);
                codeLensProvider?.refresh();
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('claudeDevHelper.acceptAll', async () => {
            await acceptAllChanges();
            if (vscode.window.activeTextEditor) {
                updateDecorations(vscode.window.activeTextEditor);
                codeLensProvider?.refresh();
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('claudeDevHelper.rejectAll', async () => {
            await rejectAllChanges();
            if (vscode.window.activeTextEditor) {
                updateDecorations(vscode.window.activeTextEditor);
                codeLensProvider?.refresh();
            }
        })
    );

    // Register CodeLens/Hover commands (clickable)
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'claudeDevHelper.acceptChangeAtLine',
            async (uriOrString: vscode.Uri | string, startLine: number, endLine: number) => {
                // Convert string to Uri if needed
                const uri = typeof uriOrString === 'string' ? vscode.Uri.parse(uriOrString) : uriOrString;

                await acceptChange(uri, startLine, endLine);
                // Refresh UI
                const editor = vscode.window.visibleTextEditors.find(e => e.document.uri.toString() === uri.toString());
                if (editor) {
                    await hoverProvider?.updateChanges(uri);
                    updateDecorations(editor);
                }
                codeLensProvider?.refresh();
            }
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            'claudeDevHelper.rejectChangeAtLine',
            async (uriOrString: vscode.Uri | string, startLine: number, endLine: number) => {
                // Convert string to Uri if needed
                const uri = typeof uriOrString === 'string' ? vscode.Uri.parse(uriOrString) : uriOrString;

                await rejectChange(uri, startLine, endLine);
                // Refresh UI
                const editor = vscode.window.visibleTextEditors.find(e => e.document.uri.toString() === uri.toString());
                if (editor) {
                    await hoverProvider?.updateChanges(uri);
                    updateDecorations(editor);
                }
                codeLensProvider?.refresh();
            }
        )
    );
}

/**
 * Create decoration types (Cursor-like green/red background)
 */
function createDecorationTypes() {
    // Detect platform for keyboard shortcuts
    const isMac = process.platform === 'darwin';
    const acceptKey = isMac ? '⌘Y' : 'Ctrl+Y';
    const rejectKey = isMac ? '⌘N' : 'Ctrl+N';

    additionDecorationType = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(0, 255, 0, 0.15)',
        isWholeLine: true,
        after: {
            contentText: ` ${rejectKey}: ${i18n.t('reject')} | ${acceptKey}: ${i18n.t('accept')} `,
            color: 'rgba(255, 255, 255, 0.5)',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            margin: '0 0 0 20px',
            fontStyle: 'italic'
        }
    });

    deletionDecorationType = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(255, 0, 0, 0.15)',
        isWholeLine: true,
        after: {
            contentText: ` ${rejectKey}: ${i18n.t('reject')} | ${acceptKey}: ${i18n.t('accept')} `,
            color: 'rgba(255, 255, 255, 0.5)',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            margin: '0 0 0 20px',
            fontStyle: 'italic'
        }
    });
}

/**
 * Apply decorations to editor
 */
function applyDecorations(editor: vscode.TextEditor, changes: GitChange[]) {
    const additions: vscode.DecorationOptions[] = [];
    const deletions: vscode.DecorationOptions[] = [];

    for (const change of changes) {
        const range = new vscode.Range(
            change.startLine,
            0,
            change.endLine,
            editor.document.lineAt(change.endLine).text.length
        );

        const decoration: vscode.DecorationOptions = { range };

        if (change.type === 'addition' || change.type === 'modification') {
            additions.push(decoration);
        } else if (change.type === 'deletion') {
            deletions.push(decoration);
        }
    }

    editor.setDecorations(additionDecorationType, additions);
    editor.setDecorations(deletionDecorationType, deletions);
}

/**
 * Get git changes for a file
 */
async function getGitChanges(uri: vscode.Uri): Promise<GitChange[]> {
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

        return parseGitDiff(stdout);
    } catch (error) {
        return [];
    }
}

/**
 * Parse git diff output
 */
function parseGitDiff(diffOutput: string): GitChange[] {
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

/**
 * Handle accept at cursor position
 */
async function handleAccept(editorChanges: Map<string, GitChange[]>) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    const cursorLine = editor.selection.active.line;
    const changes = editorChanges.get(editor.document.uri.toString()) || [];

    // Find change at cursor
    const change = changes.find(c => cursorLine >= c.startLine && cursorLine <= c.endLine);

    if (change) {
        await acceptChange(editor.document.uri, change.startLine, change.endLine);
    }
}

/**
 * Handle reject at cursor position
 */
async function handleReject(editorChanges: Map<string, GitChange[]>) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    const cursorLine = editor.selection.active.line;
    const changes = editorChanges.get(editor.document.uri.toString()) || [];

    // Find change at cursor
    const change = changes.find(c => cursorLine >= c.startLine && cursorLine <= c.endLine);

    if (change) {
        await rejectChange(editor.document.uri, change.startLine, change.endLine);
    }
}

/**
 * Accept a specific change
 */
async function acceptChange(uri: vscode.Uri, startLine: number, endLine: number) {
    try {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
        if (!workspaceFolder) {
            return;
        }

        const relativePath = path.relative(workspaceFolder.uri.fsPath, uri.fsPath);

        // Get full diff with context
        const { stdout: fullDiff } = await execAsync(`git diff --unified=3 "${relativePath}"`, {
            cwd: workspaceFolder.uri.fsPath
        });

        if (!fullDiff) {
            vscode.window.showWarningMessage(`${i18n.t('noChanges')} accept`);
            return;
        }

        // Extract patch for specific lines
        const specificPatch = extractPatchForLines(fullDiff, startLine, endLine, relativePath);

        if (!specificPatch) {
            vscode.window.showWarningMessage('Could not extract patch');
            return;
        }

        // Apply patch to index
        const tempPatchFile = path.join(require('os').tmpdir(), `patch-${Date.now()}.patch`);
        require('fs').writeFileSync(tempPatchFile, specificPatch, 'utf8');

        try {
            await execAsync(`git apply --cached "${tempPatchFile}"`, {
                cwd: workspaceFolder.uri.fsPath
            });

            vscode.window.showInformationMessage(
                `✓ ${i18n.t('acceptedChange')} ${startLine + 1}-${endLine + 1})`
            );

            // Save feedback to file
            if (feedbackStorage) {
                feedbackStorage.addFeedback({
                    type: 'accept',
                    timestamp: new Date().toISOString(),
                    file: relativePath,
                    startLine,
                    endLine,
                    changeType: 'addition',
                    reported: false
                });
            }
        } finally {
            require('fs').unlinkSync(tempPatchFile);
        }
    } catch (error) {
        vscode.window.showErrorMessage(`${i18n.t('failed')} accept: ${error}`);
    }
}

/**
 * Reject a specific change
 */
async function rejectChange(uri: vscode.Uri, startLine: number, endLine: number) {
    try {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
        if (!workspaceFolder) {
            return;
        }

        const relativePath = path.relative(workspaceFolder.uri.fsPath, uri.fsPath);

        // Get full diff
        const { stdout: fullDiff } = await execAsync(`git diff --unified=3 "${relativePath}"`, {
            cwd: workspaceFolder.uri.fsPath
        });

        if (!fullDiff) {
            vscode.window.showWarningMessage(`${i18n.t('noChanges')} reject`);
            return;
        }

        // Extract patch
        const specificPatch = extractPatchForLines(fullDiff, startLine, endLine, relativePath);

        if (!specificPatch) {
            vscode.window.showWarningMessage('Could not extract patch');
            return;
        }

        // Apply in reverse
        const tempPatchFile = path.join(require('os').tmpdir(), `patch-${Date.now()}.patch`);
        require('fs').writeFileSync(tempPatchFile, specificPatch, 'utf8');

        try {
            await execAsync(`git apply --reverse "${tempPatchFile}"`, {
                cwd: workspaceFolder.uri.fsPath
            });

            vscode.window.showInformationMessage(
                `✗ ${i18n.t('rejectedChange')} ${startLine + 1}-${endLine + 1})`
            );

            // Save feedback to file
            if (feedbackStorage) {
                feedbackStorage.addFeedback({
                    type: 'reject',
                    timestamp: new Date().toISOString(),
                    file: relativePath,
                    startLine,
                    endLine,
                    changeType: 'modification',
                    reported: false
                });
            }
        } finally {
            require('fs').unlinkSync(tempPatchFile);
        }
    } catch (error) {
        vscode.window.showErrorMessage(`${i18n.t('failed')} reject: ${error}`);
    }
}

/**
 * Extract patch for specific lines
 */
function extractPatchForLines(fullDiff: string, startLine: number, endLine: number, filePath: string): string | null {
    const lines = fullDiff.split('\n');
    const patchLines: string[] = [];
    let inTargetHunk = false;
    let headerLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (line.startsWith('diff --git') || line.startsWith('index ') ||
            line.startsWith('---') || line.startsWith('+++')) {
            headerLines.push(line);
            continue;
        }

        const hunkMatch = line.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
        if (hunkMatch) {
            const newStart = parseInt(hunkMatch[3], 10) - 1;
            const newCount = hunkMatch[4] ? parseInt(hunkMatch[4], 10) : 1;
            const newEnd = newStart + newCount - 1;

            if (newStart <= endLine && newEnd >= startLine) {
                inTargetHunk = true;

                if (patchLines.length === 0) {
                    patchLines.push(...headerLines);
                }

                patchLines.push(line);
            } else {
                inTargetHunk = false;
            }
        } else if (inTargetHunk) {
            patchLines.push(line);

            if (i + 1 < lines.length && lines[i + 1].startsWith('@@')) {
                inTargetHunk = false;
            }
        }
    }

    return patchLines.length > 0 ? patchLines.join('\n') + '\n' : null;
}

/**
 * Accept all changes
 */
async function acceptAllChanges() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    await acceptChange(editor.document.uri, 0, editor.document.lineCount - 1);
}

/**
 * Reject all changes
 */
async function rejectAllChanges() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    await rejectChange(editor.document.uri, 0, editor.document.lineCount - 1);
}

/**
 * Extension deactivation
 */
export function deactivate() {
    // Clean up old feedback on shutdown
    if (feedbackStorage) {
        feedbackStorage.cleanupOldFeedback();
        feedbackStorage = null;
    }

    // Clean up decorations
    if (additionDecorationType) {
        additionDecorationType.dispose();
    }
    if (deletionDecorationType) {
        deletionDecorationType.dispose();
    }
}
