#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();

// Load configuration from hooks.json
function loadConfiguration() {
  try {
    const hooksConfigPath = path.join(__dirname, '../hooks/hooks.json');
    const hooksConfig = JSON.parse(fs.readFileSync(hooksConfigPath, 'utf8'));
    return hooksConfig.configuration || {};
  } catch (error) {
    return {};
  }
}

const config = loadConfiguration();

// Output directory (priority: config > plugin env > global env > default)
const OUTPUT_DIR = config.outputDirectory
  || process.env.AUTO_DOCS_DIR
  || process.env.CLAUDE_PLUGIN_OUTPUT_DIR
  || '';

// Helper to get full path with output directory
function getOutputPath(filename) {
  if (OUTPUT_DIR) {
    const fullDir = path.isAbsolute(OUTPUT_DIR)
      ? OUTPUT_DIR
      : path.join(projectRoot, OUTPUT_DIR);

    // Create directory if it doesn't exist
    if (!fs.existsSync(fullDir)) {
      fs.mkdirSync(fullDir, { recursive: true });
    }

    return path.join(fullDir, filename);
  }
  return path.join(projectRoot, filename);
}

// State files stored in plugin directory (not in project root)
const PLUGIN_STATE_DIR = path.join(__dirname, '..', '.state');
const STATE_FILE = path.join(PLUGIN_STATE_DIR, 'structure-state.json');
const CHANGES_FILE = path.join(PLUGIN_STATE_DIR, 'structure-changes.json');

// Ensure plugin state directory exists
if (!fs.existsSync(PLUGIN_STATE_DIR)) {
  fs.mkdirSync(PLUGIN_STATE_DIR, { recursive: true });
}

// Output file goes to configured output directory
const OUTPUT_FILE = getOutputPath('.project-structure.md');

// Directories to exclude from scanning
const EXCLUDED_DIRS = config.excludeDirs || [
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '.next',
  'out',
  '.nuxt',
  'vendor',
  '.vscode',
  '.idea'
];

/**
 * Check if directory should be excluded
 */
function shouldExcludeDir(dirPath) {
  const dirName = path.basename(dirPath);
  return EXCLUDED_DIRS.includes(dirName) || dirName.startsWith('.');
}

/**
 * Scan directory structure
 */
function scanDirectory(dir, prefix = '', isLast = true) {
  const entries = [];

  try {
    const items = fs.readdirSync(dir);
    const filtered = items.filter(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        return !shouldExcludeDir(fullPath);
      }
      return true;
    });

    filtered.forEach((item, index) => {
      const fullPath = path.join(dir, item);
      const isLastItem = index === filtered.length - 1;
      const connector = isLastItem ? '└── ' : '├── ';
      const extension = isLastItem ? '    ' : '│   ';

      const stat = fs.statSync(fullPath);
      const relativePath = path.relative(projectRoot, fullPath).replace(/\\/g, '/');

      if (stat.isDirectory()) {
        entries.push({
          line: `${prefix}${connector}${item}/`,
          path: relativePath,
          type: 'directory'
        });

        const subEntries = scanDirectory(fullPath, prefix + extension, isLastItem);
        entries.push(...subEntries);
      } else {
        entries.push({
          line: `${prefix}${connector}[${item}](${relativePath})`,
          path: relativePath,
          type: 'file'
        });
      }
    });
  } catch (error) {
    // Skip directories we can't read
  }

  return entries;
}

/**
 * Load previous state
 */
function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const data = fs.readFileSync(STATE_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    // Return null if file doesn't exist or is corrupted
  }
  return null;
}

/**
 * Save state
 */
function saveState(state) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (error) {
    // Fail silently
  }
}

/**
 * Load changes
 */
