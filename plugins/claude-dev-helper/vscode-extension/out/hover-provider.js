"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitDiffHoverProvider = void 0;
const vscode = __importStar(require("vscode"));
const cp = __importStar(require("child_process"));
const path = __importStar(require("path"));
const util_1 = require("util");
const i18n_1 = require("./i18n");
const execAsync = (0, util_1.promisify)(cp.exec);
class GitDiffHoverProvider {
    constructor() {
        this.changesCache = new Map();
    }
    /**
     * Update changes cache for a document
     */
    async updateChanges(uri) {
        const changes = await this.getGitChanges(uri);
        this.changesCache.set(uri.toString(), changes);
    }
    /**
     * Clear changes cache
     */
    clearCache(uri) {
        if (uri) {
            this.changesCache.delete(uri.toString());
        }
        else {
            this.changesCache.clear();
        }
    }
    /**
     * Provide hover information
     */
    async provideHover(document, position, token) {
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
        markdown.appendMarkdown(`**${i18n_1.i18n.t('gitChange')}** (${i18n_1.i18n.t('lines')} ${change.startLine + 1}-${change.endLine + 1})\n\n`);
        // Create clickable command links
        const acceptCommand = vscode.Uri.parse(`command:claudeGitDiff.acceptChangeAtLine?${encodeURIComponent(JSON.stringify([
            document.uri.toString(),
            change.startLine,
            change.endLine
        ]))}`);
        const rejectCommand = vscode.Uri.parse(`command:claudeGitDiff.rejectChangeAtLine?${encodeURIComponent(JSON.stringify([
            document.uri.toString(),
            change.startLine,
            change.endLine
        ]))}`);
        // Add buttons
        markdown.appendMarkdown(`[✓ ${i18n_1.i18n.t('accept')}](${acceptCommand}) | `);
        markdown.appendMarkdown(`[✗ ${i18n_1.i18n.t('reject')}](${rejectCommand})\n\n`);
        // Add keyboard shortcuts hint
        const isMac = process.platform === 'darwin';
        const acceptKey = isMac ? '⌘Y' : 'Ctrl+Y';
        const rejectKey = isMac ? '⌘N' : 'Ctrl+N';
        markdown.appendMarkdown(`\n---\n*${i18n_1.i18n.t('keyboardHint')}: ${acceptKey} / ${rejectKey}*`);
        return new vscode.Hover(markdown);
    }
    /**
     * Get git changes for a file
     */
    async getGitChanges(uri) {
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
        }
        catch (error) {
            return [];
        }
    }
    /**
     * Parse git diff output
     */
    parseGitDiff(diffOutput) {
        const changes = [];
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
exports.GitDiffHoverProvider = GitDiffHoverProvider;
//# sourceMappingURL=hover-provider.js.map