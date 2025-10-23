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
const i18n_1 = require("./i18n");
const execAsync = (0, util_1.promisify)(cp.exec);
class GitDiffCodeLensProvider {
    constructor() {
        this._onDidChangeCodeLenses = new vscode.EventEmitter();
        this.onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;
    }
    /**
     * Refresh CodeLenses
     */
    refresh() {
        this._onDidChangeCodeLenses.fire();
    }
    /**
     * Provide CodeLenses for git changes
     */
    async provideCodeLenses(document, token) {
        if (document.uri.scheme !== 'file') {
            return [];
        }
        const changes = await this.getGitChanges(document.uri);
        const codeLenses = [];
        for (const change of changes) {
            const range = new vscode.Range(change.startLine, 0, change.startLine, 0);
            // Accept CodeLens
            const acceptLens = new vscode.CodeLens(range, {
                title: `✓ ${i18n_1.i18n.t('accept')}`,
                command: 'claudeGitDiff.acceptChangeAtLine',
                arguments: [document.uri, change.startLine, change.endLine]
            });
            // Reject CodeLens
            const rejectLens = new vscode.CodeLens(range, {
                title: `✗ ${i18n_1.i18n.t('reject')}`,
                command: 'claudeGitDiff.rejectChangeAtLine',
                arguments: [document.uri, change.startLine, change.endLine]
            });
            codeLenses.push(acceptLens, rejectLens);
        }
        return codeLenses;
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
exports.GitDiffCodeLensProvider = GitDiffCodeLensProvider;
//# sourceMappingURL=code-lens-provider.js.map