function loadChanges() {
  try {
    if (fs.existsSync(CHANGES_FILE)) {
      const data = fs.readFileSync(CHANGES_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    // Return empty object
  }
  return { files: [] };
}

/**
 * Get package.json info
 */
function getPackageInfo() {
  const packagePath = path.join(projectRoot, 'package.json');

  if (!fs.existsSync(packagePath)) {
    return null;
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    return {
      name: packageJson.name || 'Unnamed Project',
      version: packageJson.version || '0.0.0',
      description: packageJson.description || '',
      scripts: packageJson.scripts || {},
      dependencies: packageJson.dependencies || {},
      devDependencies: packageJson.devDependencies || {}
    };
  } catch (error) {
    return null;
  }
}

/**
 * Generate structure documentation
 */
function generateDocumentation(structure, packageInfo) {
  const now = new Date();
  const timestamp = now.toISOString().replace('T', ' ').slice(0, 19);

  let doc = `# Project Structure\n\n`;
  doc += `**Generated**: ${timestamp}\n\n`;

  // Project info from package.json
  if (packageInfo) {
    doc += `## Project Information\n\n`;
    doc += `- **Name**: ${packageInfo.name}\n`;
    doc += `- **Version**: ${packageInfo.version}\n`;
    if (packageInfo.description) {
      doc += `- **Description**: ${packageInfo.description}\n`;
    }
    doc += `\n`;

    // Scripts
    const scripts = Object.keys(packageInfo.scripts);
    if (scripts.length > 0) {
      doc += `## Available Scripts\n\n`;
      scripts.forEach(script => {
        doc += `- \`npm run ${script}\`: ${packageInfo.scripts[script]}\n`;
      });
      doc += `\n`;
    }

    // Dependencies
    const deps = Object.keys(packageInfo.dependencies);
    const devDeps = Object.keys(packageInfo.devDependencies);

    if (deps.length > 0 || devDeps.length > 0) {
      doc += `## Dependencies\n\n`;

      if (deps.length > 0) {
        doc += `### Production (${deps.length})\n\n`;
        deps.forEach(dep => {
          doc += `- ${dep}: \`${packageInfo.dependencies[dep]}\`\n`;
        });
        doc += `\n`;
      }

      if (devDeps.length > 0) {
        doc += `### Development (${devDeps.length})\n\n`;
        devDeps.forEach(dep => {
          doc += `- ${dep}: \`${packageInfo.devDependencies[dep]}\`\n`;
        });
        doc += `\n`;
      }
    }
  }

  // Directory structure
  doc += `## Directory Structure\n\n`;
  doc += `${path.basename(projectRoot)}/\n`;
  structure.forEach(entry => {
    doc += `${entry.line}\n`;
  });

  return doc;
}

/**
 * Main function
 */
function main() {
  const changes = loadChanges();
  const previousState = loadState();
  const isFirstRun = !previousState;

  // Check if we need to regenerate
  if (!isFirstRun && changes.files.length === 0) {
    // No changes, exit silently
    return;
  }

  // Scan directory structure
  const structure = scanDirectory(projectRoot);

  // Get package.json info
  const packageInfo = getPackageInfo();

  // Generate documentation
  const documentation = generateDocumentation(structure, packageInfo);

  // Save documentation
  fs.writeFileSync(OUTPUT_FILE, documentation, 'utf8');

  // Save new state (file list for future comparison)
  const newState = {
    files: structure.map(entry => entry.path),
    lastUpdated: new Date().toISOString()
  };
  saveState(newState);

  // Clean up changes file
  try {
    if (fs.existsSync(CHANGES_FILE)) {
      fs.unlinkSync(CHANGES_FILE);
    }
  } catch (error) {
    // Fail silently
  }

  // Generate message for user
  let message = '';
  if (isFirstRun) {
    message = `📚 Auto-Docs: Generated project structure documentation (${structure.filter(e => e.type === 'file').length} files)`;
  } else {
    message = `📚 Auto-Docs: Updated project structure (${changes.files.length} file(s) changed)`;
  }

  console.log(JSON.stringify({
    systemMessage: message,
    continue: true
  }));
}

main();
