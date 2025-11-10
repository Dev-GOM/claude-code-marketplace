#!/usr/bin/env node

/**
 * Initialize Blender Toolkit project configuration at session start.
 * This script is called by the SessionStart hook to automatically register
 * the current project in the shared configuration file.
 *
 * Only runs on 'startup' source - skips 'resume', 'clear', 'compact' events.
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const { createLogger } = require('./logger');
const processUtils = require('./process-utils');

// Get hookInput early to determine project name
let hookInput = null;
try {
  if (process.argv[2]) {
    hookInput = JSON.parse(process.argv[2]);
  }
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.warn('Failed to parse hook input JSON:', errorMessage);
}

// Get project name early for logging
let projectName = null;
if (process.env.CLAUDE_PROJECT_DIR) {
  projectName = path.basename(process.env.CLAUDE_PROJECT_DIR);
} else if (hookInput && hookInput.cwd) {
  projectName = path.basename(hookInput.cwd);
}

const logger = createLogger('init-log.txt', 'Blender Toolkit Initialization Log', projectName || 'unknown');

/**
 * Get local timestamp string
 */
function getLocalTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Get project root from environment variable or hook input
 */
function getProjectRoot(hookInput) {
  let projectRoot = process.env.CLAUDE_PROJECT_DIR;

  if (!projectRoot && hookInput && hookInput.cwd) {
    projectRoot = hookInput.cwd;
    logger.log('Using cwd from hook input as project root');
  }

  if (!projectRoot) {
    logger.error('Error: Could not determine project root');
    logger.error('CLAUDE_PROJECT_DIR not set and no cwd in hook input');
    logger.close();
    process.exit(1);
  }

  return processUtils.validateProjectRoot(projectRoot, logger);
}

/**
 * Get project name from root folder name
 */
function getProjectName(projectRoot) {
  return path.basename(projectRoot);
}

/**
 * Sleep utility
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get shared config file path
 */
function getSharedConfigPath() {
  const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT;
  if (!pluginRoot) {
    logger.error('Error: CLAUDE_PLUGIN_ROOT not set');
    logger.close();
    process.exit(1);
  }

  return path.join(pluginRoot, 'skills', 'blender-config.json');
}

/**
 * Load shared configuration
 */
function loadSharedConfig() {
  const configPath = getSharedConfigPath();

  if (!fs.existsSync(configPath)) {
    logger.log('Shared config not found, returning empty config');
    return { projects: {} };
  }

  try {
    const data = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    logger.error('Error loading config: ' + error.message);
    return { projects: {} };
  }
}

/**
 * Save shared configuration
 */
function saveSharedConfig(config) {
  const configPath = getSharedConfigPath();

  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
    logger.log('Shared config saved successfully');
  } catch (error) {
    logger.error('Error saving config: ' + error.message);
    logger.close();
    process.exit(1);
  }
}

/**
 * Check if a port is available
 */
async function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = require('net').createServer();

    server.once('error', () => {
      resolve(false);
    });

    server.once('listening', () => {
      server.close();
      resolve(true);
    });

    server.listen(port, '127.0.0.1');
  });
}

/**
 * Find available port
 */
async function findAvailablePort(usedPorts, basePort = 9400) {
  let port = basePort;

  while (usedPorts.includes(port) || !(await isPortAvailable(port))) {
    port++;
    if (port > basePort + 100) {
      throw new Error(`No available port found in range ${basePort}-${basePort + 100}`);
    }
  }

  return port;
}

/**
 * Create .blender-toolkit output directory in project root
 */
function createOutputDirectory(projectRoot) {
  const outputDir = path.join(projectRoot, '.blender-toolkit');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const gitignorePath = path.join(outputDir, '.gitignore');
  if (!fs.existsSync(gitignorePath)) {
    const gitignoreContent = `# Blender Toolkit generated files
*
`;
    fs.writeFileSync(gitignorePath, gitignoreContent, 'utf-8');
  }
}

