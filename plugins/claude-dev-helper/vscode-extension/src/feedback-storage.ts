import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

interface FeedbackMessage {
    type: 'accept' | 'reject';
    timestamp: string;
    file: string;
    startLine: number;
    endLine: number;
    changeType: 'addition' | 'deletion' | 'modification';
    reported: boolean; // Claude에게 전달되었는지 여부
}

interface FeedbackStorage {
    feedback: FeedbackMessage[];
    lastUpdated: string;
}

export class FeedbackFileStorage {
    private feedbackFilePath: string;

    constructor(private workspaceRoot: string) {
        const workspaceHash = this.getWorkspaceHash(workspaceRoot);
        this.feedbackFilePath = path.join(
            workspaceRoot,
            '.claude-code-review',
            `feedback-${workspaceHash}.json`
        );
    }

    /**
     * Generate workspace hash for unique file naming
     */
    private getWorkspaceHash(workspace: string): string {
        return crypto.createHash('md5')
            .update(workspace)
            .digest('hex')
            .substring(0, 8);
    }

    /**
     * Initialize feedback directory
     */
    private ensureDirectory(): void {
        const dir = path.dirname(this.feedbackFilePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    /**
     * Load existing feedback
     */
    private loadFeedback(): FeedbackMessage[] {
        try {
            if (fs.existsSync(this.feedbackFilePath)) {
                const data = fs.readFileSync(this.feedbackFilePath, 'utf8');
                const storage: FeedbackStorage = JSON.parse(data);
                return storage.feedback || [];
            }
        } catch (error) {
            console.error('Failed to load feedback:', error);
        }
        return [];
    }

    /**
     * Save feedback to file
     */
    private saveFeedback(feedback: FeedbackMessage[]): void {
        try {
            this.ensureDirectory();

            const storage: FeedbackStorage = {
                feedback,
                lastUpdated: new Date().toISOString()
            };

            fs.writeFileSync(
                this.feedbackFilePath,
                JSON.stringify(storage, null, 2),
                'utf8'
            );
        } catch (error) {
            console.error('Failed to save feedback:', error);
        }
    }

    /**
     * Add new feedback message
     */
    addFeedback(message: FeedbackMessage): void {
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
    cleanupOldFeedback(): void {
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
    getFilePath(): string {
        return this.feedbackFilePath;
    }
}
