import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';
import * as crypto from 'crypto';
import * as http from 'http';
import * as fs from 'fs';
import { promisify } from 'util';
import { GitDiffCodeLensProvider } from './code-lens-provider';

const execAsync = promisify(cp.exec);

/**
 * Content provider for git HEAD version of files
 */
class GitContentProvider implements vscode.TextDocumentContentProvider {
    async provideTextDocumentContent(uri: vscode.Uri): Promise<string> {
        try {
            const filePath = uri.fsPath;
            const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(filePath));

            if (!workspaceFolder) {
                return '';
            }

            // Convert Windows backslashes to forward slashes for git
            const relativePath = path.relative(workspaceFolder.uri.fsPath, filePath).replace(/\\/g, '/');
            const { stdout } = await execAsync(
                `git show HEAD:"${relativePath}"`,
                { cwd: workspaceFolder.uri.fsPath }
            );

            return stdout;
        } catch (error) {
            return '';
        }
    }
}

const SERVER_PORT = 3456;

interface GitChange {
    startLine: number;
    endLine: number;
    type: 'addition' | 'deletion' | 'modification';
    oldContent?: string;
}

let codeLensProvider: GitDiffCodeLensProvider | null = null;

export function activate(context: vscode.ExtensionContext) {
    console.log('Claude Dev Helper activated');

    // Register git content provider for HEAD version
    const gitContentProvider = new GitContentProvider();
    context.subscriptions.push(
        vscode.workspace.registerTextDocumentContentProvider('git-head', gitContentProvider)
    );

    // Automatically set diffEditor to inline view mode
    const autoSetEnabled = vscode.workspace.getConfiguration('claudeDevHelper').get('autoSetInlineDiffMode', true);

    if (autoSetEnabled) {
        const config = vscode.workspace.getConfiguration('diffEditor');
        const currentValue = config.get('renderSideBySide');

        if (currentValue !== false) {
            // Automatically set to inline mode without asking
            config.update('renderSideBySide', false, vscode.ConfigurationTarget.Global).then(() => {
                console.log('[Claude Dev Helper] Diff editor set to inline mode');
            });
        }
    }

    codeLensProvider = new GitDiffCodeLensProvider(() => true);
    context.subscriptions.push(
        vscode.languages.registerCodeLensProvider({ scheme: 'file' }, codeLensProvider)
    );

    const editorChanges = new Map<string, GitChange[]>();

    const updateDecorations = async (editor: vscode.TextEditor | undefined) => {
        if (!editor || editor.document.uri.scheme !== 'file') {
            return;
        }

        // Don't apply decorations - use VSCode's built-in diff view instead
        // Just refresh CodeLens to show "Show Diff" button
        codeLensProvider?.refresh();
    };

    if (vscode.window.activeTextEditor) {
        updateDecorations(vscode.window.activeTextEditor);
    }

    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(updateDecorations)
    );

    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument((event) => {
            const editor = vscode.window.visibleTextEditors.find(e => e.document === event.document);
            if (editor) {
                updateDecorations(editor);
            }
        })
    );

    context.subscriptions.push(
        vscode.workspace.onDidSaveTextDocument((document) => {
            const editor = vscode.window.visibleTextEditors.find(e => e.document === document);
            if (editor) {
                updateDecorations(editor);
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            'claudeDevHelper.showDiff',
            async (uriOrString: vscode.Uri | string) => {
                const uri = typeof uriOrString === 'string' ? vscode.Uri.parse(uriOrString) : uriOrString;
                await showGitDiff(uri);
            }
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            'claudeDevHelper.showBrowserDiff',
            async (uriOrString: vscode.Uri | string) => {
                const uri = typeof uriOrString === 'string' ? vscode.Uri.parse(uriOrString) : uriOrString;
                await showBrowserDiff(uri);
            }
        )
    );

    // Command to enable inline diff mode
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'claudeDevHelper.enableInlineDiffMode',
            async () => {
                const config = vscode.workspace.getConfiguration('diffEditor');
                await config.update('renderSideBySide', false, vscode.ConfigurationTarget.Global);
                vscode.window.showInformationMessage('Diff editor set to inline mode!');
            }
        )
    );

    // Setup auto-open file watcher
    setupAutoOpenFileWatcher(context);
}