/**
 * Create CLI wrapper script for easy command execution
 */
function createWrapperScript(projectRoot) {
  const wrapperPath = path.join(projectRoot, '.blender-toolkit', 'bt.js');

  const wrapperContent = `#!/usr/bin/env node

/**
 * Blender Toolkit CLI Wrapper
 *
 * This wrapper script forwards all arguments to the local CLI installation.
 * Auto-generated by blender-toolkit SessionStart hook.
 *
 * Usage: node .blender-toolkit/bt.js <command> [options]
 */

const path = require('path');

// Set CLAUDE_PROJECT_DIR to project root (parent of .blender-toolkit)
process.env.CLAUDE_PROJECT_DIR = path.resolve(__dirname, '..');

// Get the actual CLI path (future implementation)
const cliPath = path.join(__dirname, 'skills', 'scripts', 'dist', 'cli', 'cli.js');

// Forward to the actual CLI (when implemented)
if (require('fs').existsSync(cliPath)) {
  require(cliPath);
} else {
  console.error('Blender Toolkit CLI not yet implemented');
  console.error('Use the skill through Claude Code instead');
  process.exit(1);
}
`;

  fs.writeFileSync(wrapperPath, wrapperContent, 'utf-8');
  logger.log('Created CLI wrapper: .blender-toolkit/bt.js');
}

/**
 * Initialize local scripts in project .blender-toolkit directory
 */
