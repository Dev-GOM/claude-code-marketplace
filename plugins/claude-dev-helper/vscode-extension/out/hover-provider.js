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
const execAsync = (0, util_1.promisify)(cp.exec);
class GitDiffHoverProvider {
    constructor(isEnabledFunc) {
        this.changesCache = new Map();
        this.isEnabledFunc = isEnabledFunc;
    }
    async updateChanges(uri) {
        const changes = await this.getGitChanges(uri);
        this.changesCache.set(uri.toString(), changes);
    }
    clearCache(uri) {
        if (uri) {
            this.changesCache.delete(uri.toString());
        }
        else {
            this.changesCache.clear();
        }
    }
    async provideHover(document, position, token) {
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
        const showDiffCommand = vscode.Uri.parse(`command:claudeDevHelper.showDiff?${encodeURIComponent(JSON.stringify([
            document.uri.toString()
        ]))}`);
        markdown.appendMarkdown(`[$(diff) Show Diff Editor](${showDiffCommand})`);
        return new vscode.Hover(markdown);
    }
    async getGitChanges(uri) {
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
        }
        catch (error) {
            return [];
        }
    }
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
                    endLine: newStart + newCount - 1
                });
            }
        }
        return changes;
    }
}
exports.GitDiffHoverProvider = GitDiffHoverProvider;
//# sourceMappingURL=hover-provider.js.map