/**
 * Setup file watcher for auto-opening files created/edited by Claude
 */
function setupAutoOpenFileWatcher(context: vscode.ExtensionContext) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        return;
    }

    const workspaceRoot = workspaceFolders[0].uri.fsPath;
    const stateDir = path.join(workspaceRoot, '.claude-dev-helper');
    const openFilesPath = path.join(stateDir, 'open-files.json');

    // Ensure state directory exists before setting up watcher
    if (!fs.existsSync(stateDir)) {
        fs.mkdirSync(stateDir, { recursive: true });
        console.log('[Auto-open] Created .claude-dev-helper directory');
    }

    // Track processed files to avoid duplicates
    const processedFiles = new Set<string>();
    let lastModifiedTime = 0;

    // Create watcher for the open-files.json
    const watcher = fs.watch(stateDir, { persistent: false }, async (eventType, filename) => {
        if (filename !== 'open-files.json') {
            return;
        }

        try {
            // Check if file was actually modified (avoid duplicate events)
            const stats = fs.statSync(openFilesPath);
            if (stats.mtimeMs <= lastModifiedTime) {
                return;
            }
            lastModifiedTime = stats.mtimeMs;

            // Read queue
            const content = fs.readFileSync(openFilesPath, 'utf8');
            const queue = JSON.parse(content);

            if (!Array.isArray(queue) || queue.length === 0) {
                return;
            }

            // Process new files
            const newFiles = queue.filter((item: any) => !processedFiles.has(item.filePath + item.timestamp));

            for (const item of newFiles) {
                const { filePath, focus = false, openLocation = 'beside' } = item;

                // Mark as processed
                processedFiles.add(filePath + item.timestamp);

                // Open file in VSCode
                try {
                    const uri = vscode.Uri.file(filePath);
                    const doc = await vscode.workspace.openTextDocument(uri);

                    if (focus) {
                        // Open and focus
                        await vscode.window.showTextDocument(doc, { preview: false });
                    } else {
                        // Open without focus
                        const options: any = {
                            preview: false,
                            preserveFocus: true
                        };

                        // Add viewColumn based on openLocation setting
                        if (openLocation === 'beside') {
                            options.viewColumn = vscode.ViewColumn.Beside;
                        }
                        // If 'current', don't specify viewColumn to open in current tab

                        await vscode.window.showTextDocument(doc, options);
                    }

                    console.log(`[Auto-open] Opened file: ${path.basename(filePath)}`);
                } catch (error) {
                    console.error(`[Auto-open] Failed to open file: ${filePath}`, error);
                }
            }

            // Clean up old entries from processed set (keep last 50)
            if (processedFiles.size > 50) {
                const entries = Array.from(processedFiles);
                const toRemove = entries.slice(0, entries.length - 50);
                toRemove.forEach(entry => processedFiles.delete(entry));
            }
        } catch (error) {
            // Ignore errors (file might be being written)
            console.error('[Auto-open] Error processing queue:', error);
        }
    });

    // Cleanup on deactivate
    context.subscriptions.push({
        dispose: () => {
            watcher.close();
        }
    });
}

async function getGitChanges(uri: vscode.Uri): Promise<GitChange[]> {
    try {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
        if (!workspaceFolder) {
            return [];
        }

        // Convert Windows backslashes to forward slashes for git
        const relativePath = path.relative(workspaceFolder.uri.fsPath, uri.fsPath).replace(/\\/g, '/');
        const { stdout } = await execAsync(`git diff --unified=0 "${relativePath}"`, {
            cwd: workspaceFolder.uri.fsPath
        });

        return parseGitDiff(stdout);
    } catch (error) {
        return [];
    }
}