async function initializeLocalScripts(projectRoot) {
  const localSkillsPath = path.join(projectRoot, '.blender-toolkit/skills/scripts');
  const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT;

  if (!pluginRoot) {
    logger.error('CLAUDE_PLUGIN_ROOT not available, skipping local scripts initialization');
    return;
  }

  const pluginScriptsPath = path.join(pluginRoot, 'skills/blender-retargeting/scripts');
  const pluginPackageJson = path.join(pluginScriptsPath, 'package.json');

  if (!fs.existsSync(pluginPackageJson)) {
    logger.error('Plugin scripts not found at: ' + pluginScriptsPath);
    return;
  }

  const pluginVersion = JSON.parse(fs.readFileSync(pluginPackageJson, 'utf-8')).version;
  logger.log('Plugin scripts version: ' + pluginVersion);

  let needsUpdate = false;

  if (fs.existsSync(localSkillsPath)) {
    const localPackageJson = path.join(localSkillsPath, 'package.json');
    if (fs.existsSync(localPackageJson)) {
      const localVersion = JSON.parse(fs.readFileSync(localPackageJson, 'utf-8')).version;
      logger.log('Local scripts version: ' + localVersion);
      needsUpdate = pluginVersion !== localVersion;
    } else {
      needsUpdate = true;
    }
  } else {
    logger.log('Local scripts not found, initializing...');
    needsUpdate = true;
  }

  if (!needsUpdate) {
    logger.log('✅ Local scripts up-to-date (v' + pluginVersion + ')');
    return;
  }

  logger.log('Updating local scripts to v' + pluginVersion + '...');

  // Wait for deletion helper
  async function waitForDeletion(targetPath, maxWaitMs = 5000) {
    const startTime = Date.now();
    while (fs.existsSync(targetPath)) {
      if (Date.now() - startTime > maxWaitMs) {
        throw new Error('Timeout waiting for deletion: ' + targetPath);
      }
      await sleep(100);
    }
  }

  // Remove entire .blender-toolkit/skills folder
  logger.log('[STEP 1] Removing .blender-toolkit/skills folder...');
  const skillsDir = path.join(projectRoot, '.blender-toolkit/skills');

  if (fs.existsSync(skillsDir)) {
    const scriptsPath = path.join(skillsDir, 'scripts');

    if (fs.existsSync(scriptsPath)) {
      try {
        logger.log('[STEP 1-a] Pre-cleanup: Removing dist and node_modules...');

        const rimraf = spawn('npx', ['rimraf', '.blender-toolkit/skills/scripts/dist', '.blender-toolkit/skills/scripts/node_modules'], {
          cwd: projectRoot,
          stdio: 'ignore'
        });

        let timeoutId;
        const executionPromise = new Promise((resolve, reject) => {
          rimraf.on('close', (code) => {
            clearTimeout(timeoutId);
            if (code === 0) {
              resolve();
            } else {
              reject(new Error(`rimraf exited with code ${code}`));
            }
          });

          rimraf.on('error', (error) => {
            clearTimeout(timeoutId);
            reject(error);
          });
        });

        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => {
            rimraf.kill('SIGTERM');
            reject(new Error('rimraf timed out after 30 seconds'));
          }, 30000);
        });

        await Promise.race([executionPromise, timeoutPromise]);
        await sleep(500);

        const distDir = path.join(scriptsPath, 'dist');
        const nodeModulesDir = path.join(scriptsPath, 'node_modules');

        const maxWait = 20000;
        const startTime = Date.now();
        while ((fs.existsSync(distDir) || fs.existsSync(nodeModulesDir)) &&
               (Date.now() - startTime < maxWait)) {
          await sleep(100);
        }

        if (fs.existsSync(distDir) || fs.existsSync(nodeModulesDir)) {
          throw new Error('Folders still exist after rimraf completion');
        }

        logger.log('✓ dist and node_modules removed');
      } catch (error) {
        logger.log('Failed to remove dist/node_modules: ' + error.message);
        try {
          const distDir = path.join(scriptsPath, 'dist');
          const nodeModulesDir = path.join(scriptsPath, 'node_modules');
          if (fs.existsSync(distDir)) fs.rmSync(distDir, { recursive: true, force: true });
          if (fs.existsSync(nodeModulesDir)) fs.rmSync(nodeModulesDir, { recursive: true, force: true });
          logger.log('✓ dist and node_modules removed (fallback)');
        } catch (fallbackError) {
          logger.log('Fallback also failed: ' + fallbackError.message);
        }
      }
    }

    logger.log('[STEP 1-b] Removing skills folder...');
    const maxDeleteRetries = 3;
    let lastDeleteError;

    for (let attempt = 1; attempt <= maxDeleteRetries; attempt++) {
      try {
        fs.rmSync(skillsDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 500 });
        await waitForDeletion(skillsDir);
        lastDeleteError = null;
        break;
      } catch (error) {
        lastDeleteError = error;
        logger.log('Delete attempt ' + attempt + ' failed: ' + error.message);

        if (attempt < maxDeleteRetries) {
          logger.log('Waiting 2 seconds before retry...');
          await sleep(2000);
        }
      }
    }

    if (lastDeleteError) {
      throw new Error('Failed to delete .blender-toolkit/skills folder after ' + maxDeleteRetries + ' attempts');
    }
  }

  if (!fs.existsSync(skillsDir)) {
    logger.log('✓ [STEP 1] Skills folder removed successfully');
  } else {
    throw new Error('Folder still exists after deletion');
  }

  // Create fresh directory structure and copy files
  logger.log('[STEP 2] Creating directory structure...');
  fs.mkdirSync(localSkillsPath, { recursive: true });
  logger.log('✓ Directory created: ' + localSkillsPath);

  logger.log('[STEP 2] Copying source files...');
  const maxRetries = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      fs.cpSync(path.join(pluginScriptsPath, 'src'), path.join(localSkillsPath, 'src'), {
        recursive: true,
        force: true
      });
      fs.copyFileSync(path.join(pluginScriptsPath, 'package.json'), path.join(localSkillsPath, 'package.json'));
      fs.copyFileSync(path.join(pluginScriptsPath, 'tsconfig.json'), path.join(localSkillsPath, 'tsconfig.json'));
      lastError = null;
      break;
    } catch (error) {
      lastError = error;
      logger.log('Copy attempt ' + attempt + ' failed: ' + error.message);
      if (attempt < maxRetries) {
        logger.log('Retrying in 300ms...');
        await sleep(300);
      }
    }
  }

  if (lastError) {
    throw new Error('Failed to copy files after ' + maxRetries + ' attempts: ' + lastError.message);
  }

  // Verify all files were copied
  logger.log('[STEP 3] Verifying copied files...');
  const requiredFiles = [
    path.join(localSkillsPath, 'package.json'),
    path.join(localSkillsPath, 'tsconfig.json'),
    path.join(localSkillsPath, 'src')
  ];

  const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));

  if (missingFiles.length > 0) {
    throw new Error('File verification failed. Missing files: ' + missingFiles.join(', '));
  }

  logger.log('✓ [STEP 3] All files copied and verified successfully');

  // Install dependencies and build
  logger.log('[STEP 4] Installing dependencies...');
  try {
    execSync('npm install', { cwd: localSkillsPath, stdio: 'inherit' });
    logger.log('✓ [STEP 4] Dependencies installed');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('npm install failed:', errorMessage);
    throw new Error(`Failed to install dependencies: ${errorMessage}`);
  }

  logger.log('[STEP 4] Building scripts...');
  try {
    execSync('npm run build', { cwd: localSkillsPath, stdio: 'inherit' });
    logger.log('✓ [STEP 4] Build completed');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('npm run build failed:', errorMessage);
    throw new Error(`Failed to build scripts: ${errorMessage}`);
  }

  logger.log('✅ Local scripts initialized successfully (v' + pluginVersion + ')');
}

