#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = process.cwd();

function getRecentChanges() {
  try {
    // Get git diff statistics
    const diffStat = execSync('git diff --stat HEAD~1 2>nul || git diff --cached --stat', {
      encoding: 'utf8',
      cwd: projectRoot,
      stdio: 'pipe'
    }).trim();

    if (!diffStat) {
      return null;
    }

    // Get changed files
    const status = execSync('git status --porcelain', {
      encoding: 'utf8',
      cwd: projectRoot,
      stdio: 'pipe'
    });

    const changedFiles = [];
    status.split('\n').forEach(line => {
      const match = line.match(/^\s*[AM?]\s+(.+)$/);
      if (match) {
        changedFiles.push(match[1].trim());
      }
    });

    return {
      diffStat,
      changedFiles
    };
  } catch (error) {
    return null;
  }
}

function updateChangelog(changes) {
  const changelogPath = path.join(projectRoot, 'CHANGELOG.md');
  const timestamp = new Date().toISOString().split('T')[0];

  let changelogContent = '';

  // Check if CHANGELOG.md exists
  if (fs.existsSync(changelogPath)) {
    changelogContent = fs.readFileSync(changelogPath, 'utf8');
  } else {
    changelogContent = '# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n';
  }

  // Prepare new entry
  const newEntry = `## [Unreleased] - ${timestamp}\n\n### Changed\n${changes.changedFiles.map(file => `- Updated ${file}`).join('\n')}\n\n`;

  // Insert after header
  const lines = changelogContent.split('\n');
  let insertIndex = 0;

  // Find where to insert (after the header)
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('## ')) {
      insertIndex = i;
      break;
    }
  }

  if (insertIndex === 0) {
    // No existing entries, add after header
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === '') {
        insertIndex = i + 1;
        break;
      }
    }
  }

  lines.splice(insertIndex, 0, newEntry);
  const updatedContent = lines.join('\n');

  fs.writeFileSync(changelogPath, updatedContent, 'utf8');
  return true;
}

function analyzeProjectStructure() {
  const structure = {
    hasPackageJson: fs.existsSync(path.join(projectRoot, 'package.json')),
    hasReadme: fs.existsSync(path.join(projectRoot, 'README.md')),
    hasSrc: fs.existsSync(path.join(projectRoot, 'src')),
    hasTests: fs.existsSync(path.join(projectRoot, 'tests')) ||
              fs.existsSync(path.join(projectRoot, 'test')) ||
              fs.existsSync(path.join(projectRoot, '__tests__'))
  };

  return structure;
}

function getProjectInfo() {
  const packageJsonPath = path.join(projectRoot, 'package.json');

  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      return {
        name: packageJson.name || 'Unnamed Project',
        version: packageJson.version || '0.0.0',
        description: packageJson.description || '',
        scripts: Object.keys(packageJson.scripts || {}),
        dependencies: Object.keys(packageJson.dependencies || {}).length,
        devDependencies: Object.keys(packageJson.devDependencies || {}).length
      };
    } catch (error) {
      return null;
    }
  }

  return null;
}

function updateReadme() {
  const readmePath = path.join(projectRoot, 'README.md');
  const projectInfo = getProjectInfo();
  const structure = analyzeProjectStructure();

  if (!projectInfo) {
    console.log('[Auto-Docs] No package.json found. Skipping README update.');
    return false;
  }

  let readmeContent = '';

  if (fs.existsSync(readmePath)) {
    readmeContent = fs.readFileSync(readmePath, 'utf8');
  }

  // Check if we need to add a project info section
  const timestamp = new Date().toISOString().split('T')[0];

  // Create or update "Last Updated" section
  if (readmeContent.includes('<!-- AUTO-GENERATED-INFO -->')) {
    // Replace existing auto-generated section
    const infoSection = `<!-- AUTO-GENERATED-INFO -->
## Project Information

**Last Updated:** ${timestamp}

- **Version:** ${projectInfo.version}
- **Dependencies:** ${projectInfo.dependencies} production, ${projectInfo.devDependencies} development
- **Available Scripts:** ${projectInfo.scripts.join(', ')}

<!-- END-AUTO-GENERATED-INFO -->`;

    readmeContent = readmeContent.replace(
      /<!-- AUTO-GENERATED-INFO -->[\s\S]*?<!-- END-AUTO-GENERATED-INFO -->/,
      infoSection
    );
  } else if (readmeContent) {
    // Append auto-generated section at the end
    const infoSection = `\n\n<!-- AUTO-GENERATED-INFO -->
## Project Information

**Last Updated:** ${timestamp}

- **Version:** ${projectInfo.version}
- **Dependencies:** ${projectInfo.dependencies} production, ${projectInfo.devDependencies} development
- **Available Scripts:** ${projectInfo.scripts.join(', ')}

<!-- END-AUTO-GENERATED-INFO -->\n`;

    readmeContent += infoSection;
  } else {
    // Create new README
    readmeContent = `# ${projectInfo.name}

${projectInfo.description}

## Installation

\`\`\`bash
npm install
\`\`\`

## Usage

\`\`\`bash
${projectInfo.scripts.includes('start') ? 'npm start' : '# Add usage instructions'}
\`\`\`

## Available Scripts

${projectInfo.scripts.map(script => `- \`npm run ${script}\``).join('\n')}

