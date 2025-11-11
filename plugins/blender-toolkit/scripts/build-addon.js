#!/usr/bin/env node

/**
 * Blender Addon Builder
 *
 * Packages the addon folder into a ZIP file for distribution.
 * Can be run standalone or called from init-config.js during SessionStart.
 *
 * Usage:
 *   node build-addon.js [--project-root <path>] [--output-dir <path>]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Import logger
const { createLogger } = require('./logger');

// Create logger instance
const logger = createLogger('build-addon-log.txt', 'Blender Addon Build Log');

/**
 * Get plugin root directory
 */
function getPluginRoot() {
  const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT;
  if (pluginRoot) {
    return pluginRoot;
  }
  // Fallback: assume script is in scripts/ folder
  return path.resolve(__dirname, '..');
}

/**
 * Get version from plugin.json
 */
function getVersion() {
  const pluginRoot = getPluginRoot();
  const pluginJsonPath = path.join(pluginRoot, '.claude-plugin', 'plugin.json');

  if (!fs.existsSync(pluginJsonPath)) {
    logger.log('Warning: plugin.json not found, using version "unknown"');
    return 'unknown';
  }

  try {
    const pluginJson = JSON.parse(fs.readFileSync(pluginJsonPath, 'utf-8'));
    return pluginJson.version || 'unknown';
  } catch (error) {
    logger.log(`Warning: Could not read version from plugin.json: ${error.message}`);
    return 'unknown';
  }
}

/**
 * Install dependencies to libs folder
 */
