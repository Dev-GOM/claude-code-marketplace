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
exports.GitDiffCodeLensProvider = void 0;
const vscode = __importStar(require("vscode"));
const cp = __importStar(require("child_process"));
const path = __importStar(require("path"));
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(cp.exec);
class GitDiffCodeLensProvider {
    constructor(isEnabledFunc) {
        this._onDidChangeCodeLenses = new vscode.EventEmitter();
        this.onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;
        this.isEnabledFunc = isEnabledFunc;
    }
    refresh() {
        this._onDidChangeCodeLenses.fire();
    }
    async provideCodeLenses(document, token) {
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
        const codeLenses = [];
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
        let currentNewLine = 0;
        let inHunk = false;
        for (const line of lines) {
            const hunkMatch = line.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
            if (hunkMatch) {
                currentNewLine = parseInt(hunkMatch[3], 10);
                inHunk = true;
                continue;
            }
            if (!inHunk)
                continue;
            if (line.startsWith('+')) {
                changes.push({ startLine: currentNewLine - 1, endLine: currentNewLine - 1 });
                currentNewLine++;
            }
            else if (line.startsWith('-')) {
                const deletionMarkerLine = currentNewLine - 1;
                if (deletionMarkerLine >= 0) {
                    changes.push({ startLine: deletionMarkerLine, endLine: deletionMarkerLine });
                }
            }
            else if (line.startsWith(' ')) {
                currentNewLine++;
            }
            else if (line.startsWith('\\')) {
                continue;
            }
            else if (line.startsWith('diff ') || line.startsWith('index ') ||
                line.startsWith('---') || line.startsWith('+++')) {
                inHunk = false;
            }
        }
        return changes;
    }
    groupConsecutiveChanges(changes) {
        if (changes.length === 0)
            return [];
        const grouped = [];
        let current = { ...changes[0] };
        for (let i = 1; i < changes.length; i++) {
            const change = changes[i];
            if (change.startLine <= current.endLine + 1) {
                current.endLine = change.endLine;
            }
            else {
                grouped.push(current);
                current = { ...change };
            }
        }
        grouped.push(current);
        return grouped;
    }
}
exports.GitDiffCodeLensProvider = GitDiffCodeLensProvider;
//# sourceMappingURL=code-lens-provider.js.map