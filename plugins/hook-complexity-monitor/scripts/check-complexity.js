#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();

// Complexity thresholds
const THRESHOLDS = {
  cyclomaticComplexity: 10,  // Max cyclomatic complexity per function
  functionLength: 50,         // Max lines per function
  fileLength: 500,           // Max lines per file
  nesting: 4                 // Max nesting depth
};

// File extensions to check
const CODE_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.go', '.c', '.cpp'];

function getChangedFiles() {
  // Get the file that was just edited/written
  // This would be passed as an argument in a real hook
  // For now, we'll scan for recently modified files
  const recentFiles = [];

  try {
    const { execSync } = require('child_process');
    const gitStatus = execSync('git status --porcelain', {
      encoding: 'utf8',
      cwd: projectRoot,
      stdio: 'pipe'
    });

    gitStatus.split('\n').forEach(line => {
      const match = line.match(/^\s*[AM?]\s+(.+)$/);
      if (match) {
        const filePath = path.join(projectRoot, match[1].trim());
        if (CODE_EXTENSIONS.includes(path.extname(filePath))) {
          recentFiles.push(filePath);
        }
      }
    });
  } catch (error) {
    // If git fails, check for recently modified files
  }

  return recentFiles;
}

function calculateCyclomaticComplexity(code) {
  // Simple cyclomatic complexity calculator
  // Count decision points: if, else, case, while, for, &&, ||, ?, catch
  const patterns = [
    /\bif\s*\(/g,
    /\belse\s+if\s*\(/g,
    /\bwhile\s*\(/g,
    /\bfor\s*\(/g,
    /\bcase\s+/g,
    /\bcatch\s*\(/g,
    /&&/g,
    /\|\|/g,
    /\?/g
  ];

  let complexity = 1; // Base complexity
  patterns.forEach(pattern => {
    const matches = code.match(pattern);
    if (matches) {
      complexity += matches.length;
    }
  });

  return complexity;
}

function extractFunctions(code, filePath) {
  const functions = [];
  const ext = path.extname(filePath);

  // Different patterns for different languages
  let patterns = [];

  if (['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
    // JavaScript/TypeScript function patterns
    patterns = [
      /function\s+(\w+)\s*\([^)]*\)\s*{/g,
      /(\w+)\s*=\s*\([^)]*\)\s*=>\s*{/g,
      /(\w+)\s*:\s*\([^)]*\)\s*=>\s*{/g,
      /async\s+function\s+(\w+)\s*\([^)]*\)\s*{/g
    ];
  }

  const lines = code.split('\n');

  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(code)) !== null) {
      const functionName = match[1] || 'anonymous';
      const startPos = match.index;
      const startLine = code.substring(0, startPos).split('\n').length;

      // Try to find function end (simplified - just count braces)
      let braceCount = 1;
      let pos = match.index + match[0].length;
      let endLine = startLine;

      while (braceCount > 0 && pos < code.length) {
        if (code[pos] === '{') braceCount++;
        if (code[pos] === '}') braceCount--;
        if (code[pos] === '\n') endLine++;
        pos++;
      }

      const functionCode = code.substring(match.index, pos);
      const length = endLine - startLine + 1;
      const complexity = calculateCyclomaticComplexity(functionCode);

      functions.push({
        name: functionName,
        startLine,
        endLine,
        length,
        complexity
      });
    }
  });

  return functions;
}

function analyzeFile(filePath) {
  try {
    const code = fs.readFileSync(filePath, 'utf8');
    const lines = code.split('\n');
    const fileLength = lines.length;

    // Calculate max nesting depth
    let maxNesting = 0;
    let currentNesting = 0;

    code.split('').forEach(char => {
      if (char === '{') {
        currentNesting++;
        maxNesting = Math.max(maxNesting, currentNesting);
      } else if (char === '}') {
        currentNesting--;
      }
    });

    // Extract and analyze functions
    const functions = extractFunctions(code, filePath);

    const issues = [];

    // Check file length
    if (fileLength > THRESHOLDS.fileLength) {
      issues.push({
        type: 'FILE_LENGTH',
        severity: 'warning',
        message: `File has ${fileLength} lines (threshold: ${THRESHOLDS.fileLength})`,
        file: path.relative(projectRoot, filePath),
        line: 0
      });
    }

    // Check max nesting
    if (maxNesting > THRESHOLDS.nesting) {
      issues.push({
        type: 'NESTING',
        severity: 'warning',
        message: `Max nesting depth is ${maxNesting} (threshold: ${THRESHOLDS.nesting})`,
        file: path.relative(projectRoot, filePath),
        line: 0
      });
    }

    // Check function complexities
    functions.forEach(func => {
      if (func.complexity > THRESHOLDS.cyclomaticComplexity) {
        issues.push({
          type: 'COMPLEXITY',
          severity: 'warning',
          message: `Function '${func.name}' has complexity ${func.complexity} (threshold: ${THRESHOLDS.cyclomaticComplexity})`,
          file: path.relative(projectRoot, filePath),
          line: func.startLine
        });
      }

      if (func.length > THRESHOLDS.functionLength) {
        issues.push({
          type: 'FUNCTION_LENGTH',
          severity: 'info',
          message: `Function '${func.name}' has ${func.length} lines (threshold: ${THRESHOLDS.functionLength})`,
          file: path.relative(projectRoot, filePath),
          line: func.startLine
        });
      }
    });

    return { issues, functions, fileLength, maxNesting };
  } catch (error) {
    return { issues: [], functions: [], fileLength: 0, maxNesting: 0 };
  }
}

function main() {
  const changedFiles = getChangedFiles();

  if (changedFiles.length === 0) {
    const result = {
      systemMessage: '✓ Complexity Monitor: No code files to analyze',
      continue: true
    };
    console.log(JSON.stringify(result));
    return;
  }

  console.error(`[Complexity Monitor] Analyzing ${changedFiles.length} file(s)...`);

  let totalIssues = 0;
  const results = [];

  changedFiles.forEach(filePath => {
    const analysis = analyzeFile(filePath);
    if (analysis.issues.length > 0) {
      totalIssues += analysis.issues.length;
      results.push({ filePath, analysis });
    }
  });

  if (totalIssues === 0) {
    const result = {
      systemMessage: '✓ Complexity Monitor: No complexity issues found',
      continue: true
    };
    console.log(JSON.stringify(result));
    return;
  }

  // Log issues to stderr
  console.error(`[Complexity Monitor] ⚠ Found ${totalIssues} complexity issue(s):\n`);

  results.forEach(({ filePath, analysis }) => {
    const relPath = path.relative(projectRoot, filePath);
    console.error(`File: ${relPath}`);

    analysis.issues.forEach(issue => {
      const icon = issue.severity === 'warning' ? '⚠' : 'ℹ';
      const location = issue.line > 0 ? `:${issue.line}` : '';
      console.error(`  ${icon} ${issue.message}`);
    });
    console.error('');
  });

  // Append to log file
  const timestamp = new Date().toISOString();
  const logEntry = `\n[${timestamp}]\n` +
    results.map(({ filePath, analysis }) => {
      const relPath = path.relative(projectRoot, filePath);
      return `${relPath}:\n` +
        analysis.issues.map(i => `  - ${i.message}`).join('\n');
    }).join('\n') + '\n';

  const logPath = path.join(projectRoot, '.complexity-log.txt');
  fs.appendFileSync(logPath, logEntry, 'utf8');

  console.error('[Complexity Monitor] Log appended to: .complexity-log.txt');

  // Count warnings vs info
  let warnings = 0;
  let infos = 0;
  results.forEach(({ analysis }) => {
    analysis.issues.forEach(issue => {
      if (issue.severity === 'warning') warnings++;
      else infos++;
    });
  });

  // Output JSON for Claude Code
  const message = `⚠️ Complexity Monitor found ${totalIssues} issue(s) in ${results.length} file(s) (${warnings} warnings, ${infos} info). Check .complexity-log.txt`;
  const result = {
    systemMessage: message,
    continue: true
  };
  console.log(JSON.stringify(result));
}

main();
