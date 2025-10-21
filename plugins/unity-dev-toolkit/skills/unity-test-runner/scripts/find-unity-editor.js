#!/usr/bin/env node

/**
 * Unity Editor Path Finder
 *
 * Cross-platform script to automatically detect Unity Editor installation paths.
 * Supports Windows, macOS, and Linux.
 *
 * Usage:
 *   node find-unity-editor.js [--version <version>] [--json]
 *
 * Options:
 *   --version <version>  Find specific Unity version (e.g., 2021.3.15f1)
 *   --json               Output results as JSON
 *
 * Output (JSON):
 * {
 *   "found": true,
 *   "editorPath": "/path/to/Unity",
 *   "version": "2021.3.15f1",
 *   "platform": "win32|darwin|linux",
 *   "allVersions": [...]
 * }
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const requestedVersion = args.includes('--version')
  ? args[args.indexOf('--version') + 1]
  : null;
const jsonOutput = args.includes('--json');

/**
 * Get default Unity installation paths for current platform
 */
function getDefaultUnityPaths() {
  const platform = process.platform;
  const home = process.env.HOME || process.env.USERPROFILE;

  switch (platform) {
    case 'win32':
      return [
        'C:\\Program Files\\Unity\\Hub\\Editor',
        'C:\\Program Files\\Unity',
        path.join(home, 'AppData', 'Local', 'Unity', 'Hub', 'Editor')
      ];

    case 'darwin':
      return [
        '/Applications/Unity/Hub/Editor',
        '/Applications/Unity',
        path.join(home, 'Applications', 'Unity', 'Hub', 'Editor')
      ];

    case 'linux':
      return [
        path.join(home, 'Unity', 'Hub', 'Editor'),
        '/opt/unity',
        '/usr/share/unity'
      ];

    default:
      return [];
  }
}

/**
 * Get Unity executable name for current platform
 */
function getUnityExecutableName() {
  const platform = process.platform;

  switch (platform) {
    case 'win32':
      return 'Unity.exe';
    case 'darwin':
      return 'Unity.app/Contents/MacOS/Unity';
    case 'linux':
      return 'Unity';
    default:
      return 'Unity';
  }
}

/**
 * Get Unity executable path from version directory
 */
function getUnityExecutablePath(versionPath) {
  const platform = process.platform;

  if (platform === 'win32') {
    return path.join(versionPath, 'Editor', 'Unity.exe');
  } else if (platform === 'darwin') {
    return path.join(versionPath, 'Unity.app', 'Contents', 'MacOS', 'Unity');
  } else {
    return path.join(versionPath, 'Editor', 'Unity');
  }
}

/**
 * Check if a path contains a valid Unity installation
 */
function isValidUnityInstallation(versionPath) {
  return fs.existsSync(getUnityExecutablePath(versionPath));
}

/**
 * Parse Unity version string for sorting
 * Format: 2021.3.15f1 -> {year: 2021, major: 3, minor: 15, build: 'f', patch: 1}
 */
function parseUnityVersion(versionStr) {
  const match = versionStr.match(/(\d+)\.(\d+)\.(\d+)([a-z])(\d+)/);
  if (!match) return null;

  return {
    year: parseInt(match[1]),
    major: parseInt(match[2]),
    minor: parseInt(match[3]),
    build: match[4],
    patch: parseInt(match[5]),
    full: versionStr
  };
}

/**
 * Compare two Unity versions
 */
function compareVersions(a, b) {
  const vA = parseUnityVersion(a);
  const vB = parseUnityVersion(b);

  if (!vA || !vB) return 0;

  if (vA.year !== vB.year) return vB.year - vA.year;
  if (vA.major !== vB.major) return vB.major - vA.major;
  if (vA.minor !== vB.minor) return vB.minor - vA.minor;
  if (vA.build !== vB.build) return vB.build.localeCompare(vA.build);
  return vB.patch - vA.patch;
}

/**
 * Scan directory for Unity installations
 */
function scanForUnityVersions(basePath) {
  if (!fs.existsSync(basePath)) {
    return [];
  }

  try {
    const entries = fs.readdirSync(basePath, { withFileTypes: true });
    const versions = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const versionPath = path.join(basePath, entry.name);

      // Check if this looks like a Unity version (e.g., 2021.3.15f1)
      if (/^\d{4}\.\d+\.\d+[a-z]\d+$/.test(entry.name) && isValidUnityInstallation(versionPath)) {
        versions.push({
          version: entry.name,
          path: versionPath,
          executablePath: getUnityExecutablePath(versionPath)
        });
      }
    }

    return versions;
  } catch (error) {
    return [];
  }
}

/**
 * Find all Unity installations
 */
function findAllUnityInstallations() {
  const searchPaths = getDefaultUnityPaths();
  const allVersions = [];

  for (const searchPath of searchPaths) {
    const versions = scanForUnityVersions(searchPath);
    allVersions.push(...versions);
  }

  // Remove duplicates based on version string
  const uniqueVersions = allVersions.filter((v, index, self) =>
    index === self.findIndex(t => t.version === v.version)
  );

  // Sort by version (newest first)
  uniqueVersions.sort((a, b) => compareVersions(a.version, b.version));

  return uniqueVersions;
}

/**
 * Find Unity Editor
 */
function findUnityEditor() {
  const allVersions = findAllUnityInstallations();

  if (allVersions.length === 0) {
    return {
      found: false,
      error: 'No Unity installations found',
      platform: process.platform,
      searchedPaths: getDefaultUnityPaths()
    };
  }

  // If specific version requested, find it
  if (requestedVersion) {
    const found = allVersions.find(v => v.version === requestedVersion);

    if (found) {
      return {
        found: true,
        editorPath: found.executablePath,
        version: found.version,
        platform: process.platform,
        allVersions: allVersions.map(v => v.version)
      };
    } else {
      return {
        found: false,
        error: `Unity version ${requestedVersion} not found`,
        platform: process.platform,
        availableVersions: allVersions.map(v => v.version)
      };
    }
  }

  // Return latest version
  const latest = allVersions[0];
  return {
    found: true,
    editorPath: latest.executablePath,
    version: latest.version,
    platform: process.platform,
    allVersions: allVersions.map(v => v.version)
  };
}

// Main execution
try {
  const result = findUnityEditor();

  if (jsonOutput) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    if (result.found) {
      console.log(`✓ Unity ${result.version} found`);
      console.log(`  Path: ${result.editorPath}`);
      console.log(`  Platform: ${result.platform}`);

      if (result.allVersions && result.allVersions.length > 1) {
        console.log(`\n  Other versions available: ${result.allVersions.slice(1).join(', ')}`);
      }
    } else {
      console.error(`✗ ${result.error}`);

      if (result.availableVersions && result.availableVersions.length > 0) {
        console.error(`\n  Available versions: ${result.availableVersions.join(', ')}`);
      } else if (result.searchedPaths) {
        console.error(`\n  Searched paths:`);
        result.searchedPaths.forEach(p => console.error(`    - ${p}`));
      }

      process.exit(1);
    }
  }
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}