function installDependencies(addonRoot) {
  const libsDir = path.join(addonRoot, 'libs');

  logger.log('Installing Python dependencies...');

  // Create libs directory if it doesn't exist
  if (!fs.existsSync(libsDir)) {
    fs.mkdirSync(libsDir, { recursive: true });
  }

  try {
    // Install aiohttp and its dependencies
    // Use --trusted-host to bypass SSL certificate issues
    execSync(`python -m pip install --target "${libsDir}" --trusted-host pypi.org --trusted-host files.pythonhosted.org aiohttp`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    logger.log('✓ Dependencies installed to libs folder');
    return true;
  } catch (error) {
    logger.error('Failed to install dependencies: ' + error.message);
    if (error.stderr) {
      logger.error('stderr: ' + error.stderr);
    }
    return false;
  }
}

/**
 * Create ZIP file using Python (cross-platform)
 */
function createZipWithPython(addonRoot, outputPath) {
  const pythonScript = `import sys
import zipfile
from pathlib import Path

addon_root = Path(r"${addonRoot.replace(/\\/g, '\\\\')}")
output_path = Path(r"${outputPath.replace(/\\/g, '\\\\')}")

# Ensure output directory exists
output_path.parent.mkdir(parents=True, exist_ok=True)

# Collect files
files_to_add = []
for file_path in addon_root.rglob('*'):
    if not file_path.is_file():
        continue

    # Skip development files and caches
    name = file_path.name
    rel_parts = file_path.relative_to(addon_root).parts

    if (name in {'.pylintrc', 'pyrightconfig.json'} or
            name.endswith('.pyc') or
            '__pycache__' in file_path.parts or
            name.endswith('.dist-info') or
            (len(rel_parts) > 1 and rel_parts[0] == 'libs' and
             any(part.endswith('.dist-info') for part in rel_parts))):
        continue

    files_to_add.append(file_path)

# Create ZIP
with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for file_path in files_to_add:
        arcname = Path('blender_toolkit_addon') / file_path.relative_to(addon_root)
        zipf.write(file_path, str(arcname))

print(f"Added {len(files_to_add)} files to ZIP")
`;

  // Write Python script to temporary file
  const tempScriptPath = path.join(__dirname, 'build-addon-temp.py');

  try {
    fs.writeFileSync(tempScriptPath, pythonScript, 'utf-8');

    const result = execSync(`python -X utf8 "${tempScriptPath}"`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    logger.log(result.trim());

    // Clean up temp file
    fs.unlinkSync(tempScriptPath);

    return true;
  } catch (error) {
    logger.error('Python ZIP creation failed: ' + error.message);
    if (error.stderr) {
      logger.error('Python stderr: ' + error.stderr);
    }

    // Clean up temp file on error
    try {
      if (fs.existsSync(tempScriptPath)) {
        fs.unlinkSync(tempScriptPath);
      }
    } catch (cleanupError) {
      // Ignore cleanup errors
    }

    return false;
  }
}

/**
 * Check if ZIP already exists with the same version
 */
function zipExistsForVersion(outputDir, version) {
  const zipFilename = `blender-toolkit-addon-v${version}.zip`;
  const zipPath = path.join(outputDir, zipFilename);
  return fs.existsSync(zipPath);
}

/**
 * Build addon ZIP file
 */
function buildAddonZip(projectRoot = null, outputDir = null, force = false) {
  // Determine paths
  if (!projectRoot) {
    projectRoot = process.cwd();
  }

  if (!outputDir) {
    outputDir = path.join(projectRoot, '.blender-toolkit');
  }

  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Get current version
  const version = getVersion();
  const zipFilename = `blender-toolkit-addon-v${version}.zip`;
  const zipPath = path.join(outputDir, zipFilename);

  // Check if ZIP already exists for this version
  if (!force && zipExistsForVersion(outputDir, version)) {
    logger.log(`✓ Addon ZIP already exists for v${version}`);
    logger.log(`  Path: ${zipPath}`);
    return zipPath;
  }

  logger.log('Building Blender addon ZIP...');

  // Addon source directory
  const pluginRoot = getPluginRoot();
  const addonRoot = path.join(pluginRoot, 'skills', 'addon');

  if (!fs.existsSync(addonRoot)) {
    logger.error(`Addon directory not found: ${addonRoot}`);
    return null;
  }

  logger.log(`  Source: ${addonRoot}`);
  logger.log(`  Output: ${zipPath}`);

  // Remove old ZIP files with different versions
  try {
    const files = fs.readdirSync(outputDir);
    for (const file of files) {
      if (file.startsWith('blender-toolkit-addon-v') && file.endsWith('.zip') && file !== zipFilename) {
        const oldZipPath = path.join(outputDir, file);
        fs.unlinkSync(oldZipPath);
        logger.log(`  Removed old ZIP: ${file}`);
      }
    }
  } catch (error) {
    logger.log(`  Warning: Could not clean old ZIPs: ${error.message}`);
  }

  // Install Python dependencies to libs folder
  const depsInstalled = installDependencies(addonRoot);
  if (!depsInstalled) {
    logger.error('Failed to install dependencies - addon may not work properly');
    // Continue anyway - user can install manually
  }

  // Create ZIP using Python for better cross-platform support
  const success = createZipWithPython(addonRoot, zipPath);

  if (!success) {
    logger.error('Failed to create addon ZIP');
    return null;
  }

  // Print summary
  const stats = fs.statSync(zipPath);
  const sizeKB = (stats.size / 1024).toFixed(1);

  logger.log('');
  logger.log('✓ Addon ZIP created successfully!');
  logger.log(`  Version: ${version}`);
  logger.log(`  Size: ${sizeKB} KB`);
  logger.log(`  Path: ${zipPath}`);

  return zipPath;
}

/**
 * Main entry point
 */
function main() {
  const args = process.argv.slice(2);
  let projectRoot = null;
  let outputDir = null;
  let force = false;

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--project-root' && i + 1 < args.length) {
      projectRoot = args[i + 1];
      i++;
    } else if (args[i] === '--output-dir' && i + 1 < args.length) {
      outputDir = args[i + 1];
      i++;
    } else if (args[i] === '--force' || args[i] === '-f') {
      force = true;
    }
  }

  try {
    const zipPath = buildAddonZip(projectRoot, outputDir, force);
    if (zipPath) {
      logger.close();
      process.exit(0);
    } else {
      logger.error('Build failed');
      logger.close();
      process.exit(1);
    }
  } catch (error) {
    logger.error(`Error: ${error.message}`);
    logger.close();
    process.exit(1);
  }
}

// Export for use in other scripts
module.exports = { buildAddonZip };

// Run if executed directly
if (require.main === module) {
  main();
}
