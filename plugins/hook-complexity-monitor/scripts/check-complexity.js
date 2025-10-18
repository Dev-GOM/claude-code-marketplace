#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const analyzerRegistry = require('./analyzers/registry');

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

// Complexity thresholds
const THRESHOLDS = config.thresholds || {
  cyclomaticComplexity: 10,
  functionLength: 50,
  fileLength: 500,
  nesting: 4
};

// Get supported extensions from analyzer registry
const CODE_EXTENSIONS = analyzerRegistry.getAllSupportedExtensions();

// Output configuration
const OUTPUT_DIR = config.outputDirectory
  || process.env.COMPLEXITY_LOG_DIR
  || process.env.CLAUDE_PLUGIN_OUTPUT_DIR
  || '';

// Project name for file naming (current directory name)
const PROJECT_NAME = path.basename(projectRoot);

const LOG_FILE = config.logFile || `.${PROJECT_NAME}-complexity-log.md`;

// Session file
const PLUGIN_STATE_DIR = path.join(__dirname, '..', '.state');
const SESSION_FILE = path.join(PLUGIN_STATE_DIR, `${PROJECT_NAME}-complexity-session.json`);

// Ensure plugin state directory exists
if (!fs.existsSync(PLUGIN_STATE_DIR)) {
  fs.mkdirSync(PLUGIN_STATE_DIR, { recursive: true });
}

/**
 * Read Hook Input from stdin
 */
async function readHookInput() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.on('data', chunk => { data += chunk; });
    process.stdin.on('end', () => {
      try {
        resolve(JSON.parse(data));
      } catch (error) {
        resolve(null);
      }
    });
  });
}

/**
 * Get file path from Hook Input
 */
function getFileFromHookInput(hookInput) {
  if (!hookInput || !hookInput.tool_name || !hookInput.tool_input) {
    return null;
  }

  const toolName = hookInput.tool_name;
  const params = hookInput.tool_input;

  let filePath = null;

  // Get file path from different tools
  if (toolName === 'Write' || toolName === 'write') {
    filePath = params.file_path;
  } else if (toolName === 'Edit' || toolName === 'edit') {
    filePath = params.file_path;
  } else if (toolName === 'NotebookEdit' || toolName === 'notebook_edit') {
    filePath = params.notebook_path;
  }

  if (!filePath) {
    return null;
  }

  // Convert to absolute path if needed
  if (!path.isAbsolute(filePath)) {
    filePath = path.join(projectRoot, filePath);
  }

  // Check if it's a supported code file
  if (!CODE_EXTENSIONS.includes(path.extname(filePath))) {
    return null;
  }

  return filePath;
}

/**
 * Analyze file using appropriate language analyzer
 */
function analyzeFile(filePath) {
  try {
    const code = fs.readFileSync(filePath, 'utf8');
    const lines = code.split('\n');
    const fileLength = lines.length;
    const ext = path.extname(filePath);

    // Get appropriate analyzer for this file type
    const analyzer = analyzerRegistry.getAnalyzer(ext);
    if (!analyzer) {
      return { issues: [], functions: [], fileLength: 0, maxNesting: 0 };
    }

    // Extract functions using language-specific analyzer
    const functions = analyzer.extractFunctions(code, lines);

    // Calculate nesting depth using language-specific analyzer
    const { maxNesting, maxNestingLine } = analyzer.calculateNesting(code, lines);

    const issues = [];

    // Check file length
    if (fileLength > THRESHOLDS.fileLength) {
      issues.push({
        type: 'FILE_LENGTH',
        severity: 'warning',
        message: `File has ${fileLength} lines (threshold: ${THRESHOLDS.fileLength})`,
        file: path.relative(projectRoot, filePath),
        line: 1
      });
    }

    // Check max nesting
    if (maxNesting > THRESHOLDS.nesting) {
      issues.push({
        type: 'NESTING',
        severity: 'warning',
        message: `Max nesting depth is ${maxNesting} (threshold: ${THRESHOLDS.nesting})`,
        file: path.relative(projectRoot, filePath),
        line: maxNestingLine
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

async function main() {
  // Read Hook Input
  const hookInput = await readHookInput();
  const filePath = getFileFromHookInput(hookInput);

  if (!filePath) {
    return;
  }

  // Analyze file
  const analysis = analyzeFile(filePath);

  // Load or create session file
  let sessionData = { files: {} };

  try {
    if (fs.existsSync(SESSION_FILE)) {
      sessionData = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8'));
    }
  } catch (error) {
    sessionData = { files: {} };
  }

  // Add current file's issues to session
  const relPath = path.relative(projectRoot, filePath);
  if (analysis.issues.length > 0) {
    sessionData.files[relPath] = analysis.issues.map(i => ({
      message: i.message,
      line: i.line
    }));
  } else {
    // Record empty array to indicate "analyzed but no issues"
    sessionData.files[relPath] = [];
  }

  // Save session file
  fs.writeFileSync(SESSION_FILE, JSON.stringify(sessionData, null, 2), 'utf8');
}

main();
