#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

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
  '.py', '.java', '.go', '.rb', '.php',
  '.c', '.cpp', '.h', '.hpp',
  '.cs',                              // C#
  '.kt', '.kts',                      // Kotlin
  '.swift',                           // Swift
  '.rs',                              // Rust
  '.scala',                           // Scala
  '.dart',                            // Dart
  '.m', '.mm',                        // Objective-C
  '.css', '.scss', '.sass', '.less',
  '.html', '.vue', '.svelte',
  '.r', '.R', '.jl', '.coffee',
  '.sh', '.bash', '.ps1',
  '.toml', '.ini', '.yaml', '.yml'
  // Note: .md and .txt files are excluded to avoid false positives from headers
];

// Patterns to search for
const TODO_PATTERNS = [
  /\/\/\s*(TODO|FIXME|HACK|XXX|NOTE|BUG)[\s:]+(.+)/gi,
  /\/\*\s*(TODO|FIXME|HACK|XXX|NOTE|BUG)[\s:]+(.+?)\*\//gi,
  /<!--\s*(TODO|FIXME|HACK|XXX|NOTE|BUG)[\s:]+(.+?)-->/gi
];

// Python/Shell style comments (excluding markdown headers)
const SCRIPT_TODO_PATTERN = /^[^#]*#\s*(TODO|FIXME|HACK|XXX|NOTE|BUG)[\s:]+(.+)/gi;

function shouldExcludeDir(dirPath) {
  const dirName = path.basename(dirPath);
  return EXCLUDED_DIRS.includes(dirName) || dirName.startsWith('.');
}

function hasValidExtension(filePath) {
  const ext = path.extname(filePath);
  const fileName = path.basename(filePath);

  // Check special files without extensions
  const specialFiles = ['Makefile', 'Dockerfile', 'Rakefile', 'Gemfile', 'Vagrantfile'];
  if (specialFiles.includes(fileName)) {
    return true;
  }

  return EXTENSIONS.includes(ext);
}

function findTodosInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const todos = [];
    const ext = path.extname(filePath);
    const fileName = path.basename(filePath);

    // Languages that use # for comments (excluding markdown and text files)
    const hashCommentExtensions = [
      '.py',           // Python
      '.sh', '.bash',  // Shell
      '.rb',           // Ruby
      '.pl',           // Perl
      '.php',          // PHP (also supports # comments)
      '.r', '.R',      // R
      '.jl',           // Julia
      '.coffee',       // CoffeeScript
      '.ps1',          // PowerShell
      '.yaml', '.yml', // YAML
      '.toml',         // TOML
      '.ini'           // INI
    ];

    // Special files that use # for comments
    const hashCommentFiles = ['Makefile', 'Dockerfile', 'Rakefile', 'Gemfile', 'Vagrantfile'];

    const usesHashComments = hashCommentExtensions.includes(ext) || hashCommentFiles.includes(fileName);

    lines.forEach((line, index) => {
      // Apply common patterns (JS, CSS, HTML comments)
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

      // Apply # comment pattern only for languages that use it (not markdown)
      if (usesHashComments) {
        const scriptMatches = [...line.matchAll(SCRIPT_TODO_PATTERN)];
        scriptMatches.forEach(match => {
          todos.push({
            file: path.relative(projectRoot, filePath),
            line: index + 1,
            type: match[1].toUpperCase(),
            message: match[2].trim(),
            fullLine: line.trim()
          });
        });
      }
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

  // Add quick list at the top
  report += `## Quick List\n\n\`\`\`\n`;
  todos.forEach(todo => {
    report += `${todo.file}:${todo.line}: [${todo.type}] ${todo.message}\n`;
  });
  report += `\`\`\`\n\n---\n\n`;

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
      // Convert backslashes to forward slashes for cross-platform compatibility
      const fileLink = todo.file.replace(/\\/g, '/');
      report += `- **[${todo.file}:${todo.line}](${fileLink}#L${todo.line})**\n`;
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
      // Convert backslashes to forward slashes for cross-platform compatibility
      const fileLink = file.replace(/\\/g, '/');
      report += `- [${file}](${fileLink}): ${count} item(s)\n`;
    });

  return report;
}

function askUser(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase().trim());
    });
  });
}

async function main() {
  // Ask user for permission
  console.log('\n📋 TODO Collector wants to scan your project for TODO/FIXME comments.');
  const answer = await askUser('Run TODO scan? (Y/n): ');

  if (answer === 'n' || answer === 'no') {
    console.log('TODO scan skipped by user.');
    const hookResult = {
      systemMessage: 'TODO Collector: Scan skipped by user',
      continue: true
    };
    console.log(JSON.stringify(hookResult));
    return;
  }

  // Console output for debugging/logs
  console.error('\n' + '='.repeat(60));
  console.error('📋 TODO Collector - Scanning project...');
  console.error('='.repeat(60));

  const todos = walkDirectory(projectRoot);
  const report = generateReport(todos);

  // Save to file
  const outputPath = path.join(projectRoot, '.todos-report.md');
  fs.writeFileSync(outputPath, report, 'utf8');

  // Console logs for debugging
  console.error('\n' + '─'.repeat(60));
  if (todos.length > 0) {
    console.error(`✓ Found ${todos.length} TODO/FIXME comment(s)`);

    // Group by type and show summary
    const grouped = todos.reduce((acc, todo) => {
      acc[todo.type] = (acc[todo.type] || 0) + 1;
      return acc;
    }, {});

    Object.keys(grouped).sort().forEach(type => {
      console.error(`  - ${type}: ${grouped[type]}`);
    });

    console.error(`\n📄 Report generated: .todos-report.md`);
  } else {
    console.error('✓ No TODO/FIXME comments found');
  }
  console.error('='.repeat(60) + '\n');

  // Output JSON message for Claude Code to display to user
  let message = '';
  if (todos.length > 0) {
    const grouped = todos.reduce((acc, todo) => {
      acc[todo.type] = (acc[todo.type] || 0) + 1;
      return acc;
    }, {});

    const summary = Object.keys(grouped).sort().map(type =>
      `${type}: ${grouped[type]}`
    ).join(', ');

    message = `📋 TODO Collector found ${todos.length} item(s) (${summary}). Report saved to .todos-report.md`;
  } else {
    message = '✓ TODO Collector: No TODO/FIXME comments found in project';
  }

  // Output JSON for Claude Code hook system
  const hookResult = {
    systemMessage: message,
    continue: true
  };

  console.log(JSON.stringify(hookResult));
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
