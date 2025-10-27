#!/usr/bin/env node

/**
 * Open Diff Editor Script
 * - Checks if server is running, starts it if not
 * - Opens the file in VSCode if not already open
 * - Opens diff editor in browser
 */

const cp = require('child_process');
const path = require('path');
const http = require('http');

// Configuration
const SERVER_PORT = 3456;
const DIFF_EDITOR_PATH = path.join(__dirname, '..', 'diff-editor');

/**
 * Check if server is running on port
 */
function isServerRunning(port) {
    return new Promise((resolve) => {
        const req = http.get(`http://localhost:${port}/health`, (res) => {
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
 * Start diff editor server in background
 */
function startServer() {
    console.log('Starting diff editor server...');

    const serverProcess = cp.spawn('node', ['server.js'], {
        cwd: DIFF_EDITOR_PATH,
        detached: true,
        stdio: 'ignore'
    });

    serverProcess.unref();

    console.log(`Server started with PID: ${serverProcess.pid}`);

    // Wait for server to be ready
    return new Promise((resolve) => {
        setTimeout(resolve, 2000);
    });
}

/**
 * Open file in VSCode
 */
function openInVSCode(filePath, workDir) {
    try {
        console.log(`Opening file in VSCode: ${filePath}`);
        cp.execSync(`code "${path.join(workDir, filePath)}"`, {
            stdio: 'ignore',
            windowsHide: true
        });
    } catch (error) {
        console.warn('Could not open VSCode:', error.message);
    }
}

/**
 * Open diff editor in browser
 */
function openDiffEditor(filePath, workDir) {
    const url = `http://localhost:${SERVER_PORT}/diff-editor/?file=${encodeURIComponent(filePath)}&cwd=${encodeURIComponent(workDir)}`;

    console.log(`Opening Diff Editor: ${url}`);

    let openCommand;
    if (process.platform === 'win32') {
        openCommand = `start "" "${url}"`;
    } else if (process.platform === 'darwin') {
        openCommand = `open "${url}"`;
    } else {
        openCommand = `xdg-open "${url}"`;
    }

    try {
        cp.execSync(openCommand, {
            stdio: 'ignore',
            windowsHide: true
        });
    } catch (error) {
        console.error('Failed to open browser:', error.message);
    }
}

/**
 * Main function
 */
async function main() {
    const args = process.argv.slice(2);

    if (args.length < 2) {
        console.error('Usage: open-diff-editor.js <file-path> <work-dir>');
        process.exit(1);
    }

    const filePath = args[0];
    const workDir = args[1];

    console.log(`File: ${filePath}`);
    console.log(`Work Dir: ${workDir}`);

    // Check if server is running
    const running = await isServerRunning(SERVER_PORT);

    if (!running) {
        console.log('Server is not running. Starting...');
        await startServer();
    } else {
        console.log('Server is already running.');
    }

    // Open file in VSCode (in case it's not open)
    openInVSCode(filePath, workDir);

    // Wait a bit for VSCode to open
    await new Promise(resolve => setTimeout(resolve, 500));

    // Open diff editor in browser
    openDiffEditor(filePath, workDir);

    console.log('Done!');
}

main().catch(error => {
    console.error('Error:', error);
    process.exit(1);
});