/**
 * Initialize project configuration
 */
async function initializeProject(hookInput) {
  logger.log('Blender Toolkit: Starting initialization...');

  const projectRoot = getProjectRoot(hookInput);
  const projectName = getProjectName(projectRoot);
  const sharedConfig = loadSharedConfig();

  logger.log('Blender Toolkit: Project: ' + projectName);
  logger.log('Blender Toolkit: Root: ' + projectRoot);

  // Always ensure .blender-toolkit directory exists
  createOutputDirectory(projectRoot);

  // Initialize local scripts
  await initializeLocalScripts(projectRoot);

  // Create CLI wrapper script
  createWrapperScript(projectRoot);

  // Normalize project root path for consistent comparison
  const normalizedProjectRoot = path.normalize(projectRoot);

  // Check if project already exists by rootPath
  const existingEntry = Object.entries(sharedConfig.projects).find(
    ([_, config]) => path.normalize(config.rootPath) === normalizedProjectRoot
  );

  if (existingEntry) {
    const [existingName, config] = existingEntry;

    if (existingName !== projectName) {
      delete sharedConfig.projects[existingName];
      sharedConfig.projects[projectName] = config;
      saveSharedConfig(sharedConfig);
      logger.log(`✅ Blender Toolkit: Updated project name: ${existingName} → ${projectName}`);
    } else {
      config.lastUsed = getLocalTimestamp();
      saveSharedConfig(sharedConfig);
      logger.log(`✅ Blender Toolkit: Project "${projectName}" ready (Port: ${config.port})`);
    }

    return;
  }

  // Check if name already exists with different path
  if (sharedConfig.projects[projectName]) {
    const existingPath = path.normalize(sharedConfig.projects[projectName].rootPath);
    if (existingPath !== normalizedProjectRoot) {
      logger.warn(`⚠️  Blender Toolkit: Project name "${projectName}" already exists with different path`);
      logger.warn(`   Existing: ${existingPath}`);
      logger.warn(`   Current:  ${normalizedProjectRoot}`);
      return;
    }
  }

  // Create new project config
  const basePort = parseInt(process.env.BLENDER_WS_PORT || '9400');
  const usedPorts = Object.values(sharedConfig.projects).map(p => p.port);
  const port = await findAvailablePort(usedPorts, basePort);

  const projectConfig = {
    rootPath: normalizedProjectRoot,
    port: port,
    outputDir: '.blender-toolkit',
    lastUsed: getLocalTimestamp(),
    autoCleanup: false
  };

  sharedConfig.projects[projectName] = projectConfig;
  saveSharedConfig(sharedConfig);

  logger.log(`✅ Blender Toolkit: Registered project "${projectName}"`);
  logger.log(`   Port: ${port}`);
  logger.log(`   Output: ${projectConfig.outputDir}`);
}