function parseGitDiff(diffOutput: string): GitChange[] {
    const changes: GitChange[] = [];
    const lines = diffOutput.split('\n');
    let currentNewLine = 0;
    let inHunk = false;
    const deletedLines: string[] = [];

    for (const line of lines) {
        const hunkMatch = line.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
        if (hunkMatch) {
            // Flush any pending deletions before starting new hunk
            if (deletedLines.length > 0) {
                const markerLine = currentNewLine > 0 ? currentNewLine - 1 : 0;
                changes.push({
                    startLine: markerLine,
                    endLine: markerLine,
                    type: 'deletion',
                    oldContent: deletedLines.join('\n')
                });
                deletedLines.length = 0;
            }

            currentNewLine = parseInt(hunkMatch[3], 10);
            inHunk = true;
            continue;
        }

        if (!inHunk) continue;

        if (line.startsWith('+')) {
            // Flush deletions before addition
            if (deletedLines.length > 0) {
                const markerLine = currentNewLine > 0 ? currentNewLine - 1 : 0;
                changes.push({
                    startLine: markerLine,
                    endLine: markerLine,
                    type: 'deletion',
                    oldContent: deletedLines.join('\n')
                });
                deletedLines.length = 0;
            }

            const addedLine = currentNewLine - 1;
            changes.push({ startLine: addedLine, endLine: addedLine, type: 'addition' });
            currentNewLine++;
        } else if (line.startsWith('-')) {
            // Collect deleted line content (remove the '-' prefix)
            deletedLines.push(line.substring(1));
        } else if (line.startsWith(' ')) {
            // Flush deletions at context line
            if (deletedLines.length > 0) {
                const markerLine = currentNewLine > 0 ? currentNewLine - 1 : 0;
                changes.push({
                    startLine: markerLine,
                    endLine: markerLine,
                    type: 'deletion',
                    oldContent: deletedLines.join('\n')
                });
                deletedLines.length = 0;
            }
            currentNewLine++;
        } else if (line.startsWith('\\')) {
            continue;
        } else if (line.startsWith('diff ') || line.startsWith('index ') ||
                   line.startsWith('---') || line.startsWith('+++')) {
            // Flush deletions at end of hunk
            if (deletedLines.length > 0) {
                const markerLine = currentNewLine > 0 ? currentNewLine - 1 : 0;
                changes.push({
                    startLine: markerLine,
                    endLine: markerLine,
                    type: 'deletion',
                    oldContent: deletedLines.join('\n')
                });
                deletedLines.length = 0;
            }
            inHunk = false;
        }
    }

    // Flush any remaining deletions
    if (deletedLines.length > 0) {
        const markerLine = currentNewLine > 0 ? currentNewLine - 1 : 0;
        changes.push({
            startLine: markerLine,
            endLine: markerLine,
            type: 'deletion',
            oldContent: deletedLines.join('\n')
        });
    }

    return changes;
}

/**
 * Check if diff editor server is running
 */
function checkServer(): Promise<boolean> {
    return new Promise((resolve) => {
        const req = http.get(`http://localhost:${SERVER_PORT}/health`, (res) => {
            resolve(res.statusCode === 200);
        });

        req.on('error', () => {
            resolve(false);
        });

        req.setTimeout(1000, () => {
            req.destroy();
            resolve(false);
        });
    });
}

/**
 * Start diff editor server in background (no cmd window!)
 */
