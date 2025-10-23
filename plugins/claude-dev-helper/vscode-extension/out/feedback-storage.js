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
exports.FeedbackFileStorage = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const crypto = __importStar(require("crypto"));
class FeedbackFileStorage {
    constructor(workspaceRoot) {
        this.workspaceRoot = workspaceRoot;
        const workspaceHash = this.getWorkspaceHash(workspaceRoot);
        this.feedbackFilePath = path.join(workspaceRoot, '.claude-code-review', `feedback-${workspaceHash}.json`);
    }
    /**
     * Generate workspace hash for unique file naming
     */
    getWorkspaceHash(workspace) {
        return crypto.createHash('md5')
            .update(workspace)
            .digest('hex')
            .substring(0, 8);
    }
    /**
     * Initialize feedback directory
     */
    ensureDirectory() {
        const dir = path.dirname(this.feedbackFilePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }
    /**
     * Load existing feedback
     */
    loadFeedback() {
        try {
            if (fs.existsSync(this.feedbackFilePath)) {
                const data = fs.readFileSync(this.feedbackFilePath, 'utf8');
                const storage = JSON.parse(data);
                return storage.feedback || [];
            }
        }
        catch (error) {
            console.error('Failed to load feedback:', error);
        }
        return [];
    }
    /**
     * Save feedback to file
     */
    saveFeedback(feedback) {
        try {
            this.ensureDirectory();
            const storage = {
                feedback,
                lastUpdated: new Date().toISOString()
            };
            fs.writeFileSync(this.feedbackFilePath, JSON.stringify(storage, null, 2), 'utf8');
        }
        catch (error) {
            console.error('Failed to save feedback:', error);
        }
    }
    /**
     * Add new feedback message
     */
    addFeedback(message) {
        const existingFeedback = this.loadFeedback();
        // Add new message
        existingFeedback.push(message);
        // Keep only last 100 messages
        const trimmedFeedback = existingFeedback.slice(-100);
        this.saveFeedback(trimmedFeedback);
        console.log(`Feedback saved to ${this.feedbackFilePath}:`, message);
    }
    /**
     * Clean up old feedback (older than 1 hour)
     */
    cleanupOldFeedback() {
        const existingFeedback = this.loadFeedback();
        const now = new Date();
        const recentFeedback = existingFeedback.filter(fb => {
            const fbTime = new Date(fb.timestamp);
            const ageInMinutes = (now.getTime() - fbTime.getTime()) / (1000 * 60);
            return ageInMinutes < 60; // Keep last 1 hour
        });
        if (recentFeedback.length !== existingFeedback.length) {
            this.saveFeedback(recentFeedback);
            console.log(`Cleaned up ${existingFeedback.length - recentFeedback.length} old feedback messages`);
        }
    }
    /**
     * Get feedback file path (for hook script to read)
     */
    getFilePath() {
        return this.feedbackFilePath;
    }
}
exports.FeedbackFileStorage = FeedbackFileStorage;
//# sourceMappingURL=feedback-storage.js.map