<!-- AUTO-GENERATED-INFO -->
## Project Information

**Last Updated:** ${timestamp}

- **Version:** ${projectInfo.version}
- **Dependencies:** ${projectInfo.dependencies} production, ${projectInfo.devDependencies} development

<!-- END-AUTO-GENERATED-INFO -->
`;
  }

  fs.writeFileSync(readmePath, readmeContent, 'utf8');
  return true;
}

function generateDocsSummary() {
  const summaryPath = path.join(projectRoot, '.docs-summary.md');
  const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
  const changes = getRecentChanges();
  const projectInfo = getProjectInfo();

  let summary = `# Documentation Update Summary\n\n`;
  summary += `**Generated:** ${timestamp}\n\n`;

  if (projectInfo) {
    summary += `## Project: ${projectInfo.name}\n`;
    summary += `**Version:** ${projectInfo.version}\n\n`;
  }

  if (changes && changes.changedFiles.length > 0) {
    summary += `## Recent Changes (${changes.changedFiles.length} files)\n\n`;
    changes.changedFiles.forEach(file => {
      summary += `- ${file}\n`;
    });
    summary += `\n`;
  }

  summary += `## Documentation Status\n\n`;
  summary += `- README.md: ${fs.existsSync(path.join(projectRoot, 'README.md')) ? '✓ Exists' : '✗ Missing'}\n`;
  summary += `- CHANGELOG.md: ${fs.existsSync(path.join(projectRoot, 'CHANGELOG.md')) ? '✓ Exists' : '✗ Missing'}\n`;
  summary += `- package.json: ${fs.existsSync(path.join(projectRoot, 'package.json')) ? '✓ Exists' : '✗ Missing'}\n`;

  fs.writeFileSync(summaryPath, summary, 'utf8');
}

function main() {
  console.error('[Auto-Docs] Checking for documentation updates...');

  const changes = getRecentChanges();

  if (!changes || changes.changedFiles.length === 0) {
    const result = {
      systemMessage: '✓ Auto-Docs: No recent changes detected',
      continue: true
    };
    console.log(JSON.stringify(result));
    return;
  }

  const updatedFiles = [];
  let hadErrors = false;

  // Update README
  try {
    if (updateReadme()) {
      console.error('[Auto-Docs] ✓ README.md updated');
      updatedFiles.push('README.md');
    }
  } catch (error) {
    console.error('[Auto-Docs] Could not update README.md');
    hadErrors = true;
  }

  // Update CHANGELOG
  try {
    if (updateChangelog(changes)) {
      console.error('[Auto-Docs] ✓ CHANGELOG.md updated');
      updatedFiles.push('CHANGELOG.md');
    }
  } catch (error) {
    console.error('[Auto-Docs] Could not update CHANGELOG.md');
    hadErrors = true;
  }

  // Generate summary
  try {
    generateDocsSummary();
    console.error('[Auto-Docs] ✓ Documentation summary generated');
    updatedFiles.push('.docs-summary.md');
  } catch (error) {
    console.error('[Auto-Docs] Could not generate documentation summary');
    hadErrors = true;
  }

  // Output JSON for Claude Code
  let message = '';
  if (updatedFiles.length > 0) {
    message = `📝 Auto-Docs updated: ${updatedFiles.join(', ')}`;
    if (hadErrors) {
      message += ' (some errors occurred)';
    }
  } else {
    message = '⚠️ Auto-Docs: Could not update documentation files';
  }

  const result = {
    systemMessage: message,
    continue: true
  };
  console.log(JSON.stringify(result));
}

main();
