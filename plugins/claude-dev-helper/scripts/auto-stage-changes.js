#!/usr/bin/env node

/**
 * Auto Stage Changes Script
 * Stages modified files and triggers diff editor
 */

const { exec } = require('child_process');
const path = require('path');

const projectRoot = process.cwd();

/**
 * Stage file with git add
 */
function stageFile(filePath) {
    return new Promise((resolve, reject) => {
        exec(`git add "${filePath}"`, { cwd: projectRoot }, (error) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    });
}

/**
 * Trigger diff editor check
 */
function triggerDiffEditor(filePath) {
    const editorScript = path.join(__dirname, 'check-and-open-editor.js');
    const relativePath = path.relative(projectRoot, filePath);

    exec(`node "${editorScript}" "${relativePath}"`, { cwd: projectRoot }, (error) => {
        // Silent fail - don't interrupt workflow
        if (error) {
            console.error('[Auto Stage] Error triggering diff editor:', error.message);
        }
    });
}

/**
 * Parse JSON input from stdin
 */
let inputData = '';

process.stdin.on('data', (chunk) => {
    inputData += chunk;
});

process.stdin.on('end', async () => {
    try {
        const input = JSON.parse(inputData);

        // Only process Write and Edit operations
        const toolName = input.tool_name;
        if (toolName !== 'Write' && toolName !== 'Edit') {
            process.exit(0);
        }

        // Extract file path from tool input
        const toolInput = input.tool_input || {};
        let filePath = toolInput.file_path;

        if (!filePath) {
            process.exit(0);
        }

        // Convert to absolute path if necessary
        if (!path.isAbsolute(filePath)) {
            filePath = path.join(projectRoot, filePath);
        }

        // Stage the file
        try {
            await stageFile(filePath);
            console.log(`[Auto Stage] Staged: ${path.relative(projectRoot, filePath)}`);

            // Trigger diff editor check
            triggerDiffEditor(filePath);
        } catch (error) {
            // Silent fail - git might not be initialized
            console.error('[Auto Stage] Failed to stage:', error.message);
        }

        process.exit(0);
    } catch (err) {
        // Silent fail - don't interrupt the workflow
        process.exit(0);
    }
});