async function startServer(): Promise<boolean> {
    try {
        // Get workspace root
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showErrorMessage('No workspace folder found');
            return false;
        }

        const workspaceRoot = workspaceFolders[0].uri.fsPath;

        // Calculate diff-editor path from workspace root
        const diffEditorPath = path.join(workspaceRoot, 'plugins', 'claude-dev-helper', 'diff-editor');

        console.log(`[Claude Dev Helper] Workspace root: ${workspaceRoot}`);
        console.log(`[Claude Dev Helper] Diff editor path: ${diffEditorPath}`);

        vscode.window.showInformationMessage('Starting diff editor server...');

        // Start server in background using spawn (detached, no window)
        const serverProcess = cp.spawn('node', ['server.js'], {
            cwd: diffEditorPath,
            detached: true,
            stdio: 'ignore',
            windowsHide: true  // Critical: prevents cmd window on Windows!
        });

        serverProcess.unref();  // Allow parent to exit independently

        // Wait for server to start
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Verify server started
        const running = await checkServer();
        if (running) {
            vscode.window.showInformationMessage('Diff editor server started successfully!');
            return true;
        } else {
            vscode.window.showErrorMessage('Failed to start diff editor server');
            return false;
        }
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to start server: ${error}`);
        return false;
    }
}

async function showGitDiff(uri: vscode.Uri) {
    try {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('No workspace folder found');
            return;
        }

        // Convert Windows backslashes to forward slashes for git
        const relativePath = path.relative(workspaceFolder.uri.fsPath, uri.fsPath).replace(/\\/g, '/');
        const fileName = path.basename(uri.fsPath);

        // Check if file exists in git HEAD
        try {
            await execAsync(
                `git show HEAD:"${relativePath}"`,
                { cwd: workspaceFolder.uri.fsPath }
            );

            // Create URI for git HEAD version using custom scheme
            const gitHeadUri = uri.with({
                scheme: 'git-head',
                path: uri.fsPath
            });

            // Open VSCode's built-in diff editor
            await vscode.commands.executeCommand(
                'vscode.diff',
                gitHeadUri,
                uri,
                `${fileName} (Working Tree ↔ HEAD)`,
                { preview: false }
            );

            // Wait a bit for the diff editor to open, then ensure inline view
            setTimeout(async () => {
                const config = vscode.workspace.getConfiguration('diffEditor');
                const renderSideBySide = config.get('renderSideBySide');

                // If it's side-by-side, toggle to inline
                if (renderSideBySide !== false) {
                    try {
                        await vscode.commands.executeCommand('toggle.diff.renderSideBySide');
                    } catch (e) {
                        // Toggle command might not be available
                        console.log('[Claude Dev Helper] Could not toggle diff view:', e);
                    }
                }
            }, 100);
        } catch (error: any) {
            if (error.message?.includes('does not exist') || error.message?.includes('Path')) {
                vscode.window.showInformationMessage(
                    'This is a new file (not in HEAD). No diff available.'
                );
            } else {
                throw error;
            }
        }
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to open diff editor: ${error}`);
    }
}

async function showBrowserDiff(uri: vscode.Uri) {
    try {
        // Check if server is running
        const isRunning = await checkServer();

        if (!isRunning) {
            // Ask user if they want to start the server
            const choice = await vscode.window.showInformationMessage(
                'Diff editor server is not running. Start it now?',
                'Yes', 'No'
            );

            if (choice !== 'Yes') {
                return;
            }

            // Start server
            const started = await startServer();
            if (!started) {
                return;
            }
        }

        const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('No workspace folder found');
            return;
        }

        const relativePath = path.relative(workspaceFolder.uri.fsPath, uri.fsPath).replace(/\\/g, '/');

        // Generate workspace hash for tab isolation (prevents conflicts when multiple VSCode instances are open)
        const workspaceHash = crypto.createHash('md5')
            .update(workspaceFolder.uri.fsPath)
            .digest('hex')
            .substring(0, 8);

        // Open diff editor URL directly
        const url = `http://localhost:${SERVER_PORT}/?workspace=${workspaceHash}&file=${encodeURIComponent(relativePath)}&cwd=${encodeURIComponent(workspaceFolder.uri.fsPath)}`;

        // Open in browser using VSCode's native API (no cmd window!)
        await vscode.env.openExternal(vscode.Uri.parse(url));
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to open diff editor: ${error}`);
    }
}

export function deactivate() {
    console.log('Claude Dev Helper deactivated');
}
