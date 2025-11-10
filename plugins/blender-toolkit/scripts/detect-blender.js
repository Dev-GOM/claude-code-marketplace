const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Detect installed Blender versions across all platforms
 * @returns {Array<{version: string, path: string, major: number, minor: number}>}
 */
function detectBlenderVersions() {
  const detectedVersions = [];
  const platform = process.platform;

  // 1. Check PATH environment variable first
  const pathVersion = findBlenderInPath();
  if (pathVersion) {
    detectedVersions.push(pathVersion);
  }

  // 2. Check common installation paths
  const commonVersions = findBlenderInCommonPaths(platform);
  detectedVersions.push(...commonVersions);

  // 3. Remove duplicates based on path
  const uniqueVersions = Array.from(
    new Map(detectedVersions.map(v => [v.path, v])).values()
  );

  // 4. Sort by version (descending)
  uniqueVersions.sort((a, b) => {
    if (a.major !== b.major) return b.major - a.major;
    if (a.minor !== b.minor) return b.minor - a.minor;
    return 0;
  });

  return uniqueVersions;
}

/**
 * Find Blender in PATH environment variable
 * @returns {Object|null}
 */
function findBlenderInPath() {
  try {
    const command = process.platform === 'win32' ? 'where blender' : 'which blender';
    const output = execSync(command, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();

    if (!output) return null;

    // Take first line if multiple results
    const blenderPath = output.split('\n')[0].trim();

    if (fs.existsSync(blenderPath)) {
      const version = getBlenderVersion(blenderPath);
      return version ? { ...version, path: blenderPath } : null;
    }
  } catch (error) {
    // Command not found or error
    return null;
  }

  return null;
}

/**
 * Find Blender in common installation paths
 * @param {string} platform - process.platform
 * @returns {Array<Object>}
 */
function findBlenderInCommonPaths(platform) {
  const versions = [];

  if (platform === 'win32') {
    // Windows: C:\Program Files\Blender Foundation\Blender [version]
    const blenderRoot = 'C:\\Program Files\\Blender Foundation';

    if (fs.existsSync(blenderRoot)) {
      const entries = fs.readdirSync(blenderRoot);

      for (const entry of entries) {
        if (entry.startsWith('Blender ')) {
          const blenderPath = path.join(blenderRoot, entry, 'blender.exe');

          if (fs.existsSync(blenderPath)) {
            const version = parseVersionFromPath(entry);
            if (version) {
              versions.push({ ...version, path: blenderPath });
            }
          }
        }
      }
    }
  } else if (platform === 'darwin') {
    // macOS: /Applications/Blender.app
    const blenderPath = '/Applications/Blender.app/Contents/MacOS/Blender';

    if (fs.existsSync(blenderPath)) {
      const version = getBlenderVersion(blenderPath);
      if (version) {
        versions.push({ ...version, path: blenderPath });
      }
    }
  } else {
    // Linux: /usr/bin/blender, /usr/local/bin/blender
    const commonPaths = [
      '/usr/bin/blender',
      '/usr/local/bin/blender',
      '/snap/bin/blender',
    ];

    for (const blenderPath of commonPaths) {
      if (fs.existsSync(blenderPath)) {
        const version = getBlenderVersion(blenderPath);
        if (version) {
          versions.push({ ...version, path: blenderPath });
        }
      }
    }
  }

  return versions;
}

/**
 * Parse version from path string (e.g., "Blender 4.2" -> {version: "4.2", major: 4, minor: 2})
 * @param {string} pathStr
 * @returns {Object|null}
 */
function parseVersionFromPath(pathStr) {
  const match = pathStr.match(/Blender\s+(\d+)\.(\d+)/);

  if (match) {
    const major = parseInt(match[1], 10);
    const minor = parseInt(match[2], 10);
    return {
      version: `${major}.${minor}`,
      major,
      minor,
    };
  }

  return null;
}

/**
 * Get Blender version by executing --version command
 * @param {string} blenderPath
 * @returns {Object|null}
 */
function getBlenderVersion(blenderPath) {
  try {
    const output = execSync(`"${blenderPath}" --version`, {
      encoding: 'utf-8',
      timeout: 5000,
      stdio: ['pipe', 'pipe', 'ignore']
    });

    // Parse output: "Blender 4.2.0"
    const match = output.match(/Blender\s+(\d+)\.(\d+)\.(\d+)/);

    if (match) {
      const major = parseInt(match[1], 10);
      const minor = parseInt(match[2], 10);
      const patch = parseInt(match[3], 10);

      return {
        version: `${major}.${minor}.${patch}`,
        major,
        minor,
        patch,
      };
    }
  } catch (error) {
    // Failed to get version, try parsing from path
    return null;
  }

  return null;
}

/**
 * Format version info for display
 * @param {Object} versionInfo
 * @returns {string}
 */
function formatVersionDisplay(versionInfo) {
  const { version, path: blenderPath } = versionInfo;
  return `Blender ${version} - ${blenderPath}`;
}

/**
 * Check if Blender version meets minimum requirement (4.0+)
 * @param {Object} versionInfo
 * @returns {boolean}
 */
function meetsMinimumVersion(versionInfo) {
  return versionInfo.major >= 4;
}

module.exports = {
  detectBlenderVersions,
  findBlenderInPath,
  findBlenderInCommonPaths,
  parseVersionFromPath,
  getBlenderVersion,
  formatVersionDisplay,
  meetsMinimumVersion,
};
