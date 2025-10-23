#!/usr/bin/env node

/**
 * Feedback Collector for Claude Code
 * Reads user feedback (accept/reject) from file-based storage
 * and provides it as additionalContext to Claude
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const projectRoot = process.cwd();

/**
 * Generate workspace hash (same algorithm as Extension)
 */
function getWorkspaceHash(workspace) {
    return crypto.createHash('md5')
        .update(workspace)
        .digest('hex')
        .substring(0, 8);
}

/**
 * Load feedback from workspace-specific file
 */
function loadFeedback() {
    try {
        const workspaceHash = getWorkspaceHash(projectRoot);
        const feedbackFilePath = path.join(
            projectRoot,
            '.claude-code-review',
            `feedback-${workspaceHash}.json`
        );

        if (fs.existsSync(feedbackFilePath)) {
            const data = fs.readFileSync(feedbackFilePath, 'utf8');
            const storage = JSON.parse(data);
            return storage.feedback || [];
        }
    } catch (error) {
        // Silent fail
    }
    return [];
}

/**
 * Format feedback for Claude
 */
function formatFeedbackForClaude(feedbackList) {
    if (feedbackList.length === 0) {
        return null;
    }

    const messages = [];

    // Group by file
    const byFile = {};
    feedbackList.forEach(fb => {
        if (!byFile[fb.file]) {
            byFile[fb.file] = [];
        }
        byFile[fb.file].push(fb);
    });

    // Create summary
    messages.push('📊 **User Feedback on Your Changes:**');
    messages.push('');

    Object.keys(byFile).forEach(file => {
        const feedbacks = byFile[file];
        const accepted = feedbacks.filter(f => f.type === 'accept').length;
        const rejected = feedbacks.filter(f => f.type === 'reject').length;

        messages.push(`**${file}**`);
        messages.push(`  ✓ Accepted: ${accepted} changes`);
        messages.push(`  ✗ Rejected: ${rejected} changes`);

        feedbacks.forEach(fb => {
            const action = fb.type === 'accept' ? '✓ ACCEPTED' : '✗ REJECTED';
            messages.push(`    ${action} lines ${fb.startLine + 1}-${fb.endLine + 1}`);
        });

        messages.push('');
    });

    // Analysis
    const totalAccepted = feedbackList.filter(f => f.type === 'accept').length;
    const totalRejected = feedbackList.filter(f => f.type === 'reject').length;
    const acceptanceRate = Math.round((totalAccepted / (totalAccepted + totalRejected)) * 100);

    messages.push(`**Summary:** ${acceptanceRate}% acceptance rate`);
    messages.push('');
    messages.push('💡 **Suggestion:** Consider the patterns in accepted vs. rejected changes for future improvements.');

    return messages.join('\n');
}

/**
 * Save feedback back to file
 */
function saveFeedback(feedbackList) {
    try {
        const workspaceHash = getWorkspaceHash(projectRoot);
        const feedbackFilePath = path.join(
            projectRoot,
            '.claude-code-review',
            `feedback-${workspaceHash}.json`
        );

        const storage = {
            feedback: feedbackList,
            lastUpdated: new Date().toISOString()
        };

        fs.writeFileSync(feedbackFilePath, JSON.stringify(storage, null, 2), 'utf8');
    } catch (error) {
        // Silent fail
    }
}

/**
 * Main execution
 */
function main() {
    // Load feedback from file
    const allFeedback = loadFeedback();

    if (allFeedback.length === 0) {
        // No feedback to report
        process.exit(0);
        return;
    }

    // Filter unreported feedback
    const unreportedFeedback = allFeedback.filter(fb => fb.reported === false);

    if (unreportedFeedback.length > 0) {
        const formattedFeedback = formatFeedbackForClaude(unreportedFeedback);
        if (formattedFeedback) {
            console.log(JSON.stringify({
                additionalContext: formattedFeedback
            }));

            // Mark as reported
            const updatedFeedback = allFeedback.map(fb => {
                if (fb.reported === false) {
                    return { ...fb, reported: true };
                }
                return fb;
            });

            saveFeedback(updatedFeedback);
        }
    }

    process.exit(0);
}

main();