/**
 * Read hook input from stdin
 */
async function readHookInput() {
  return new Promise((resolve) => {
    let data = '';

    process.stdin.on('data', chunk => {
      data += chunk;
    });

    process.stdin.on('end', () => {
      try {
        const input = JSON.parse(data);
        resolve(input);
      } catch (error) {
        resolve({});
      }
    });

    setTimeout(() => {
      process.stdin.removeAllListeners();
      resolve({});
    }, 100);
  });
}

/**
 * Acquire lock file
 */
async function acquireLock(projectRoot) {
  const lockFile = path.join(projectRoot, '.blender-toolkit', '.init.lock');
  const maxWait = 30000;
  const checkInterval = 500;
  const startTime = Date.now();
  const STALE_LOCK_TIMEOUT = 120000;

  while (fs.existsSync(lockFile)) {
    try {
      const stats = fs.statSync(lockFile);
      const age = Date.now() - stats.mtimeMs;
      if (age > STALE_LOCK_TIMEOUT) {
        logger.log(`Removing stale lock file (age: ${Math.floor(age / 1000)}s)`);
        fs.unlinkSync(lockFile);
        break;
      }
    } catch (error) {
      break;
    }

    if (Date.now() - startTime > maxWait) {
      throw new Error('Timeout waiting for lock file');
    }

    logger.log('Waiting for another init process to complete...');
    await sleep(checkInterval);
  }

  const lockDir = path.dirname(lockFile);
  if (!fs.existsSync(lockDir)) {
    fs.mkdirSync(lockDir, { recursive: true });
  }
  fs.writeFileSync(lockFile, String(process.pid));
  logger.log('Lock acquired (PID: ' + process.pid + ')');

  return lockFile;
}

/**
 * Release lock file
 */
function releaseLock(lockFile) {
  try {
    if (fs.existsSync(lockFile)) {
      fs.unlinkSync(lockFile);
      logger.log('Lock released');
    }
  } catch (error) {
    logger.log('Failed to release lock: ' + error.message);
  }
}

// Main execution
(async () => {
  let lockFile = null;

  const cleanup = (signal) => {
    logger.log('Received ' + signal + ', cleaning up...');
    if (lockFile) {
      releaseLock(lockFile);
    }
    logger.close();
    process.exit(1);
  };

  process.on('SIGINT', () => cleanup('SIGINT'));
  process.on('SIGTERM', () => cleanup('SIGTERM'));

  if (process.platform !== 'win32') {
    process.on('SIGHUP', () => cleanup('SIGHUP'));
  }

  try {
    const hookInput = await readHookInput();

    logger.log('Hook input: ' + JSON.stringify(hookInput));
    logger.log('CLAUDE_PROJECT_DIR env: ' + (process.env.CLAUDE_PROJECT_DIR || 'NOT SET'));

    // Skip only 'clear' and 'compact' events
    if (hookInput.source === 'clear' || hookInput.source === 'compact') {
      logger.log('Skipping event: ' + hookInput.source);
      logger.close();
      process.exit(0);
    }

    const projectRoot = getProjectRoot(hookInput);
    lockFile = await acquireLock(projectRoot);

    await initializeProject(hookInput);

    logger.close();
    releaseLock(lockFile);
    process.exit(0);
  } catch (error) {
    logger.error('Error initializing Blender Toolkit: ' + error.message);
    logger.error('Stack: ' + error.stack);
    logger.close();
    if (lockFile) releaseLock(lockFile);
    process.exit(1);
  }
})();
