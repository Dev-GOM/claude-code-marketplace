#!/usr/bin/env node

const http = require('http');
const { spawn } = require('child_process');
const path = require('path');
const readline = require('readline');

const EDITOR_PORT = 3456;
const EDITOR_DIR = path.join(__dirname, '../diff-editor');

// Get file path from arguments
const changedFiles = process.argv.slice(2);

if (changedFiles.length === 0) {
    console.log('[Diff Editor] No files specified');
    process.exit(0);
}

// Check if server is running
function checkServer() {
    return new Promise((resolve) => {
        const req = http.get(`http://localhost:${EDITOR_PORT}/health`, (res) => {
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

// Ask user if they want to open editor
function askUser(question) {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.toLowerCase().startsWith('y'));
        });
    });
}

// Start editor server
function startServer() {
    return new Promise((resolve, reject) => {
        console.log('[Diff Editor] Starting server...');

        const serverProcess = spawn('npm', ['start'], {
            cwd: EDITOR_DIR,
            detached: true,
            stdio: 'ignore',
            shell: true
        });

        serverProcess.unref();

        // Wait for server to start
        setTimeout(async () => {
            const running = await checkServer();
            if (running) {
                console.log('[Diff Editor] Server started successfully');
                resolve();
            } else {
                reject(new Error('Failed to start server'));
            }
        }, 3000);
    });
}

// Open browser with file
function openBrowser(file) {
    const cwd = process.cwd();
    const url = `http://localhost:${EDITOR_PORT}?file=${encodeURIComponent(file)}&cwd=${encodeURIComponent(cwd)}`;

    console.log(`[Diff Editor] Opening: ${file}`);

    // Windows: use 'start', Mac: 'open', Linux: 'xdg-open'
    const command = process.platform === 'win32' ? 'start' :
                   process.platform === 'darwin' ? 'open' : 'xdg-open';

    spawn(command, [url], {
        detached: true,
        stdio: 'ignore',
        shell: true
    }).unref();
}

// Main function
async function main() {
    try {
        const isRunning = await checkServer();

        if (!isRunning) {
            console.log('\n📝 Claude Dev Helper - Diff Editor');
            console.log('═'.repeat(50));
            console.log(`Files changed: ${changedFiles.length}`);
            console.log('The custom diff editor is not running.');
            console.log('');

            const shouldStart = await askUser('Would you like to open the diff editor? (y/N): ');

            if (!shouldStart) {
                console.log('[Diff Editor] Skipped');
                return;
            }

            await startServer();
        }

        // Open browser for each file
        for (const file of changedFiles) {
            openBrowser(file);
            // Small delay between opening multiple files
            if (changedFiles.length > 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        console.log('[Diff Editor] Done');
    } catch (error) {
        console.error('[Diff Editor] Error:', error.message);
        process.exit(1);
    }
}

// Run
main();
