#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();

// Directories to exclude from search
const EXCLUDED_DIRS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '.next',
  '.nuxt',
  'out',
  'vendor',
  '.snapshots',
  '.claude-plugin'
];

// File extensions to search
const EXTENSIONS = [
  '.js', '.jsx', '.ts', '.tsx',
  '.py', '.java', '.go', '.rb',
  '.php', '.c', '.cpp', '.h', '.hpp',
  '.css', '.scss', '.sass', '.less',
  '.html', '.vue', '.svelte',
  '.md', '.txt'
];

// Patterns to search for
const TODO_PATTERNS = [
  /\/\/\s*(TODO|FIXME|HACK|XXX|NOTE|BUG)[\s:]+(.+)/gi,
  /\/\*\s*(TODO|FIXME|HACK|XXX|NOTE|BUG)[\s:]+(.+?)\*\//gi,
  /#\s*(TODO|FIXME|HACK|XXX|NOTE|BUG)[\s:]+(.+)/gi,
  /<!--\s*(TODO|FIXME|HACK|XXX|NOTE|BUG)[\s:]+(.+?)-->/gi
];

function shouldExcludeDir(dirPath) {
  const dirName = path.basename(dirPath);
  return EXCLUDED_DIRS.includes(dirName) || dirName.startsWith('.');
}

function hasValidExtension(filePath) {
  const ext = path.extname(filePath);
  return EXTENSIONS.includes(ext);
}

function findTodosInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const todos = [];

    lines.forEach((line, index) => {
      TODO_PATTERNS.forEach(pattern => {
        const matches = [...line.matchAll(pattern)];
        matches.forEach(match => {
          todos.push({
            file: path.relative(projectRoot, filePath),
            line: index + 1,
            type: match[1].toUpperCase(),
            message: match[2].trim(),
            fullLine: line.trim()
          });
        });
      });
    });

    return todos;
  } catch (error) {
    return [];
  }
}

function walkDirectory(dir, todos = []) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (!shouldExcludeDir(fullPath)) {
          walkDirectory(fullPath, todos);
        }
      } else if (entry.isFile() && hasValidExtension(fullPath)) {
        const fileTodos = findTodosInFile(fullPath);
        todos.push(...fileTodos);
      }
    }
  } catch (error) {
    // Skip directories we can't read
  }

  return todos;
}

function generateReport(todos) {
  const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

  let report = `# TODO/FIXME Report
Generated: ${timestamp}
Total Items: ${todos.length}

`;

  if (todos.length === 0) {
    report += 'No TODO or FIXME comments found in the project.\n';
    return report;
  }

  // Group by type
  const grouped = todos.reduce((acc, todo) => {
    if (!acc[todo.type]) {
      acc[todo.type] = [];
    }
    acc[todo.type].push(todo);
    return acc;
  }, {});

  // Generate report for each type
  Object.keys(grouped).sort().forEach(type => {
    report += `## ${type} (${grouped[type].length})\n\n`;

    grouped[type].forEach(todo => {
      report += `- **${todo.file}:${todo.line}**\n`;
      report += `  \`${todo.message}\`\n\n`;
    });
  });

  // Summary by file
  report += `\n## Summary by File\n\n`;
  const byFile = todos.reduce((acc, todo) => {
    if (!acc[todo.file]) {
      acc[todo.file] = 0;
    }
    acc[todo.file]++;
    return acc;
  }, {});

  Object.entries(byFile)
    .sort((a, b) => b[1] - a[1])
    .forEach(([file, count]) => {
      report += `- ${file}: ${count} item(s)\n`;
    });

  return report;
}

function main() {
  console.log('[TODO Collector] Scanning project for TODO/FIXME comments...');

  const todos = walkDirectory(projectRoot);
  const report = generateReport(todos);

  // Save to file
  const outputPath = path.join(projectRoot, '.todos-report.md');
  fs.writeFileSync(outputPath, report, 'utf8');

  console.log(`[TODO Collector] ✓ Found ${todos.length} TODO/FIXME comment(s)`);
  console.log(`[TODO Collector] Report saved to: .todos-report.md`);

  // Also create a simple text version
  const simpleOutput = todos.map(todo =>
    `${todo.file}:${todo.line}: [${todo.type}] ${todo.message}`
  ).join('\n');

  fs.writeFileSync(
    path.join(projectRoot, '.todos.txt'),
    simpleOutput || 'No TODOs found',
    'utf8'
  );
}

main();
